'use client';

/**
 * 汤面消息组件 - 置顶显示，可折叠
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PuzzleMessageProps {
  surface: string;  // 汤面
  bottom?: string;  // 汤底 (only show if game is finished)
  isFinished: boolean;
}

export function PuzzleMessage({ surface, bottom, isFinished }: PuzzleMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldCollapse = surface.length > 150;

  return (
    <div
      className="mb-6 rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm transition-colors duration-300
                 bg-white/85 dark:bg-zinc-900/50
                 border border-slate-200/80 dark:border-zinc-800/50"
    >
      {/* Header - Always Visible */}
      <div
        onClick={() => shouldCollapse && setIsExpanded(!isExpanded)}
        className={cn(
          "p-4 transition-colors",
          shouldCollapse && "cursor-pointer hover:bg-slate-100/80 dark:hover:bg-zinc-800/30"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Icon + Title */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10
                        flex items-center justify-center">
              <span className="text-amber-400">🐢</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 transition-colors duration-300">
                汤面
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5 transition-colors duration-300">
                {isFinished ? "已破解" : "推理真相"}
              </p>
            </div>
          </div>

          {/* Expand/Collapse Icon */}
          {shouldCollapse && (
            <button className="text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {/* Preview (first 150 chars) */}
        <div className="mt-3">
          <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap transition-colors duration-300">
            {shouldCollapse && !isExpanded
              ? surface.substring(0, 150) + '...'
              : surface}
          </p>
        </div>
      </div>

      {/* Answer (汤底) - Only if finished */}
      {isFinished && bottom && (
        <div className="border-t border-slate-200/80 dark:border-zinc-800/50 p-4 bg-slate-50/80 dark:bg-zinc-800/30 transition-colors duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-emerald-500/10
                        flex items-center justify-center">
              <span className="text-emerald-400 text-xs">✓</span>
            </div>
            <h4 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 transition-colors duration-300">
              真相
            </h4>
          </div>
          <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap transition-colors duration-300">
            {bottom}
          </p>
        </div>
      )}
    </div>
  );
}
