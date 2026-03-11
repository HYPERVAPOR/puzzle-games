# 心跳机制实现总结

## 问题

用户报告的问题：
> "为什么即使用户关闭网页 也显示在线呢？我希望一个浏览器下只能严格对应一个用户（不管他用户名是什么），只要关闭网页，就显示用户离开了，同时在"在线用户"里面移除他"

## 解决方案

实现了基于心跳的在线用户检测系统：

### 1. **数据结构更新**

**lib/types.ts**
```typescript
export interface User {
  id: string;
  username: string;
  joinedAt: Date;
  lastSeen: Date;
  lastHeartbeat?: Date;  // 新增：最后心跳时间
  isAdmin?: boolean;
}
```

### 2. **服务端实现**

**lib/game/game-manager.ts**

新增三个关键函数：

```typescript
// 更新用户心跳
export async function updateHeartbeat(gameId: string, userId: string)

// 清理不活跃用户（30秒无心跳）
export async function cleanupInactiveUsers(gameId: string)

// 启动定期清理任务（每15秒）
export function startCleanupTask(): NodeJS.Timeout
```

工作原理：
- 每15秒检查所有游戏中的用户
- 移除超过30秒无心跳的用户
- 广播用户离开事件给所有在线用户

### 3. **API端点**

**app/api/game/heartbeat/route.ts**（新建）
```
POST /api/game/heartbeat
Body: { gameId, userId }
```

**app/api/game/leave/route.ts**（更新）
- 支持 `sendBeacon` 发送的请求
- 处理 `text/plain` content-type（sendBeacon默认格式）

### 4. **客户端实现**

**app/game/page.tsx**（更新）

三个关键的 useEffect hooks：

```typescript
// 1. 定时心跳（每15秒）
useEffect(() => {
  const sendHeartbeat = async () => {
    await fetch('/api/game/heartbeat', {...});
  };

  sendHeartbeat(); // 立即发送一次
  const interval = setInterval(sendHeartbeat, 15000); // 每15秒

  return () => clearInterval(interval);
}, [game, currentUser]);

// 2. 页面卸载时发送离开请求
useEffect(() => {
  const handleBeforeUnload = () => {
    navigator.sendBeacon('/api/game/leave', data);
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [game, currentUser]);

// 3. 页面可见性变化时立即发送心跳
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      fetch('/api/game/heartbeat', {...});
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [game, currentUser]);
```

### 5. **自动启动清理任务**

**lib/game/cleanup-init.ts**（新建）
```typescript
export function ensureCleanupStarted() {
  if (!cleanupStarted) {
    startCleanupTask();
    cleanupStarted = true;
    console.log('✓ User cleanup task started (checks every 30s)');
  }
}

ensureCleanupStarted(); // 自动启动
```

**app/api/game/join/route.ts**（更新）
```typescript
import '@/lib/game/cleanup-init'; // 确保清理任务启动
```

## 工作流程

### 场景1：正常关闭浏览器
```
用户关闭标签页
  ↓
beforeunload 事件触发
  ↓
sendBeacon 发送 /api/game/leave
  ↓
用户立即从列表移除
```

### 场景2：浏览器崩溃/网络断开
```
浏览器崩溃/网络断开
  ↓
心跳停止发送
  ↓
60秒后服务端清理任务检测到超时
  ↓
自动移除用户，广播"用户离开（超时）"
```

### 场景3：切换标签页
```
用户切换到其他标签页
  ↓
心跳继续在后台发送（每15秒）
  ↓
用户切换回来
  ↓
立即发送心跳
  ↓
用户始终显示为在线
```

## 配置参数

| 参数 | 值 | 说明 |
|------|------|------|
| 心跳间隔 | 15秒 | 客户端每15秒发送一次心跳 |
| 超时阈值 | 60秒 | 60秒无心跳视为离线 |
| 清理间隔 | 30秒 | 服务端每30秒检查一次 |

## 关键改进

1. **一个浏览器一个用户**
   - 使用 localStorage 存储 userId
   - 同一浏览器的多个标签页共享同一个 userId
   - 不会出现同一浏览器显示多个用户的情况

2. **优雅处理浏览器关闭**
   - 使用 `sendBeacon` 确保离开请求能发送
   - 即使页面正在卸载，请求也能成功发送

3. **处理网络波动**
   - 60秒超时阈值可以容忍短暂的网络问题
   - 用户不会因为一次心跳丢失就被踢出

4. **标签页切换友好**
   - 切换到其他标签页时，心跳继续在后台发送
   - 切换回来时立即发送心跳，快速恢复活跃状态

## 日志验证

查看日志可以看到：
```
✓ User cleanup task started (checks every 30s)
POST /api/game/heartbeat 200 in 107ms
POST /api/game/heartbeat 200 in 44ms
POST /api/game/heartbeat 200 in 29ms
```

## 测试方法

1. **手动测试**
   - 打开游戏页面，查看在线用户列表
   - 关闭标签页，等待几秒后刷新查看用户是否消失

2. **自动化测试**
   ```bash
   ./scripts/test-heartbeat.sh
   ```

## 文件清单

### 新建文件
- `app/api/game/heartbeat/route.ts` - 心跳API
- `lib/game/cleanup-init.ts` - 清理任务初始化
- `docs/HEARTBEAT.md` - 心跳机制文档
- `scripts/test-heartbeat.sh` - 测试脚本

### 修改文件
- `lib/types.ts` - 添加 lastHeartbeat 字段
- `lib/game/game-manager.ts` - 添加心跳和清理逻辑
- `app/game/page.tsx` - 添加客户端心跳
- `app/api/game/join/route.ts` - 启动清理任务
- `app/api/game/leave/route.ts` - 支持 sendBeacon
- `lib/storage/room-store.ts` - 修复 TypeScript 类型

## 技术亮点

1. **使用 sendBeacon API**
   - 确保页面卸载时请求能发送
   - 不会被浏览器取消

2. **页面可见性检测**
   - Page Visibility API
   - 切换回标签页时立即发送心跳

3. **自动启动清理任务**
   - 通过模块导入自动启动
   - 确保任务只启动一次

4. **轻量级实现**
   - 不需要额外的存储
   - 对服务器性能影响极小
   - 纯内存操作

## 注意事项

1. **隐身模式/隐私模式**
   - localStorage 会被清除
   - 每次打开会创建新用户
   - 这是预期行为

2. **跨浏览器/设备**
   - 不同浏览器有独立的 localStorage
   - 会创建不同的用户
   - 符合"一个浏览器一个用户"的需求
