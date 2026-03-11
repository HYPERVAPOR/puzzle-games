/**
 * 房间管理 API
 * GET: 获取房间列表
 * POST: 创建新房间
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRoom, listRooms, ensureDefaultRoom } from '@/lib/storage/room-store';
import { getOrCreateActiveGame } from '@/lib/game/game-manager';
import { Room } from '@/lib/types';

// 获取房间列表
export async function GET() {
  try {
    // 确保默认房间存在
    await ensureDefaultRoom();

    const rooms = await listRooms();
    return NextResponse.json({
      success: true,
      data: { rooms },
    });
  } catch (error) {
    console.error('Failed to get rooms:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取房间列表失败',
      },
      { status: 500 }
    );
  }
}

// 创建新房间
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomName, roomPassword, username } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { success: false, error: '用户名不能为空' },
        { status: 400 }
      );
    }

    if (!roomPassword || typeof roomPassword !== 'string' || !roomPassword.trim()) {
      return NextResponse.json(
        { success: false, error: '房间密码不能为空' },
        { status: 400 }
      );
    }

    // 创建房间（NanoID 自动生成）
    const room = await createRoom(roomName, roomPassword.trim(), username);

    // 创建该房间的第一个游戏
    const game = await getOrCreateActiveGame(room.id);

    return NextResponse.json({
      success: true,
      data: { room, game },
    });
  } catch (error) {
    console.error('Failed to create room:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '创建房间失败',
      },
      { status: 500 }
    );
  }
}
