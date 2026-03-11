/**
 * 文件存储工具
 * 用于持久化游戏和房间数据
 */

import fs from 'fs/promises';
import path from 'path';
import { Game, Room } from '../types';

export const DATA_PATH = process.env.DATA_PATH || './data';
export const GAMES_DIR = path.join(DATA_PATH, 'games');
export const ROOMS_DIR = path.join(DATA_PATH, 'rooms');

/**
 * 确保数据目录存在
 */
export async function ensureDataDirectories(): Promise<void> {
  try {
    await fs.access(DATA_PATH);
  } catch {
    await fs.mkdir(DATA_PATH, { recursive: true });
  }

  try {
    await fs.access(GAMES_DIR);
  } catch {
    await fs.mkdir(GAMES_DIR, { recursive: true });
  }

  try {
    await fs.access(ROOMS_DIR);
  } catch {
    await fs.mkdir(ROOMS_DIR, { recursive: true });
  }
}

/**
 * 保存游戏数据到文件
 */
export async function saveGame(game: Game): Promise<void> {
  await ensureDataDirectories();
  const filePath = path.join(GAMES_DIR, `${game.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(game, null, 2), 'utf-8');
}

/**
 * 从文件加载游戏数据
 */
export async function loadGame(gameId: string): Promise<Game | null> {
  try {
    const filePath = path.join(GAMES_DIR, `${gameId}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);

    // 转换日期字符串为Date对象
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      finishedAt: data.finishedAt ? new Date(data.finishedAt) : undefined,
      messages: data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })),
      users: data.users.map((user: any) => ({
        ...user,
        joinedAt: new Date(user.joinedAt),
        lastSeen: new Date(user.lastSeen)
      }))
    };
  } catch (error) {
    console.error(`Failed to load game ${gameId}:`, error);
    return null;
  }
}

/**
 * 删除游戏文件
 */
export async function deleteGame(gameId: string): Promise<void> {
  try {
    const filePath = path.join(GAMES_DIR, `${gameId}.json`);
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Failed to delete game ${gameId}:`, error);
  }
}

/**
 * 保存房间数据到文件
 */
export async function saveRoom(room: Room): Promise<void> {
  await ensureDataDirectories();
  const filePath = path.join(ROOMS_DIR, `${room.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(room, null, 2), 'utf-8');
}

/**
 * 从文件加载房间数据
 */
export async function loadRoom(roomId: string): Promise<Room | null> {
  try {
    const filePath = path.join(ROOMS_DIR, `${roomId}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);

    // 转换日期字符串为Date对象
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      lastActiveAt: new Date(data.lastActiveAt)
    };
  } catch (error) {
    console.error(`Failed to load room ${roomId}:`, error);
    return null;
  }
}

/**
 * 获取所有房间列表
 */
export async function getAllRooms(): Promise<Room[]> {
  try {
    await ensureDataDirectories();
    const files = await fs.readdir(ROOMS_DIR);
    const rooms: Room[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const roomId = file.replace('.json', '');
        const room = await loadRoom(roomId);
        if (room) {
          rooms.push(room);
        }
      }
    }

    // 按最后活跃时间倒序排列
    return rooms.sort((a, b) =>
      b.lastActiveAt.getTime() - a.lastActiveAt.getTime()
    );
  } catch (error) {
    console.error('Failed to get all rooms:', error);
    return [];
  }
}

/**
 * 删除房间文件
 */
export async function deleteRoom(roomId: string): Promise<void> {
  try {
    const filePath = path.join(ROOMS_DIR, `${roomId}.json`);
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Failed to delete room ${roomId}:`, error);
  }
}

/**
 * 获取房间的所有游戏
 */
export async function getRoomGames(roomId: string): Promise<Game[]> {
  try {
    await ensureDataDirectories();
    const files = await fs.readdir(GAMES_DIR);
    const games: Game[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const gameId = file.replace('.json', '');
        const game = await loadGame(gameId);
        if (game && game.roomId === roomId) {
          games.push(game);
        }
      }
    }

    // 按创建时间倒序排列
    return games.sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  } catch (error) {
    console.error(`Failed to get games for room ${roomId}:`, error);
    return [];
  }
}

/**
 * 获取会话的所有游戏 (别名函数)
 */
export async function getSessionGames(sessionId: string): Promise<Game[]> {
  return getRoomGames(sessionId);
}
