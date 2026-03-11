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
    <div className="mb-6">
      {/* Header - Always Visible */}
      <div
        onClick={() => shouldCollapse && setIsExpanded(!isExpanded)}
        className={cn(
          "transition-colors",
          shouldCollapse && "cursor-pointer"
        )}
      >
        {/* Expand/Collapse Icon - Top Right */}
        {shouldCollapse && (
          <div className="flex justify-end mb-2">
            <button className="text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        )}

        {/* Puzzle Content */}
        <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap transition-colors duration-300 text-justify">
          {shouldCollapse && !isExpanded
            ? surface.substring(0, 150) + '...'
            : surface}
        </p>
      </div>

      {/* Answer (汤底) - Only if finished */}
      {isFinished && bottom && (
        <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-zinc-800/50 transition-colors duration-300">
          <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap transition-colors duration-300 text-justify">
            {bottom}
          </p>
        </div>
      )}
    </div>
  );
}
