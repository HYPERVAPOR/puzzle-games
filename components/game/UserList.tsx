/**
 * 用户列表组件 - 现代化版本
 * 仿Notion/VSCode侧边栏风格
 */

import React from 'react';
import { Users } from 'lucide-react';
import { User } from '@/lib/types';
import { cn } from '@/lib/utils';

interface UserListProps {
  users: User[];
  currentUserId?: string;
  className?: string;
}

export function UserList({ users, currentUserId, className }: UserListProps) {
  return (
    <div className={cn("h-full flex flex-col bg-zinc-900/30 border-l border-zinc-800/50", className)}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-100">
            在线用户
          </h2>
          <span className="text-xs text-zinc-500">
            {users.length}
          </span>
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto p-3">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Users className="w-10 h-10 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500">
              暂无在线用户
            </p>
          </div>
        ) : (
          <div>
            {users.map((user) => (
              <div
                key={user.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg mb-1",
                  "transition-all duration-200",
                  user.id === currentUserId
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : "hover:bg-zinc-800/50"
                )}
              >
                {/* Avatar with first letter */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br
                            from-blue-500 to-purple-600
                            flex items-center justify-center
                            text-white font-semibold text-sm
                            flex-shrink-0">
                  {user.username.charAt(0).toUpperCase()}
                </div>

                {/* Username */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300 truncate">
                    {user.username}
                    {user.id === currentUserId && (
                      <span className="ml-1.5 text-xs text-zinc-500">(你)</span>
                    )}
                  </p>
                </div>

                {/* Online indicator */}
                <div className="w-2 h-2 rounded-full bg-emerald-400
                            animate-pulse-slow flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
