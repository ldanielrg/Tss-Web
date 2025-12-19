import type { TruckQueueCost, TruckQueueParams, TruckQueueSummary } from '../types/truckQueueSimulation';

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
  // floor evita que 07:29:59 “suba” a 510 por redondeo
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

/**
 * Transformada inversa discreta, fiel al libro:
 * - intervalos del tipo [Fprev, F)
 * - por eso usamos u < acc (no <=)
 */
function invDiscrete(u: number, values: number[], probs: number[]) {
  let acc = 0;
  for (let i = 0; i < values.length; i++) {
    acc += probs[i];
    if (u < acc) return values[i];
  }
  return values[values.length - 1];
}

// Camiones esperando al abrir
const INIT_TRUCKS = [0, 1, 2, 3];
const INIT_P = [0.5, 0.25, 0.15, 0.1];

// Intervalo de llegada (min)
const IA_T = [20, 25, 30, 35, 40, 45, 50, 55, 60];
const IA_P = [0.02, 0.08, 0.12, 0.25, 0.20, 0.15, 0.10, 0.05, 0.03];

// Servicio por equipo (min)
const S3_T = [20, 25, 30, 35, 40, 45, 50, 55, 60];
const S3_P = [0.05, 0.10, 0.20, 0.25, 0.12, 0.10, 0.08, 0.06, 0.04];

const S4_T = [15, 20, 25, 30, 35, 40, 45, 50, 55];
const S4_P = [0.05, 0.15, 0.20, 0.20, 0.15, 0.12, 0.08, 0.04, 0.01];

const S5_T = [10, 15, 20, 25, 30, 35, 40, 45, 50];
const S5_P = [0.10, 0.18, 0.22, 0.18, 0.10, 0.08, 0.06, 0.05, 0.03];

const S6_T = [5, 10, 15, 20, 25, 30, 35, 40, 45];
const S6_P = [0.12, 0.15, 0.26, 0.15, 0.12, 0.08, 0.06, 0.04, 0.02];

function sampleService(u: number, team: number) {
  switch (team) {
    case 3: return invDiscrete(u, S3_T, S3_P);
    case 4: return invDiscrete(u, S4_T, S4_P);
    case 5: return invDiscrete(u, S5_T, S5_P);
    case 6: return invDiscrete(u, S6_T, S6_P);
    default: return invDiscrete(u, S3_T, S3_P);
  }
}

// Simulación de una noche
function simulateOneNight(params: TruckQueueParams, team: number, seed: number): TruckQueueCost {
  const rnd = makeLCG(seed);

  const startStr = params.horaInicio;

  const limitArrivals = minutesFromStart(params.limiteLlegadas, startStr);
  const breakStart = minutesFromStart(params.horaBreak, startStr);
  const breakDur = durationToMinutes(params.duracionBreak);

  const jornadaEnd = Math.round(params.duracionJornadaHoras * 60);

  // --- Generar llegadas (incluye cola inicial) ---
  const initN = invDiscrete(rnd(), INIT_TRUCKS, INIT_P);

  const arrivals: number[] = [];
  for (let i = 0; i < initN; i++) arrivals.push(0);

  let lastArrival = 0;
  while (true) {
    const ia = invDiscrete(rnd(), IA_T, IA_P);
    const next = lastArrival + ia;
    if (next > limitArrivals) break;
    arrivals.push(next);
    lastArrival = next;
  }

  // --- Servidor / break ---
  let serverFreeAt = 0;      // fin del último servicio o fin break (si aplica)
  let breakTaken = false;    // break ya aplicado

  let lastFinish = 0;

  let totalWait = 0;
  let served = 0;

  for (const arrival of arrivals) {
    // momento “tentativo” de inicio
    let start = Math.max(serverFreeAt, arrival);

    // aplicar break ANTES de iniciar un servicio, si corresponde
    if (!breakTaken && start >= breakStart) {
      // si el servidor estaba libre en breakStart, el break arranca en breakStart
      // si estaba ocupado (serverFreeAt > breakStart), arranca al terminar ese servicio (serverFreeAt)
      const breakBegin = serverFreeAt <= breakStart ? breakStart : serverFreeAt;
      serverFreeAt = breakBegin + breakDur;
      breakTaken = true;

      // recalcular inicio real
      start = Math.max(serverFreeAt, arrival);
    }

    const service = sampleService(rnd(), team);
    const finish = start + service;

    totalWait += Math.max(0, start - arrival);
    served++;

    lastFinish = Math.max(lastFinish, finish);
    serverFreeAt = finish;
  }

  // --- Métricas de tiempo (fiel al libro) ---
  // Operación del almacén: desde 11:00 (t=0) como mínimo hasta el fin de la jornada normal,
  // y si termina después, hasta lastFinish.
  const operationMin = Math.max(jornadaEnd, lastFinish);

  // Tiempo extra: solo si termina después de la jornada
  const overtimeMin = Math.max(0, lastFinish - jornadaEnd);

  // --- Costos ---
  const salarioNormal = team * params.duracionJornadaHoras * params.salarioHora;
  const salarioExtra = team * (overtimeMin / 60) * params.salarioExtraHora;
  const costoEspera = (totalWait / 60) * params.costoEsperaCamionHora;
  const costoOperacion = (operationMin / 60) * params.costoOperacionAlmacenHora;

  const costoTotal = salarioNormal + salarioExtra + costoEspera + costoOperacion;

  return {
    salarioNormal,
    salarioExtra,
    costoEspera,
    costoOperacion,
    costoTotal,
    camionesServidos: served,
    esperaTotalMin: totalWait,
    tiempoExtraMin: overtimeMin,
    operacionMin: operationMin,
  };
}

// Simulación de muchas noches y promedio
function simulateMany(params: TruckQueueParams, team: number, n: number, seedBase: number): TruckQueueCost {
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
    const r = simulateOneNight(params, team, seedBase + i + team * 1000);
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

  return {
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
}

export function simulateTruckQueue(params: TruckQueueParams): TruckQueueSummary {
  const n = Math.max(1, Math.floor(params.nTurnos || 1));
  const seedBase = (typeof params.seed === 'number' ? params.seed : Date.now()) >>> 0;

  const teams = params.personas === 'AUTO' ? [3, 4, 5, 6] : [params.personas];
  const porEquipo: Record<number, TruckQueueCost> = {};

  for (const t of teams) {
    porEquipo[t] = simulateMany(params, t, n, seedBase);
  }

  let best = teams[0];
  for (const t of teams) {
    if (porEquipo[t].costoTotal < porEquipo[best].costoTotal) best = t;
  }

  return { nTurnos: n, porEquipo, equipoOptimo: best };
}
