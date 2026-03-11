/**
 * 认证API - 用户登录
 */

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { User, LoginResponse } from '@/lib/types';
import { sanitizeUsername, validatePasscode } from '@/lib/validation/input-sanitizer';

const GAME_PASSCODE = process.env.GAME_PASSCODE || 'letmein';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, passcode } = body;

    // 验证输入
    if (!username || !passcode) {
      return NextResponse.json<LoginResponse>({
        success: false,
        error: '用户名和口令不能为空',
      }, { status: 400 });
    }

    // 验证口令
    if (passcode !== GAME_PASSCODE) {
      return NextResponse.json<LoginResponse>({
        success: false,
        error: '口令错误',
      }, { status: 401 });
    }

    // 验证并转义用户名
    const sanitizedUsername = sanitizeUsername(username);

    // 创建用户对象
    const user: User = {
      id: randomUUID(),
      username: sanitizedUsername,
      joinedAt: new Date(),
      lastSeen: new Date(),
    };

    // 生成JWT token
    const token = await new SignJWT({
      userId: user.id,
      username: user.username,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    return NextResponse.json<LoginResponse>({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json<LoginResponse>({
      success: false,
      error: '登录失败，请稍后重试',
    }, { status: 500 });
  }
}

function randomUUID(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
