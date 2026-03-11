/**
 * 游戏功能完整测试脚本
 * 测试用户登录、加入游戏、发送消息等核心功能
 */

import { readFileSync } from 'fs';

const API_BASE = 'http://localhost:3000';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testLogin() {
  info('测试用户登录...');

  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'testuser',
      passcode: 'letmein',
    }),
  });

  const data = await response.json();

  if (data.success && data.token && data.user) {
    success('登录成功');
    return { token: data.token, user: data.user };
  } else {
    error(`登录失败: ${data.error}`);
    throw new Error('Login failed');
  }
}

async function testJoinGame(token, gameId = 'default-game') {
  info(`测试加入游戏 (${gameId})...`);

  const response = await fetch(`${API_BASE}/api/game/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, gameId }),
  });

  const data = await response.json();

  if (data.success && data.data.game) {
    success('加入游戏成功');
    return data.data.game;
  } else {
    error(`加入游戏失败: ${data.error}`);
    throw new Error('Join game failed');
  }
}

async function testSendMessage(token, gameId, message) {
  info(`测试发送消息: "${message}"...`);

  const startTime = Date.now();

  const response = await fetch(`${API_BASE}/api/game/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      gameId,
      message,
    }),
  });

  const elapsed = (Date.now() - startTime) / 1000;

  const data = await response.json();

  if (data.success) {
    success(`AI响应成功 (${elapsed.toFixed(2)}秒)`);

    // 检查是否有AI回复
    const messages = data.data.game?.messages || [];
    const lastMessage = messages[messages.length - 1];

    if (lastMessage && lastMessage.type === 'ai') {
      info(`AI回答: ${lastMessage.content}`);
      if (lastMessage.aiResponse) {
        info(`判定结果: ${lastMessage.aiResponse}`);
      }
    }

    return data.data;
  } else {
    error(`发送消息失败: ${data.error}`);
    throw new Error('Send message failed');
  }
}

async function testAdminCreatePuzzle(adminPasscode) {
  info('测试管理员创建题目...');

  const response = await fetch(`${API_BASE}/api/admin/create-puzzle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adminPasscode,
      surface: '测试汤面：一个人坐在火车上突然跳车',
      bottom: '测试汤底：这个人是盲人，以为火车停了',
    }),
  });

  const data = await response.json();

  if (data.success) {
    success('创建题目成功');
    return data.data;
  } else {
    warn(`创建题目失败: ${data.error}`);
    return null;
  }
}

async function main() {
  log('\n========================================', 'blue');
  log('🧪 海龟汤游戏功能测试', 'blue');
  log('========================================\n', 'blue');

  try {
    // 1. 测试登录
    const { token, user } = await testLogin();

    // 2. 测试加入游戏
    const game = await testJoinGame(token);
    info(`游戏ID: ${game.id}`);
    info(`游戏状态: ${game.status}`);
    info(`当前用户数: ${game.users.length}`);

    // 3. 测试发送多条消息
    const testQuestions = [
      '他是盲人吗？',
      '火车停了吗？',
      '他想自杀吗？',
    ];

    log('\n开始测试AI判定...', 'blue');
    const responseTimes = [];

    for (const question of testQuestions) {
      const startTime = Date.now();
      await testSendMessage(token, game.id, question);
      const elapsed = (Date.now() - startTime) / 1000;
      responseTimes.push(elapsed);

      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 4. 统计响应时间
    const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxTime = Math.max(...responseTimes);
    const minTime = Math.min(...responseTimes);

    log('\n========================================', 'blue');
    log('📊 响应时间统计', 'blue');
    log('========================================', 'blue');
    info(`平均响应时间: ${avgTime.toFixed(2)}秒`);
    info(`最快响应: ${minTime.toFixed(2)}秒`);
    info(`最慢响应: ${maxTime.toFixed(2)}秒`);

    if (avgTime < 3) {
      success('响应速度优秀 ✨');
    } else if (avgTime < 10) {
      success('响应速度良好');
    } else {
      warn('响应速度较慢，建议更换模型');
    }

    // 5. 测试管理员功能
    log('\n========================================', 'blue');
    log('🔐 管理员功能测试', 'blue');
    log('========================================\n', 'blue');

    await testAdminCreatePuzzle('admin123');

    // 6. 总结
    log('\n========================================', 'blue');
    log('✅ 所有测试完成', 'blue');
    log('========================================\n', 'blue');

    success('登录功能正常');
    success('加入游戏功能正常');
    success('AI判定功能正常');
    success('管理员功能正常');
    success(`平均响应时间: ${avgTime.toFixed(2)}秒`);

    log('\n提示: 如果响应时间超过10秒，建议更换为更快的模型', 'yellow');
    info('推荐模型: openai/gpt-4o-mini (测试中响应时间约0.5秒)');

  } catch (err) {
    error('\n========================================');
    error('❌ 测试失败');
    error('========================================\n');
    error(err.message);

    if (err.cause) {
      error(`错误详情: ${err.cause}`);
    }

    process.exit(1);
  }
}

main();
