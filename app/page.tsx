'use client';

/**
 * 首页 - 极简版
 */

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';

function HomeContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-950 dark:bg-zinc-950 bg-zinc-50 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        {/* 居中卡片 */}
        <div className="bg-zinc-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-zinc-800/50 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">🐢</div>
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
              海龟汤
            </h1>
          </div>

          {/* 按钮组 */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/join-room')}
              className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-400
                       text-zinc-950 font-medium rounded-xl
                       transition-all duration-200"
            >
              加入房间
            </button>

            <button
              onClick={() => router.push('/create-room')}
              className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700
                       text-zinc-100 font-medium rounded-xl
                       transition-all duration-200"
            >
              创建房间
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 text-sm">加载中...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
