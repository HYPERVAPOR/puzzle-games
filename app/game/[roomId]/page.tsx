'use client';

/**
 * 游戏主页面 - 现代化版本
 * 仿ChatGPT/VSCode/Notion的3栏布局
 * 动态路由：/game/[roomId]
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { MessageList } from '@/components/game/MessageList';
import { ChatInterface } from '@/components/game/ChatInterface';
import { GameHeader } from '@/components/game/header/GameHeader';
import { RightSidebar } from '@/components/game/RightSidebar';
import { PuzzleMessage } from '@/components/game/chat/PuzzleMessage';
import { PuzzleEditModal } from '@/components/game/PuzzleEditModal';
import { ConfirmDialog } from '@/components/game/ConfirmDialog';
import { Game, Message, User, Room } from '@/lib/types';

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const [copied, setCopied] = useState(false);

  const [game, setGame] = useState<Game | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  // 房主功能相关状态
  const [isPuzzleModalOpen, setIsPuzzleModalOpen] = useState(false);
  const [puzzleSurface, setPuzzleSurface] = useState('');
  const [puzzleBottom, setPuzzleBottom] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'warning',
  });
  const initializedRef = useRef(false); // 标记是否已初始化加载过历史消息
  const messagesLengthRef = useRef(0); // 记录消息数量
  const gameRef = useRef<Game | null>(null); // 用于卸载时的离开事件
  const userRef = useRef<User | null>(null); // 用于卸载时的离开事件
  const eventSourceRef = useRef<EventSource | null>(null); // 用于卸载时关闭 SSE

  // 保持 ref 与 state 同步
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    userRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    eventSourceRef.current = eventSource;
  }, [eventSource]);

  // 检查用户状态
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const passwordFromUrl = searchParams.get('password')?.trim();
    const savedRoomPassword = roomId
      ? localStorage.getItem(`room_${roomId}_password`)?.trim()
      : undefined;
    const currentRoomId = localStorage.getItem('currentRoomId');
    const accessPassword =
      passwordFromUrl ||
      (currentRoomId === roomId ? savedRoomPassword : undefined);

    if (!roomId) {
      router.push('/');
      return;
    }

    if (!userStr) {
      router.push(`/join-room?room=${encodeURIComponent(roomId)}`);
      return;
    }

    if (!accessPassword) {
      router.push(`/join-room?room=${encodeURIComponent(roomId)}`);
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      // 根据 roomId 获取或创建游戏
      joinGameByRoomId(roomId, user, accessPassword);
    } catch (error) {
      console.error('Failed to parse user:', error);
      router.push('/');
    }
  }, [router, roomId, searchParams]);

  // 根据 roomId 加入游戏
  const joinGameByRoomId = async (roomId: string, user: User, password: string) => {
    try {
      // 获取或创建该房间的游戏
      const gameResponse = await fetch(`/api/rooms/${roomId}/game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          username: user.username,
          password,
        }),
      });

      const gameData = await gameResponse.json();

      if (!gameData.success) {
        console.error('Failed to get game:', gameData.error);
        router.push(`/join-room?room=${encodeURIComponent(roomId)}`);
        return;
      }

      const game = gameData.data.game;
      const roomInfo = gameData.data.room;
      const gameMessages = game.messages || [];

      localStorage.setItem('currentRoomId', roomInfo.id);
      localStorage.setItem(`room_${roomInfo.id}_password`, password);

      console.log('[Frontend] Game data received:', {
        gameId: game.id,
        messageCount: game.messages?.length || 0,
        messages: game.messages?.map((m: any) => ({
          id: m.id,
          type: m.type,
          content: m.content?.substring(0, 50) + '...',
        }))
      });

      setGame(game);
      setRoom(roomInfo);
      setRoomName(roomInfo.name || roomId);
      setMessages(gameMessages);
      initializedRef.current = true;
      messagesLengthRef.current = gameMessages.length;
      console.log(`[Frontend] Loaded ${gameMessages.length} messages from room ${roomId}`);
      setupSSE(game.id);
    } catch (error) {
      console.error('Failed to join game:', error);
      router.push(`/join-room?room=${encodeURIComponent(roomId)}`);
    }
  };

  // 加入游戏（保留用于其他可能的需求）
  const joinGame = async (gameId: string, user: User) => {
    try {
      const response = await fetch('/api/game/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          userId: user.id,
          username: user.username,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const gameMessages = data.data.game.messages || [];
        setGame(data.data.game);
        setMessages(gameMessages);
        initializedRef.current = true;
        messagesLengthRef.current = gameMessages.length;
        console.log(`[Frontend] Loaded ${gameMessages.length} messages from join API`);
        setupSSE(gameId);
      } else {
        console.error('Failed to join game:', data.error);
      }
    } catch (error) {
      console.error('Failed to join game:', error);
    }
  };

  // 建立SSE连接
  const setupSSE = (gameId: string) => {
    console.log(`[Frontend SSE] Setting up SSE connection for game ${gameId}`);

    // 关闭旧的连接
    if (eventSource) {
      console.log(`[Frontend SSE] Closing old SSE connection before setting up new one`);
      eventSource.close();
    }

    const es = new EventSource(`/api/game/events?gameId=${gameId}`);

    es.onopen = () => {
      console.log(`[Frontend SSE] Connection opened for game ${gameId}`);
      setIsConnected(true);
    };

    es.onerror = (error) => {
      console.error(`[Frontend SSE] Connection error for game ${gameId}:`, error);
      setIsConnected(false);
      // EventSource 会自动重连，但我们可以关闭旧的连接并创建新的
      es.close();
      // 延迟 2 秒后重新连接
      setTimeout(() => {
        console.log(`[Frontend SSE] Attempting to reconnect to game ${gameId}`);
        setupSSE(gameId);
      }, 2000);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(`[Frontend SSE] Raw message received:`, data);
        handleServerEvent(data);
      } catch (error) {
        console.error('Failed to parse SSE message:', error, event.data);
      }
    };

    setEventSource(es);
  };

  // 监听游戏 ID 变化，重新建立 SSE 连接
  useEffect(() => {
    if (game && initializedRef.current) {
      console.log(`[Frontend] Game ID changed to ${game.id}, reconnecting SSE`);
      setupSSE(game.id);
    }
  }, [game?.id]);

  // 处理服务器事件
  const handleServerEvent = (data: any) => {
    console.log(`[Frontend SSE] Received event: ${data.event}`, {
      payloadKeys: Object.keys(data.payload || {}),
      messageCount: data.payload?.game?.messages?.length,
      currentMessageCount: messagesLengthRef.current,
    });

    switch (data.event) {
      case 'user_joined':
      case 'user_left':
        // 只更新游戏状态，不覆盖消息（避免历史消息丢失）
        if (data.payload.game) {
          setGame(data.payload.game);
          // 只有当事件中的消息更多时才更新（避免覆盖刚加载的历史）
          const eventMessages = data.payload.game.messages || [];
          if (eventMessages.length > messagesLengthRef.current) {
            console.log(`[Frontend] SSE event has more messages (${eventMessages.length} > ${messagesLengthRef.current}), updating...`);
            setMessages(eventMessages);
            messagesLengthRef.current = eventMessages.length;
          } else {
            console.log(`[Frontend] SSE event has fewer or same messages (${eventMessages.length} <= ${messagesLengthRef.current}), keeping current messages`);
          }
        }
        break;
      case 'new_message':
      case 'game_finished':
      case 'game_started':
        // 这些事件需要更新消息
        if (data.payload.game) {
          const newGame = data.payload.game;
          const newMessages = newGame.messages || [];
          const isReset = data.payload.isReset;

          console.log(`[Frontend] ${data.event} event: received ${newMessages.length} messages, current: ${messagesLengthRef.current}, isReset: ${isReset}`);
          console.log(`[Frontend] ${data.event} event: new game has ${newGame.users?.length || 0} users, new gameId: ${newGame.id}`);

          // 总是使用 SSE 事件的完整消息列表（因为 SSE 是服务器广播的权威数据源）
          setGame(newGame);

          // 如果是重置事件，强制清空消息
          if (isReset) {
            console.log(`[Frontend] Game reset detected, clearing messages`);
            setMessages([]);
            messagesLengthRef.current = 0;
          } else {
            setMessages(newMessages);
            messagesLengthRef.current = newMessages.length;
          }

          console.log(`[Frontend] ${data.event} event: updated to ${isReset ? 0 : newMessages.length} messages`);
        }
        break;
    }
  };

  // 发送消息
  const handleSendMessage = useCallback(async (message: string, isCrackAttempt = false) => {
    if (!game || !currentUser) return;

    // 乐观更新
    const tempUserMessageId = `temp-user-${Date.now()}`;
    const tempAiMessageId = `temp-ai-${Date.now()}`;

    const optimisticUserMessage: Message = {
      id: tempUserMessageId,
      type: isCrackAttempt ? 'crack_attempt' : 'user',
      content: message,
      userId: currentUser.id,
      username: currentUser.username,
      timestamp: new Date(),
      isCrackAttempt,
    };

    const optimisticAiMessage: Message = {
      id: tempAiMessageId,
      type: isCrackAttempt ? 'crack_result' : 'ai',
      content: isCrackAttempt ? '🧐 正在分析你的猜测...' : '正在思考...',
      timestamp: new Date(),
      crackResponse: isCrackAttempt ? undefined : undefined,
    };

    setMessages((prev) => [...prev, optimisticUserMessage, optimisticAiMessage]);

    try {
      // 根据是否破案尝试调用不同的 API
      const endpoint = isCrackAttempt ? '/api/game/crack' : '/api/game/message';

      // 确保加载状态至少显示 800ms（用户体验优化）
      const minDisplayTime = isCrackAttempt ? 800 : 0;
      const startTime = Date.now();

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          username: currentUser.username,
          gameId: game.id,
          message,
          guess: isCrackAttempt ? message : undefined,
        }),
      });

      const data = await response.json();

      // 等待最小显示时间
      const elapsed = Date.now() - startTime;
      if (elapsed < minDisplayTime) {
        await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsed));
      }

      if (!data.success) {
        throw new Error(data.error || '发送失败');
      }

      if (data.data.game) {
        const apiMessages = data.data.game.messages;
        console.log(`[Frontend] API response: received ${apiMessages.length} messages`);

        setGame(data.data.game);
        const newMessages = data.data.game.messages;
        setMessages(newMessages);
        messagesLengthRef.current = newMessages.length;
        console.log(`[Frontend] Send message: updated to ${newMessages.length} messages from API`);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempAiMessageId
            ? { ...msg, content: '发送失败，请重试' }
            : msg.id === tempUserMessageId
            ? { ...msg }
            : msg
        )
      );
      throw error;
    }
  }, [game, currentUser]);

  // 退出游戏
  const handleLeaveGame = async () => {
    if (!game || !currentUser) return;

    try {
      await fetch('/api/game/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          gameId: game.id,
        }),
      });
    } catch (error) {
      console.error('Failed to leave game:', error);
    }

    if (eventSource) {
      eventSource.close();
    }

    localStorage.removeItem('user');
    localStorage.removeItem('currentRoomId');
    localStorage.removeItem('currentGameId');

    router.push('/');
  };

  // 检查是否是房主
  const isRoomOwner = room && currentUser && room.ownerId === currentUser.id;

  // 打开编辑谜题弹窗
  const handleOpenPuzzleModal = () => {
    if (game) {
      setPuzzleSurface(game.puzzle.surface);
      setPuzzleBottom(game.puzzle.bottom);
      setAiPrompt('');
      setIsPuzzleModalOpen(true);
    }
  };

  // AI生成新谜题（仅填充表单，不直接应用）
  const handleGeneratePuzzle = async (prompt?: string) => {
    if (!room || !currentUser) {
      throw new Error('房间或用户信息不存在');
    }

    setIsGenerating(true);

    try {
      const response = await fetch(`/api/rooms/${room.id}/puzzle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          prompt: prompt || undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '生成失败');
      }

      // 返回生成的谜题数据，由调用方决定如何处理
      return data.data.puzzle;
    } finally {
      setIsGenerating(false);
    }
  };

  // 重开游戏（清空聊天记录，保留用户列表，可选更新谜题）
  const handleResetGameWithPuzzle = async (surface: string, bottom: string) => {
    if (!room || !currentUser) return;

    // 显示确认对话框
    setConfirmDialog({
      isOpen: true,
      title: '确认重开游戏',
      message: '聊天记录将被清空，但用户列表会保留。确定要继续吗？',
      variant: 'warning',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));

        try {
          const response = await fetch(`/api/rooms/${room.id}/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.id,
              puzzle: {
                surface,
                bottom,
              },
            }),
          });

          const data = await response.json();

          if (data.success) {
            setGame(data.data.game);
            setMessages([]);
            messagesLengthRef.current = 0;
            setIsPuzzleModalOpen(false);
          } else {
            // 显示错误提示
            setConfirmDialog({
              isOpen: true,
              title: '重开失败',
              message: data.error || '重开游戏失败，请稍后重试',
              variant: 'danger',
              onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
            });
          }
        } catch (error) {
          console.error('Failed to reset game:', error);
          setConfirmDialog({
            isOpen: true,
            title: '重开失败',
            message: '重开游戏失败，请稍后重试',
            variant: 'danger',
            onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
          });
        }
      },
    });
  };

  // 成为默认房主
  const handleBecomeOwner = async (password: string) => {
    if (!room || !currentUser) return;

    const response = await fetch(`/api/rooms/${room.id}/owner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        password,
      }),
    });

    const data = await response.json();

    if (data.success) {
      // 更新房间信息
      setRoom(data.data.room);
      alert('你已成为默认房主！');
    } else {
      throw new Error(data.error || '成为房主失败');
    }
  };

  // 心跳机制 + 页面可见性检测
  useEffect(() => {
    if (!game || !currentUser) return;

    let heartbeatInterval: NodeJS.Timeout;
    let isPageHidden = false;

    const sendHeartbeat = async () => {
      // 正常心跳
      try {
        await fetch('/api/game/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gameId: game.id,
            userId: currentUser.id,
            visible: !document.hidden, // 告诉服务器页面是否可见
          }),
        });
      } catch (error) {
        console.error('[Frontend] Heartbeat failed:', error);
      }
    };

    // 立即发送一次心跳
    sendHeartbeat();

    // 定期发送心跳（15秒）
    heartbeatInterval = setInterval(sendHeartbeat, 15000);

    // 监听页面可见性变化
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面隐藏时，记录状态但不发送 leave 事件
        // 服务器会通过 30 秒无心跳来清理离线用户
        console.log('[Frontend] Page hidden, pausing UI updates (still sending heartbeat)');
        isPageHidden = true;
      } else {
        // 页面重新可见，立即发送心跳更新状态
        console.log('[Frontend] Page visible again, resuming normal operation');
        isPageHidden = false;
        sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [game, currentUser]);

  // 页面卸载和隐藏处理（确保用户离开时被清理）
  useEffect(() => {
    const sendLeaveEvent = () => {
      // 使用 ref 获取最新的 game 和 currentUser
      const currentGame = gameRef.current;
      const currentUser = userRef.current;

      if (currentGame && currentUser) {
        const data = JSON.stringify({
          userId: currentUser.id,
          gameId: currentGame.id,
          reason: 'page_unload',
        });
        // 使用 sendBeacon 确保在页面卸载时也能发送
        const sent = navigator.sendBeacon('/api/game/leave', data);
        console.log('[Frontend] Sent leave event via sendBeacon:', sent);
      }
    };

    const handleBeforeUnload = () => {
      sendLeaveEvent();
    };

    const handlePageHide = () => {
      sendLeaveEvent();
    };

    // 注册事件监听器
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []); // 空依赖数组，只在挂载时注册一次

  // 组件卸载时关闭SSE并发送离开事件
  useEffect(() => {
    return () => {
      // 关闭 SSE 连接
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // 组件卸载时（包括路由导航）发送离开事件
      // 使用 ref 避免依赖变化导致清理函数被调用
      const currentGame = gameRef.current;
      const currentUser = userRef.current;

      if (currentGame && currentUser) {
        console.log('[Frontend] Component unmounting, sending leave event...');

        // 组件卸载时使用同步 fetch（如果可能），否则使用 sendBeacon
        const data = JSON.stringify({
          userId: currentUser.id,
          gameId: currentGame.id,
          reason: 'component_unmount',
        });

        // 优先使用 sendBeacon（在卸载时更可靠）
        const sent = navigator.sendBeacon('/api/game/leave', data);
        console.log('[Frontend] Leave event sent on unmount:', sent);
      }
    };
  }, []);

  if (!game || !currentUser) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center transition-colors duration-300">
        <div className="text-zinc-400 transition-colors duration-300">加载中...</div>
      </div>
    );
  }

  const isGameFinished = game.status === 'finished';
  const isDefaultRoom = room?.isDefault || false;

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden transition-colors duration-300">
      {/* 左侧：在线用户 + 已确认线索 */}
      <RightSidebar
        users={game.users}
        currentUserId={currentUser.id}
        clues={game.publicClues}
        roomId={roomId}
        isDefaultRoom={isDefaultRoom}
        ownerId={room?.ownerId}
        copied={copied}
        setCopied={setCopied}
        onBecomeOwner={handleBecomeOwner}
      />

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 头部 */}
        <GameHeader game={game} roomName={roomName} isConnected={isConnected} />

        {/* 谜面 - 固定在头部下方 */}
        <div className="flex-shrink-0 border-b border-slate-200/90 dark:border-zinc-800/50 transition-colors duration-300">
          <div className="max-w-3xl mx-auto px-6 py-4">
            <div
              className={isRoomOwner ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
              onClick={isRoomOwner ? handleOpenPuzzleModal : undefined}
              title={isRoomOwner ? '点击编辑谜题' : ''}
            >
              <PuzzleMessage
                surface={game.puzzle.surface}
                bottom={game.puzzle.bottom}
                isFinished={game.status === 'finished'}
              />
            </div>
            {isRoomOwner && (
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2 text-center">
                点击谜题可编辑
              </p>
            )}
          </div>
        </div>

        {/* 消息列表 - 可滚动 */}
        <div className="flex-1 overflow-y-auto">
          <MessageList
            messages={messages}
            game={game}
            currentUserId={currentUser.id}
            excludePuzzle={true}
          />
        </div>

        {/* 输入区域 */}
        <div className="flex-shrink-0">
          <ChatInterface
            onSendMessage={handleSendMessage}
            disabled={isGameFinished}
          />
        </div>
      </div>

      {/* 编辑谜题弹窗 */}
      {game && (
        <PuzzleEditModal
          isOpen={isPuzzleModalOpen}
          onClose={() => setIsPuzzleModalOpen(false)}
          currentPuzzle={game.puzzle}
          onReset={handleResetGameWithPuzzle}
          onGenerate={handleGeneratePuzzle}
          isGenerating={isGenerating}
        />
      )}

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        variant={confirmDialog.variant}
      />
    </div>
  );
}
