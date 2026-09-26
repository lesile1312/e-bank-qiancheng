const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../decision-engine.js');

const config = {
  months: 36,
  paths: 1000,
  seed: 170017,
  start: 12580,
  baseIncome: 3200,
  baseExpense: 2430,
  salaryGrowth: 0.03,
  expenseGrowth: 0.025,
  risk: 4,
  goal: 12000,
  goalMonth: 6,
  computer: 0,
  policy: { spendFactor: 1, shockFactor: 1 }
};

function campusRoute(goalMonth) {
  return {
    city: `第${goalMonth}月购置`,
    salary: 0,
    rent: 0,
    delay: 36,
    preIncome: 3200,
    volatility: 0,
    goalLabel: '电脑购置',
    goalMonth,
    goalCost: 9000,
    includeSharedGoal: true
  };
}

test('同一输入与种子会产生完全一致的路线和归因结果', () => {
  const first = engine.compare(campusRoute(1), campusRoute(9), config);
  const second = engine.compare(campusRoute(1), campusRoute(9), config);
  assert.deepEqual(first, second);
});

test('共用风险扰动下，延后电脑购置会提高第6月目标前现金，但不虚构期末净资产', () => {
  const result = engine.compare(campusRoute(1), campusRoute(9), config);
  assert.equal(result.attribution.target.delta, 9000);
  assert.ok(Math.abs(result.attribution.ending.delta) < 1e-7);
  assert.equal(result.a.goal, 0);
  assert.ok(result.b.goal > 99.5);
});

test('五项 Shapley 贡献可加总回路线差异，且共有32个反事实组合', () => {
  const result = engine.compare(campusRoute(1), campusRoute(9), config);
  assert.equal(result.model.factorCount, 5);
  assert.equal(result.model.coalitionCount, 32);
  for (const metric of [result.attribution.target, result.attribution.ending]) {
    const total = metric.contributions.reduce((sum, row) => sum + row.value, 0);
    assert.ok(Math.abs(total - metric.delta) < 1e-7, `${total} should equal ${metric.delta}`);
  }
  const driver = result.attribution.target.contributions.find(row => row.id === 'goals');
  assert.equal(driver.value, 9000);
});

test('改变收入或住房假设会实际改变模拟路径和因素归因', () => {
  const a = { ...campusRoute(1), salary: 7000, delay: 6, rent: 1800, preIncome: 0, goalCost: 0, goalMonth: 1 };
  const b = { ...campusRoute(1), salary: 12000, delay: 6, rent: 2800, preIncome: 0, goalCost: 0, goalMonth: 1 };
  const result = engine.compare(a, b, { ...config, goal: 0 });
  assert.notEqual(result.a.final.p50, result.b.final.p50);
  assert.ok(result.attribution.ending.contributions.find(row => row.id === 'income').value > 0);
  assert.ok(result.attribution.ending.contributions.find(row => row.id === 'housing').value < 0);
});

test('目标本身已计入路线支出时，不会在目标可负担判断中重复扣除', () => {
  const routeA = { city: '本地就业', salary: 0, rent: 0, delay: 36, preIncome: 0, volatility: 0, goalLabel: '考研投入', goalMonth: 1, goalCost: 0 };
  const routeB = { city: '继续深造', salary: 0, rent: 0, delay: 36, preIncome: 0, volatility: 0, goalLabel: '考研投入', goalMonth: 1, goalCost: 18000 };
  const result = engine.compare(routeA, routeB, { ...config, months: 12, start: 30000, baseIncome: 0, baseExpense: 0, goal: 18000, goalMonth: 1, goalLabel: '考研投入', risk: 0 });
  assert.equal(result.b.goal, 100);
  assert.equal(result.b.goalAvailable.p50, 30000);
  assert.equal(result.b.final.p50, 12000);
});

test('输出含完整月度分位线、目标前资金、目标命中率与现金流压力路径数', () => {
  const result = engine.compare(campusRoute(1), campusRoute(9), config);
  assert.equal(result.a.p50.length, config.months);
  assert.equal(result.b.p10.length, config.months);
  assert.ok(result.a.goalAvailable.p10 <= result.a.goalAvailable.p50);
  assert.ok(result.a.goalAvailable.p50 <= result.a.goalAvailable.p90);
  assert.ok(result.a.negative >= 0 && result.a.negative <= config.paths);
  assert.equal(result.b.paths, config.paths);
});

test('切换资金策略会改变模拟现金流，而不只更换页面标签', () => {
  const route = { city: '稳定就业', salary: 9000, rent: 1800, delay: 1, volatility: 0.1 };
  const safer = engine.compare(route, route, {
    ...config,
    goal: 0,
    policy: { spendFactor: 0.94, shockFactor: 0.78 }
  }).a.final.p50;
  const faster = engine.compare(route, route, {
    ...config,
    goal: 0,
    policy: { spendFactor: 1.04, shockFactor: 1.14 }
  }).a.final.p50;
  assert.ok(safer > faster, `safety strategy ${safer} should exceed goal-acceleration strategy ${faster}`);
});
