/**
 * 游戏API - SSE事件流
 * 实时推送游戏事件
 */

import { NextRequest } from 'next/server';
import { addConnection } from '@/lib/game/event-dispatcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const gameId = request.nextUrl.searchParams.get('gameId');

  if (!gameId) {
    return new Response('Missing gameId parameter', { status: 400 });
  }

  // 创建SSE流
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // 发送初始连接成功消息
      const data = `data: ${JSON.stringify({
        event: 'connected',
        payload: { gameId },
        timestamp: new Date(),
      })}\n\n`;
      controller.enqueue(encoder.encode(data));

      // 添加连接到连接池
      const cleanup = addConnection(gameId, controller);

      // 当连接关闭时清理
      request.signal.addEventListener('abort', () => {
        cleanup();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
