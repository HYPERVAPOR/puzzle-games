/**
 * 事件分发器
 * 管理SSE连接池和事件广播
 */

import { ServerEvent } from '../types';

interface SSEConnection {
  gameId: string;
  controller: ReadableStreamDefaultController;
  userId?: string;
}

// 使用全局变量存储连接池，避免 Next.js 热重载时丢失连接
const globalConnections = () => {
  if (!(globalThis as any).__sse_connections__) {
    (globalThis as any).__sse_connections__ = new Set<SSEConnection>();
    console.log(`[EventDispatcher] Created new global connections pool`);
  } else {
    console.log(`[EventDispatcher] Using existing global connections pool, size: ${(globalThis as any).__sse_connections__.size}`);
  }
  return (globalThis as any).__sse_connections__;
};

const connections = globalConnections();

/**
 * 发送事件到指定连接
 */
function sendEvent(connection: SSEConnection, event: ServerEvent): void {
  try {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    connection.controller.enqueue(new TextEncoder().encode(data));
    console.log(`[EventDispatcher] Sent ${event.event} event to connection for game ${connection.gameId}`);
  } catch (error) {
    console.error(`[EventDispatcher] Failed to send event to connection for game ${connection.gameId}:`, error);
    // 连接可能已断开，移除连接
    globalConnections().delete(connection);
  }
}

/**
 * 广播事件到所有连接
 */
export function broadcastEvent(event: ServerEvent): void {
  const conns = globalConnections();
  conns.forEach(connection => {
    sendEvent(connection, event);
  });
}

/**
 * 广播事件到指定游戏的所有连接
 */
export function broadcastToGame(gameId: string, event: ServerEvent): void {
  const conns = globalConnections();
  let connectionCount = 0;
  conns.forEach(connection => {
    if (connection.gameId === gameId) {
      sendEvent(connection, event);
      connectionCount++;
    }
  });
  console.log(`[EventDispatcher] Broadcast ${event.event} to ${connectionCount} connections for game ${gameId}`);
}

/**
 * 添加SSE连接
 */
export function addConnection(
  gameId: string,
  controller: ReadableStreamDefaultController,
  userId?: string
): () => void {
  const conns = globalConnections();
  const connection: SSEConnection = {
    gameId,
    controller,
    userId,
  };

  conns.add(connection);
  console.log(`[EventDispatcher] Added SSE connection for game ${gameId}, total connections: ${conns.size}`);
  console.log(`[EventDispatcher] Current game IDs in pool:`, Array.from(conns).map(c => c.gameId));

  // 返回清理函数
  return () => {
    console.log(`[EventDispatcher] Removing SSE connection for game ${gameId}`);
    conns.delete(connection);
    console.log(`[EventDispatcher] Remaining connections: ${conns.size}`);
  };
}

/**
 * 发送心跳保活消息
 */
export function sendHeartbeat(): void {
  const conns = globalConnections();
  conns.forEach(connection => {
    try {
      const data = `: heartbeat\n\n`;
      connection.controller.enqueue(new TextEncoder().encode(data));
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
      conns.delete(connection);
    }
  });
}

/**
 * 启动心跳定时器
 */
let heartbeatInterval: NodeJS.Timeout | null = null;

export function startHeartbeat(interval: number = 30000): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  heartbeatInterval = setInterval(() => {
    sendHeartbeat();
  }, interval);
}

/**
 * 停止心跳定时器
 */
export function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

/**
 * 获取连接数量
 */
export function getConnectionCount(): number {
  return globalConnections().size;
}

/**
 * 获取指定游戏的连接数量
 */
export function getGameConnectionCount(gameId: string): number {
  const conns = globalConnections();
  let count = 0;
  conns.forEach(connection => {
    if (connection.gameId === gameId) {
      count++;
    }
  });
  return count;
}

// 在模块加载时启动心跳
startHeartbeat();
