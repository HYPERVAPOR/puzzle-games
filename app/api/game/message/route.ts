/**
 * 游戏API - 发送消息
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/lib/game/game-manager';
import { sanitizeMessage } from '@/lib/validation/input-sanitizer';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, gameId, message } = body;

    if (!userId || !gameId || !message) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '用户ID、游戏ID和消息不能为空',
      }, { status: 400 });
    }

    // 验证并转义消息
    const sanitizedMessage = sanitizeMessage(message);

    // 从游戏状态中获取用户名（因为userId已经存在）
    // 这里我们需要从游戏对象中获取用户信息
    // 为了简化，我们让前端也传递username
    const username = body.username || 'User';

    // 发送消息
    const result = await sendMessage(gameId, userId, username, sanitizedMessage);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        game: result.game,
        aiResponse: result.aiResponse,
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : '发送消息失败',
    }, { status: 500 });
  }
}
