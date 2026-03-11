/**
 * 清理任务初始化
 * 确保清理任务在服务器启动时只启动一次
 */

import { startCleanupTask } from './game-manager';

let cleanupStarted = false;

export function ensureCleanupStarted() {
  if (!cleanupStarted) {
    startCleanupTask();
    cleanupStarted = true;
    console.log('✓ User cleanup task started (checks every 30s)');
  }
}

// 自动启动清理任务
ensureCleanupStarted();
