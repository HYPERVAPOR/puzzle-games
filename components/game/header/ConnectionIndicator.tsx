'use client';

/**
 * SSE连接状态指示器 - 仿VSCode状态栏风格
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ConnectionIndicatorProps {
  isConnected: boolean;
  className?: string;
}

export function ConnectionIndicator({ isConnected, className }: ConnectionIndicatorProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <div
        className={cn(
          "w-2 h-2 rounded-full transition-all duration-300",
          isConnected ? "bg-emerald-400 animate-pulse-slow" : "bg-zinc-600"
        )}
        title={isConnected ? '已连接' : '重连中'}
      />
    </div>
  );
}
