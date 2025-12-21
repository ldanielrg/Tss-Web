import type {
  DiscreteDistribution,
  HookeJeevesResult,
  HookeJeevesRow,
  InventoryA14DayRow,
  InventoryA14Params,
  InventoryA14PolicyAggregate,
  InventoryA14ReplicationResult,
} from "../types/inventoryActividad14";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clampInt(x: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(x)));
}

function validateDist(dist: DiscreteDistribution<number>) {
  const sum = dist.outcomes.reduce((acc, o) => acc + o.p, 0);
  const eps = 1e-9;
  if (Math.abs(sum - 1) > 1e-6) {
    console.warn(`[${dist.name}] Probabilidades no suman 1. Suma=`, sum);
  }

  if (dist.outcomes.some((o) => o.p < -eps)) {
    console.warn(`[${dist.name}] Hay probabilidades negativas.`);
  }
}

function sampleDiscrete(dist: DiscreteDistribution<number>, u: number): number {
  let acc = 0;
  for (const o of dist.outcomes) {
    acc += o.p;
    if (u <= acc) return o.value;
  }
  return dist.outcomes[dist.outcomes.length - 1]?.value ?? 0;
}

function dailyInventoryAverage(invStart: number, invEnd: number, demand: number, sales: number): number {
  if (demand <= 0) {
    return invStart;
  }
  if (invEnd > 0) {
    return (invStart + invEnd) / 2;
  }
  const frac = Math.max(0, Math.min(1, sales / demand));
  return (invStart * frac) / 2;
}

type PendingOrder = { arrivalDay: number; qty: number };

type SimCoreResult = {
  rows: InventoryA14DayRow[];
  totalCost: number;
  costOrder: number;
  costHolding: number;
  costShortage: number;

  avgOnHand: number;
  stockoutDays: number;
  totalShortageUnits: number;

  totalLostUnits?: number;
  totalWaitFulfilledUnits?: number;
};

function simulateOneReplication(params: InventoryA14Params, seed: number): SimCoreResult {
  const rng = mulberry32(seed);

  validateDist(params.problem === "P1" ? params.demandDistP1 : params.demandDistP2);
  validateDist(params.problem === "P1" ? params.leadTimeDistP1 : params.leadTimeDistP2);
  if (params.problem === "P2") validateDist(params.waitDistP2);

  const hDaily = params.costs.holdingCostAnnual / params.days;

  let onHand = params.initialOnHand;

  let pendingOrders: PendingOrder[] = [];

  let BO = 0;

  const WMAX = 4;
  let waitBuckets = new Array(WMAX + 1).fill(0) as number[];

  let costOrder = 0;
  let costHolding = 0;
  let costShortage = 0;

  let sumOnHandEnd = 0;
  let stockoutDays = 0;
  let totalShortageUnits = 0;

  let totalLostUnits = 0;
  let totalWaitFulfilledUnits = 0;

  const rows: InventoryA14DayRow[] = [];

  for (let day = 1; day <= params.days; day++) {
    const arrivalsToday = pendingOrders
      .filter((o) => o.arrivalDay === day)
      .reduce((acc, o) => acc + o.qty, 0);

    if (arrivalsToday > 0) {
      onHand += arrivalsToday;
      pendingOrders = pendingOrders.filter((o) => o.arrivalDay !== day);
    }

    let expiredToday = 0;
    if (params.problem === "P2") {
      expiredToday = waitBuckets[0] || 0;
      if (expiredToday > 0) {
        const extraPenalty = params.costs.shortageCostNoWaitP2 - params.costs.shortageCostWaitP2;
        costShortage += expiredToday * extraPenalty;
        totalLostUnits += expiredToday;
      }

      const newBuckets = new Array(WMAX + 1).fill(0) as number[];
      for (let r = 1; r <= WMAX; r++) newBuckets[r - 1] = waitBuckets[r];
      waitBuckets = newBuckets;
    }

    if (params.problem === "P1" && BO > 0 && onHand > 0) {
      const fulfill = Math.min(onHand, BO);
      onHand -= fulfill;
      BO -= fulfill;
    }

    let waitFulfilledToday = 0;
    if (params.problem === "P2" && onHand > 0) {
      for (let r = 0; r <= WMAX; r++) {
        const need = waitBuckets[r];
        if (need <= 0) continue;
        if (onHand <= 0) break;
        const fulfill = Math.min(onHand, need);
        onHand -= fulfill;
        waitBuckets[r] -= fulfill;
        waitFulfilledToday += fulfill;
      }
      totalWaitFulfilledUnits += waitFulfilledToday;
    }

    const invInitial = onHand;

    const uDemand = rng();
    const demand =
      params.problem === "P1"
        ? sampleDiscrete(params.demandDistP1, uDemand)
        : sampleDiscrete(params.demandDistP2, uDemand);

    const sales = Math.min(onHand, demand);
    onHand -= sales;

    const shortage = Math.max(0, demand - sales);
    totalShortageUnits += shortage;

    let shortageAccum = 0;
    let costShortageToday = 0;

    let uWait: number | undefined;
    let waitDays: number | undefined;
    let waitAdded = 0;
    let lostNoWait = 0;

    if (params.problem === "P1") {
      if (shortage > 0) {
        BO += shortage;
        costShortageToday += shortage * params.costs.shortageCostP1;
      }
      shortageAccum = BO;
    } else {
      // P2
      shortageAccum = waitBuckets.reduce((a, b) => a + b, 0);

      if (shortage > 0) {

        uWait = rng();
        waitDays = sampleDiscrete(params.waitDistP2, uWait);

        if ((waitDays ?? 0) <= 0) {
          lostNoWait = shortage;
          totalLostUnits += shortage;
          costShortageToday += shortage * params.costs.shortageCostNoWaitP2;
        } else {
          const w = Math.min(WMAX, Math.max(1, waitDays));
          waitBuckets[w] += shortage;
          waitAdded = shortage;
          costShortageToday += shortage * params.costs.shortageCostWaitP2;
        }
      }

      shortageAccum = waitBuckets.reduce((a, b) => a + b, 0);
    }

    const invFinal = onHand;
    const invAvg = dailyInventoryAverage(invInitial, invFinal, demand, sales);

    const costHoldingToday = hDaily * invAvg;

    const onOrderQty = pendingOrders.reduce((acc, o) => acc + o.qty, 0);
    const currentBO =
      params.problem === "P1"
        ? BO
        : waitBuckets.reduce((acc, x) => acc + x, 0);

    const IP = invFinal + onOrderQty - currentBO;

    let orderPlaced = false;
    let uLeadTime: number | undefined;
    let leadTimeDays: number | undefined;
    let arrivalDay: number | null = null;
    let costOrderToday = 0;

    if (IP <= params.R) {
      orderPlaced = true;
      uLeadTime = rng();
      leadTimeDays =
        params.problem === "P1"
          ? sampleDiscrete(params.leadTimeDistP1, uLeadTime)
          : sampleDiscrete(params.leadTimeDistP2, uLeadTime);

      arrivalDay = day + (leadTimeDays ?? 0) + 1;
      pendingOrders.push({ arrivalDay, qty: params.q });

      costOrderToday = params.costs.orderCost;
      costOrder += costOrderToday;
    }

    const nextArrival =
      pendingOrders.length > 0
        ? Math.min(...pendingOrders.map((o) => o.arrivalDay))
        : null;

    costHolding += costHoldingToday;
    costShortage += costShortageToday;

    if (invFinal <= 0 && demand > 0) stockoutDays++;

    sumOnHandEnd += invFinal;

    const row: InventoryA14DayRow = {
      R: params.R,
      day,

      invInitial,
      uDemand,
      demand,

      invFinal,

      shortage,
      shortageAccum,

      orderPlaced,
      uLeadTime,
      leadTimeDays,
      arrivalDay: nextArrival,

      costOrder: costOrderToday,
      costShortage: costShortageToday,
      invAvg,

      ...(params.problem === "P2"
        ? {
            uWait,
            waitDays,
            expiredLost: expiredToday,
            waitAdded,
            waitFulfilled: waitFulfilledToday,
            lostNoWait,
          }
        : {}),
    };

    rows.push(row);
  }

  const totalCost = costOrder + costHolding + costShortage;
  const avgOnHand = sumOnHandEnd / params.days;

  const out: SimCoreResult = {
    rows,
    totalCost,
    costOrder,
    costHolding,
    costShortage,
    avgOnHand,
    stockoutDays,
    totalShortageUnits,
  };

  if (params.problem === "P2") {
    out.totalLostUnits = totalLostUnits;
    out.totalWaitFulfilledUnits = totalWaitFulfilledUnits;
  }

  return out;
}

function mean(xs: number[]) {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function std(xs: number[]) {
  if (xs.length <= 1) return 0;
  const m = mean(xs);
  const v = xs.reduce((acc, x) => acc + (x - m) * (x - m), 0) / (xs.length - 1);
  return Math.sqrt(v);
}

export function evaluatePolicy(params: InventoryA14Params): {
  aggregate: InventoryA14PolicyAggregate;
  exampleReplication: InventoryA14ReplicationResult;
} {
  const N = Math.max(1, Math.floor(params.replications));
  const baseSeed = params.seed >>> 0;

  const costs: number[] = [];
  const costOrderArr: number[] = [];
  const costHoldingArr: number[] = [];
  const costShortArr: number[] = [];
  const avgOnHandArr: number[] = [];
  const stockoutDaysArr: number[] = [];
  const totalShortArr: number[] = [];

  const lostArr: number[] = [];
  const waitFulfilledArr: number[] = [];

  let example: InventoryA14ReplicationResult | null = null;

  for (let r = 0; r < N; r++) {
    const seed = (baseSeed + 1000 * r + 17) >>> 0;
    const sim = simulateOneReplication(params, seed);

    costs.push(sim.totalCost);
    costOrderArr.push(sim.costOrder);
    costHoldingArr.push(sim.costHolding);
    costShortArr.push(sim.costShortage);

    avgOnHandArr.push(sim.avgOnHand);
    stockoutDaysArr.push(sim.stockoutDays);
    totalShortArr.push(sim.totalShortageUnits);

    if (params.problem === "P2") {
      lostArr.push(sim.totalLostUnits ?? 0);
      waitFulfilledArr.push(sim.totalWaitFulfilledUnits ?? 0);
    }

    if (r === 0) {
      example = {
        rows: sim.rows,
        totalCost: sim.totalCost,
        costOrder: sim.costOrder,
        costHolding: sim.costHolding,
        costShortage: sim.costShortage,
        avgOnHand: sim.avgOnHand,
        stockoutDays: sim.stockoutDays,
        totalShortageUnits: sim.totalShortageUnits,
        ...(params.problem === "P2"
          ? {
              totalLostUnits: sim.totalLostUnits,
              totalWaitFulfilledUnits: sim.totalWaitFulfilledUnits,
            }
          : {}),
      };
    }
  }

  if (!example) {
    example = {
      rows: [],
      totalCost: 0,
      costOrder: 0,
      costHolding: 0,
      costShortage: 0,
      avgOnHand: 0,
      stockoutDays: 0,
      totalShortageUnits: 0,
    };
  }

  const aggregate: InventoryA14PolicyAggregate = {
    q: params.q,
    R: params.R,
    replications: N,
    meanCost: mean(costs),
    stdCost: std(costs),

    meanCostOrder: mean(costOrderArr),
    meanCostHolding: mean(costHoldingArr),
    meanCostShortage: mean(costShortArr),

    meanAvgOnHand: mean(avgOnHandArr),
    meanStockoutDays: mean(stockoutDaysArr),
    meanTotalShortageUnits: mean(totalShortArr),
  };

  if (params.problem === "P2") {
    aggregate.meanTotalLostUnits = mean(lostArr);
    aggregate.meanTotalWaitFulfilledUnits = mean(waitFulfilledArr);
  }

  return { aggregate, exampleReplication: example };
}

type Candidate = { q: number; R: number; cost: number; agg: InventoryA14PolicyAggregate };

function makeParamsWithQR(base: InventoryA14Params, q: number, R: number): InventoryA14Params {
  return {
    ...base,
    q,
    R,
  };
}

function withinBounds(q: number, R: number): boolean {
  return q > 0 && R >= 0;
}

export function runHookeJeeves(
  baseParams: InventoryA14Params,
  settings: {
    q0: number;
    R0: number;
    stepQ: number;
    stepR: number;
    reduceFactor: number;
    minStepQ: number;
    minStepR: number;
    maxIter: number;
    qMin: number;
    qMax: number;
    RMin: number;
    RMax: number;
  }
): HookeJeevesResult {
  let stepQ = Math.max(1, Math.floor(settings.stepQ));
  let stepR = Math.max(1, Math.floor(settings.stepR));

  const reduceFactor = Math.max(0.1, Math.min(0.9, settings.reduceFactor));

  let baseQ = clampInt(settings.q0, settings.qMin, settings.qMax);
  let baseR = clampInt(settings.R0, settings.RMin, settings.RMax);

  const table: HookeJeevesRow[] = [];
  let iter = 0;

  let bestEval = evaluatePolicy(makeParamsWithQR(baseParams, baseQ, baseR));
  let best: Candidate = {
    q: baseQ,
    R: baseR,
    cost: bestEval.aggregate.meanCost,
    agg: bestEval.aggregate,
  };

  table.push({
    iter,
    q: baseQ,
    R: baseR,
    cost: best.cost,
    action: "BASE",
    stepQ,
    stepR,
    bestQ: best.q,
    bestR: best.R,
    bestCost: best.cost,
  });

  const tryCandidate = (q: number, R: number, action: string): Candidate | null => {
    q = clampInt(q, settings.qMin, settings.qMax);
    R = clampInt(R, settings.RMin, settings.RMax);

    if (!withinBounds(q, R)) return null;

    const { aggregate } = evaluatePolicy(makeParamsWithQR(baseParams, q, R));
    const cand: Candidate = { q, R, cost: aggregate.meanCost, agg: aggregate };

    table.push({
      iter,
      q,
      R,
      cost: cand.cost,
      action,
      stepQ,
      stepR,
      bestQ: best.q,
      bestR: best.R,
      bestCost: best.cost,
    });

    if (cand.cost < best.cost) {
      best = cand;
    }
    return cand;
  };

  const maxIter = Math.max(1, settings.maxIter);

  while (
    iter < maxIter &&
    (stepQ >= settings.minStepQ || stepR >= settings.minStepR)
  ) {
    iter++;

    let localBest: Candidate = { ...best };

    const candidates: (Candidate | null)[] = [
      tryCandidate(baseQ + stepQ, baseR, "Explora q +"),
      tryCandidate(baseQ - stepQ, baseR, "Explora q -"),
      tryCandidate(baseQ, baseR + stepR, "Explora R +"),
      tryCandidate(baseQ, baseR - stepR, "Explora R -"),
    ];

    const valid = candidates.filter((c): c is Candidate => c !== null);

    const baseAgg = evaluatePolicy(makeParamsWithQR(baseParams, baseQ, baseR)).aggregate;
    localBest = { q: baseQ, R: baseR, cost: baseAgg.meanCost, agg: baseAgg };

    for (const c of valid) {
      if (c.cost < localBest.cost) localBest = c;
    }

    if (localBest.cost < baseAgg.meanCost) {
      const newBaseQ = localBest.q;
      const newBaseR = localBest.R;

      const patternQ = clampInt(newBaseQ + (newBaseQ - baseQ), settings.qMin, settings.qMax);
      const patternR = clampInt(newBaseR + (newBaseR - baseR), settings.RMin, settings.RMax);

      baseQ = newBaseQ;
      baseR = newBaseR;
      const pat = tryCandidate(patternQ, patternR, "Patrón");
      if (pat && pat.cost < localBest.cost) {
        baseQ = pat.q;
        baseR = pat.R;
      }

      table.push({
        iter,
        q: baseQ,
        R: baseR,
        cost: evaluatePolicy(makeParamsWithQR(baseParams, baseQ, baseR)).aggregate.meanCost,
        action: "Base actualizada",
        stepQ,
        stepR,
        bestQ: best.q,
        bestR: best.R,
        bestCost: best.cost,
      });
    } else {

      stepQ = Math.max(1, Math.floor(stepQ * reduceFactor));
      stepR = Math.max(1, Math.floor(stepR * reduceFactor));

      table.push({
        iter,
        q: baseQ,
        R: baseR,
        cost: baseAgg.meanCost,
        action: "Reduce paso",
        stepQ,
        stepR,
        bestQ: best.q,
        bestR: best.R,
        bestCost: best.cost,
      });

      if (stepQ < settings.minStepQ && stepR < settings.minStepR) break;
    }
  }

  return {
    best: best.agg,
    table,
  };
}
