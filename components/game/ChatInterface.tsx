'use client';

/**
 * 聊天输入组件 - 悬浮式现代化版本
 * 自适应高度，丝滑动画，圆形圆角
 * 支持 /crack 斜杠命令进入破案模式
 * 命令自动补全功能
 */

import React, { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  onSendMessage: (message: string, isCrackAttempt?: boolean) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

// 可用命令列表
const COMMANDS = [
  { command: '/crack', description: '破案模式：输入你认为的完整真相' },
];

export function ChatInterface({
  onSendMessage,
  disabled = false,
  className
}: ChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [isCrackMode, setIsCrackMode] = useState(false);
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 自动调整textarea高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 56), 200);
      textarea.style.height = `${newHeight}px`;
    }
  }, [message]);

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowCommandSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // 检测斜杠命令输入
    if (newValue === '/' && !isCrackMode) {
      setShowCommandSuggestions(true);
      setSelectedCommandIndex(0);
      setMessage(newValue);
      return;
    }

    // 如果在输入命令，过滤建议
    if (newValue.startsWith('/') && !isCrackMode) {
      setShowCommandSuggestions(true);
      setMessage(newValue);
      return;
    }

    // 检测 /crack 命令
    if (newValue.trim() === '/crack' && !isCrackMode) {
      setIsCrackMode(true);
      setMessage('');
      setShowCommandSuggestions(false);
      return;
    }

    // 按 ESC 退出或清空时退出破案模式
    if (newValue === '' && isCrackMode) {
      setIsCrackMode(false);
    }

    // 关闭建议
    if (!newValue.startsWith('/')) {
      setShowCommandSuggestions(false);
    }

    setMessage(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // ESC 退出破案模式或关闭建议
    if (e.key === 'Escape') {
      if (showCommandSuggestions) {
        e.preventDefault();
        setShowCommandSuggestions(false);
        setSelectedCommandIndex(0);
        return;
      }
      if (isCrackMode) {
        e.preventDefault();
        setIsCrackMode(false);
        setMessage('');
        return;
      }
    }

    // 处理命令建议导航
    if (showCommandSuggestions) {
      const filteredCommands = COMMANDS.filter(cmd =>
        cmd.command.startsWith(message)
      );

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        return;
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const selectedCommand = filteredCommands[selectedCommandIndex];
        if (selectedCommand) {
          // 执行选中的命令
          if (selectedCommand.command === '/crack') {
            setIsCrackMode(true);
            setMessage('');
            setShowCommandSuggestions(false);
            setSelectedCommandIndex(0);
          }
        }
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        if (filteredCommands.length > 0) {
          setMessage(filteredCommands[0].command);
          setShowCommandSuggestions(false);
        }
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const selectCommand = (command: string) => {
    if (command === '/crack') {
      setIsCrackMode(true);
      setMessage('');
      setShowCommandSuggestions(false);
      setSelectedCommandIndex(0);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!message.trim() || isSending || disabled) {
      return;
    }

    const messageToSend = message.trim();
    setMessage('');
    setError('');
    setShowCommandSuggestions(false);

    // 保存当前的破案模式状态（在重置之前）
    const wasCrackMode = isCrackMode;

    // 如果是破案模式，重置模式
    if (isCrackMode) {
      setIsCrackMode(false);
    }

    // 重置textarea高度
    if (textareaRef.current) {
      textareaRef.current.style.height = '56px';
    }
    textareaRef.current?.focus();

    try {
      setIsSending(true);
      // 传递保存的破案模式状态
      await onSendMessage(messageToSend, wasCrackMode);
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

  // 过滤命令建议
  const filteredCommands = COMMANDS.filter(cmd =>
    cmd.command.startsWith(message)
  );

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

      {/* 破案模式提示 */}
      <AnimatePresence>
        {isCrackMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg"
          >
            <p className="text-sm text-amber-400">
              🔍 破案模式：输入你认为的完整真相，按 ESC 取消
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 悬浮输入框 */}
      <div className="max-w-3xl mx-auto relative">
        {/* 命令建议列表 */}
        <AnimatePresence>
          {showCommandSuggestions && filteredCommands.length > 0 && (
            <motion.div
              ref={suggestionsRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden z-50"
            >
              {filteredCommands.map((cmd, index) => (
                <motion.button
                  key={cmd.command}
                  type="button"
                  onClick={() => selectCommand(cmd.command)}
                  className={cn(
                    "w-full px-4 py-3 text-left transition-colors duration-200",
                    "flex flex-col gap-1",
                    "hover:bg-slate-100 dark:hover:bg-zinc-800",
                    index === selectedCommandIndex
                      ? "bg-amber-50 dark:bg-amber-950/30"
                      : "bg-transparent"
                  )}
                >
                  <span className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    index === selectedCommandIndex
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-slate-900 dark:text-zinc-100"
                  )}>
                    {cmd.command}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-zinc-500">
                    {cmd.description}
                  </span>
                </motion.button>
              ))}
              <div className="px-4 py-2 bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-200 dark:border-zinc-800">
                <p className="text-xs text-slate-500 dark:text-zinc-500">
                  使用 ↑↓ 选择，Enter 确认
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 输入框容器 */}
        <div className={cn(
          "relative backdrop-blur-xl rounded-3xl shadow-2xl border transition-colors duration-300",
          "bg-white/92 dark:bg-zinc-900/80",
          // 破案模式：金色边框和微弱背景
          isCrackMode
            ? "border-amber-400/50 dark:border-amber-500/50 ring-2 ring-amber-400/20 dark:ring-amber-500/20"
            : "border-slate-200/90 dark:border-zinc-800/50"
        )}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSending}
            placeholder={isCrackMode ? "输入你认为的真相..." : "问问AI，或输入'/crack'破案"}
            rows={1}
            className={cn(
              "w-full px-5 py-4 pr-14",
              "min-h-[56px] max-h-[200px]",
              "bg-transparent text-sm transition-colors duration-300",
              // 破案模式：金色文字
              isCrackMode
                ? "text-amber-900 dark:text-amber-100 placeholder-amber-600/50 dark:placeholder-amber-400/50"
                : "text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500",
              "focus:outline-none focus:ring-0 focus:shadow-none focus:border-0 resize-none",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            style={{
              height: '56px',
              outline: 'none',
              boxShadow: 'none'
            }}
          />

          {/* 发送按钮 - 破案模式使用金色 */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={disabled || isSending || !message.trim()}
            className={cn(
              "absolute right-3 bottom-3",
              "p-2.5",
              "transition-all duration-300 ease-out",
              "flex items-center justify-center",
              // 破案模式：金色
              isCrackMode
                ? "text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                : "text-slate-500 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400",
              "disabled:opacity-30 disabled:cursor-not-allowed"
            )}
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isCrackMode ? (
              // 破案模式：钥匙图标
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
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
