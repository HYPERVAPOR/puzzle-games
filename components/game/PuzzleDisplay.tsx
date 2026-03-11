/**
 * 谜面显示组件
 */

import React from 'react';
import { Puzzle } from '@/lib/types';

interface PuzzleDisplayProps {
  puzzle: Puzzle;
  showBottom?: boolean;
  className?: string;
}

export function PuzzleDisplay({ puzzle, showBottom = false, className = '' }: PuzzleDisplayProps) {
  return (
    <div className={`bg-gradient-to-br from-gray-900 to-gray-800 border-b border-gray-700 ${className}`}>
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <h2 className="text-lg font-semibold text-white">谜面（汤面）</h2>
        </div>
        <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
          {puzzle.surface}
        </p>

        {showBottom && puzzle.bottom && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <h2 className="text-lg font-semibold text-white">谜底（汤底）</h2>
            </div>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {puzzle.bottom}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
