/*
 * 工E千程的可复现情景引擎。
 * 所有金额均由现金流模型计算；固定随机种子只用于复现实验，不代表真实概率校准。
 */
(function (root, factory) {
  const engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) root.QianchengDecisionEngine = engine;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const FACTORS = [
    { id: 'income', label: '收入与入职时点', keys: ['salary', 'preIncome', 'incomeFloor', 'delay', 'study'] },
    { id: 'housing', label: '住房与日常成本', keys: ['rent', 'monthlyExtra'] },
    { id: 'goals', label: '大额目标与时点', keys: ['goalCost', 'goalMonth', 'oneOff', 'includeSharedGoal'] },
    { id: 'family', label: '家庭现金流', keys: ['familySupport', 'monthlySupport'] },
    { id: 'risk', label: '收入波动与风险', keys: ['volatility', 'riskPremium'] }
  ];
  const DEFAULT_SEED = 170017;

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function stableDelta(value) {
    return Math.abs(value) < 1e-6 ? 0 : value;
  }

  function mulberry32(seed) {
    let state = seed >>> 0;
    return function () {
      state = (state + 0x6D2B79F5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normalSample(random) {
    const u = Math.max(random(), Number.EPSILON);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
  }

  function createNoise(paths, months, seed) {
    const random = mulberry32(seed >>> 0);
    const size = paths * months;
    const noise = {
      income: new Float32Array(size),
      spending: new Float32Array(size),
      shockChance: new Float32Array(size),
      shockSize: new Float32Array(size),
      interruption: new Float32Array(size)
    };
    for (let i = 0; i < size; i += 1) {
      noise.income[i] = normalSample(random);
      noise.spending[i] = normalSample(random);
      noise.shockChance[i] = random();
      noise.shockSize[i] = random();
      noise.interruption[i] = random();
    }
    return noise;
  }

  function quantile(values, fraction) {
    if (!values.length) return 0;
    const ordered = Array.from(values).sort((a, b) => a - b);
    return ordered[Math.floor((ordered.length - 1) * fraction)];
  }

  function normalizeConfig(input = {}) {
    const months = clamp(Math.round(number(input.months, 36)), 1, 120);
    const paths = clamp(Math.round(number(input.paths, 1000)), 100, 10000);
    const goal = Math.max(0, number(input.goal));
    const goalMonth = clamp(Math.round(number(input.goalMonth, 18)), 1, months);
    return {
      months,
      paths,
      seed: Math.floor(number(input.seed, DEFAULT_SEED)) >>> 0,
      start: number(input.start),
      baseIncome: number(input.baseIncome),
      baseExpense: number(input.baseExpense),
      salaryGrowth: number(input.salaryGrowth),
      expenseGrowth: number(input.expenseGrowth),
      risk: clamp(number(input.risk, 4), 0, 10),
      goal,
      goalMonth,
      goalLabel: String(input.goalLabel || ''),
      computer: Math.max(0, number(input.computer)),
      unemployed: Boolean(input.unemployed),
      policy: {
        spendFactor: clamp(number(input.policy && input.policy.spendFactor, 1), 0.1, 3),
        shockFactor: clamp(number(input.policy && input.policy.shockFactor, 1), 0, 5)
      }
    };
  }

  function routeTarget(route, config) {
    const routeGoal = Math.max(0, number(route.goalCost));
    if (config.goal > 0) return { amount: config.goal, month: config.goalMonth, kind: 'shared' };
    if (routeGoal > 0) {
      return { amount: routeGoal, month: clamp(Math.round(number(route.goalMonth, 1)), 1, config.months), kind: 'route' };
    }
    return { amount: 0, month: config.months, kind: 'none' };
  }

  function runRoute(routeInput, configInput, noise, includeTimeline) {
    const route = routeInput || {};
    const config = configInput.months ? configInput : normalizeConfig(configInput);
    const target = routeTarget(route, config);
    const targetMonth = target.month;
    const routeGoalMonth = clamp(Math.round(number(route.goalMonth, 1)), 1, config.months);
    const routeGoalIsFocus = target.kind === 'shared'
      && Math.abs(Math.max(0, number(route.goalCost)) - target.amount) < 1e-6
      && routeGoalMonth === target.month
      && (!route.goalLabel || !config.goalLabel || route.goalLabel === config.goalLabel);
    const months = config.months;
    const paths = config.paths;
    const timeline = includeTimeline ? Array.from({ length: months }, () => new Float64Array(paths)) : null;
    const ending = new Float64Array(paths);
    const targetAvailable = new Float64Array(paths);
    let negative = 0;
    let targetHits = 0;

    for (let path = 0; path < paths; path += 1) {
      let cash = config.start;
      let wasNegative = cash < 0;
      for (let month = 1; month <= months; month += 1) {
        const index = path * months + month - 1;
        const employed = month > number(route.delay, 6);
        let income = employed
          ? Math.max(number(route.incomeFloor), number(route.salary))
          : route.preIncome !== undefined ? number(route.preIncome) : config.baseIncome;
        if (route.study && !employed) income = Math.max(0, config.baseIncome * 0.35 + number(route.preIncome));
        const incomeVolatility = clamp(number(route.volatility, 0.14), 0, 1.5);
        income *= Math.pow(1 + config.salaryGrowth, Math.max(0, month - number(route.delay, 6)) / 12);
        income *= Math.max(0.1, 1 + noise.income[index] * incomeVolatility);
        if (config.unemployed && month >= 24 && month < 30 && noise.interruption[index] < 0.48) income *= 0.12;

        const rent = Math.max(0, number(route.rent));
        const housing = rent * (employed ? 1 : route.study ? 0.72 : 1);
        const recurring = Math.max(0, config.baseExpense + housing + number(route.monthlyExtra));
        const spending = recurring * config.policy.spendFactor
          * Math.pow(1 + config.expenseGrowth, month / 12)
          * Math.max(0.25, 1 + noise.spending[index] * 0.09);
        const shockProbability = clamp(0.006 + config.risk * 0.0017 + number(route.riskPremium), 0, 0.35);
        const shock = noise.shockChance[index] < shockProbability
          ? (1200 + noise.shockSize[index] * config.risk * 900) * config.policy.shockFactor
          : 0;
        const routeGoal = month === routeGoalMonth
          ? Math.max(0, number(route.goalCost)) : 0;
        const sharedGoal = config.goal > 0 && month === config.goalMonth
          && (!(route.goalCost !== undefined) || Boolean(route.includeSharedGoal)) ? config.goal : 0;
        const computer = month === 12 ? config.computer : 0;
        const oneOff = month === 1 ? Math.max(0, number(route.oneOff)) : 0;
        const familySupport = (month === 1 ? number(route.familySupport) : 0) + number(route.monthlySupport);
        const beforeGoals = cash + income - spending - shock + familySupport;
        const totalGoals = routeGoal + sharedGoal + computer + oneOff;

        if (month === targetMonth) {
          const targetExpense = target.kind === 'shared' ? (sharedGoal > 0 ? sharedGoal : routeGoalIsFocus ? routeGoal : 0) : target.kind === 'route' ? routeGoal : 0;
          const available = beforeGoals - Math.max(0, totalGoals - targetExpense);
          targetAvailable[path] = available;
          if (target.amount > 0 && available >= target.amount) targetHits += 1;
        }

        cash = beforeGoals - totalGoals;
        if (cash < 0) wasNegative = true;
        if (timeline) timeline[month - 1][path] = cash;
      }
      ending[path] = cash;
      if (wasNegative) negative += 1;
    }

    const finalStats = { p10: quantile(ending, 0.1), p50: quantile(ending, 0.5), p90: quantile(ending, 0.9) };
    const targetStats = target.amount > 0
      ? { p10: quantile(targetAvailable, 0.1), p50: quantile(targetAvailable, 0.5), p90: quantile(targetAvailable, 0.9) }
      : { ...finalStats };
    if (!timeline) return { targetP50: targetStats.p50, endingP50: finalStats.p50 };

    const p10 = [], p50 = [], p90 = [];
    for (let month = 0; month < months; month += 1) {
      p10.push(quantile(timeline[month], 0.1));
      p50.push(quantile(timeline[month], 0.5));
      p90.push(quantile(timeline[month], 0.9));
    }
    return {
      p10, p50, p90,
      goal: target.amount > 0 ? targetHits / paths * 100 : 0,
      hasGoal: target.amount > 0,
      goalAvailable: targetStats,
      final: finalStats,
      negative,
      paths,
      targetMonth
    };
  }

  function makeHybridRoute(routeA, routeB, mask) {
    const hybrid = { ...(routeA || {}) };
    FACTORS.forEach((factor, index) => {
      if (!(mask & (1 << index))) return;
      factor.keys.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(routeB || {}, key)) hybrid[key] = routeB[key];
        else delete hybrid[key];
      });
    });
    return hybrid;
  }

  function shapley(values) {
    const count = FACTORS.length;
    const factorial = [1];
    for (let i = 1; i <= count; i += 1) factorial[i] = factorial[i - 1] * i;
    const contributions = FACTORS.map((factor, factorIndex) => {
      let value = 0;
      for (let mask = 0; mask < (1 << count); mask += 1) {
        if (mask & (1 << factorIndex)) continue;
        let size = 0;
        for (let bit = 0; bit < count; bit += 1) if (mask & (1 << bit)) size += 1;
        const weight = factorial[size] * factorial[count - size - 1] / factorial[count];
        value += weight * (values[mask | (1 << factorIndex)] - values[mask]);
      }
      return { id: factor.id, label: factor.label, value: stableDelta(value) };
    });
    return contributions;
  }

  function compare(routeA, routeB, configInput = {}) {
    const config = normalizeConfig(configInput);
    const noise = createNoise(config.paths, config.months, config.seed);
    const a = runRoute(routeA, config, noise, true);
    const b = runRoute(routeB, config, noise, true);
    const coalitionTarget = new Float64Array(1 << FACTORS.length);
    const coalitionEnding = new Float64Array(1 << FACTORS.length);
    for (let mask = 0; mask < coalitionTarget.length; mask += 1) {
      const hybrid = makeHybridRoute(routeA, routeB, mask);
      const metrics = runRoute(hybrid, config, noise, false);
      coalitionTarget[mask] = metrics.targetP50;
      coalitionEnding[mask] = metrics.endingP50;
    }
    const targetValueA = coalitionTarget[0];
    const targetValueB = coalitionTarget[coalitionTarget.length - 1];
    const endingValueA = coalitionEnding[0];
    const endingValueB = coalitionEnding[coalitionEnding.length - 1];
    return {
      a,
      b,
      model: { paths: config.paths, months: config.months, seed: config.seed, factorCount: FACTORS.length, coalitionCount: coalitionTarget.length },
      attribution: {
        factors: FACTORS.map(({ id, label }) => ({ id, label })),
        target: {
          label: config.goal > 0 ? `第${config.goalMonth}个月目标前可用资金` : '期末资金',
          a: targetValueA,
          b: targetValueB,
          delta: stableDelta(targetValueB - targetValueA),
          contributions: shapley(coalitionTarget)
        },
        ending: {
          label: `${config.months}个月期末资金`,
          a: endingValueA,
          b: endingValueB,
          delta: stableDelta(endingValueB - endingValueA),
          contributions: shapley(coalitionEnding)
        }
      }
    };
  }

  return { FACTORS, DEFAULT_SEED, normalizeConfig, compare };
});
