# 提示词配置系统

## 概述

所有 AI 提示词现在从独立的 Markdown 文件加载，便于维护和调整。

## 目录结构

```
lib/prompts/
├── README.md                 # 本文件
├── judge-question.md         # 判定玩家问题
├── generate-puzzle.md        # 生成海龟汤题目
├── judge-truth-crack.md      # 判定破案尝试
└── index.ts                  # 加载器
```

## 文件格式

每个提示词文件使用 Markdown 格式，包含 YAML 元数据和提示词内容：

```markdown
---
version: 1.0
model: openai/gpt-4o-mini
temperature: 0.7
description: 判定玩家问题并返回是/否/不重要
---

你是一个海龟汤游戏的裁判...
```

### YAML 元数据字段

- `version`: 提示词版本号
- `model`: 推荐使用的 AI 模型
- `temperature`: 推荐的温度参数
- `description`: 提示词描述

## 使用方法

### 在代码中使用

```typescript
import { getPromptContent, getPromptMetadata } from '@/lib/prompts';

// 获取提示词内容
const prompt = getPromptContent('judge-question');

// 获取元数据
const metadata = getPromptMetadata('judge-question');
console.log(metadata.model); // 'openai/gpt-4o-mini'
```

### 使用便捷对象

```typescript
import { prompts } from '@/lib/prompts';

const prompt = prompts.judgeQuestion();
```

## 修改提示词

1. 直接编辑对应的 `.md` 文件
2. 保存后需要重启服务才能生效（提示词有缓存）

## 清除缓存（开发中）

如果需要热重载，可以调用：

```typescript
import { clearPromptCache } from '@/lib/prompts';
clearPromptCache();
```

## 现有提示词

| 文件 | 用途 | 函数 |
|------|------|------|
| `judge-question.md` | 判定玩家问题（是/否/不重要） | `judgeQuestion()` |
| `generate-puzzle.md` | 生成新的海龟汤题目 | `generatePuzzle()` |
| `judge-truth-crack.md` | 判定破案尝试 | `judgeTruthCrack()` |

## 注意事项

- ⚠️ 修改提示词后会影响 AI 的行为，请谨慎测试
- ⚠️ YAML 元数据目前仅供文档使用，实际模型配置在环境变量中
- 💡 提示词内容支持多行和特殊字符，不需要转义
