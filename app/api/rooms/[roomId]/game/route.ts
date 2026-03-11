/**
 * 房间游戏 API
 * POST: 获取或创建房间的当前游戏
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/storage/room-store';
import { getOrCreateActiveGame, joinGame } from '@/lib/game/game-manager';
import { User } from '@/lib/types';
import { randomUUID } from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { userId, username, password } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { success: false, error: '用户名不能为空' },
        { status: 400 }
      );
    }

    // 获取房间
    const room = await getRoom(roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, error: '房间不存在' },
        { status: 404 }
      );
    }

    // 直接访问房间页时也必须校验密码，避免绕过 join-room 流程
    if (room.password && room.password !== password) {
      return NextResponse.json(
        { success: false, error: '房间密码错误' },
        { status: 401 }
      );
    }

    // 获取或创建房间游戏
    const game = await getOrCreateActiveGame(room.id);
    console.log(`[RoomGameAPI] Retrieved/created game ${game.id} for room ${room.id}`);

    // 创建用户对象
    const user: User = {
      id: userId || `user-${randomUUID()}`,
      username,
      joinedAt: new Date(),
      lastSeen: new Date(),
    };

    // 加入游戏
    const updatedGame = await joinGame(game.id, user);
    console.log(`[RoomGameAPI] User ${username} (${user.id}) joined game ${game.id}, total users: ${updatedGame.users.length}`);

    return NextResponse.json({
      success: true,
      data: {
        room,
        game: updatedGame,
        user,
      },
    });
  } catch (error) {
    console.error('Failed to get room game:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取游戏失败',
      },
      { status: 500 }
    );
  }
}
