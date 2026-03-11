'use client';

/**
 * 加入房间页面 - 极简版
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function JoinRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 从URL获取房间号（如果有）
    const roomParam = searchParams.get('room');
    if (roomParam) {
      setRoomId(roomParam);
    }

    // 从URL获取密码（如果有）
    const passwordParam = searchParams.get('password');
    if (passwordParam) {
      setPassword(passwordParam);
    }

    // 加载本地用户信息
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUsername(user.username || '');
      }
    } catch (error) {
      console.error('Failed to load local user:', error);
    }
  }, [searchParams]);

  const handleJoin = async () => {
    setError('');
    setIsLoading(true);

    try {
      if (!username.trim()) {
        setError('请输入用户名');
        setIsLoading(false);
        return;
      }

      // 复用已有 userId，避免同一个人多次进入游戏时产生重复用户记录
      const existingUserId = localStorage.getItem('userId');
      const userId = existingUserId || `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // 保存用户信息
      const user = {
        id: userId,
        username: username.trim(),
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userId', userId);

      // 加入房间（如果 roomId 为空则加入默认房间）
      const response = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomId.trim() || '',
          password: password.trim() || undefined,
          userId: userId,
          username: username.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('currentRoomId', data.data.room.id);
        if (password.trim()) {
          localStorage.setItem(`room_${data.data.room.id}_password`, password.trim());
        }
        // 跳转到游戏页面（使用实际的房间 ID）
        router.push(`/game/${data.data.room.id}`);
      } else {
        setError(data.error || '加入房间失败');
      }
    } catch (err) {
      setError('操作失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleJoin();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 dark:bg-zinc-950 bg-zinc-50 flex items-center justify-center p-4 transition-colors duration-300">
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
              加入房间
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
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="房间 ID（可选，留空加入默认房间）"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="密码"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl
                         text-sm text-zinc-100 placeholder-zinc-500
                         focus:outline-none focus:ring-0 focus:border-zinc-600
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleJoin}
                disabled={isLoading || !username.trim()}
                className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-400
                         text-zinc-950 font-medium rounded-xl
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200"
              >
                {isLoading ? '加入中...' : '加入'}
              </button>

              <button
                onClick={() => router.push('/create-room')}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700
                         text-zinc-100 font-medium rounded-xl
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200"
              >
                创建房间
              </button>
            </div>
          </div>

          {/* 说明文字 */}
          <div className="mt-6 pt-6 border-t border-zinc-800/50">
            <p className="text-xs text-zinc-500 text-center">
              输入房间 ID 加入指定房间，或留空直接加入默认房间
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JoinRoomPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 text-sm">加载中...</div>
      </div>
    }>
      <JoinRoomContent />
    </Suspense>
  );
}
