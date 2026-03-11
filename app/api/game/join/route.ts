/**
 * 游戏API - 加入游戏
 */

import { NextRequest, NextResponse } from 'next/server';
import { joinGame } from '@/lib/game/game-manager';
import { ApiResponse, User } from '@/lib/types';
import '@/lib/game/cleanup-init'; // 启动清理任务

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, userId, username } = body;

    if (!gameId || !userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '游戏ID和用户ID不能为空',
      }, { status: 400 });
    }

    // 创建用户对象
    const user: User = {
      id: userId,
      username: username || 'User',
      joinedAt: new Date(),
      lastSeen: new Date(),
    };

    // 加入游戏
    const game = await joinGame(gameId, user);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { game },
    });
  } catch (error) {
    console.error('Join game error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : '加入游戏失败',
    }, { status: 500 });
  }
}
