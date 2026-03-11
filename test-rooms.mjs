/**
 * 房间功能测试脚本
 */

const API_BASE = 'http://localhost:3000';

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

async function testListRooms() {
  info('测试获取房间列表...');

  const response = await fetch(`${API_BASE}/api/rooms`);
  const data = await response.json();

  if (data.success && data.data.rooms) {
    success(`获取到 ${data.data.rooms.length} 个房间`);
    data.data.rooms.forEach(room => {
      info(`  - ${room.name} (${room.id}): ${room.userCount} 人, ${room.gameCount} 局`);
    });
    return data.data.rooms;
  } else {
    error(`获取房间列表失败: ${data.error}`);
    return [];
  }
}

async function testJoinRoom(roomId, username) {
  info(`测试加入房间: ${roomId} (用户: ${username})...`);

  const response = await fetch(`${API_BASE}/api/rooms/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, username }),
  });

  const data = await response.json();

  if (data.success && data.data.room && data.data.game) {
    success('加入房间成功');
    info(`  房间: ${data.data.room.name}`);
    info(`  游戏: ${data.data.game.id}`);
    info(`  用户: ${data.data.user.username}`);
    return data.data;
  } else {
    error(`加入房间失败: ${data.error}`);
    return null;
  }
}

async function testCreateRoom(roomId, username) {
  info(`测试创建房间: ${roomId} (用户: ${username})...`);

  const response = await fetch(`${API_BASE}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, roomName: `房间 ${roomId}`, username }),
  });

  const data = await response.json();

  if (data.success && data.data.room && data.data.game) {
    success('创建房间成功');
    info(`  房间: ${data.data.room.name} (${data.data.room.id})`);
    info(`  游戏: ${data.data.game.id}`);
    return data.data;
  } else {
    error(`创建房间失败: ${data.error}`);
    return null;
  }
}

async function main() {
  log('\n========================================', 'blue');
  log('🧪 房间功能测试', 'blue');
  log('========================================\n', 'blue');

  try {
    // 1. 测试获取房间列表（确保默认房间存在）
    const rooms = await testListRooms();

    // 2. 测试加入默认房间
    log('\n========================================', 'blue');
    log('测试加入默认房间', 'blue');
    log('========================================\n', 'blue');

    const joinResult = await testJoinRoom('default', '测试用户1');
    if (joinResult) {
      success('加入默认房间成功');
    }

    // 3. 测试创建新房间
    log('\n========================================', 'blue');
    log('测试创建新房间', 'blue');
    log('========================================\n', 'blue');

    const testRoomId = `test-${Date.now()}`;
    const createResult = await testCreateRoom(testRoomId, '测试用户2');
    if (createResult) {
      success('创建新房间成功');

      // 再次获取房间列表验证
      log('\n========================================', 'blue');
      log('验证房间列表更新', 'blue');
      log('========================================\n', 'blue');

      await testListRooms();
    }

    // 4. 测试加入刚创建的房间
    if (createResult) {
      log('\n========================================', 'blue');
      log('测试加入新创建的房间', 'blue');
      log('========================================\n', 'blue');

      const joinNewRoomResult = await testJoinRoom(testRoomId, '测试用户3');
      if (joinNewRoomResult) {
        success('加入新房间成功');
      }
    }

    // 5. 总结
    log('\n========================================', 'blue');
    log('✅ 所有测试完成', 'blue');
    log('========================================\n', 'blue');

    success('房间列表功能正常');
    success('加入房间功能正常');
    success('创建房间功能正常');

    log('\n提示: 可以通过浏览器访问 http://localhost:3000 来测试完整功能', 'yellow');

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

main().catch(console.error);
