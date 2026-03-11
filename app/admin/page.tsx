'use client';

/**
 * 管理员页面 - 创建和生成题目
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Puzzle } from '@/lib/types';

export default function AdminPage() {
  const router = useRouter();
  const [adminPasscode, setAdminPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 手动创建题目表单
  const [surface, setSurface] = useState('');
  const [bottom, setBottom] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // AI生成题目表单
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPuzzle, setGeneratedPuzzle] = useState<Puzzle | null>(null);
  const [generateError, setGenerateError] = useState('');

  // 验证管理员口令
  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();

    // 简单验证：实际应该在服务器端验证
    if (adminPasscode === (process.env.NEXT_PUBLIC_ADMIN_PASSCODE || 'admin123')) {
      setIsAuthenticated(true);
      setCreateError('');
    } else {
      setCreateError('管理员口令错误');
    }
  };

  // 手动创建题目
  const handleCreatePuzzle = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    try {
      const response = await fetch('/api/admin/create-puzzle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminPasscode,
          surface,
          bottom,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCreateSuccess('题目创建成功！');
        setSurface('');
        setBottom('');
      } else {
        setCreateError(data.error || '创建失败');
      }
    } catch (error) {
      setCreateError('创建失败，请稍后重试');
    }
  };

  // AI生成题目
  const handleGeneratePuzzle = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerateError('');
    setGeneratedPuzzle(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/admin/generate-puzzle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminPasscode,
          prompt: prompt || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedPuzzle(data.data.puzzle);
        setPrompt('');
      } else {
        setGenerateError(data.error || '生成失败');
      }
    } catch (error) {
      setGenerateError('生成失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">管理员入口</h1>
            <p className="text-gray-400 text-sm">请输入管理员口令</p>
          </div>

          <form onSubmit={handleAuthenticate} className="space-y-4">
            <Input
              type="password"
              value={adminPasscode}
              onChange={(e) => setAdminPasscode(e.target.value)}
              placeholder="请输入管理员口令"
              required
              error={createError}
            />

            <Button type="submit" className="w-full">
              验证
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                返回登录
              </button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">管理员控制台</h1>
            <p className="text-gray-400">创建和生成海龟汤题目</p>
          </div>
          <Button variant="ghost" onClick={() => router.push('/')}>
            返回首页
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 手动创建题目 */}
          <Card>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white mb-2">手动创建题目</h2>
              <p className="text-sm text-gray-400">输入谜面和谜底来创建新题目</p>
            </div>

            <form onSubmit={handleCreatePuzzle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  谜面（汤面）
                </label>
                <textarea
                  value={surface}
                  onChange={(e) => setSurface(e.target.value)}
                  placeholder="请输入谜面（10-1000字符）"
                  required
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  谜底（汤底）
                </label>
                <textarea
                  value={bottom}
                  onChange={(e) => setBottom(e.target.value)}
                  placeholder="请输入谜底（10-2000字符）"
                  required
                  rows={6}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {createError && (
                <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-2 rounded">
                  {createError}
                </div>
              )}

              {createSuccess && (
                <div className="bg-green-900/30 border border-green-700 text-green-300 px-4 py-2 rounded">
                  {createSuccess}
                </div>
              )}

              <Button type="submit" className="w-full">
                创建题目
              </Button>
            </form>
          </Card>

          {/* AI生成题目 */}
          <Card>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white mb-2">AI生成题目</h2>
              <p className="text-sm text-gray-400">让AI为你生成新的海龟汤题目</p>
            </div>

            <form onSubmit={handleGeneratePuzzle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  提示词（可选）
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="输入具体要求"
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {generateError && (
                <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-2 rounded">
                  {generateError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isGenerating}
              >
                {isGenerating ? '生成中...' : '生成题目'}
              </Button>

              {/* 显示生成的题目 */}
              {generatedPuzzle && (
                <div className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-lg">
                  <h3 className="text-sm font-semibold text-white mb-2">生成的题目：</h3>
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-1">谜面：</p>
                    <p className="text-sm text-gray-200">{generatedPuzzle.surface}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">谜底：</p>
                    <p className="text-sm text-gray-300">{generatedPuzzle.bottom}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3"
                    onClick={() => setGeneratedPuzzle(null)}
                  >
                    关闭
                  </Button>
                </div>
              )}
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
