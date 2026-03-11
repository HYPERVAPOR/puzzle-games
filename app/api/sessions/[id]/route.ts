/**
 * 会话详情API - 获取指定会话详情
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/storage/session-store';
import { getSessionGames } from '@/lib/storage/file-storage';
import { ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    // 获取会话信息
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '会话不存在',
      }, { status: 404 });
    }

    // 获取会话的所有游戏
    const games = await getSessionGames(sessionId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { session, games },
    });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: '获取会话详情失败',
    }, { status: 500 });
  }
}
