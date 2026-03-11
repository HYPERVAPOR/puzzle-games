'use client';

/**
 * 现代化消息气泡组件 - 仿ChatGPT风格
 * 支持破案尝试和破案结果消息
 */

import React from 'react';
import { Check, X, HelpCircle } from 'lucide-react';
import { Message, AIResponse, CrackResponse } from '@/lib/types';
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
        <div className="text-xs text-zinc-400 dark:text-zinc-400 text-zinc-600 mb-1.5 px-1 flex items-center gap-2 transition-colors duration-300">
          <span>{username}</span>
          {timestamp && (
            <span className="text-zinc-400 dark:text-zinc-400 text-zinc-500 transition-colors duration-300">
              {new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className={cn(
          "rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm border transition-colors duration-300",
          "bg-slate-100 dark:bg-zinc-800",
          "border-slate-200 dark:border-zinc-700/50"
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
              <span className="text-xs text-zinc-400 dark:text-zinc-400 text-zinc-600 font-medium transition-colors duration-300">AI 判定</span>
            </div>
          )}
          {timestamp && (
            <span className="text-xs text-zinc-400 dark:text-zinc-400 text-zinc-500 transition-colors duration-300">
              {new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Message - No avatar */}
        <div className="text-sm text-zinc-100 dark:text-zinc-100 text-zinc-900 leading-relaxed whitespace-pre-wrap transition-colors duration-300">
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
      <p className="text-xs text-zinc-600 dark:text-zinc-600 transition-colors duration-300">
        {content}
      </p>
    </div>
  );
}

// 破案尝试消息组件
interface CrackAttemptMessageProps {
  content: string;
  username: string;
  timestamp?: Date;
}

export function CrackAttemptMessage({
  content,
  username,
  timestamp
}: CrackAttemptMessageProps) {
  return (
    <div className="flex justify-end mb-6">
      <div className="max-w-[85%]">
        <div className="text-xs text-amber-600 dark:text-amber-400 mb-1.5 px-1 flex items-center gap-2 font-medium transition-colors duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
          </svg>
          <span>{username} 尝试破案</span>
          {timestamp && (
            <span className="text-amber-500/70 dark:text-amber-500/70">
              {new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className={cn(
          "rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm border transition-colors duration-300",
          "bg-amber-50 dark:bg-amber-950/30",
          "border-amber-300 dark:border-amber-700/50"
        )}>
          <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed whitespace-pre-wrap transition-colors duration-300">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}

// 破案结果消息组件
interface CrackResultMessageProps {
  content: string;
  crackResponse?: CrackResponse;
  timestamp?: Date;
  fullStory?: string;
}

export function CrackResultMessage({
  content,
  crackResponse,
  timestamp,
  fullStory
}: CrackResultMessageProps) {
  const getConfig = () => {
    switch (crackResponse) {
      case 'correct':
        return {
          icon: <Check className="w-4 h-4 text-emerald-400" />,
          label: '破案成功',
          labelColor: 'text-emerald-600 dark:text-emerald-400',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
          borderColor: 'border-emerald-300 dark:border-emerald-700/50',
          textColor: 'text-emerald-900 dark:text-emerald-100',
        };
      case 'close':
        return {
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-amber-400"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
          label: '非常接近',
          labelColor: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-50 dark:bg-amber-950/30',
          borderColor: 'border-amber-300 dark:border-amber-700/50',
          textColor: 'text-amber-900 dark:text-amber-100',
        };
      case 'incorrect':
      default:
        return {
          icon: <X className="w-4 h-4 text-rose-400" />,
          label: '并非真相',
          labelColor: 'text-rose-600 dark:text-rose-400',
          bgColor: 'bg-rose-50 dark:bg-rose-950/30',
          borderColor: 'border-rose-300 dark:border-rose-700/50',
          textColor: 'text-rose-900 dark:text-rose-100',
        };
    }
  };

  // Loading state (when crackResponse is undefined during optimistic update)
  if (!crackResponse) {
    return (
      <div className="flex justify-start mb-6">
        <div className="max-w-[85%]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-400 animate-pulse">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                分析中
              </span>
            </div>
            {timestamp && (
              <span className="text-xs text-zinc-400 dark:text-zinc-400">
                {new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <div className="rounded-2xl px-4 py-3 shadow-sm border transition-colors duration-300 bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700/50">
            <p className="text-sm leading-relaxed whitespace-pre-wrap transition-colors duration-300 text-blue-900 dark:text-blue-100">
              {content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const config = getConfig();

  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-[85%]">
        {/* Header with response icon */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            {config.icon}
            <span className={cn("text-xs font-medium", config.labelColor)}>
              {config.label}
            </span>
          </div>
          {timestamp && (
            <span className="text-xs text-zinc-400 dark:text-zinc-400">
              {new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Message content */}
        <div className={cn(
          "rounded-2xl px-4 py-3 shadow-sm border transition-colors duration-300",
          config.bgColor,
          config.borderColor
        )}>
          <p className={cn("text-sm leading-relaxed whitespace-pre-wrap transition-colors duration-300", config.textColor)}>
            {content}
          </p>

          {/* 如果成功，显示完整故事 */}
          {crackResponse === 'correct' && fullStory && (
            <div className={cn(
              "mt-3 pt-3 border-t transition-colors duration-300",
              "border-emerald-200 dark:border-emerald-800/50"
            )}>
              <p className="text-xs font-semibold mb-2 text-emerald-700 dark:text-emerald-300">
                📖 完整真相：
              </p>
              <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">
                {fullStory}
              </p>
            </div>
          )}
        </div>
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

  // 处理破案尝试消息
  if (message.type === 'crack_attempt' || message.isCrackAttempt) {
    return (
      <CrackAttemptMessage
        content={message.content}
        username={message.username || 'User'}
        timestamp={message.timestamp}
      />
    );
  }

  // 处理破案结果消息
  if (message.type === 'crack_result') {
    return (
      <CrackResultMessage
        content={message.content}
        crackResponse={message.crackResponse}
        timestamp={message.timestamp}
        fullStory={message.fullStory}
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
