/**
 * 游戏API - 离开游戏
 */

import { NextRequest, NextResponse } from 'next/server';
import { leaveGame } from '@/lib/game/game-manager';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // sendBeacon 发送的是 text/plain，需要特殊处理
    const contentType = request.headers.get('content-type') || '';
    let body;

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      // 处理 sendBeacon 发送的文本数据
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch (error) {
        console.error('[Leave API] Failed to parse request body:', error);
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Invalid request body',
        }, { status: 400 });
      }
    }

    const { userId, gameId, reason } = body;

    console.log('[Leave API] Received leave request:', {
      userId,
      gameId,
      reason: reason || 'unknown',
      contentType,
    });

    if (!userId || !gameId) {
      console.error('[Leave API] Missing required fields:', { userId, gameId });
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '用户ID和游戏ID不能为空',
      }, { status: 400 });
    }

    // 离开游戏
    const game = await leaveGame(gameId, userId);

    console.log('[Leave API] User left successfully:', {
      userId,
      gameId,
      remainingUsers: game.users.length,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { game },
    });
  } catch (error) {
    console.error('[Leave API] Error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : '离开游戏失败',
    }, { status: 500 });
  }
}
