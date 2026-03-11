'use client';

/**
 * 情报板组件 - 右侧面板，显示已确认的线索
 * 仿Notion侧边栏风格
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClueBoardProps {
  clues: string[];
  className?: string;
}

export function ClueBoard({ clues, className }: ClueBoardProps) {
  return (
    <div className={cn("h-full flex flex-col bg-zinc-900/30 border-r border-zinc-800/50", className)}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
            已确认线索
          </h2>
          {/* Simple count */}
          <span className="text-xs text-zinc-500">
            {clues.length}
          </span>
        </div>
      </div>

      {/* Clues List */}
      <div className="flex-1 overflow-y-auto p-4">
        {clues.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Lightbulb className="w-10 h-10 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500">
              暂无线索
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              先问AI，才有线索
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {clues.map((clue, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex gap-3 p-3 bg-zinc-800/40 rounded-xl
                            border border-zinc-700/50
                            hover:bg-zinc-800/60 hover:border-zinc-700/70
                            transition-all duration-200"
              >
                {/* 序号 */}
                <div className="flex-shrink-0 w-6 h-6 rounded-full
                            bg-emerald-500/10 text-emerald-400
                            flex items-center justify-center
                            text-xs font-semibold border border-emerald-500/20">
                  {index + 1}
                </div>

                {/* 内容 */}
                <p className="flex-1 text-sm text-zinc-300 leading-relaxed">
                  {clue}
                </p>

                {/* 确认图标 */}
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
