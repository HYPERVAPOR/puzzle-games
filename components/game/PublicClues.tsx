/**
 * 公开情报组件
 * 显示所有AI回答"是"的问题
 */

import React, { useState } from 'react';

interface PublicCluesProps {
  clues: string[];
  className?: string;
}

export function PublicClues({ clues, className = '' }: PublicCluesProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (clues.length === 0) {
    return null;
  }

  return (
    <div className={`bg-gray-900 border-t border-gray-800 ${className}`}>
      <div
        className="p-4 cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <h3 className="text-sm font-semibold text-white">
              可以公开的情报 ({clues.length})
            </h3>
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            {isExpanded ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {clues.map((clue, index) => (
            <div
              key={index}
              className="bg-green-900/30 border border-green-700/50 rounded-lg p-3"
            >
              <div className="flex items-start space-x-2">
                <span className="text-green-500 font-bold text-sm mt-0.5">✓</span>
                <p className="text-sm text-gray-200 flex-1">{clue}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
