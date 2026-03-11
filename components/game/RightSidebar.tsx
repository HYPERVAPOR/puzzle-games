'use client';

/**
 * 左侧边栏 - 可折叠的用户列表和线索板
 * 丝滑展开/收起动画
 * 可拖拽调整宽度
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Lightbulb, ChevronRight, Check, GripVertical } from 'lucide-react';
import { User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SettingsMenu } from './header/SettingsMenu';

interface RightSidebarProps {
  users: User[];
  currentUserId?: string;
  clues: string[];
  roomId: string;
  isDefaultRoom?: boolean;
  ownerId?: string;
  copied: boolean;
  setCopied: (copied: boolean) => void;
  onBecomeOwner?: (password: string) => Promise<void> | void;
  className?: string;
}

const MIN_WIDTH = 240;
const MAX_WIDTH = 500;
const DEFAULT_WIDTH = 280;

type CollapsibleSectionProps = {
  title: string;
  icon: React.ReactNode;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

function CollapsibleSection({
  title,
  icon,
  count,
  isExpanded,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="border-b border-zinc-800/50 dark:border-zinc-800/50 border-zinc-200/50 last:border-b-0 transition-colors duration-300">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between
                   hover:bg-zinc-800/30 dark:hover:bg-zinc-800/30 hover:bg-zinc-200/30
                   transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold text-zinc-100 dark:text-zinc-100 text-zinc-900 transition-colors duration-300">
            {title}
          </h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-500 text-zinc-600 transition-colors duration-300">
            {count}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <ChevronRight className="w-4 h-4 text-zinc-500 dark:text-zinc-500 text-zinc-600 transition-colors duration-300" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RightSidebar({ users, currentUserId, clues, roomId, isDefaultRoom, ownerId, copied, setCopied, onBecomeOwner, className }: RightSidebarProps) {
  const [usersExpanded, setUsersExpanded] = useState(true);
  const [cluesExpanded, setCluesExpanded] = useState(true);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // 拖拽调整宽度
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;

      const newWidth = e.clientX;

      // 限制宽度范围
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  return (
    <div
      ref={sidebarRef}
      className={cn(
        "h-full flex border-r relative transition-colors duration-300",
        "bg-white/88 dark:bg-zinc-900/30",
        "border-slate-200/90 dark:border-zinc-800/50",
        className
      )}
      style={{ width: `${width}px`, minWidth: `${MIN_WIDTH}px`, maxWidth: `${MAX_WIDTH}px` }}
    >
      {/* 拖拽手柄 */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute right-0 top-0 bottom-0 w-1 hover:w-2 cursor-ew-resize
                     bg-transparent hover:bg-slate-300/70 dark:hover:bg-zinc-600/30
                     transition-all duration-150
                     -mr-0.5"
        title="拖拽调整宽度"
      >
        {/* 可见的手柄图标 */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        opacity-0 hover:opacity-100
                        text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-300
                        transition-opacity duration-150">
          <GripVertical className="w-4 h-4" />
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Users Section */}
        <CollapsibleSection
          title="在线用户"
          icon={<Users className="w-4 h-4 text-zinc-400" />}
          count={users.length}
          isExpanded={usersExpanded}
          onToggle={() => setUsersExpanded(!usersExpanded)}
        >
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="w-10 h-10 text-zinc-700 dark:text-zinc-700 text-zinc-400 mb-3 transition-colors duration-300" />
              <p className="text-sm text-zinc-500 dark:text-zinc-500 text-zinc-600 transition-colors duration-300">
                暂无在线用户
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {users.map((user) => {
                const isOwner = ownerId && user.id === ownerId;
                return (
                  <div
                    key={user.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg",
                      "transition-all duration-200",
                      user.id === currentUserId
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "hover:bg-zinc-800/50 dark:hover:bg-zinc-800/50 hover:bg-zinc-200/50"
                    )}
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br
                                from-blue-500 to-purple-600
                                flex items-center justify-center
                                text-white font-semibold text-sm
                                flex-shrink-0">
                      {user.username.charAt(0).toUpperCase()}
                    </div>

                    {/* Username - 强制换行 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 dark:text-zinc-300 text-zinc-700 break-words transition-colors duration-300">
                        {user.username}
                        {user.id === currentUserId && (
                          <span className="ml-1.5 text-xs text-zinc-500 dark:text-zinc-500 text-zinc-600 transition-colors duration-300">(你)</span>
                        )}
                      </p>
                    </div>

                    {/* 房主标签 */}
                    {isOwner && (
                      <div className="flex-shrink-0">
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-amber-400"
                          >
                            <circle cx="12" cy="8" r="5"/>
                            <path d="M20 21a8 8 0 0 0-16 0"/>
                          </svg>
                          <span className="text-xs text-amber-400 font-medium">房主</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CollapsibleSection>

        {/* Clues Section */}
        <CollapsibleSection
          title="已确认线索"
          icon={<Lightbulb className="w-4 h-4 text-amber-400" />}
          count={clues.length}
          isExpanded={cluesExpanded}
          onToggle={() => setCluesExpanded(!cluesExpanded)}
        >
          {clues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Lightbulb className="w-10 h-10 text-zinc-700 dark:text-zinc-700 text-zinc-400 mb-3 transition-colors duration-300" />
              <p className="text-sm text-zinc-500 dark:text-zinc-500 text-zinc-600 transition-colors duration-300">
                暂无线索
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {clues.map((clue, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={cn(
                    "flex gap-3 p-3 rounded-xl border transition-all duration-200",
                    "bg-zinc-800/40 dark:bg-zinc-800/40 bg-zinc-200/40",
                    "border-zinc-700/50 dark:border-zinc-700/50 border-zinc-300/50",
                    "hover:bg-zinc-800/60 dark:hover:bg-zinc-800/60 hover:bg-zinc-200/60",
                    "hover:border-zinc-700/70 dark:hover:border-zinc-700/70 hover:border-zinc-300/70"
                  )}
                >
                  {/* 序号 */}
                  <div className="flex-shrink-0 w-6 h-6 rounded-full
                              bg-emerald-500/10 text-emerald-400
                              flex items-center justify-center
                              text-xs font-semibold border border-emerald-500/20">
                    {index + 1}
                  </div>

                  {/* 内容 - 强制换行 */}
                  <p className="flex-1 text-sm text-zinc-300 dark:text-zinc-300 text-zinc-700 leading-relaxed break-words transition-colors duration-300">
                    {clue}
                  </p>

                  {/* 确认图标 */}
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                </motion.div>
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* 底端按钮区域 */}
        <div className="mt-auto border-t border-slate-200/90 dark:border-zinc-800/50 p-3 transition-colors duration-300">
          <div className="flex gap-2">
            {/* 设置按钮（带菜单） */}
            <SettingsMenu
              isDefaultRoom={isDefaultRoom}
              onBecomeOwner={onBecomeOwner}
            />

            {/* 分享按钮 */}
            <button
              onClick={() => {
                // 复制可直接访问房间的分享链接
                let url = `${window.location.origin}/join-room?room=${encodeURIComponent(roomId)}`;
                const savedPassword = localStorage.getItem(`room_${roomId}_password`);
                if (savedPassword) {
                  url = `${window.location.origin}/game/${encodeURIComponent(roomId)}?password=${encodeURIComponent(savedPassword)}`;
                }

                navigator.clipboard.writeText(url).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 300);
                });
              }}
              className="p-2 rounded-lg hover:bg-zinc-800/50 dark:hover:bg-zinc-800/50 hover:bg-zinc-200/50 text-zinc-400 dark:text-zinc-400 text-zinc-600 hover:text-zinc-300 dark:hover:text-zinc-300 hover:text-zinc-800 transition-colors relative"
              title="分享房间"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-share-icon lucide-share">
                <path d="M12 2v13"/>
                <path d="m16 6-4-4-4 4"/>
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              </svg>
              <AnimatePresence>
                {copied && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-emerald-600 text-white text-xs rounded whitespace-nowrap flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                    已复制
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
