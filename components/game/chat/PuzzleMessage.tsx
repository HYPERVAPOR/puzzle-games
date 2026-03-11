'use client';

/**
 * 汤面消息组件 - 置顶显示，可折叠
 */

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PuzzleMessageProps {
  surface: string;  // 汤面
  bottom?: string;  // 汤底 (only show if game is finished)
  isFinished: boolean;
}

export function PuzzleMessage({ surface, bottom, isFinished }: PuzzleMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  // 检测内容是否真的溢出（类似抖音评论区的实现）
  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    // 检查 scrollHeight 是否大于 clientHeight
    const checkOverflow = () => {
      const overflowing = element.scrollHeight > element.clientHeight;
      // 一旦检测到溢出，就保持按钮显示（展开后不再重新检测）
      setIsOverflowing(prev => prev || overflowing);
    };

    // 初始检测
    checkOverflow();

    // 窗口大小改变时重新检测（响应式）
    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [surface]);

  return (
    <div className="mb-6">
      {/* Puzzle Content */}
      <div className="text-center">
        <p
          ref={contentRef}
          className={cn(
            "text-sm leading-relaxed whitespace-pre-wrap transition-colors duration-300",
            "text-slate-700 dark:text-zinc-300",
            // 移动端：长文本折叠显示两行
            !isExpanded && "line-clamp-2"
          )}
        >
          {surface}
        </p>

        {/* 展开/收起按钮 - 只在内容真的溢出时显示 */}
        {isOverflowing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="mt-2 text-sm text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors duration-200 font-medium inline-flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                收起
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                展开
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Answer (汤底) - Only if finished */}
      {isFinished && bottom && (
        <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-zinc-800/50 transition-colors duration-300">
          <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap transition-colors duration-300 text-center">
            {bottom}
          </p>
        </div>
      )}
    </div>
  );
}
