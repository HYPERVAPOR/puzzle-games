// 用户
export interface User {
  id: string;
  username: string;
  joinedAt: Date;
  lastSeen: Date;
  lastHeartbeat?: Date;  // 最后心跳时间，用于检测断开连接
  isAdmin?: boolean;
}

// 消息
export type MessageType = 'system' | 'user' | 'ai' | 'admin';
export type AIResponse = 'yes' | 'no' | 'irrelevant';
export type MessageStatus = 'pending' | 'sent' | 'failed';

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  userId?: string;
  username?: string;
  timestamp: Date;
  aiResponse?: AIResponse;
  status?: MessageStatus;  // 仅用于乐观更新的临时状态
}

// 题目
export interface Puzzle {
  id?: string;
  surface: string;  // 汤面
  bottom: string;   // 汤底
  createdBy?: string;
  createdAt?: Date;
}

// 游戏
export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface Game {
  id: string;
  roomId: string;  // 关联的房间ID
  puzzle: Puzzle;
  status: GameStatus;
  users: User[];
  messages: Message[];
  publicClues: string[];
  createdAt: Date;
  finishedAt?: Date;
  winner?: string;
}

// 房间
export interface Room {
  id: string;  // NanoID 生成的唯一标识，如 "V1StGXR8_Z5jdHi6B-myT"
  name: string;  // 房间名称，用户自定义
  password?: string;  // 房间口令（可选），加入时需要验证
  createdBy?: string;  // 创建者
  createdAt: Date;
  lastActiveAt: Date;  // 最后活跃时间
  gameCount: number;  // 房间内游戏局数
  currentGameId?: string;  // 当前游戏ID
  isDefault?: boolean;  // 是否为默认房间
}

// 房间列表项
export interface RoomListItem {
  id: string;
  name: string;
  userCount: number;  // 当前在线用户数
  gameCount: number;
  isDefault: boolean;
  lastActiveAt: Date;
}

// API响应
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// SSE事件
export interface ServerEvent {
  event: 'user_joined' | 'user_left' | 'new_message' | 'game_started' | 'game_finished';
  payload: any;
  timestamp: Date;
}

// 登录请求
export interface LoginRequest {
  username: string;
  passcode: string;
}

// 登录响应
export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

// 加入游戏请求
export interface JoinGameRequest {
  token: string;
  roomId: string;
}

// 发送消息请求
export interface SendMessageRequest {
  token: string;
  roomId: string;
  message: string;
}

// 创建房间请求
export interface CreateRoomRequest {
  roomName?: string;  // 可选，默认使用 "未命名房间"
  roomPassword?: string;  // 可选，房间口令
  username: string;
}

// 加入房间请求
export interface JoinRoomRequest {
  roomId: string;  // 房间 ID (NanoID)
  password?: string;  // 房间口令（如果房间设置了口令）
  username: string;
}

// 创建题目请求
export interface CreatePuzzleRequest {
  adminPasscode: string;
  surface: string;
  bottom: string;
  roomId?: string;
}

// AI生成题目请求
export interface GeneratePuzzleRequest {
  adminPasscode: string;
  prompt?: string;
  roomId?: string;
}
