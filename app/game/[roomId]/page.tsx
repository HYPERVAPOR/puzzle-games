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
import { Game, Message, User } from '@/lib/types';

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const [copied, setCopied] = useState(false);

  const [game, setGame] = useState<Game | null>(null);
  const [roomName, setRoomName] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
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
      const room = gameData.data.room;
      const gameMessages = game.messages || [];

      localStorage.setItem('currentRoomId', room.id);
      localStorage.setItem(`room_${room.id}_password`, password);

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
      setRoomName(room.name || roomId);
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
    const es = new EventSource(`/api/game/events?gameId=${gameId}`);

    es.onopen = () => {
      setIsConnected(true);
    };

    es.onerror = () => {
      setIsConnected(false);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleServerEvent(data);
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    setEventSource(es);
  };

  // 处理服务器事件
  const handleServerEvent = (data: any) => {
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
          setGame(data.payload.game);
          const newMessages = data.payload.game.messages || [];
          setMessages(newMessages);
          messagesLengthRef.current = newMessages.length;
          console.log(`[Frontend] ${data.event} event: updated to ${newMessages.length} messages`);
        }
        break;
    }
  };

  // 发送消息
  const handleSendMessage = useCallback(async (message: string) => {
    if (!game || !currentUser) return;

    // 乐观更新
    const tempUserMessageId = `temp-user-${Date.now()}`;
    const tempAiMessageId = `temp-ai-${Date.now()}`;

    const optimisticUserMessage: Message = {
      id: tempUserMessageId,
      type: 'user',
      content: message,
      userId: currentUser.id,
      username: currentUser.username,
      timestamp: new Date(),
    };

    const optimisticAiMessage: Message = {
      id: tempAiMessageId,
      type: 'ai',
      content: '正在思考...',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, optimisticUserMessage, optimisticAiMessage]);

    try {
      const response = await fetch('/api/game/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          username: currentUser.username,
          gameId: game.id,
          message,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '发送失败');
      }

      if (data.data.game) {
        setGame(data.data.game);
        const newMessages = data.data.game.messages;
        setMessages(newMessages);
        messagesLengthRef.current = newMessages.length;
        console.log(`[Frontend] Send message: updated to ${newMessages.length} messages`);
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

  // 心跳机制 + 页面可见性检测
  useEffect(() => {
    if (!game || !currentUser) return;

    let heartbeatInterval: NodeJS.Timeout;
    let visibilityCheckTimeout: NodeJS.Timeout;
    let isPageVisible = !document.hidden;

    const sendHeartbeat = async () => {
      // 如果页面不可见，发送特殊的离开信号
      if (document.hidden && isPageVisible) {
        // 页面刚变为不可见，立即发送离开事件
        console.log('[Frontend] Page became hidden, sending immediate leave event');
        try {
          await fetch('/api/game/leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.id,
              gameId: game.id,
              reason: 'page_hidden',
            }),
          });
        } catch (error) {
          console.error('[Frontend] Failed to send leave on page hide:', error);
          // 失败则尝试 sendBeacon
          const data = JSON.stringify({
            userId: currentUser.id,
            gameId: game.id,
            reason: 'page_hidden',
          });
          navigator.sendBeacon('/api/game/leave', data);
        }
        isPageVisible = false;
        return;
      }

      if (!document.hidden) {
        isPageVisible = true;
      }

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
        // 页面隐藏时，延迟3秒后发送离开事件（避免切换标签页时误触发）
        visibilityCheckTimeout = setTimeout(async () => {
          if (document.hidden) {
            console.log('[Frontend] Page still hidden after 3s, sending leave event');
            await sendHeartbeat(); // 会触发上面的离开逻辑
          }
        }, 3000);
      } else {
        // 页面重新可见，取消离开计时器
        if (visibilityCheckTimeout) {
          clearTimeout(visibilityCheckTimeout);
        }
        // 立即发送心跳
        sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      if (visibilityCheckTimeout) {
        clearTimeout(visibilityCheckTimeout);
      }
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
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center transition-colors duration-300">
        <div className="text-slate-500 dark:text-zinc-400 transition-colors duration-300">加载中...</div>
      </div>
    );
  }

  const isGameFinished = game.status === 'finished';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 overflow-hidden transition-colors duration-300">
      {/* 左侧：在线用户 + 已确认线索 */}
      <RightSidebar
        users={game.users}
        currentUserId={currentUser.id}
        clues={game.publicClues}
        roomId={roomId}
        copied={copied}
        setCopied={setCopied}
      />

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 头部 */}
        <GameHeader game={game} roomName={roomName} isConnected={isConnected} />

        {/* 消息列表 */}
        <MessageList messages={messages} game={game} currentUserId={currentUser.id} />

        {/* 输入区域 */}
        <ChatInterface
          onSendMessage={handleSendMessage}
          disabled={isGameFinished}
        />
      </div>
    </div>
  );
}
