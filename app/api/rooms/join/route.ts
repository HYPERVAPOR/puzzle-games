/**
 * 加入房间 API
 * POST: 加入指定房间（或加入默认房间）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRoom, ensureDefaultRoom } from '@/lib/storage/room-store';
import { getOrCreateActiveGame, joinGame } from '@/lib/game/game-manager';
import { User } from '@/lib/types';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, password, userId, username } = body;

    console.log('[Join Room] Request received:', { roomId, password, userId, username });

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { success: false, error: '用户名不能为空' },
        { status: 400 }
      );
    }

    // 如果 roomId 为空，使用默认房间
    const targetRoomId = roomId?.trim() || 'default';

    // 获取或创建房间
    let room;
    if (targetRoomId === 'default') {
      room = await ensureDefaultRoom();
    } else {
      room = await getRoom(targetRoomId);
      if (!room) {
        return NextResponse.json(
          { success: false, error: '房间不存在' },
          { status: 404 }
        );
      }
    }

    // 验证密码
    // 默认房间也需要输入正确的密码（不自动跳过）
    const effectivePassword = password;

    console.log('[Join Room] Password validation:', {
      isDefault: room.isDefault,
      providedPassword: password,
      effectivePassword,
      roomPassword: room.password,
      match: room.password === effectivePassword
    });

    if (room.password && room.password !== effectivePassword) {
      return NextResponse.json(
        { success: false, error: '房间密码错误' },
        { status: 401 }
      );
    }

    // 获取或创建房间游戏
    const game = await getOrCreateActiveGame(room.id);

    // 创建用户对象（使用前端传递的userId，如果没有则生成新的）
    const user: User = {
      id: userId || `user-${randomUUID()}`,
      username,
      joinedAt: new Date(),
      lastSeen: new Date(),
    };

    // 加入游戏
    const updatedGame = await joinGame(game.id, user);

    return NextResponse.json({
      success: true,
      data: {
        room,
        game: updatedGame,
        user,
      },
    });
  } catch (error) {
    console.error('Failed to join room:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '加入房间失败',
      },
      { status: 500 }
    );
  }
}
