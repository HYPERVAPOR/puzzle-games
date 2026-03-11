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
        <div className="text-xs text-zinc-500 mb-1.5 px-1 flex items-center gap-2">
          <span>{username}</span>
          {timestamp && (
            <span className="text-zinc-600">
              {new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="bg-zinc-800 rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm border border-zinc-700/50">
          <p className="text-sm text-zinc-100 leading-relaxed whitespace-pre-wrap">
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
    irrelevant: <HelpCircle className="w-4 h-4 text-zinc-400" />,
  };

  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-[85%]">
        {/* Header with response icon */}
        <div className="flex items-center gap-2 mb-1.5">
          {aiResponse && (
            <div className="flex items-center gap-1.5">
              {icons[aiResponse]}
              <span className="text-xs text-zinc-500 font-medium">AI 判定</span>
            </div>
          )}
          {timestamp && (
            <span className="text-xs text-zinc-600">
              {new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Message - No avatar */}
        <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
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
      <div className="bg-zinc-900/30 px-4 py-2 rounded-full
                  text-xs text-zinc-500">
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
