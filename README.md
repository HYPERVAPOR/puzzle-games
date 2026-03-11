# 🐢 海龟汤 - 情境推理游戏

一个现代化的在线多人海龟汤游戏，使用Next.js 16构建，支持实时多人游戏和AI辅助。

## ✨ 特性

- 🎮 **多人在线** - 支持多玩家同时参与游戏
- 🤖 **AI辅助** - 集成OpenRouter API，智能判定问题和生成题目
- 💬 **实时聊天** - 基于SSE的实时通信，类似Telegram的聊天界面
- 🎨 **深色主题** - 现代化的深色UI设计，美观舒适
- 🔒 **安全可靠** - 输入验证、防注入攻击、JWT认证
- 📝 **会话管理** - 类似ChatGPT的会话管理和历史记录
- 🎯 **智能判定** - AI自动判定游戏结束，揭晓谜底

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```bash
# 用户口令（默认letmein）
GAME_PASSCODE=letmein

# 管理员口令
ADMIN_PASSCODE=admin123

# OpenRouter API配置
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_JUDGE_MODEL=openai/gpt-4o-mini
OPENROUTER_GENERATE_MODEL=anthropic/claude-3.5-sonnet

# JWT密钥
JWT_SECRET=change-this-to-a-secure-random-string

# 数据存储路径
DATA_PATH=./data
```

### 3. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 🎮 如何游玩

### 用户玩法

1. 在首页输入用户名和口令登录
2. 进入游戏房间，查看谜面（汤面）
3. 通过提问是/否问题来推理故事
4. AI会回答"是"/"否"/"不重要"
5. 所有"是"的问题会显示在"可以公开的情报"区域
6. 当你推理出足够细节时，AI会判定游戏结束并揭晓谜底

### 管理员功能

访问 `/admin` 进入管理后台：

- **手动创建题目** - 输入谜面和谜底创建新题目
- **AI生成题目** - 让AI自动生成有趣的海龟汤题目

## 🏗️ 技术栈

- **框架**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind CSS v4
- **语言**: TypeScript
- **实时通信**: Server-Sent Events (SSE)
- **认证**: JWT (jose)
- **AI**: OpenRouter API
- **存储**: JSON文件系统

## 📁 项目结构

```
puzzle-games/
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   │   ├── auth/          # 认证
│   │   ├── game/          # 游戏API
│   │   ├── admin/         # 管理员API
│   │   └── sessions/      # 会话API
│   ├── game/              # 游戏页面
│   ├── admin/             # 管理员页面
│   └── page.tsx           # 登录页面
├── components/            # React组件
│   ├── game/              # 游戏组件
│   ├── admin/             # 管理员组件
│   └── ui/                # 基础UI组件
├── lib/                   # 核心逻辑
│   ├── game/              # 游戏管理
│   ├── storage/           # 数据存储
│   ├── validation/        # 输入验证
│   └── types.ts           # TypeScript类型
└── data/                  # 数据存储目录
```

## 🔐 安全特性

- ✅ HTML转义防止XSS攻击
- ✅ 输入长度限制
- ✅ 用户名格式验证
- ✅ JWT token认证
- ✅ 速率限制防止滥用
- ✅ 安全响应头

## 🎯 游戏规则

1. **提问**: 玩家通过提问是/否问题来推理故事
2. **判定**: AI根据谜底判定问题的答案
3. **情报**: 所有"是"的回答会被记录在公开情报区
4. **胜利**: 当推理出足够细节时，游戏结束，揭晓谜底

## 📝 API端点

### 认证
- `POST /api/auth/login` - 用户登录

### 游戏
- `POST /api/game/join` - 加入游戏
- `POST /api/game/message` - 发送消息
- `POST /api/game/leave` - 离开游戏
- `GET /api/game/events` - SSE事件流

### 管理员
- `POST /api/admin/create-puzzle` - 创建题目
- `POST /api/admin/generate-puzzle` - AI生成题目

### 会话
- `GET /api/sessions` - 获取会话列表
- `POST /api/sessions` - 创建会话
- `GET /api/sessions/[id]` - 获取会话详情

## 🚀 部署

### Vercel部署

1. Fork本项目
2. 在Vercel中导入项目
3. 配置环境变量
4. 部署！

### 其他平台

确保平台支持：
- Node.js 18+
- 文件系统写入权限
- 环境变量配置

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 联系

如有问题，请提交Issue或联系开发者。

---

**祝游戏愉快！🎉**
