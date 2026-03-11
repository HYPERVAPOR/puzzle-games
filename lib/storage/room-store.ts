/**
 * 房间存储管理
 * 管理房间数据的内存缓存和持久化
 */

import { Room, RoomListItem } from '../types';
import { saveRoom, loadRoom, getAllRooms, getRoomGames } from './file-storage';
import { nanoid } from 'nanoid';

// 内存中的房间缓存
const roomsCache = new Map<string, Room>();

/**
 * 创建新房间
 */
export async function createRoom(
  roomName?: string,
  roomPassword?: string,
  createdBy?: string
): Promise<Room> {
  const now = new Date();
  const roomId = nanoid(); // 使用 NanoID 生成唯一 ID

  const room: Room = {
    id: roomId,
    name: roomName || '未命名房间',
    password: roomPassword,
    createdBy,
    createdAt: now,
    lastActiveAt: now,
    gameCount: 0,
    isDefault: false,
  };

  // 保存到文件
  await saveRoom(room);

  // 添加到内存缓存
  roomsCache.set(roomId, room);

  return room;
}

/**
 * 获取房间（先从缓存读取，不存在则从文件加载）
 */
export async function getRoom(roomId: string): Promise<Room | null> {
  // 先从缓存读取
  let room = roomsCache.get(roomId);

  if (!room) {
    // 从文件加载
    const loadedRoom = await loadRoom(roomId);
    if (loadedRoom) {
      room = loadedRoom;
      roomsCache.set(roomId, room);
    }
  }

  return room || null;
}

/**
 * 更新房间信息
 */
export async function updateRoom(
  roomId: string,
  updates: Partial<Omit<Room, 'id' | 'createdAt'>>
): Promise<Room | null> {
  const room = await getRoom(roomId);
  if (!room) {
    return null;
  }

  const updatedRoom: Room = {
    ...room,
    ...updates,
    lastActiveAt: updates.lastActiveAt || new Date(),
  };

  await saveRoom(updatedRoom);
  roomsCache.set(roomId, updatedRoom);

  return updatedRoom;
}

/**
 * 增加房间游戏计数
 */
export async function incrementRoomGameCount(roomId: string): Promise<void> {
  const room = await getRoom(roomId);
  if (room) {
    await updateRoom(roomId, {
      gameCount: room.gameCount + 1,
      lastActiveAt: new Date(),
    });
  }
}

/**
 * 设置房间当前游戏ID
 */
export async function setRoomCurrentGame(roomId: string, gameId: string): Promise<void> {
  await updateRoom(roomId, {
    currentGameId: gameId,
    lastActiveAt: new Date(),
  });
}

/**
 * 获取房间列表（包含统计信息）
 */
export async function listRooms(): Promise<RoomListItem[]> {
  const rooms = await getAllRooms();

  // 为每个房间获取游戏数量和用户数量
  const roomList: RoomListItem[] = await Promise.all(
    rooms.map(async (room) => {
      const games = await getRoomGames(room.id);

      // 从当前活跃的游戏中获取在线用户数
      // 这里简化处理：如果没有活跃游戏，用户数为0
      const currentGame = games.find(g => g.id === room.currentGameId);
      const userCount = currentGame ? currentGame.users.length : 0;

      return {
        id: room.id,
        name: room.name,
        userCount,
        gameCount: room.gameCount,
        isDefault: room.isDefault || false,
        lastActiveAt: room.lastActiveAt,
      };
    })
  );

  // 默认房间排在最前面
  return roomList.sort((a, b) => {
    if (a.isDefault) return -1;
    if (b.isDefault) return 1;
    return b.lastActiveAt.getTime() - a.lastActiveAt.getTime();
  });
}

/**
 * 删除房间
 */
export async function removeRoom(roomId: string): Promise<void> {
  roomsCache.delete(roomId);
  // 注意：不删除文件，保留历史记录
}

/**
 * 确保默认房间存在
 */
export async function ensureDefaultRoom(): Promise<Room> {
  console.log('[ensureDefaultRoom] Checking default room...');

  let room = await getRoom('default');

  if (!room) {
    console.log('[ensureDefaultRoom] Default room not found, creating new one...');
    // 手动创建默认房间（ID固定为 'default'）
    const now = new Date();
    const defaultPassword = process.env.GAME_PASSCODE || 'default';
    room = {
      id: 'default',
      name: '默认房间',
      password: defaultPassword,
      createdBy: 'system',
      createdAt: now,
      lastActiveAt: now,
      gameCount: 0,
      isDefault: true,
    };

    // 保存到文件
    await saveRoom(room);

    // 添加到内存缓存
    roomsCache.set('default', room);

    console.log('[ensureDefaultRoom] Default room created:', room);
  } else {
    console.log('[ensureDefaultRoom] Default room found:', room);
  }

  return room;
}
