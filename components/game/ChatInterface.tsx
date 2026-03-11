'use client';

/**
 * 聊天输入组件 - 悬浮式现代化版本
 * 自适应高度，丝滑动画，圆形圆角
 */

import React, { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function ChatInterface({ onSendMessage, disabled = false, className }: ChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整textarea高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // 重置高度到auto以获取正确的scrollHeight
      textarea.style.height = 'auto';
      // 计算新高度，最小56px（相当于py-4 + line-height），最大200px
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 56), 200);
      textarea.style.height = `${newHeight}px`;
    }
  }, [message]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!message.trim() || isSending || disabled) {
      return;
    }

    const messageToSend = message.trim();
    setMessage('');
    setError('');

    // 重置textarea高度
    if (textareaRef.current) {
      textareaRef.current.style.height = '56px';
    }
    textareaRef.current?.focus();

    try {
      setIsSending(true);
      await onSendMessage(messageToSend);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = error instanceof Error ? error.message : '发送失败，请稍后重试';
      setError(errorMessage);
      setMessage(messageToSend); // 恢复消息
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn("px-4 pt-4 pb-8", className)}>
      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg"
          >
            <p className="text-sm text-rose-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 悬浮输入框 */}
      <div className="max-w-3xl mx-auto">
        <div className="relative bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-zinc-800/50">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSending}
            placeholder="问问AI"
            rows={1}
            className={cn(
              "w-full px-5 py-4 pr-14",
              "min-h-[56px] max-h-[200px]",
              "bg-transparent text-sm text-zinc-100 placeholder-zinc-500",
              "focus:outline-none focus:ring-0 focus:shadow-none focus:border-0 resize-none",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-300 ease-out"
            )}
            style={{
              height: '56px',
              outline: 'none',
              boxShadow: 'none'
            }}
          />

          {/* 发送按钮 - 悬浮在右下角 */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={disabled || isSending || !message.trim()}
            className={cn(
              "absolute right-3 bottom-3",
              "p-2.5",
              "text-zinc-400 hover:text-emerald-400",
              "disabled:opacity-30 disabled:cursor-not-allowed",
              "transition-all duration-300 ease-out",
              "flex items-center justify-center"
            )}
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z"/>
                <path d="M6 12h16"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
