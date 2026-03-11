'use client';

/**
 * 现代化消息气泡组件 - 仿ChatGPT风格
 */

import React from 'react';
import { Check, X, HelpCircle } from 'lucide-react';
import { Message, AIResponse } from '@/lib/types';
import { cn } from '@/lib/utils';

interface UserMessageProps {
  content: string;
  username: string;
  timestamp?: Date;
}

export function UserMessage({ content, username, timestamp }: UserMessageProps) {
  return (
    <div className="flex justify-end mb-6">
      <div className="max-w-[85%]">
        <div className="text-xs text-zinc-500 dark:text-zinc-500 text-zinc-600 mb-1.5 px-1 flex items-center gap-2 transition-colors duration-300">
          <span>{username}</span>
          {timestamp && (
            <span className="text-zinc-600 dark:text-zinc-600 text-zinc-500 transition-colors duration-300">
              {new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className={cn(
          "rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm border transition-colors duration-300",
          "bg-zinc-800 dark:bg-zinc-800 bg-zinc-200",
          "border-zinc-700/50 dark:border-zinc-700/50 border-zinc-300/50"
        )}>
          <p className="text-sm text-zinc-100 dark:text-zinc-100 text-zinc-900 leading-relaxed whitespace-pre-wrap transition-colors duration-300">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}

interface AIMessageProps {
  content: string;
  aiResponse?: AIResponse;
  timestamp?: Date;
}

export function AIMessage({ content, aiResponse, timestamp }: AIMessageProps) {
  const icons = {
    yes: <Check className="w-4 h-4 text-emerald-400" />,
    no: <X className="w-4 h-4 text-rose-400" />,
    irrelevant: <HelpCircle className="w-4 h-4 text-zinc-400 dark:text-zinc-400 text-zinc-600 transition-colors duration-300" />,
  };

  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-[85%]">
        {/* Header with response icon */}
        <div className="flex items-center gap-2 mb-1.5">
          {aiResponse && (
            <div className="flex items-center gap-1.5">
              {icons[aiResponse]}
              <span className="text-xs text-zinc-500 dark:text-zinc-500 text-zinc-600 font-medium transition-colors duration-300">AI 判定</span>
            </div>
          )}
          {timestamp && (
            <span className="text-xs text-zinc-600 dark:text-zinc-600 text-zinc-500 transition-colors duration-300">
              {new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Message - No avatar */}
        <div className="text-sm text-zinc-300 dark:text-zinc-300 text-zinc-700 leading-relaxed whitespace-pre-wrap transition-colors duration-300">
          {content}
        </div>
      </div>
    </div>
  );
}

interface SystemMessageProps {
  content: string;
}

export function SystemMessage({ content }: SystemMessageProps) {
  return (
    <div className="flex justify-center my-4">
      <div className={cn(
        "px-4 py-2 rounded-full text-xs transition-colors duration-300",
        "bg-zinc-900/30 dark:bg-zinc-900/30 bg-zinc-200/50",
        "text-zinc-500 dark:text-zinc-500 text-zinc-600"
      )}>
        {content}
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  if (message.type === 'system') {
    return <SystemMessage content={message.content} />;
  }

  if (message.type === 'ai') {
    return (
      <AIMessage
        content={message.content}
        aiResponse={message.aiResponse}
        timestamp={message.timestamp}
      />
    );
  }

  return (
    <UserMessage
      content={message.content}
      username={message.username || 'User'}
      timestamp={message.timestamp}
    />
  );
}
