/**
 * 管理员API - AI生成题目
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePuzzle } from '@/lib/game/ai-service';
import { ApiResponse } from '@/lib/types';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'admin123';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminPasscode, prompt } = body;

    // 验证管理员口令
    if (adminPasscode !== ADMIN_PASSCODE) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '管理员口令错误',
      }, { status: 401 });
    }

    // 调用AI生成题目
    const puzzle = await generatePuzzle(prompt);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { puzzle },
    });
  } catch (error) {
    console.error('Generate puzzle error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : '生成题目失败',
    }, { status: 500 });
  }
}
