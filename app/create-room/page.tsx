'use client';

/**
 * 创建房间页面 - 极简版
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateRoomPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async () => {
    setError('');
    setIsLoading(true);

    try {
      // 验证用户名必填
      if (!username.trim()) {
        setError('请输入用户名');
        setIsLoading(false);
        return;
      }

      // 验证密码必填
      if (!roomPassword.trim()) {
        setError('请设置房间密码');
        setIsLoading(false);
        return;
      }

      // 创建房间
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: roomName.trim() || undefined,
          roomPassword: roomPassword.trim(),
          username: username.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 保存房间信息到 localStorage（用于分享功能）
        localStorage.setItem('currentRoomId', data.data.room.id);
        localStorage.setItem(`room_${data.data.room.id}_password`, roomPassword.trim());
        // 跳转到游戏页面（URL 包含房间 ID）
        router.push(`/game/${data.data.room.id}`);
      } else {
        setError(data.error || '创建房间失败');
      }
    } catch (err) {
      setError('创建房间失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreateRoom();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 居中卡片 */}
        <div className="bg-zinc-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-zinc-800/50 p-8">
          {/* 返回按钮 + 标题 */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => router.push('/')}
              className="p-2 -ml-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
              创建房间
            </h1>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <p className="text-sm text-rose-400 text-center">{error}</p>
            </div>
          )}

          {/* 输入表单 */}
          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="用户名"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl
                         text-sm text-zinc-100 placeholder-zinc-500
                         focus:outline-none focus:ring-0 focus:border-zinc-600
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200"
              />
            </div>

            <div>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="房间名（可选）"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl
                         text-sm text-zinc-100 placeholder-zinc-500
                         focus:outline-none focus:ring-0 focus:border-zinc-600
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200"
              />
            </div>

            <div>
              <input
                type="password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="房间密码"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl
                         text-sm text-zinc-100 placeholder-zinc-500
                         focus:outline-none focus:ring-0 focus:border-zinc-600
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200"
              />
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={isLoading || !username.trim() || !roomPassword.trim()}
              className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-400
                       text-zinc-950 font-medium rounded-xl
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              {isLoading ? '创建中...' : '创建'}
            </button>
          </div>

          {/* 说明文字 */}
          <div className="mt-6 pt-6 border-t border-zinc-800/50">
            <p className="text-xs text-zinc-500 text-center">
              系统将自动生成唯一的房间 ID
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
