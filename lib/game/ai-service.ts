/**
 * AI服务
 * 集成OpenRouter API提供判定AI和生成AI功能
 */

import { Puzzle, AIResponse } from '../types';
import { getPromptContent } from '../prompts';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const JUDGE_MODEL = process.env.OPENROUTER_JUDGE_MODEL || 'openai/gpt-4o-mini';
const GENERATE_MODEL = process.env.OPENROUTER_GENERATE_MODEL || 'anthropic/claude-3.5-sonnet';
const JUDGE_TEMPERATURE = parseFloat(process.env.OPENROUTER_JUDGE_TEMPERATURE || '0.7');
const GENERATE_TEMPERATURE = parseFloat(process.env.OPENROUTER_GENERATE_TEMPERATURE || '0.7');

// 推理模式开关（判定AI和生成AI独立控制）
const ENABLE_JUDGE_REASONING = process.env.ENABLE_JUDGE_REASONING === 'true';
const ENABLE_GENERATE_REASONING = process.env.ENABLE_GENERATE_REASONING === 'true';

/**
 * 调用OpenRouter API的通用方法
 */
async function callOpenRouter(
  model: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number,
  enableReasoning: boolean = false
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key is not configured');
  }

  try {
    const requestBody: any = {
      model,
      messages,
      temperature,
      max_tokens: 1000,
    };

    // 如果启用了推理模式，添加reasoning参数
    if (enableReasoning) {
      requestBody.reasoning = { enabled: true };
      console.log('[AI Service] Reasoning mode ENABLED for model:', model);
    } else {
      console.log('[AI Service] Reasoning mode DISABLED for model:', model);
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Turtle Soup Game',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // 提取推理内容（如果有）和最终回复
    const choice = data.choices[0];
    const reasoning = choice?.message?.reasoning;
    const content = choice?.message?.content || '';

    // 如果有推理过程，可以记录到日志
    if (reasoning) {
      console.log('AI Reasoning:', reasoning);
    }

    return content;
  } catch (error) {
    console.error('OpenRouter API call failed:', error);
    throw error;
  }
}

/**
 * 判定AI：分析玩家问题并返回"是"/"否"/"不重要"
 * @param question 玩家的问题
 * @param puzzleBottom 谜底（汤底）
 * @param conversationHistory 对话历史（用于上下文理解）
 */
export async function judgeQuestion(
  question: string,
  puzzleBottom: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<{ response: AIResponse; explanation?: string }> {
  // 从配置文件加载提示词
  const systemPrompt = getPromptContent('judge-question');

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `谜底：${puzzleBottom}` },
  ];

  // 添加对话历史
  if (conversationHistory && conversationHistory.length > 0) {
    conversationHistory.forEach(msg => {
      messages.push({ role: msg.role, content: msg.content });
    });
  }

  messages.push({ role: 'user', content: `玩家问题：${question}\n\n请回答yes/no/irrelevant：` });

  try {
    const response = await callOpenRouter(JUDGE_MODEL, messages, JUDGE_TEMPERATURE, ENABLE_JUDGE_REASONING);
    const trimmedResponse = response.toLowerCase().trim();

    // 解析AI响应
    if (trimmedResponse.includes('yes')) {
      return { response: 'yes', explanation: '这个问题指向了故事的关键要素' };
    } else if (trimmedResponse.includes('no')) {
      return { response: 'no', explanation: '这个问题与故事不符' };
    } else {
      return { response: 'irrelevant', explanation: '这个问题不重要或无法判断' };
    }
  } catch (error) {
    console.error('Judge AI failed:', error);
    // 抛出错误而不是返回默认值
    throw new Error(
      error instanceof Error
        ? `AI判定失败: ${error.message}`
        : 'AI判定服务暂时不可用'
    );
  }
}

/**
 * 判定游戏是否结束
 * @param puzzleBottom 谜底
 * @param conversationHistory 对话历史
 * @param yesCount 获得的"是"的回答数量
 */
export async function judgeGameEnd(
  puzzleBottom: string,
  conversationHistory: Array<{ role: string; content: string }>,
  yesCount: number
): Promise<{ isGameOver: boolean; reason?: string }> {
  // 如果获得足够多的"是"的回答，可能游戏即将结束
  if (yesCount < 5) {
    return { isGameOver: false };
  }

  const systemPrompt = `你是一个海龟汤游戏的裁判。根据谜底和对话历史，判断玩家是否已经理解了故事的核心。

判断标准：
1. 玩家是否通过问题推理出了故事的主要情节
2. 玩家是否理解了故事的关键要素和因果关系
3. 玩家是否接近完整理解整个故事

如果玩家已经理解了故事的核心，返回"GAME_OVER"。
否则，返回"CONTINUE"。

只返回这两个选项之一，不要添加其他内容。`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `谜底：${puzzleBottom}` },
    { role: 'user', content: `对话历史：\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}` },
    { role: 'user', content: '请判断游戏是否结束（GAME_OVER/CONTINUE）：' },
  ];

  try {
    const response = await callOpenRouter(JUDGE_MODEL, messages, JUDGE_TEMPERATURE);
    const trimmedResponse = response.toUpperCase().trim();

    if (trimmedResponse.includes('GAME_OVER')) {
      return { isGameOver: true, reason: '玩家已经理解了故事的核心' };
    }
    return { isGameOver: false };
  } catch (error) {
    console.error('Game end judge failed:', error);
    return { isGameOver: false };
  }
}

/**
 * 生成AI：生成新的海龟汤题目
 * @param prompt 可选的提示词
 */
export async function generatePuzzle(prompt?: string): Promise<Puzzle> {
  // 从配置文件加载提示词
  const systemPrompt = getPromptContent('generate-puzzle');

  const userPrompt = prompt
    ? `请根据以下提示创建一个海龟汤题目：${prompt}`
    : '请创建一个新的海龟汤题目';

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    const response = await callOpenRouter(GENERATE_MODEL, messages, GENERATE_TEMPERATURE, ENABLE_GENERATE_REASONING);

    // 尝试解析JSON
    let jsonStr = response.trim();

    // 提取JSON（如果响应包含其他文本）
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const puzzleData = JSON.parse(jsonStr);

    return {
      surface: puzzleData.surface || '',
      bottom: puzzleData.bottom || '',
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Generate puzzle failed:', error);
    throw new Error('生成题目失败，请稍后重试');
  }
}

/**
 * 测试AI服务是否可用
 */
export async function testAIService(): Promise<boolean> {
  try {
    const result = await judgeQuestion(
      '测试问题',
      '测试谜底',
      []
    );
    return true;
  } catch (error) {
    console.error('AI service test failed:', error);
    return false;
  }
}

/**
 * 破案判定：判断玩家是否还原了真相
 * @param guess 玩家的猜测
 * @param puzzleBottom 谜底（汤底）
 * @param conversationHistory 对话历史
 */
export async function judgeTruthCrack(
  guess: string,
  puzzleBottom: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<{
  response: 'correct' | 'close' | 'incorrect';
  feedback: string;
  confidence?: number;
}> {
  // 从配置文件加载提示词
  const systemPrompt = getPromptContent('judge-truth-crack');

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `谜底：${puzzleBottom}` },
  ];

  // 添加对话历史（最近20条）
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-20);
    recentHistory.forEach(msg => {
      messages.push({ role: msg.role, content: msg.content });
    });
  }

  messages.push({
    role: 'user',
    content: `玩家的猜测：${guess}\n\n请判断猜测准确性并返回JSON：`,
  });

  try {
    const response = await callOpenRouter(
      GENERATE_MODEL,
      messages,
      GENERATE_TEMPERATURE,
      ENABLE_GENERATE_REASONING
    );

    // 尝试解析 JSON
    let jsonStr = response.trim();

    // 提取JSON（如果响应包含其他文本）
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const result = JSON.parse(jsonStr);

    // 验证响应格式
    if (
      !result.response ||
      !['correct', 'close', 'incorrect'].includes(result.response)
    ) {
      throw new Error('Invalid crack response from AI');
    }

    return {
      response: result.response,
      feedback: result.feedback || getDefaultFeedback(result.response),
      confidence: result.confidence || 0.8,
    };
  } catch (error) {
    console.error('Crack judge failed:', error);
    throw new Error(
      error instanceof Error
        ? `破案判定失败: ${error.message}`
        : '破案判定服务暂时不可用'
    );
  }
}

/**
 * 获取默认反馈
 */
function getDefaultFeedback(
  response: 'correct' | 'close' | 'incorrect'
): string {
  switch (response) {
    case 'correct':
      return '🎉 恭喜你！你完全还原了真相！';
    case 'close':
      return '👍 非常接近了！你已经理解了大部分内容，继续思考细节。';
    case 'incorrect':
      return '🤔 还没有对哦，再仔细想想故事的关键线索。';
    default:
      return '继续加油！';
  }
}
