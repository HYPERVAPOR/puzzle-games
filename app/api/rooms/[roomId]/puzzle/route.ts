/**
 * 房间题目管理 API
 * PUT: 更新房间题目（仅房主）
 * POST: AI生成新题目（仅房主）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/storage/room-store';
import { getGame, changePuzzle, getOrCreateActiveGame } from '@/lib/game/game-manager';
import { generatePuzzle } from '@/lib/game/ai-service';
import { broadcastToGame } from '@/lib/game/event-dispatcher';

// 验证房主权限
function verifyRoomOwner(room: any, userId: string): boolean {
  if (!room.ownerId) {
    return false;
  }
  return room.ownerId === userId;
}

// PUT - 更新题目
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { userId, surface, bottom } = body;

    // 验证输入
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用户ID' },
        { status: 400 }
      );
    }

    if (!surface || !bottom) {
      return NextResponse.json(
        { success: false, error: '汤面和汤底不能为空' },
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

    // 获取或创建当前游戏
    let game = getGame(room.currentGameId || '');
    if (!game) {
      // 如果游戏不存在，创建一个新游戏
      game = await getOrCreateActiveGame(roomId);
    }

    // 换题
    const newPuzzle = { surface, bottom };
    const newGame = await changePuzzle(game.id, newPuzzle, roomId);

    return NextResponse.json({
      success: true,
      data: { game: newGame },
    });
  } catch (error) {
    console.error('Failed to update puzzle:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '更新题目失败',
      },
      { status: 500 }
    );
  }
}

// POST - AI生成题目
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { userId, prompt } = body;

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

    // 获取或创建当前游戏
    let game = getGame(room.currentGameId || '');
    if (!game) {
      // 如果游戏不存在，创建一个新游戏
      game = await getOrCreateActiveGame(roomId);
    }

    // AI生成题目
    const newPuzzle = await generatePuzzle(prompt);

    // 换题
    const newGame = await changePuzzle(game.id, newPuzzle, roomId);

    return NextResponse.json({
      success: true,
      data: { game: newGame, puzzle: newPuzzle },
    });
  } catch (error) {
    console.error('Failed to generate puzzle:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '生成题目失败',
      },
      { status: 500 }
    );
  }
}
