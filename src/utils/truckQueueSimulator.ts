import type {
  TruckQueueCost,
  TruckQueueParams,
  TruckQueueSummary,
  TruckTeamSize,
  TruckQueueNightDetail,
  TruckQueueTraceRow,
  TruckQueueTurnStats,
} from '../types/truckQueueSimulation';

function parseHHMMSS(s: string): { h: number; m: number; sec: number } {
  const parts = s.trim().split(':').map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const sec = parts[2] ?? 0;
  return { h, m, sec };
}

function minutesFromStart(time: string, start: string): number {
  const t = parseHHMMSS(time);
  const s = parseHHMMSS(start);

  const tMin = t.h * 60 + t.m + t.sec / 60;
  const sMin = s.h * 60 + s.m + s.sec / 60;

  const adj = tMin < sMin ? tMin + 24 * 60 : tMin;
  return Math.floor(adj - sMin);
}

function durationToMinutes(dur: string): number {
  const t = parseHHMMSS(dur);
  return Math.floor(t.h * 60 + t.m + t.sec / 60);
}

function makeLCG(seed: number) {
  let x = seed >>> 0;
  return () => {
    x = (1103515245 * x + 12345) >>> 0;
    return x / 2 ** 32; // [0,1)
  };
}
 //Transformada inversa 
export function invDiscrete(u: number, values: number[], probs: number[]) {
  let acc = 0;
  for (let i = 0; i < values.length; i++) {
    acc += probs[i];
    if (u < acc) return values[i];
  }
  return values[values.length - 1];
}

export type DiscreteDist = {
  label: string;
  unit: 'min' | 'camiones';
  values: number[];
  probs: number[];
};

export type DistRow = {
  i: number;
  x: number;
  p: number;
  F: number;
  interval: string;
};

export function buildDistRows(dist: DiscreteDist, decimals = 2): DistRow[] {
  const rows: DistRow[] = [];
  let acc = 0;
  let prev = 0;

  for (let i = 0; i < dist.values.length; i++) {
    acc += dist.probs[i];

    rows.push({
      i: i + 1,
      x: dist.values[i],
      p: dist.probs[i],
      F: acc,
      interval: `${prev.toFixed(decimals)} ≤ R < ${acc.toFixed(decimals)}`,
    });

    prev = acc;
  }
  return rows;
}

export const INIT_DIST: DiscreteDist = {
  label: 'Número de camiones esperando al abrir (N0)',
  unit: 'camiones',
  values: [0, 1, 2, 3],
  probs: [0.5, 0.25, 0.15, 0.1],
};

export const IA_DIST: DiscreteDist = {
  label: 'Tiempo entre llegadas (ΔA)',
  unit: 'min',
  values: [20, 25, 30, 35, 40, 45, 50, 55, 60],
  probs: [0.02, 0.08, 0.12, 0.25, 0.2, 0.15, 0.1, 0.05, 0.03],
};

export const SERVICE_DIST: Record<TruckTeamSize, DiscreteDist> = {
  3: {
    label: 'Tiempo de servicio (equipo 3)',
    unit: 'min',
    values: [20, 25, 30, 35, 40, 45, 50, 55, 60],
    probs: [0.05, 0.1, 0.2, 0.25, 0.12, 0.1, 0.08, 0.06, 0.04],
  },
  4: {
    label: 'Tiempo de servicio (equipo 4)',
    unit: 'min',
    values: [15, 20, 25, 30, 35, 40, 45, 50, 55],
    probs: [0.05, 0.15, 0.2, 0.2, 0.15, 0.12, 0.08, 0.04, 0.01],
  },
  5: {
    label: 'Tiempo de servicio (equipo 5)',
    unit: 'min',
    values: [10, 15, 20, 25, 30, 35, 40, 45, 50],
    probs: [0.1, 0.18, 0.22, 0.18, 0.1, 0.08, 0.06, 0.05, 0.03],
  },
  6: {
    label: 'Tiempo de servicio (equipo 6)',
    unit: 'min',
    values: [5, 10, 15, 20, 25, 30, 35, 40, 45],
    probs: [0.12, 0.15, 0.26, 0.15, 0.12, 0.08, 0.06, 0.04, 0.02],
  },
};

function sampleService(u: number, team: TruckTeamSize) {
  const dist = SERVICE_DIST[team];
  return invDiscrete(u, dist.values, dist.probs);
}

function computeCosts(params: TruckQueueParams, team: number, totalWaitMin: number, lastFinishMin: number): TruckQueueCost {
  const jornadaEnd = Math.round(params.duracionJornadaHoras * 60);

  const operationMin = Math.max(jornadaEnd, lastFinishMin);
  const overtimeMin = Math.max(0, lastFinishMin - jornadaEnd);

  const salarioNormal = team * params.duracionJornadaHoras * params.salarioHora;
  const salarioExtra = team * (overtimeMin / 60) * params.salarioExtraHora;
  const costoEspera = (totalWaitMin / 60) * params.costoEsperaCamionHora;
  const costoOperacion = (operationMin / 60) * params.costoOperacionAlmacenHora;

  const costoTotal = salarioNormal + salarioExtra + costoEspera + costoOperacion;

  return {
    salarioNormal,
    salarioExtra,
    costoEspera,
    costoOperacion,
    costoTotal,
    camionesServidos: 0,
    esperaTotalMin: totalWaitMin,
    tiempoExtraMin: overtimeMin,
    operacionMin: operationMin,
  };
}

//Noche individual
export function simulateTruckQueueOneNightDetail(
  params: TruckQueueParams,
  team: TruckTeamSize,
  seed: number
): TruckQueueNightDetail {
  const rnd = makeLCG(seed >>> 0);

  const startStr = params.horaInicio;
  const limitArrivals = minutesFromStart(params.limiteLlegadas, startStr);
  const breakStart = minutesFromStart(params.horaBreak, startStr);
  const breakDur = durationToMinutes(params.duracionBreak);

  const initN = invDiscrete(rnd(), INIT_DIST.values, INIT_DIST.probs);

  type ArrivalRec = { llegada: number; rIA: number | null; ia: number | null };
  const arrivals: ArrivalRec[] = [];

  for (let i = 0; i < initN; i++) {
    arrivals.push({ llegada: 0, rIA: null, ia: null });
  }

  let lastArrival = 0;
  while (true) {
    const u = rnd();
    const ia = invDiscrete(u, IA_DIST.values, IA_DIST.probs);
    const next = lastArrival + ia;
    if (next > limitArrivals) break;
    arrivals.push({ llegada: next, rIA: u, ia });
    lastArrival = next;
  }

  // Atender
  let serverFreeAt = 0;
  let breakTaken = false;

  let breakBegin: number | null = null;
  let breakEnd: number | null = null;

  let totalWait = 0;
  let lastFinish = 0;

  const trace: TruckQueueTraceRow[] = [];

  for (let idx = 0; idx < arrivals.length; idx++) {
    const rec = arrivals[idx];

    let start = Math.max(serverFreeAt, rec.llegada);
    let breakAppliedHere = false;

    // Break antes de iniciar servicio si corresponde
    if (!breakTaken && start >= breakStart) {
      const begin = serverFreeAt <= breakStart ? breakStart : serverFreeAt;
      const end = begin + breakDur;

      breakBegin = begin;
      breakEnd = end;

      serverFreeAt = end;
      breakTaken = true;

      start = Math.max(serverFreeAt, rec.llegada);
      breakAppliedHere = true;
    }

    const uST = rnd();
    const st = sampleService(uST, team);
    const finish = start + st;

    const wait = Math.max(0, start - rec.llegada);

    totalWait += wait;
    lastFinish = Math.max(lastFinish, finish);
    serverFreeAt = finish;

    trace.push({
      i: idx + 1,
      rIA: rec.rIA,
      iaMin: rec.ia,
      llegadaMin: rec.llegada,
      rST: uST,
      stMin: st,
      inicioMin: start,
      finMin: finish,
      esperaMin: wait,
      breakAplicadoAntesDeEste: breakAppliedHere,
    });
  }

  const costBase = computeCosts(params, team, totalWait, lastFinish);
  const cost: TruckQueueCost = { ...costBase, camionesServidos: trace.length };

  return { team, cost, trace, breakBeginMin: breakBegin, breakEndMin: breakEnd };
}

// Múltiples noches y equipos
function mean(xs: number[]) {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function sampleStd(xs: number[]) {
  const n = xs.length;
  if (n <= 1) return 0;
  const m = mean(xs);
  let s2 = 0;
  for (const x of xs) s2 += (x - m) * (x - m);
  return Math.sqrt(s2 / (n - 1));
}

function simulateManyWithTurns(params: TruckQueueParams, team: TruckTeamSize, n: number, seedBase: number) {
  const turns: TruckQueueCost[] = [];

  let acc: TruckQueueCost = {
    salarioNormal: 0,
    salarioExtra: 0,
    costoEspera: 0,
    costoOperacion: 0,
    costoTotal: 0,
    camionesServidos: 0,
    esperaTotalMin: 0,
    tiempoExtraMin: 0,
    operacionMin: 0,
  };

  for (let i = 0; i < n; i++) {
    const detail = simulateTruckQueueOneNightDetail(params, team, seedBase + i + team * 1000);
    const r = detail.cost;

    turns.push(r);

    acc.salarioNormal += r.salarioNormal;
    acc.salarioExtra += r.salarioExtra;
    acc.costoEspera += r.costoEspera;
    acc.costoOperacion += r.costoOperacion;
    acc.costoTotal += r.costoTotal;

    acc.camionesServidos += r.camionesServidos;
    acc.esperaTotalMin += r.esperaTotalMin;
    acc.tiempoExtraMin += r.tiempoExtraMin;
    acc.operacionMin += r.operacionMin;
  }

  const div = (x: number) => x / n;

  const avg: TruckQueueCost = {
    salarioNormal: div(acc.salarioNormal),
    salarioExtra: div(acc.salarioExtra),
    costoEspera: div(acc.costoEspera),
    costoOperacion: div(acc.costoOperacion),
    costoTotal: div(acc.costoTotal),
    camionesServidos: div(acc.camionesServidos),
    esperaTotalMin: div(acc.esperaTotalMin),
    tiempoExtraMin: div(acc.tiempoExtraMin),
    operacionMin: div(acc.operacionMin),
  };

  const totals = turns.map((t) => t.costoTotal);
  const std = sampleStd(totals);

  const z = n >= 30 ? 1.96 : 2.0;
  const half = n > 0 ? z * (std / Math.sqrt(n)) : 0;

  const stats: TruckQueueTurnStats = {
    stdCostoTotal: std,
    ci95Low: avg.costoTotal - half,
    ci95High: avg.costoTotal + half,
  };

  return { avg, turns, stats };
}

export function simulateTruckQueue(params: TruckQueueParams): TruckQueueSummary {
  const n = Math.max(1, Math.floor(params.nTurnos || 1));
  const seedBase = (typeof params.seed === 'number' ? params.seed : Date.now()) >>> 0;

  const teams: TruckTeamSize[] = params.personas === 'AUTO' ? [3, 4, 5, 6] : [params.personas];

  const porEquipo: Record<number, TruckQueueCost> = {};
  const porTurno: Record<number, TruckQueueCost[]> = {};
  const stats: Record<number, TruckQueueTurnStats> = {};

  for (const t of teams) {
    const r = simulateManyWithTurns(params, t, n, seedBase);
    porEquipo[t] = r.avg;
    porTurno[t] = r.turns;
    stats[t] = r.stats;
  }

  let best = teams[0];
  for (const t of teams) {
    if (porEquipo[t].costoTotal < porEquipo[best].costoTotal) best = t;
  }

  return { nTurnos: n, porEquipo, porTurno, stats, equipoOptimo: best };
}
