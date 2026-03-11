/**
 * 会话存储 - 简单的内存实现
 * TODO: 实现完整的会话管理功能
 */

export interface Session {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function listSessions(): Promise<Session[]> {
  // TODO: 实现会话列表功能
  return [];
}

export async function createSession(name: string): Promise<Session> {
  // TODO: 实现创建会话功能
  return {
    id: Date.now().toString(),
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function getSession(id: string): Promise<Session | null> {
  // TODO: 实现获取会话功能
  return null;
}
