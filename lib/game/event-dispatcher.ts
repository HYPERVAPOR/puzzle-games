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

// 连接池：存储所有活跃的SSE连接
const connections = new Set<SSEConnection>();

/**
 * 发送事件到指定连接
 */
function sendEvent(connection: SSEConnection, event: ServerEvent): void {
  try {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    connection.controller.enqueue(new TextEncoder().encode(data));
  } catch (error) {
    console.error('Failed to send event:', error);
    // 连接可能已断开，移除连接
    connections.delete(connection);
  }
}

/**
 * 广播事件到所有连接
 */
export function broadcastEvent(event: ServerEvent): void {
  connections.forEach(connection => {
    sendEvent(connection, event);
  });
}

/**
 * 广播事件到指定游戏的所有连接
 */
export function broadcastToGame(gameId: string, event: ServerEvent): void {
  connections.forEach(connection => {
    if (connection.gameId === gameId) {
      sendEvent(connection, event);
    }
  });
}

/**
 * 添加SSE连接
 */
export function addConnection(
  gameId: string,
  controller: ReadableStreamDefaultController,
  userId?: string
): () => void {
  const connection: SSEConnection = {
    gameId,
    controller,
    userId,
  };

  connections.add(connection);

  // 返回清理函数
  return () => {
    connections.delete(connection);
  };
}

/**
 * 发送心跳保活消息
 */
export function sendHeartbeat(): void {
  connections.forEach(connection => {
    try {
      const data = `: heartbeat\n\n`;
      connection.controller.enqueue(new TextEncoder().encode(data));
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
      connections.delete(connection);
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
  return connections.size;
}

/**
 * 获取指定游戏的连接数量
 */
export function getGameConnectionCount(gameId: string): number {
  let count = 0;
  connections.forEach(connection => {
    if (connection.gameId === gameId) {
      count++;
    }
  });
  return count;
}

// 在模块加载时启动心跳
startHeartbeat();
