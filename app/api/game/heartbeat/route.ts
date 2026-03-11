/**
 * 心跳API - 用于检测用户是否在线
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateHeartbeat } from '@/lib/game/game-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, userId } = body;

    if (!gameId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing gameId or userId'
      }, { status: 400 });
    }

    // 更新用户心跳时间
    await updateHeartbeat(gameId, userId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json({
      success: false,
      error: 'Heartbeat failed'
    }, { status: 500 });
  }
}
