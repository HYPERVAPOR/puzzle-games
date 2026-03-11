/**
 * 管理员API - 创建题目
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Puzzle } from '@/lib/types';
import { sanitizePuzzleSurface, sanitizePuzzleBottom } from '@/lib/validation/input-sanitizer';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'admin123';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminPasscode, surface, bottom } = body;

    // 验证管理员口令
    if (adminPasscode !== ADMIN_PASSCODE) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '管理员口令错误',
      }, { status: 401 });
    }

    // 验证输入
    if (!surface || !bottom) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '谜面和谜底不能为空',
      }, { status: 400 });
    }

    // 验证并转义输入
    const sanitizedSurface = sanitizePuzzleSurface(surface);
    const sanitizedBottom = sanitizePuzzleBottom(bottom);

    // 创建题目
    const puzzle: Puzzle = {
      id: `puzzle-${Date.now()}`,
      surface: sanitizedSurface,
      bottom: sanitizedBottom,
      createdAt: new Date(),
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { puzzle },
    });
  } catch (error) {
    console.error('Create puzzle error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : '创建题目失败',
    }, { status: 500 });
  }
}
