# 心跳机制（Heartbeat）

## 概述

为了准确检测用户在线状态，实现了一个基于心跳的用户在线检测系统。

## 工作原理

### 1. 客户端（浏览器）

**初始化时：**
- 用户加入游戏后，立即发送第一次心跳
- 每 15 秒自动发送一次心跳到服务器

**页面可见性变化：**
- 当用户切换回标签页时，立即发送心跳
- 确保快速恢复活跃状态

**页面卸载时：**
- 使用 `sendBeacon` API 发送离开请求
- 即使页面关闭也能确保请求发送成功

### 2. 服务端

**心跳接收：**
- API 端点：`POST /api/game/heartbeat`
- 更新用户的 `lastHeartbeat` 时间戳
- 同时更新 `lastSeen` 时间戳

**清理任务：**
- 每 30 秒运行一次
- 检查所有游戏中的用户
- 移除超过 60 秒无心跳的用户
- 广播用户离开事件

## 数据结构

```typescript
export interface User {
  id: string;
  username: string;
  joinedAt: Date;
  lastSeen: Date;
  lastHeartbeat?: Date;  // 最后心跳时间
  isAdmin?: boolean;
}
```

## 超时设置

- **心跳间隔**：15 秒（客户端）
- **超时阈值**：60 秒（服务端）
- **清理间隔**：30 秒（服务端）

## 为什么选择这些值？

1. **心跳间隔 15 秒**
   - 足够频繁，确保及时检测到断线
   - 不会给服务器造成太大负担
   - 考虑到网络波动

2. **超时阈值 60 秒**
   - 至少可以容忍 3-4 次心跳丢失
   - 避免因短暂网络问题而误判
   - 60 秒对用户来说是可以接受的延迟

3. **清理间隔 30 秒**
   - 足够频繁，及时清理离线用户
   - 不会频繁执行造成性能问题

## 使用场景

### 场景 1：正常关闭浏览器

```
1. 用户关闭浏览器标签页
2. beforeunload 事件触发
3. sendBeacon 发送 /api/game/leave 请求
4. 用户立即从列表移除
```

### 场景 2：浏览器崩溃/网络断开

```
1. 用户浏览器崩溃或网络断开
2. 心跳停止发送
3. 60 秒后，服务端清理任务检测到超时
4. 自动移除用户，并广播"用户离开（超时）"
```

### 场景 3：切换标签页

```
1. 用户切换到其他标签页
2. 心跳继续在后台发送（每 15 秒）
3. 用户切换回来时，立即发送一次心跳
4. 用户始终显示为在线
```

## 代码位置

### 客户端
- [app/game/page.tsx](../app/game/page.tsx)
  - `useEffect` - 心跳间隔（第 273-293 行）
  - `useEffect` - 页面卸载处理（第 295-312 行）
  - `useEffect` - 可见性变化（第 314-331 行）

### 服务端
- [lib/game/game-manager.ts](../lib/game/game-manager.ts)
  - `updateHeartbeat()` - 更新心跳时间（第 464-474 行）
  - `cleanupInactiveUsers()` - 清理不活跃用户（第 476-520 行）
  - `startCleanupTask()` - 启动清理任务（第 534-545 行）

### API 端点
- [app/api/game/heartbeat/route.ts](../app/api/game/heartbeat/route.ts) - 心跳 API
- [app/api/game/leave/route.ts](../app/api/game/leave/route.ts) - 离开 API（支持 sendBeacon）

## 测试

运行测试脚本：
```bash
./scripts/test-heartbeat.sh
```

该脚本会：
1. 创建测试用户并加入游戏
2. 发送心跳
3. 等待 65 秒（超过超时时间）
4. 验证用户是否被自动移除

## 注意事项

1. **一个浏览器一个用户**
   - 使用 localStorage 存储 userId
   - 同一浏览器的多个标签页会共享同一个 userId
   - 不会显示为多个用户

2. **跨浏览器/设备**
   - 不同浏览器有独立的 localStorage
   - 会创建不同的用户
   - 符合预期行为

3. **隐私模式**
   - 隐私模式下 localStorage 会被清除
   - 关闭标签页后 userId 会丢失
   - 下次访问会创建新用户

## 性能考虑

- 心跳请求非常轻量（只有 gameId 和 userId）
- 每 30 秒的清理任务只遍历内存中的游戏
- 不需要额外的存储或数据库查询
- 对服务器性能影响极小
