'use client';

/**
 * 设置菜单组件 - 包含主题切换和其他设置选项
 * 可用于侧边栏或头部
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsMenuProps {
  className?: string;
  triggerClassName?: string;
  roomId?: string;
  isDefaultRoom?: boolean;
  onBecomeOwner?: (password: string) => Promise<void> | void;
}

export function SettingsMenu({ className, triggerClassName, isDefaultRoom, onBecomeOwner }: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerError, setOwnerError] = useState('');
  const [isBecomingOwner, setIsBecomingOwner] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 成为房主
  const handleBecomeOwner = async () => {
    if (!ownerPassword.trim()) {
      setOwnerError('请输入房主密码');
      return;
    }

    setIsBecomingOwner(true);
    setOwnerError('');

    try {
      if (onBecomeOwner) {
        await onBecomeOwner(ownerPassword);
        setIsOwnerModalOpen(false);
        setOwnerPassword('');
        setIsOpen(false);
      }
    } catch (error: any) {
      setOwnerError(error.message || '成为房主失败');
    } finally {
      setIsBecomingOwner(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* 设置按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2 rounded-lg transition-all duration-200",
          "hover:bg-zinc-800/50 dark:hover:bg-zinc-800/50 hover:bg-zinc-200/50",
          "text-zinc-100 dark:text-zinc-100 text-zinc-800 hover:text-zinc-50 dark:hover:text-zinc-50 hover:text-zinc-900",
          "focus:outline-none focus-visible:ring-2",
          "focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2",
          "focus-visible:ring-offset-[#131314] dark:focus-visible:ring-offset-[#131314] focus-visible:ring-offset-white",
          triggerClassName
        )}
        aria-label="设置"
        aria-expanded={isOpen}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div
          className={cn(
            "absolute bottom-full left-0 mb-2 w-56 rounded-xl",
            "bg-zinc-900/95 dark:bg-zinc-900/95 bg-white/95",
            "backdrop-blur-xl",
            "border border-zinc-800/50 dark:border-zinc-800/50 border-zinc-200/50",
            "shadow-2xl",
            "animate-slide-in",
            "py-2",
            className
          )}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="settings-menu"
        >
          {/* 主题切换 */}
          <div
            className="px-3 py-2"
            role="none"
          >
            <p
              className="text-xs font-medium text-zinc-300 dark:text-zinc-300 text-zinc-800 mb-2 px-1"
              role="none"
            >
              主题
            </p>
            <div className="space-y-1" role="group">
              {/* 深色模式 */}
              <button
                disabled
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
                  "transition-all duration-200",
                  "text-left",
                  "text-zinc-300 dark:text-zinc-300 text-zinc-700",
                  "cursor-not-allowed opacity-50"
                )}
                role="menuitem"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
                <span className="text-sm font-medium">深色模式</span>
                <span
                  className={cn(
                    "ml-auto text-xs px-1.5 py-0.5 rounded",
                    "bg-zinc-700/50 dark:bg-zinc-700/50 bg-zinc-300/50",
                    "text-zinc-300 dark:text-zinc-300 text-zinc-700"
                  )}
                >
                  即将推出
                </span>
              </button>

              {/* 浅色模式 */}
              <button
                disabled
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
                  "transition-all duration-200",
                  "text-left",
                  "text-zinc-300 dark:text-zinc-300 text-zinc-700",
                  "cursor-not-allowed opacity-50"
                )}
                role="menuitem"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
                <span className="text-sm font-medium">浅色模式</span>
                <span
                  className={cn(
                    "ml-auto text-xs px-1.5 py-0.5 rounded",
                    "bg-zinc-700/50 dark:bg-zinc-700/50 bg-zinc-300/50",
                    "text-zinc-300 dark:text-zinc-300 text-zinc-700"
                  )}
                >
                  即将推出
                </span>
              </button>
            </div>
          </div>

          {/* 分隔线 */}
          <div
            className="my-2 border-t border-zinc-800/50 dark:border-zinc-800/50 border-zinc-200/50"
            role="separator"
          />

          {/* 占位符按钮 */}
          <div
            className="px-3 py-2"
            role="none"
          >
            <p
              className="text-xs font-medium text-zinc-300 dark:text-zinc-300 text-zinc-800 mb-2 px-1"
              role="none"
            >
              设置
            </p>

            {/* 成为房主选项（仅默认房间） */}
            {isDefaultRoom && (
              <div className="space-y-1 mb-2" role="group">
                <button
                  onClick={() => {
                    setIsOwnerModalOpen(true);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
                    "transition-all duration-200",
                    "text-left",
                    "text-zinc-100 dark:text-zinc-100 text-zinc-900",
                    "hover:bg-zinc-800/50 dark:hover:bg-zinc-800/50 hover:bg-zinc-200/50"
                  )}
                  role="menuitem"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" x2="3" y1="12" y2="12" />
                  </svg>
                  <span className="text-sm font-medium">成为房主</span>
                </button>
              </div>
            )}

            <div className="space-y-1" role="group">
              <button
                disabled
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
                  "transition-all duration-200",
                  "text-left",
                  "text-zinc-300 dark:text-zinc-300 text-zinc-700",
                  "cursor-not-allowed opacity-50"
                )}
                role="menuitem"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                <span className="text-sm font-medium">通知设置</span>
                <span
                  className={cn(
                    "ml-auto text-xs px-1.5 py-0.5 rounded",
                    "bg-zinc-700/50 dark:bg-zinc-700/50 bg-zinc-300/50",
                    "text-zinc-300 dark:text-zinc-300 text-zinc-700"
                  )}
                >
                  即将推出
                </span>
              </button>

              <button
                disabled
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
                  "transition-all duration-200",
                  "text-left",
                  "text-zinc-300 dark:text-zinc-300 text-zinc-700",
                  "cursor-not-allowed opacity-50"
                )}
                role="menuitem"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="text-sm font-medium">隐私设置</span>
                <span
                  className={cn(
                    "ml-auto text-xs px-1.5 py-0.5 rounded",
                    "bg-zinc-700/50 dark:bg-zinc-700/50 bg-zinc-300/50",
                    "text-zinc-300 dark:text-zinc-300 text-zinc-700"
                  )}
                >
                  即将推出
                </span>
              </button>

              <button
                disabled
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
                  "transition-all duration-200",
                  "text-left",
                  "text-zinc-300 dark:text-zinc-300 text-zinc-700",
                  "cursor-not-allowed opacity-50"
                )}
                role="menuitem"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                <span className="text-sm font-medium">帮助与反馈</span>
                <span
                  className={cn(
                    "ml-auto text-xs px-1.5 py-0.5 rounded",
                    "bg-zinc-700/50 dark:bg-zinc-700/50 bg-zinc-300/50",
                    "text-zinc-300 dark:text-zinc-300 text-zinc-700"
                  )}
                >
                  即将推出
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 成为房主弹窗 - 使用Portal渲染到body，确保在页面中央 */}
      {isOwnerModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 dark:bg-zinc-900 bg-white rounded-2xl shadow-2xl border border-zinc-800 dark:border-zinc-800 border-zinc-200 w-full max-w-md">
            {/* 头部 */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800 dark:border-zinc-800 border-zinc-200">
              <h2 className="text-xl font-semibold text-zinc-100 dark:text-zinc-100 text-zinc-900">
                成为默认房主
              </h2>
              <button
                onClick={() => {
                  setIsOwnerModalOpen(false);
                  setOwnerPassword('');
                  setOwnerError('');
                }}
                className="p-1 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-800 hover:bg-zinc-200 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400 dark:text-zinc-400 text-zinc-600" />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-zinc-400 dark:text-zinc-400 text-zinc-600">
                输入房主密码后，你将成为默认房间的房主，可以编辑谜题和重开游戏。
              </p>
              <div>
                <input
                  type="password"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="请输入房主密码"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleBecomeOwner();
                    }
                  }}
                  className="w-full px-4 py-3 bg-zinc-800 dark:bg-zinc-800 bg-zinc-100
                           border border-zinc-700 dark:border-zinc-700 border-zinc-300 rounded-xl
                           text-sm text-zinc-100 dark:text-zinc-100 text-zinc-900
                           placeholder-zinc-500 dark:placeholder-zinc-500 placeholder-zinc-400
                           focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
                           transition-all duration-200"
                />
              </div>
              {ownerError && (
                <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                  <p className="text-sm text-rose-400">{ownerError}</p>
                </div>
              )}
              <button
                onClick={handleBecomeOwner}
                disabled={isBecomingOwner || !ownerPassword.trim()}
                className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-400
                         text-zinc-950 font-medium rounded-xl
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200"
              >
                {isBecomingOwner ? '处理中...' : '成为房主'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
