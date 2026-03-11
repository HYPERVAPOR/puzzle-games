/**
 * 房间房主管理 API
 * POST: 成为默认房间的房主（需要房主密码）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRoom, updateRoom } from '@/lib/storage/room-store';

// 验证房主密码
function verifyOwnerPassword(password: string): boolean {
  const OWNER_PASSWORD = process.env.DEFAULT_ROOM_OWNER_PASSWORD || 'owner123';
  return password === OWNER_PASSWORD;
}

// POST - 成为房主
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { userId, password } = body;

    // 验证输入
    if (!userId || !password) {
      return NextResponse.json(
        { success: false, error: '缺少用户ID或密码' },
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

    // 只允许默认房间设置房主
    if (!room.isDefault) {
      return NextResponse.json(
        { success: false, error: '只有默认房间可以设置房主' },
        { status: 403 }
      );
    }

    // 验证房主密码
    if (!verifyOwnerPassword(password)) {
      return NextResponse.json(
        { success: false, error: '房主密码错误' },
        { status: 401 }
      );
    }

    // 更新房主
    const updatedRoom = await updateRoom(roomId, {
      ownerId: userId,
    });

    if (!updatedRoom) {
      return NextResponse.json(
        { success: false, error: '更新房主失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { room: updatedRoom },
    });
  } catch (error) {
    console.error('Failed to set room owner:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '设置房主失败',
      },
      { status: 500 }
    );
  }
}
