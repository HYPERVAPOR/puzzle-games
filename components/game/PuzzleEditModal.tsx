'use client';

/**
 * 谜题编辑模态框 - 带标签页界面
 * 支持手动输入和AI生成两种方式
 * 统一的"新的一局"按钮用于应用并重开游戏
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Puzzle } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from './ConfirmDialog';

interface PuzzleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPuzzle: Puzzle;
  onReset: (surface: string, bottom: string) => Promise<void>;
  onGenerate: (prompt?: string) => Promise<{ surface: string; bottom: string }>;
  isGenerating: boolean;
}

export function PuzzleEditModal({
  isOpen,
  onClose,
  currentPuzzle,
  onReset,
  onGenerate,
  isGenerating,
}: PuzzleEditModalProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  const [surface, setSurface] = useState(currentPuzzle.surface);
  const [bottom, setBottom] = useState(currentPuzzle.bottom);
  const [aiPrompt, setAiPrompt] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // 当当前谜题变化时，更新表单
  useEffect(() => {
    setSurface(currentPuzzle.surface);
    setBottom(currentPuzzle.bottom);
  }, [currentPuzzle]);

  // 处理AI生成
  const handleGenerate = async () => {
    try {
      const puzzle = await onGenerate(aiPrompt || undefined);
      setSurface(puzzle.surface);
      setBottom(puzzle.bottom);
      setAiPrompt('');
    } catch (error) {
      console.error('Failed to generate puzzle:', error);
    }
  };

  // 处理重开游戏
  const handleReset = async () => {
    await onReset(surface, bottom);
  };

  // 处理关闭（检查未保存的修改）
  const handleClose = () => {
    const hasUnsavedChanges =
      surface !== currentPuzzle.surface ||
      bottom !== currentPuzzle.bottom ||
      aiPrompt.trim();

    if (hasUnsavedChanges) {
      setConfirmDialog({
        isOpen: true,
        title: '有未保存的修改',
        message: '您有未保存的修改，确定要关闭吗？',
        onConfirm: () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          onClose();
        },
      });
      return;
    }
    onClose();
  };

  // 表单验证
  const isFormValid = surface.trim() && bottom.trim();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-zinc-900 dark:bg-zinc-900 bg-white rounded-2xl shadow-2xl border border-zinc-800 dark:border-zinc-800 border-zinc-200 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 dark:border-zinc-800 border-zinc-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-zinc-100 dark:text-zinc-100 text-zinc-900">
            编辑谜题
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-800 hover:bg-zinc-200 transition-colors"
          >
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
              className="text-zinc-400 dark:text-zinc-400 text-zinc-600"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 18 18" />
            </svg>
          </button>
        </div>

        {/* 标签页导航 */}
        <div className="flex border-b border-zinc-800 dark:border-zinc-800 border-zinc-200 flex-shrink-0">
          <button
            onClick={() => setActiveTab('manual')}
            className={cn(
              'flex-1 px-6 py-3 text-sm font-medium transition-colors',
              activeTab === 'manual'
                ? 'text-emerald-500 border-b-2 border-emerald-500'
                : 'text-zinc-400 dark:text-zinc-400 text-zinc-600 hover:text-zinc-300 dark:hover:text-zinc-300 hover:text-zinc-700'
            )}
          >
            手动输入
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={cn(
              'flex-1 px-6 py-3 text-sm font-medium transition-colors',
              activeTab === 'ai'
                ? 'text-emerald-500 border-b-2 border-emerald-500'
                : 'text-zinc-400 dark:text-zinc-400 text-zinc-600 hover:text-zinc-300 dark:hover:text-zinc-300 hover:text-zinc-700'
            )}
          >
            AI生成
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 汤面（谜面） */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-2">
              汤面（谜面）
            </label>
            <textarea
              value={surface}
              onChange={(e) => setSurface(e.target.value)}
              rows={4}
              placeholder="请输入汤面"
              className="w-full px-4 py-3 bg-zinc-800 dark:bg-zinc-800 bg-zinc-100 border border-zinc-700 dark:border-zinc-700 border-zinc-300 rounded-xl text-sm text-zinc-100 dark:text-zinc-100 text-zinc-900 placeholder-zinc-500 dark:placeholder-zinc-500 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
            />
          </div>

          {/* 汤底（谜底） */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-2">
              汤底（谜底）
            </label>
            <textarea
              value={bottom}
              onChange={(e) => setBottom(e.target.value)}
              rows={6}
              placeholder="请输入汤底"
              className="w-full px-4 py-3 bg-zinc-800 dark:bg-zinc-800 bg-zinc-100 border border-zinc-700 dark:border-zinc-700 border-zinc-300 rounded-xl text-sm text-zinc-100 dark:text-zinc-100 text-zinc-900 placeholder-zinc-500 dark:placeholder-zinc-500 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
            />
          </div>

          {/* AI生成专属：提示词输入 */}
          {activeTab === 'ai' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <label className="block text-sm font-medium text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-2">
                AI提示词（可选）
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="如'恐怖主题'、'科幻主题'等"
                rows={3}
                className="w-full px-4 py-3 bg-zinc-800 dark:bg-zinc-800 bg-zinc-100 border border-zinc-700 dark:border-zinc-700 border-zinc-300 rounded-xl text-sm text-zinc-100 dark:text-zinc-100 text-zinc-900 placeholder-zinc-500 dark:placeholder-zinc-500 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
              />
              <motion.button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={cn(
                  'w-full mt-3 px-4 py-3 font-medium rounded-xl transition-all duration-200',
                  'flex items-center justify-center gap-2',
                  'bg-zinc-700 hover:bg-zinc-600 dark:bg-zinc-700 dark:hover:bg-zinc-600 hover:bg-zinc-600',
                  'text-zinc-200 dark:text-zinc-200 text-zinc-200',
                  'disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-zinc-700'
                )}
                animate={isGenerating ? {
                  scale: [1, 1.02, 1],
                  transition: { duration: 1.5, repeat: Infinity }
                } : {}}
              >
                {isGenerating ? (
                  <>
                    <motion.svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </motion.svg>
                    <span>生成中...</span>
                  </>
                ) : (
                  '生成谜题'
                )}
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="p-6 border-t border-zinc-800 dark:border-zinc-800 border-zinc-200 flex-shrink-0">
          <button
            onClick={handleReset}
            disabled={!isFormValid}
            className={cn(
              'w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
              'bg-emerald-500 hover:bg-emerald-400',
              'text-zinc-950',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            新的一局
          </button>
        </div>
      </motion.div>

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
