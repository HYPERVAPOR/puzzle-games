/**
 * 游戏管理器
 * 管理游戏状态、用户列表和游戏逻辑
 */

import fs from 'fs/promises';
import path from 'path';
import { Game, User, Message, Puzzle, GameStatus, AIResponse } from '../types';
import { judgeQuestion, judgeGameEnd, judgeTruthCrack } from './ai-service';
import { broadcastToGame } from './event-dispatcher';
import { saveGame, loadGame, GAMES_DIR } from '../storage/file-storage';
import { incrementRoomGameCount, setRoomCurrentGame } from '../storage/room-store';
import { randomUUID } from 'crypto';

// 内存中的游戏存储
const games = new Map<string, Game>();

// 速率限制存储
const rateLimits = new Map<string, { count: number; resetTime: number }>();

// 从文件加载后，超过此时间无心跳的用户视为过期（60 秒 = 4 个心跳周期）
const STALE_USER_THRESHOLD_MS = 60 * 1000;

/**
 * 从游戏中移除过期用户（用于文件加载后立即清理）
 * 不广播也不写消息——这些是上个服务进程的残留，静默清理即可
 */
async function purgeStaleUsers(game: Game): Promise<void> {
  const now = Date.now();
  const before = game.users.length;
  game.users = game.users.filter(u => {
    const lastActivity = u.lastHeartbeat
      ? new Date(u.lastHeartbeat).getTime()
      : new Date(u.lastSeen).getTime();
    return now - lastActivity < STALE_USER_THRESHOLD_MS;
  });
  if (game.users.length < before) {
    console.log(
      `[purgeStaleUsers] Removed ${before - game.users.length} stale user(s) from game ${game.id}`
    );
    await saveGame(game);
  }
}

/**
 * 生成唯一的游戏ID
 */
export function generateGameId(): string {
  return `game-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 生成唯一的消息ID
 */
function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 创建新游戏
 */
export async function createGame(
  roomId: string,
  puzzle: Puzzle,
  createdBy?: string
): Promise<Game> {
  const gameId = generateGameId();
  const now = new Date();

  const game: Game = {
    id: gameId,
    roomId,
    puzzle,
    status: 'waiting',
    users: [],
    messages: [],
    publicClues: [],
    createdAt: now,
  };

  games.set(gameId, game);
  await saveGame(game);
  await incrementRoomGameCount(roomId);
  await setRoomCurrentGame(roomId, gameId);

  // 广播游戏创建事件
  broadcastToGame(gameId, {
    event: 'game_started',
    payload: { game },
    timestamp: now,
  });

  return game;
}

/**
 * 获取游戏
 */
export function getGame(gameId: string): Game | undefined {
  return games.get(gameId);
}

/**
 * 更新内存中的游戏
 */
export function updateGameInMemory(game: Game): void {
  games.set(game.id, game);
}

/**
 * 从内存中移除游戏
 */
export function removeGameFromMemory(gameId: string): void {
  games.delete(gameId);
}

/**
 * 获取或创建当前活跃游戏
 * 优先从文件加载，文件不存在才创建新游戏
 */
export async function getOrCreateActiveGame(roomId: string, puzzle?: Puzzle): Promise<Game> {
  console.log(`[getOrCreateActiveGame] Looking for active game in room ${roomId}`);
  // 1. 先检查内存中是否有该房间的活跃游戏
  for (const game of games.values()) {
    if (game.roomId === roomId && game.status !== 'finished') {
      console.log(`[getOrCreateActiveGame] Found active game ${game.id} in memory for room ${roomId}`);
      // 验证文件是否仍然存在（loadGame 内部 catch 错误返回 null，不会 throw）
      const fileGame = await loadGame(game.id);
      if (fileGame) {
        return game; // 文件存在，返回内存中的游戏
      } else {
        // 文件已被删除，从内存中移除，继续向下走创建新游戏
        games.delete(game.id);
        console.log(`[getOrCreateActiveGame] Game ${game.id} file deleted, removing from memory`);
        break;
      }
    }
  }

  // 2. 内存中没有（或文件被删除），查找最新的游戏文件
  try {
    const gameFiles = await fs.readdir(GAMES_DIR);
    const roomGames = [];

    for (const file of gameFiles) {
      if (!file.endsWith('.json')) continue;

      try {
        const filePath = path.join(GAMES_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const game = JSON.parse(content) as Game;

        if (game.roomId === roomId && game.status !== 'finished') {
          roomGames.push({ game, mtime: (await fs.stat(filePath)).mtime });
        }
      } catch (error) {
        console.error(`Failed to read game file ${file}:`, error);
      }
    }

    // 返回最近修改的游戏
    if (roomGames.length > 0) {
      roomGames.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      const latestGame = roomGames[0].game;

      // 加载到内存，并立即清除上个进程残留的过期用户
      games.set(latestGame.id, latestGame);
      await purgeStaleUsers(latestGame);
      console.log(`[getOrCreateActiveGame] Loaded latest game ${latestGame.id} from file`);
      return latestGame;
    }
  } catch (error) {
    console.error('[getOrCreateActiveGame] Failed to scan game files:', error);
  }

  // 3. 没有找到任何游戏文件，创建新游戏
  const defaultPuzzle: Puzzle = {
    surface: '一个男人坐在火车上，突然跳车而死。为什么？',
    bottom: '这个男人是盲人，他以为火车已经停了，所以跳下车，结果火车还在行驶，他摔死了。',
  };

  console.log(`[getOrCreateActiveGame] No active game found for room ${roomId}, creating new game`);
  return await createGame(roomId, puzzle || defaultPuzzle);
}

/**
 * 用户加入游戏
 */
export async function joinGame(gameId: string, user: User): Promise<Game> {
  let game = games.get(gameId);
  let loadedFromFile = false;

  // 如果游戏不在内存中，尝试从文件加载
  if (!game) {
    try {
      const loadedGame = await loadGame(gameId);
      if (loadedGame) {
        game = loadedGame;
        games.set(gameId, game);
        loadedFromFile = true;
        // 从文件首次加载时立即清除上个进程残留的过期用户
        await purgeStaleUsers(game);
        console.log(`Loaded game ${gameId} from file: ${game.messages?.length || 0} messages`);
      }
    } catch (error) {
      console.error(`Failed to load game ${gameId}:`, error);
    }
  }

  // 如果游戏在内存中，总是尝试从文件同步最新数据
  // （服务器重启后内存数据可能不完整）
  if (game && !loadedFromFile) {
    try {
      const loadedGame = await loadGame(gameId);
      if (loadedGame) {
        // 如果文件中的消息更多，使用文件数据
        const fileMessageCount = loadedGame.messages?.length || 0;
        const memoryMessageCount = game.messages?.length || 0;

        if (fileMessageCount > memoryMessageCount) {
          // 保留内存中的用户列表，但更新其他字段
          const existingUsers = game.users;
          game = loadedGame;
          game.users = existingUsers; // 保留用户列表
          games.set(gameId, game);
          console.log(`Synced game ${gameId} from file: ${fileMessageCount} messages (had ${memoryMessageCount} in memory)`);
        }
      }
    } catch (error) {
      console.error(`Failed to sync game ${gameId}:`, error);
    }
  }

  // 如果游戏仍不存在，创建一个默认游戏
  if (!game) {
    const defaultPuzzle: Puzzle = {
      surface: '一个男人坐在火车上，突然跳车而死。为什么？',
      bottom: '这个男人是盲人，他以为火车已经停了，所以跳下车，结果火车还在行驶，他摔死了。',
    };

    game = await createGame('default', defaultPuzzle, 'system');

    // 使用指定的游戏ID
    games.delete(game.id);
    game.id = gameId;
    games.set(gameId, game);
    console.log(`Created new default game ${gameId}`);
  }

  // 检查用户是否已在游戏中
  const existingUser = game.users.find(u => u.id === user.id);
  if (existingUser) {
    // 更新最后活跃时间、心跳时间，以及可能变更的用户名
    existingUser.username = user.username;
    existingUser.lastSeen = new Date();
    existingUser.lastHeartbeat = new Date();
    // 无论是否改名，都要落盘，避免内存和文件中的 users 状态分裂
    await saveGame(game);
    console.log(`User ${user.username} rejoined game ${gameId}. Total messages: ${game.messages?.length || 0}`);
    return game;
  }

  // 添加新用户（初始化心跳时间）
  user.lastHeartbeat = new Date();
  game.users.push(user);

  // 添加系统消息
  const joinMessage: Message = {
    id: generateMessageId(),
    type: 'system',
    content: `${user.username} 加入了游戏`,
    timestamp: new Date(),
  };
  game.messages.push(joinMessage);

  // 保存并广播
  await saveGame(game);
  broadcastToGame(gameId, {
    event: 'user_joined',
    payload: { user, game },
    timestamp: new Date(),
  });

  return game;
}

/**
 * 用户离开游戏
 */
export async function leaveGame(gameId: string, userId: string): Promise<Game> {
  let game = games.get(gameId);

  // 内存中找不到时从文件加载（处理 sendBeacon / 服务器重启场景）
  if (!game) {
    console.log(`[LeaveGame] Game ${gameId} not in memory, loading from file`);
    const loadedGame = await loadGame(gameId);
    if (!loadedGame) {
      console.error(`[LeaveGame] Game ${gameId} not found in memory or file`);
      throw new Error('Game not found');
    }
    game = loadedGame;
    games.set(gameId, game);
  }

  // 移除用户
  const userIndex = game.users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    console.log(`[LeaveGame] User ${userId} not found in game ${gameId}`);
    return game;
  }

  const user = game.users[userIndex];
  game.users.splice(userIndex, 1);

  console.log(`[LeaveGame] Removed user ${user.username} (${userId}) from game ${gameId}`);

  // 添加系统消息
  const leaveMessage: Message = {
    id: generateMessageId(),
    type: 'system',
    content: `${user.username} 离开了游戏`,
    timestamp: new Date(),
  };
  game.messages.push(leaveMessage);

  // 保存并广播
  await saveGame(game);
  broadcastToGame(gameId, {
    event: 'user_left',
    payload: { userId, username: user.username, game },
    timestamp: new Date(),
  });

  return game;
}

/**
 * 检查速率限制
 */
function checkRateLimit(userId: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userLimit = rateLimits.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimits.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * 发送消息并获取AI回复
 */
export async function sendMessage(
  gameId: string,
  userId: string,
  username: string,
  content: string
): Promise<{ game: Game; aiResponse?: AIResponse; gameOver?: boolean }> {
  let game = games.get(gameId);
  let loadedFromFile = false;

  // 如果游戏不在内存中，尝试从文件加载
  if (!game) {
    try {
      const loadedGame = await loadGame(gameId);
      if (loadedGame) {
        game = loadedGame;
        games.set(gameId, game);
        loadedFromFile = true;
        await purgeStaleUsers(game);
        console.log(`Loaded game ${gameId} from file in sendMessage: ${game.messages?.length || 0} messages`);
      }
    } catch (error) {
      console.error(`Failed to load game ${gameId}:`, error);
    }
  }

  // 如果游戏在内存中，总是尝试从文件同步最新数据
  if (game && !loadedFromFile) {
    try {
      const loadedGame = await loadGame(gameId);
      if (loadedGame) {
        // 如果文件中的消息更多，使用文件数据
        const fileMessageCount = loadedGame.messages?.length || 0;
        const memoryMessageCount = game.messages?.length || 0;

        if (fileMessageCount > memoryMessageCount) {
          // 保留内存中的用户列表，但更新其他字段
          const existingUsers = game.users;
          game = loadedGame;
          game.users = existingUsers; // 保留用户列表
          games.set(gameId, game);
          console.log(`Synced game ${gameId} from file in sendMessage: ${fileMessageCount} messages (had ${memoryMessageCount} in memory)`);
        }
      }
    } catch (error) {
      console.error(`Failed to sync game ${gameId}:`, error);
    }
  }

  // 如果游戏仍然不存在，自动创建一个新游戏
  if (!game) {
    const defaultPuzzle: Puzzle = {
      surface: '一个男人坐在火车上，突然跳车而死。为什么？',
      bottom: '这个男人是盲人，他以为火车已经停了，所以跳下车，结果火车还在行驶，他摔死了。',
    };

    game = await createGame('default', defaultPuzzle, 'system');
    games.delete(game.id);
    game.id = gameId;
    games.set(gameId, game);

    // 添加系统消息
    const reloadMessage: Message = {
      id: generateMessageId(),
      type: 'system',
      content: '由于服务器重启，游戏已重新创建',
      timestamp: new Date(),
    };
    game.messages.push(reloadMessage);
  }

  // 检查速率限制
  if (!checkRateLimit(userId)) {
    throw new Error('发送消息过于频繁，请稍后再试');
  }

  // 更新用户心跳时间（活跃用户）
  // 如果文件/内存状态短暂分裂导致当前发送者丢失，这里顺手修复 users 列表
  let sendingUser = game.users.find(u => u.id === userId);
  if (sendingUser) {
    sendingUser.username = username;
    sendingUser.lastHeartbeat = new Date();
    sendingUser.lastSeen = new Date();
  } else {
    sendingUser = {
      id: userId,
      username,
      joinedAt: new Date(),
      lastSeen: new Date(),
      lastHeartbeat: new Date(),
    };
    game.users.push(sendingUser);
    console.log(`[sendMessage] Recovered missing sender ${username} (${userId}) into users list`);
  }

  // 如果游戏未开始，开始游戏
  if (game.status === 'waiting') {
    game.status = 'playing';
  }

  // 添加用户消息
  const userMessage: Message = {
    id: generateMessageId(),
    type: 'user',
    content,
    userId,
    username,
    timestamp: new Date(),
  };
  game.messages.push(userMessage);

  // 调用AI判定
  let aiResponse: AIResponse | undefined;
  let aiExplanation: string | undefined;

  try {
    const result = await judgeQuestion(
      content,
      game.puzzle.bottom,
      game.messages.slice(-10).map(m => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: m.content,
      }))
    );

    aiResponse = result.response;
    aiExplanation = result.explanation;

    // 如果AI回答"是"，添加到公开情报
    if (aiResponse === 'yes') {
      game.publicClues.push(content);
    }
  } catch (error) {
    console.error('AI judge failed:', error);
    // AI不可用时抛出错误，而不是返回默认值
    throw new Error(
      error instanceof Error
        ? `AI服务不可用: ${error.message}`
        : 'AI服务暂时不可用，请稍后重试'
    );
  }

  // 添加AI回复消息
  const aiMessage: Message = {
    id: generateMessageId(),
    type: 'ai',
    content: getAIResponseText(aiResponse),
    aiResponse,
    timestamp: new Date(),
  };
  game.messages.push(aiMessage);

  // 检查游戏是否应该结束
  const yesCount = game.messages.filter(
    m => m.aiResponse === 'yes'
  ).length;

  let gameOver = false;
  if (yesCount >= 5) {
    try {
      const gameEndResult = await judgeGameEnd(
        game.puzzle.bottom,
        game.messages.slice(-20).map(m => ({
          role: m.type === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
        yesCount
      );

      if (gameEndResult.isGameOver) {
        gameOver = true;
        game.status = 'finished';
        game.finishedAt = new Date();
        game.winner = userId;

        // 添加游戏结束系统消息
        const endMessage: Message = {
          id: generateMessageId(),
          type: 'system',
          content: `🎉 游戏结束！${username} 解开了谜题！\n\n谜底：${game.puzzle.bottom}`,
          timestamp: new Date(),
        };
        game.messages.push(endMessage);

        // 广播游戏结束事件
        broadcastToGame(gameId, {
          event: 'game_finished',
          payload: { game, winner: username },
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Game end check failed:', error);
    }
  }

  // 保存并广播
  await saveGame(game);
  broadcastToGame(gameId, {
    event: 'new_message',
    payload: { message: aiMessage, game },
    timestamp: new Date(),
  });

  return { game, aiResponse, gameOver };
}

/**
 * 获取AI回复文本
 */
function getAIResponseText(response?: AIResponse): string {
  switch (response) {
    case 'yes':
      return '✅ 是';
    case 'no':
      return '❌ 否';
    case 'irrelevant':
      return '❓ 不重要';
    default:
      return '❓ 不重要';
  }
}

/**
 * 换题（结束当前游戏并创建新游戏）
 */
export async function changePuzzle(
  gameId: string,
  newPuzzle: Puzzle,
  sessionId: string
): Promise<Game> {
  // 结束当前游戏
  const oldGame = games.get(gameId);
  if (oldGame && oldGame.status !== 'finished') {
    oldGame.status = 'finished';
    oldGame.finishedAt = new Date();

    const endMessage: Message = {
      id: generateMessageId(),
      type: 'system',
      content: '🔄 换题了！新题目已加载。',
      timestamp: new Date(),
    };
    oldGame.messages.push(endMessage);

    await saveGame(oldGame);
  }

  // 创建新游戏
  const newGame = await createGame(sessionId, newPuzzle);

  // 广播换题事件
  broadcastToGame(gameId, {
    event: 'game_started',
    payload: { game: newGame },
    timestamp: new Date(),
  });

  return newGame;
}

/**
 * 获取所有活跃游戏
 */
export function getActiveGames(): Game[] {
  return Array.from(games.values()).filter(
    game => game.status !== 'finished'
  );
}

/**
 * 更新用户心跳
 */
export async function updateHeartbeat(gameId: string, userId: string): Promise<void> {
  const game = games.get(gameId);
  if (!game) {
    return;
  }

  const user = game.users.find(u => u.id === userId);
  if (user) {
    user.lastHeartbeat = new Date();
    user.lastSeen = new Date();
  }
}

/**
 * 清理不活跃的用户
 */
export async function cleanupInactiveUsers(gameId: string): Promise<void> {
  const game = games.get(gameId);
  if (!game) {
    return;
  }

  const now = new Date();
  const TIMEOUT = 30000; // 30秒无心跳视为离线（从60秒缩短）

  const usersToRemove: User[] = [];

  for (const user of game.users) {
    const lastActivity = user.lastHeartbeat || user.lastSeen;
    const inactiveTime = now.getTime() - lastActivity.getTime();

    if (inactiveTime > TIMEOUT) {
      usersToRemove.push(user);
      console.log(`[Cleanup] User ${user.username} inactive for ${Math.round(inactiveTime / 1000)}s, marking for removal`);
    }
  }

  // 移除不活跃的用户
  for (const user of usersToRemove) {
    const userIndex = game.users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      game.users.splice(userIndex, 1);

      // 添加系统消息
      const leaveMessage: Message = {
        id: generateMessageId(),
        type: 'system',
        content: `${user.username} 离开了游戏（超时）`,
        timestamp: new Date(),
      };
      game.messages.push(leaveMessage);

      // 广播用户离开事件
      broadcastToGame(gameId, {
        event: 'user_left',
        payload: { userId: user.id, username: user.username, game },
        timestamp: new Date(),
      });
    }
  }

  // 如果有用户被移除，保存游戏状态
  if (usersToRemove.length > 0) {
    await saveGame(game);
  }
}

/**
 * 清理旧游戏（可以定期调用）
 */
export function cleanupOldGames(maxAge: number = 24 * 60 * 60 * 1000): void {
  const now = Date.now();
  for (const [gameId, game] of games.entries()) {
    const age = now - game.createdAt.getTime();
    if (age > maxAge) {
      games.delete(gameId);
    }
  }
}

/**
 * 启动定期清理任务
 */
export function startCleanupTask(): NodeJS.Timeout {
  // 每15秒清理一次不活跃的用户（从30秒缩短）
  return setInterval(async () => {
    const gamesToCheck = Array.from(games.entries());
    console.log(`[Cleanup] Checking ${gamesToCheck.length} games for inactive users...`);

    for (const [gameId, game] of gamesToCheck) {
      if (game.status !== 'finished') {
        await cleanupInactiveUsers(gameId);
      }
    }
  }, 15000); // 15秒
}

/**
 * 处理破案尝试
 */
export async function handleCrackAttempt(
  gameId: string,
  userId: string,
  username: string,
  guess: string
): Promise<{
  game: Game;
  crackResponse: 'correct' | 'close' | 'incorrect';
  feedback: string;
}> {
  let game = games.get(gameId);

  // 加载游戏逻辑（与 sendMessage 相同）
  if (!game) {
    try {
      const loadedGame = await loadGame(gameId);
      if (loadedGame) {
        game = loadedGame;
        games.set(gameId, game);
        await purgeStaleUsers(gameId);
      }
    } catch (error) {
      console.error(`Failed to load game ${gameId}:`, error);
    }
  }

  if (!game) {
    throw new Error('游戏不存在');
  }

  // 检查速率限制
  if (!checkRateLimit(userId)) {
    throw new Error('发送消息过于频繁，请稍后再试');
  }

  // 更新用户心跳
  let sendingUser = game.users.find((u) => u.id === userId);
  if (sendingUser) {
    sendingUser.username = username;
    sendingUser.lastHeartbeat = new Date();
    sendingUser.lastSeen = new Date();
  } else {
    sendingUser = {
      id: userId,
      username,
      joinedAt: new Date(),
      lastSeen: new Date(),
      lastHeartbeat: new Date(),
    };
    game.users.push(sendingUser);
  }

  // 如果游戏未开始，开始游戏
  if (game.status === 'waiting') {
    game.status = 'playing';
  }

  // 添加破案尝试消息
  const crackAttemptMessage: Message = {
    id: generateMessageId(),
    type: 'crack_attempt',
    content: guess,
    userId,
    username,
    timestamp: new Date(),
    isCrackAttempt: true,
  };
  game.messages.push(crackAttemptMessage);

  // 调用 AI 判定
  let crackResponse: 'correct' | 'close' | 'incorrect';
  let feedback: string;

  try {
    const result = await judgeTruthCrack(
      guess,
      game.puzzle.bottom,
      game.messages
        .slice(-20)
        .map((m) => ({
          role:
            m.type === 'user' || m.type === 'crack_attempt'
              ? 'user'
              : 'assistant',
          content: m.content,
        }))
    );

    crackResponse = result.response;
    feedback = result.feedback;

    // 成功时添加系统消息，但不结束游戏
    if (crackResponse === 'correct') {
      const successMessage: Message = {
        id: generateMessageId(),
        type: 'system',
        content: `🎉 ${username} 成功破案！真相已揭晓，游戏继续进行。`,
        timestamp: new Date(),
      };
      game.messages.push(successMessage);
    }
  } catch (error) {
    console.error('Crack judge failed:', error);
    throw new Error(
      error instanceof Error
        ? `AI服务不可用: ${error.message}`
        : 'AI服务暂时不可用，请稍后重试'
    );
  }

  // 添加破案结果消息
  const crackResultMessage: Message = {
    id: generateMessageId(),
    type: 'crack_result',
    content: feedback,
    crackResponse,
    timestamp: new Date(),
    fullStory:
      crackResponse === 'correct' ? game.puzzle.bottom : undefined,
  };
  game.messages.push(crackResultMessage);

  // 保存并广播
  await saveGame(game);
  broadcastToGame(gameId, {
    event: 'new_message',
    payload: { message: crackResultMessage, game },
    timestamp: new Date(),
  });

  return { game, crackResponse, feedback };
}
