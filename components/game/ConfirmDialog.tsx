'use client';

/**
 * 自定义确认对话框
 * 替代浏览器原生的 confirm/alert
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
  variant = 'warning',
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      confirm: 'bg-red-500 hover:bg-red-400 text-white',
      icon: 'text-red-500',
      iconBg: 'bg-red-500/10',
    },
    warning: {
      confirm: 'bg-amber-500 hover:bg-amber-400 text-white',
      icon: 'text-amber-500',
      iconBg: 'bg-amber-500/10',
    },
    info: {
      confirm: 'bg-emerald-500 hover:bg-emerald-400 text-white',
      icon: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10',
    },
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* 对话框 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-zinc-900 dark:bg-zinc-900 bg-white rounded-2xl shadow-2xl border border-zinc-800 dark:border-zinc-800 border-zinc-200 w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 头部 */}
              <div className="p-6 pb-4">
                <div className="flex items-start gap-4">
                  {/* 图标 */}
                  <div className={cn(
                    'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                    styles.iconBg
                  )}>
                    {variant === 'danger' && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={styles.icon}
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    )}
                    {variant === 'warning' && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={styles.icon}
                      >
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                        <path d="M12 9v4" />
                        <path d="M12 17h.01" />
                      </svg>
                    )}
                    {variant === 'info' && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={styles.icon}
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                    )}
                  </div>

                  {/* 标题和消息 */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-zinc-100 dark:text-zinc-100 text-zinc-900 mb-2">
                      {title}
                    </h3>
                    <p className="text-sm text-zinc-400 dark:text-zinc-400 text-zinc-600 leading-relaxed">
                      {message}
                    </p>
                  </div>
                </div>
              </div>

              {/* 底部按钮 */}
              <div className="px-6 pb-6 pt-2 flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg
                    bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 hover:bg-zinc-200
                    text-zinc-300 dark:text-zinc-300 text-zinc-700 dark:text-zinc-300 hover:text-zinc-200
                    transition-all duration-200"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={cn(
                    'flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                    styles.confirm
                  )}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
