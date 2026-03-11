/**
 * 会话API - 获取会话列表和创建会话
 */

import { NextRequest, NextResponse } from 'next/server';
import { listSessions, createSession } from '@/lib/storage/session-store';
import { ApiResponse } from '@/lib/types';

export async function GET() {
  try {
    const sessions = await listSessions();

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { sessions },
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: '获取会话列表失败',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '会话名称不能为空',
      }, { status: 400 });
    }

    const session = await createSession(name);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { session },
    });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: '创建会话失败',
    }, { status: 500 });
  }
}
