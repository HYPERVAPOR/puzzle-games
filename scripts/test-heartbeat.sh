#!/bin/bash

# 测试心跳机制的脚本
# 这个脚本会模拟用户加入游戏后停止发送心跳，验证用户是否会被正确移除

BASE_URL="http://localhost:3000"

echo "🧪 测试心跳机制"
echo "================"

# 生成唯一的用户ID和游戏ID
USER_ID="test-user-$(date +%s)"
GAME_ID="game-heartbeat-test-$(date +%s)"
USERNAME="TestUser"

echo ""
echo "1️⃣ 创建测试用户并加入游戏..."
curl -s -X POST "$BASE_URL/api/game/join" \
  -H "Content-Type: application/json" \
  -d "{\"gameId\":\"$GAME_ID\",\"userId\":\"$USER_ID\",\"username\":\"$USERNAME\"}" \
  | jq '.'

echo ""
echo "2️⃣ 等待 5 秒..."
sleep 5

echo ""
echo "3️⃣ 发送心跳（模拟用户活跃）..."
curl -s -X POST "$BASE_URL/api/game/heartbeat" \
  -H "Content-Type: application/json" \
  -d "{\"gameId\":\"$GAME_ID\",\"userId\":\"$USER_ID\"}" \
  | jq '.'

echo ""
echo "4️⃣ 等待 65 秒（超过超时时间 60 秒）..."
echo "⏳ 用户应该在这之后被标记为离线并从游戏移除"
sleep 65

echo ""
echo "5️⃣ 检查用户是否已被移除..."
# 尝试再次发送心跳，用户应该已经不在游戏中了
curl -s -X POST "$BASE_URL/api/game/heartbeat" \
  -H "Content-Type: application/json" \
  -d "{\"gameId\":\"$GAME_ID\",\"userId\":\"$USER_ID\"}" \
  | jq '.'

echo ""
echo "✅ 测试完成！"
echo ""
echo "说明："
echo "- 用户加入游戏后，每 15 秒需要发送一次心跳"
echo "- 如果 60 秒内没有收到心跳，用户会被自动移除"
echo "- 清理任务每 30 秒运行一次"
