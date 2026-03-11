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
  // 确定游戏状态 - 只显示进行中和已破案
  const getStatus = (): { text: string; variant: StatusVariant } => {
    // 检查是否有成功的破案记录
    const hasSuccessfulCrack = game.messages?.some(
      msg => msg.type === 'crack_result' && msg.crackResponse === 'correct'
    );

    if (hasSuccessfulCrack) {
      return { text: '已破案', variant: 'solved' };
    }

    // 游戏正在进行中（包括 waiting 和 playing 状态）
    return { text: '进行中', variant: 'playing' };
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
            <span
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md border transition-smooth",
                statusVariants[status.variant]
              )}
            >
              {status.text}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
