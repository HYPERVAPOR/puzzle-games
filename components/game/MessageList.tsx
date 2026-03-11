'use client';

/**
 * 消息列表组件 - 现代化版本
 * 仿ChatGPT/Notion风格，居中布局，带动画
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Message, Game } from '@/lib/types';
import { MessageBubble } from './chat/MessageBubble';
import { PuzzleMessage } from './chat/PuzzleMessage';
import { cn } from '@/lib/utils';

interface MessageListProps {
  messages: Message[];
  game: Game;
  currentUserId: string;
  className?: string;
}

export function MessageList({ messages, game, currentUserId, className }: MessageListProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const previousMessageCountRef = React.useRef(messages.length);

  React.useEffect(() => {
    const hasNewMessage = messages.length > previousMessageCountRef.current;
    messagesEndRef.current?.scrollIntoView({
      behavior: hasNewMessage ? 'smooth' : 'auto',
    });
    previousMessageCountRef.current = messages.length;
    console.log('[MessageList] Messages updated:', {
      total: messages.length,
      byType: {
        system: messages.filter(m => m.type === 'system').length,
        user: messages.filter(m => m.type === 'user').length,
        ai: messages.filter(m => m.type === 'ai').length,
      },
      messages: messages.map(m => ({
        id: m.id,
        type: m.type,
        content: m.content?.substring(0, 30) + '...',
      }))
    });
  }, [messages]);

  return (
    <div className={cn("flex-1 overflow-y-auto", className)}>
      {/* Centered Container - 仿ChatGPT */}
      <div className="max-w-3xl mx-auto px-6 py-6">
        {/* Puzzle - Pinned at top */}
        <PuzzleMessage
          surface={game.puzzle.surface}
          bottom={game.puzzle.bottom}
          isFinished={game.status === 'finished'}
        />

        {/* Messages */}
        {messages.map((message) => (
          <motion.div
            key={message.id}
            layout="position"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.2,
              ease: 'easeOut',
            }}
          >
            <MessageBubble
              message={message}
              isCurrentUser={message.userId === currentUserId}
            />
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
