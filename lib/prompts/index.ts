/**
 * 提示词配置管理
 * 从 Markdown 文件加载提示词配置
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径（兼容 ESM 和 CommonJS）
let __dirname = '';
try {
  // ESM 环境
  const __filename = fileURLToPath(import.meta.url);
  __dirname = dirname(__filename);
} catch {
  // CommonJS 环境（Next.js 构建后）
  // @ts-ignore
  __dirname = typeof __dirname !== 'undefined' ? __dirname : '.';
}

// 提示词目录（相对于项目根目录）
const PROMPTS_DIR = join(process.cwd(), 'lib', 'prompts');

// 提示词元数据
export interface PromptMetadata {
  version: string;
  description: string;
}

// 提示词内容
export interface Prompt {
  metadata: PromptMetadata;
  content: string;
}

// 提示词类型
export type PromptType = 'judge-question' | 'generate-puzzle' | 'judge-truth-crack';

// 缓存已加载的提示词
const promptCache = new Map<PromptType, Prompt>();

/**
 * 解析 Markdown 文件的 YAML 头和内容
 */
function parseMarkdownFile(content: string): Prompt {
  // 移除 BOM
  content = content.replace(/^\uFEFF/, '');

  // 检查是否有 YAML 头（以 --- 开始）
  if (!content.startsWith('---')) {
    // 没有 YAML 头，返回默认元数据
    return {
      metadata: {
        version: '1.0',
        description: '',
      },
      content: content.trim(),
    };
  }

  // 提取 YAML 头
  const firstEnd = content.indexOf('---', 3);
  if (firstEnd === -1) {
    throw new Error('Invalid markdown format: missing closing ---');
  }

  const yamlContent = content.slice(3, firstEnd).trim();
  const promptContent = content.slice(firstEnd + 3).trim();

  // 解析 YAML（简单的键值对解析）
  const metadata: PromptMetadata = {
    version: '1.0',
    description: '',
  };

  const lines = yamlContent.split('\n');
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      switch (key) {
        case 'version':
          metadata.version = value;
          break;
        case 'description':
          metadata.description = value;
          break;
        // 忽略 model 和 temperature，它们从环境变量读取
      }
    }
  }

  return {
    metadata,
    content: promptContent,
  };
}

/**
 * 加载提示词文件
 */
export function loadPrompt(type: PromptType): Prompt {
  // 检查缓存
  if (promptCache.has(type)) {
    return promptCache.get(type)!;
  }

  try {
    const filePath = join(PROMPTS_DIR, `${type}.md`);
    const fileContent = readFileSync(filePath, 'utf-8');
    const prompt = parseMarkdownFile(fileContent);

    // 缓存
    promptCache.set(type, prompt);

    return prompt;
  } catch (error) {
    console.error(`Failed to load prompt "${type}":`, error);
    throw new Error(`Prompt file not found: ${type}.md`);
  }
}

/**
 * 获取提示词内容（仅文本）
 */
export function getPromptContent(type: PromptType): string {
  const prompt = loadPrompt(type);
  return prompt.content;
}

/**
 * 获取提示词元数据
 */
export function getPromptMetadata(type: PromptType): PromptMetadata {
  const prompt = loadPrompt(type);
  return prompt.metadata;
}

/**
 * 清除提示词缓存（用于热重载）
 */
export function clearPromptCache(): void {
  promptCache.clear();
}

// 导出便捷函数
export const prompts = {
  judgeQuestion: () => getPromptContent('judge-question'),
  generatePuzzle: () => getPromptContent('generate-puzzle'),
  judgeTruthCrack: () => getPromptContent('judge-truth-crack'),
};
