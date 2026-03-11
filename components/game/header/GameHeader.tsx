'use client';

/**
 * 游戏头部组件 - 仿Notion/ChatGPT头部
 */

import React from 'react';
import { Game } from '@/lib/types';
import { cn } from '@/lib/utils';

interface GameHeaderProps {
  game: Game;
  roomName: string;
  isConnected: boolean;
}

type StatusVariant = 'playing' | 'solved';

export function GameHeader({ game, roomName, isConnected }: GameHeaderProps) {
  // 确定游戏状态 - 只显示进行中和已破解
  const getStatus = (): { text: string; variant: StatusVariant } | null => {
    if (game.status === 'finished') return { text: '已破解', variant: 'solved' };
    if (game.status === 'playing') return { text: '进行中', variant: 'playing' };
    return null; // waiting状态不显示badge
  };

  const status = getStatus();

  const statusVariants: Record<StatusVariant, string> = {
    playing: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    solved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <header className="glass-header">
      <div className="px-6 py-3">
        <div className="flex items-center justify-center">
          {/* Center: Room Name + Status Badge */}
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-base font-semibold text-slate-900 dark:text-zinc-100 tracking-tight transition-colors duration-300">
                {roomName}
              </h1>
            </div>
            {status && (
              <span
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-md border transition-smooth",
                  statusVariants[status.variant]
                )}
              >
                {status.text}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
