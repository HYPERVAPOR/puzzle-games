/**
 * 房间游戏重置 API
 * POST: 重开游戏（清空聊天记录，保留用户列表）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/storage/room-store';
import { getGame, saveGame, generateGameId } from '@/lib/game/game-manager';
import { broadcastToGame } from '@/lib/game/event-dispatcher';

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
    const { userId } = body;

    // 验证输入
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用户ID' },
        { status: 400 }
      );
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

    // 获取当前游戏
    const currentGame = await getGame(room.currentGameId || '');
    if (!currentGame) {
      return NextResponse.json(
        { success: false, error: '游戏不存在' },
        { status: 404 }
      );
    }

    // 结束当前游戏
    if (currentGame.status !== 'finished') {
      currentGame.status = 'finished';
      currentGame.finishedAt = new Date();
    }

    // 创建新游戏，保留用户列表
    const newGameId = generateGameId();
    const newGame = {
      ...currentGame,
      id: newGameId,
      status: 'waiting' as const,
      messages: [], // 清空消息
      publicClues: [], // 清空公开线索
      createdAt: new Date(),
      finishedAt: undefined,
      winner: undefined,
    };

    // 保存新游戏
    await saveGame(newGame);

    // 更新房间当前游戏ID
    room.currentGameId = newGameId;

    // 广播游戏重置事件
    broadcastToGame(newGameId, {
      event: 'game_started',
      payload: { game: newGame, isReset: true },
      timestamp: new Date(),
    });

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
