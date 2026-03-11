/**
 * 输入验证和转义工具
 * 防止XSS、注入攻击等安全问题
 */

/**
 * HTML转义，防止XSS攻击
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * 移除特殊字符，防止命令注入
 */
export function sanitizeInput(input: string): string {
  return input.replace(/['";\\$`<>]/g, '');
}

/**
 * 验证用户名
 * 只允许字母、数字、中文、下划线、连字符
 * 长度限制1-20字符
 */
export function validateUsername(username: string): boolean {
  // 只允许字母、数字、中文、下划线、连字符
  const regex = /^[\w\u4e00-\u9fa5-]{1,20}$/;
  return regex.test(username);
}

/**
 * 验证消息内容
 * 长度限制1-1000字符
 */
export function validateMessage(message: string): boolean {
  const trimmed = message.trim();
  return trimmed.length > 0 && trimmed.length <= 1000;
}

/**
 * 验证口令
 * 长度限制1-100字符
 */
export function validatePasscode(passcode: string): boolean {
  return passcode.length > 0 && passcode.length <= 100;
}

/**
 * 验证谜面（汤面）
 * 长度限制10-1000字符
 */
export function validatePuzzleSurface(surface: string): boolean {
  const trimmed = surface.trim();
  return trimmed.length >= 10 && trimmed.length <= 1000;
}

/**
 * 验证谜底（汤底）
 * 长度限制10-2000字符
 */
export function validatePuzzleBottom(bottom: string): boolean {
  const trimmed = bottom.trim();
  return trimmed.length >= 10 && trimmed.length <= 2000;
}

/**
 * 综合验证和转义函数 - 用户名
 */
export function sanitizeUsername(username: string): string {
  if (!validateUsername(username)) {
    throw new Error('用户名格式不正确');
  }
  return escapeHtml(username.trim());
}

/**
 * 综合验证和转义函数 - 消息内容
 */
export function sanitizeMessage(message: string): string {
  if (!validateMessage(message)) {
    throw new Error('消息长度必须在1-1000字符之间');
  }
  return escapeHtml(message.trim());
}

/**
 * 综合验证和转义函数 - 谜面
 */
export function sanitizePuzzleSurface(surface: string): string {
  if (!validatePuzzleSurface(surface)) {
    throw new Error('谜面长度必须在10-1000字符之间');
  }
  return escapeHtml(surface.trim());
}

/**
 * 综合验证和转义函数 - 谜底
 */
export function sanitizePuzzleBottom(bottom: string): string {
  if (!validatePuzzleBottom(bottom)) {
    throw new Error('谜底长度必须在10-2000字符之间');
  }
  return escapeHtml(bottom.trim());
}
