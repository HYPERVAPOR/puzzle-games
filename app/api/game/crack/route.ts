/**
 * 游戏API - 破案尝试
 *
 * POST /api/game/crack
 * 允许玩家尝试破案（还原完整真相）
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleCrackAttempt } from '@/lib/game/game-manager';
import { sanitizeMessage } from '@/lib/validation/input-sanitizer';
import { ApiResponse, CrackAttemptResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, gameId, guess, username } = body;

    // 验证必填字段
    if (!userId || !gameId || !guess) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '用户ID、游戏ID和猜测内容不能为空',
      }, { status: 400 });
    }

    // 验证并转义猜测内容
    const sanitizedGuess = sanitizeMessage(guess);

    // 获取用户名
    const finalUsername = username || 'User';

    // 处理破案尝试
    const result = await handleCrackAttempt(
      gameId,
      userId,
      finalUsername,
      sanitizedGuess
    );

    const response: CrackAttemptResponse = {
      game: result.game,
      crackResponse: result.crackResponse,
      feedback: result.feedback,
    };

    return NextResponse.json<ApiResponse<CrackAttemptResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Crack attempt error:', error);

    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : '破案判定失败',
    }, { status: 500 });
  }
}
