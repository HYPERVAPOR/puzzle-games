/**
 * 测试 SSE 端点
 * 用于验证 SSE 连接是否正常工作
 */

import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // 发送初始连接消息
      const data = `data: ${JSON.stringify({
        event: 'connected',
        payload: { message: 'SSE connection established' },
        timestamp: new Date(),
      })}\n\n`;
      controller.enqueue(encoder.encode(data));

      // 每 3 秒发送一次测试消息
      const interval = setInterval(() => {
        const testData = `data: ${JSON.stringify({
          event: 'test',
          payload: { message: `Test message at ${new Date().toISOString()}` },
          timestamp: new Date(),
        })}\n\n`;
        try {
          controller.enqueue(encoder.encode(testData));
        } catch (error) {
          console.error('Failed to send test message:', error);
          clearInterval(interval);
        }
      }, 3000);

      // 当连接关闭时清理
      request.signal.addEventListener('abort', () => {
        console.log('[Test SSE] Connection closed');
        clearInterval(interval);
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
    },
  });
}
