/**
 * 房间游戏重置 API
 * POST: 重开游戏（清空聊天记录，保留用户列表）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/storage/room-store';
import { getGame, generateGameId, getOrCreateActiveGame, updateGameInMemory, removeGameFromMemory } from '@/lib/game/game-manager';
import { saveGame } from '@/lib/storage/file-storage';
import { broadcastToGame } from '@/lib/game/event-dispatcher';
import { updateRoom } from '@/lib/storage/room-store';
import { Game } from '@/lib/types';

// 验证房主权限
function verifyRoomOwner(room: any, userId: string): boolean {
  if (!room.ownerId) {
    return false;
  }
  return room.ownerId === userId;
}

// POST - 重开游戏
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { userId, puzzle } = body;

    console.log(`[Reset API] Reset request for room ${roomId} by user ${userId}`);

    // 验证输入
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用户ID' },
        { status: 400 }
      );
    }

    // 验证谜题数据（如果提供）
    if (puzzle) {
      if (!puzzle.surface || !puzzle.bottom) {
        return NextResponse.json(
          { success: false, error: '汤面和汤底不能为空' },
          { status: 400 }
        );
      }
    }

    // 获取房间并验证权限
    const room = await getRoom(roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, error: '房间不存在' },
        { status: 404 }
      );
    }

    if (!verifyRoomOwner(room, userId)) {
      return NextResponse.json(
        { success: false, error: '无权限操作' },
        { status: 403 }
      );
    }

    // 获取当前房间的活跃游戏
    const currentGame = await getOrCreateActiveGame(room.id);
    if (!currentGame) {
      return NextResponse.json(
        { success: false, error: '游戏不存在' },
        { status: 404 }
      );
    }

    console.log(`[Reset API] Found current game ${currentGame.id} for room ${room.id} with ${currentGame.users?.length || 0} users`);

    // 检查内存中是否有更新的用户列表
    const memoryGame = getGame(currentGame.id);
    const usersList = (memoryGame?.users && memoryGame.users.length > 0) ? memoryGame.users : currentGame.users;
    console.log(`[Reset API] Using user list with ${usersList.length} users (memory: ${memoryGame?.users.length || 0}, file: ${currentGame.users?.length || 0})`);

    // 1. 将旧游戏标记为 finished（避免刷新后找到旧游戏）
    currentGame.status = 'finished';
    currentGame.finishedAt = new Date();
    await saveGame(currentGame);
    console.log(`[Reset API] Marked old game ${currentGame.id} as finished`);

    // 2. 创建新游戏，保留用户列表
    const newGameId = generateGameId();
    const newGame: Game = {
      id: newGameId,
      roomId: room.id, // 确保设置正确的 roomId
      status: 'waiting',
      puzzle: puzzle || currentGame.puzzle,
      messages: [], // 清空消息
      publicClues: [], // 清空公开线索
      users: usersList || [], // 保留用户列表（优先使用内存中的）
      createdAt: new Date(),
    };

    // 保存新游戏
    await saveGame(newGame);
    console.log(`[Reset API] Created new game ${newGameId} with ${newGame.users.length} users`);

    // 将新游戏添加到内存
    updateGameInMemory(newGame);
    console.log(`[Reset API] Added new game ${newGameId} to memory`);

    // 从内存中移除旧游戏
    removeGameFromMemory(currentGame.id);
    console.log(`[Reset API] Removed old game ${currentGame.id} from memory`);

    // 3. 更新房间当前游戏ID
    await updateRoom(roomId, { currentGameId: newGameId });
    console.log(`[Reset API] Updated room ${roomId} currentGameId to ${newGameId}`);

    // 立即广播游戏重置事件到当前游戏ID（确保所有用户都能收到）
    const resetEvent = {
      event: 'game_started' as const,
      payload: { game: newGame, isReset: true, oldGameId: currentGame.id },
      timestamp: new Date(),
    };

    console.log(`[Reset API] Broadcasting reset to current game ${currentGame.id}`);
    broadcastToGame(currentGame.id, resetEvent);

    return NextResponse.json({
      success: true,
      data: { game: newGame },
    });
  } catch (error) {
    console.error('Failed to reset game:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '重开游戏失败',
      },
      { status: 500 }
    );
  }
}
