/**
 * AI服务测试脚本
 * 测试不同模型的响应时间和推理行为
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';

const models = [
  'z-ai/glm-4.7-flash',
  'google/gemini-2.0-flash-exp',
  'openai/gpt-4o-mini',
];

const testQuestion = '他是盲人吗？';
const testPuzzle = '这个男人是盲人，他以为火车已经停了，所以跳下车，结果火车还在行驶，他摔死了。';

async function testModel(model) {
  console.log(`\n========================================`);
  console.log(`测试模型: ${model}`);
  console.log(`========================================`);

  const requestBody = {
    model,
    messages: [
      {
        role: 'system',
        content: '你是一个海龟汤游戏的裁判。只返回 yes/no/irrelevant，不要添加其他内容。',
      },
      {
        role: 'user',
        content: `谜底：${testPuzzle}\n\n玩家问题：${testQuestion}\n\n请回答yes/no/irrelevant：`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  };

  const startTime = Date.now();

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      console.error(`❌ API错误: ${response.status}`);
      const errorText = await response.text();
      console.error(`错误详情:`, errorText);
      return { model, error: true, elapsed: null };
    }

    const data = await response.json();
    const choice = data.choices[0];
    const reasoning = choice?.message?.reasoning;
    const content = choice?.message?.content || '';

    console.log(`✅ 响应时间: ${(elapsed / 1000).toFixed(2)}秒`);
    console.log(`📝 回答: ${content.trim()}`);

    if (reasoning) {
      console.log(`🧠 推理过程: ${reasoning.substring(0, 100)}...`);
      console.log(`⚠️  模型自动返回了推理内容`);
    } else {
      console.log(`✅ 无推理内容（符合预期）`);
    }

    return {
      model,
      elapsed,
      hasReasoning: !!reasoning,
      answer: content.trim(),
    };
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ 请求失败:`, error.message);
    return { model, error: true, elapsed };
  }
}

async function main() {
  console.log('🧪 开始测试 AI 模型...\n');

  const results = [];

  for (const model of models) {
    const result = await testModel(model);
    results.push(result);
    // 避免速率限制
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n========================================');
  console.log('📊 测试结果汇总');
  console.log('========================================');

  results
    .filter(r => !r.error)
    .sort((a, b) => a.elapsed - b.elapsed)
    .forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.model}`);
      console.log(`   响应时间: ${(result.elapsed / 1000).toFixed(2)}秒`);
      console.log(`   自动推理: ${result.hasReasoning ? '⚠️ 是' : '✅ 否'}`);
      console.log(`   回答: ${result.answer}`);
    });
}

main().catch(console.error);
