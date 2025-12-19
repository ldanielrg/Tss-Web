// src/utils/machineMechanicSimulator.ts
// Problema 1: Asignación de máquinas por mecánico
//
// Distribuciones (del PDF):
// - Tiempo entre descomposturas (h): [6,8],[8,10],[10,12],[12,14],[16,18],[18,20] con sus probabilidades
// - Tiempo de reparación (h): [2,4],[4,6],[6,8],[8,10],[10,12] con sus probabilidades
// Costos:
// - Costo máquina ociosa: $500 por hora
// - Salario mecánico: $50 por hora
// Objetivo sugerido: minimizar costo ocioso + (salario/N)

export type MachineMechanicParams = {
  minMachines: number; // N min
  maxMachines: number; // N max
  simHours: number; // horizonte (ej. 10000)
  replications: number; // promediar
  idleCostPerHour: number; // 500
  wagePerHour: number; // 50
};

export type MachineMechanicRow = {
  N: number;
  T: number;

  // acumulados/promedios (por réplica)
  idleMachineHours: number; // suma de horas ociosas (máquina-hora)
  avgDownMachines: number; // idleMachineHours / T
  idleCostPerHourSystem: number; // 500 * (idleMachineHours/T)
  wagePerHourPerMachine: number; // 50 / N
  objectiveCost: number; // idleCostPerHourSystem + wagePerHourPerMachine
};

export type MachineMechanicOutput = {
  kind: 'machine-mechanic';
  metrics: Record<string, string | number>;
  columns: string[];
  rows: (string | number)[][];
  chart: {
    labels: string[];
    objectiveCost: number[];
    idleCostPerHourSystem: number[];
    avgDownMachines: number[];
  };
  raw: MachineMechanicRow[];
};

type IntervalProb = { a: number; b: number; p: number };

const FAIL_INTERVALS: IntervalProb[] = [
  { a: 6, b: 8, p: 0.10 },
  { a: 8, b: 10, p: 0.15 },
  { a: 10, b: 12, p: 0.24 },
  { a: 12, b: 14, p: 0.26 },
  { a: 16, b: 18, p: 0.18 },
  { a: 18, b: 20, p: 0.07 },
];

const REPAIR_INTERVALS: IntervalProb[] = [
  { a: 2, b: 4, p: 0.15 },
  { a: 4, b: 6, p: 0.25 },
  { a: 6, b: 8, p: 0.30 },
  { a: 8, b: 10, p: 0.20 },
  { a: 10, b: 12, p: 0.10 },
];

const clamp01 = (u: number) => (u <= 0 ? Number.MIN_VALUE : u >= 1 ? 1 - Number.EPSILON : u);

function pickInterval(intervals: IntervalProb[]): { a: number; b: number } {
  const u = clamp01(Math.random());
  let acc = 0;
  for (const it of intervals) {
    acc += it.p;
    if (u <= acc) return { a: it.a, b: it.b };
  }
  // fallback por redondeos
  const last = intervals[intervals.length - 1];
  return { a: last.a, b: last.b };
}

function uniform(a: number, b: number) {
  const u = clamp01(Math.random());
  return a + (b - a) * u;
}

export function generateFailureTimeHours(): number {
  const { a, b } = pickInterval(FAIL_INTERVALS);
  return uniform(a, b);
}

export function generateRepairTimeHours(): number {
  const { a, b } = pickInterval(REPAIR_INTERVALS);
  return uniform(a, b);
}

function simulateOnce(N: number, T: number) {
  // Estado por máquina
  const nextFailure: number[] = new Array(N).fill(0);
  const downStart: (number | null)[] = new Array(N).fill(null);

  // Cola FIFO de máquinas descompuestas esperando mecánico
  const queue: number[] = [];

  // Mecánico
  let mechanicBusy = false;
  let currentRepairMachine: number | null = null;
  let repairDoneTime = Infinity;

  // reloj
  let t = 0;

  // inicializar fallas
  for (let i = 0; i < N; i++) {
    nextFailure[i] = generateFailureTimeHours();
  }

  let idleMachineHours = 0;

  const getNextFailureEvent = () => {
    let minT = Infinity;
    let idx = -1;
    for (let i = 0; i < N; i++) {
      // si está operando (no down) y tiene falla programada
      if (downStart[i] === null && nextFailure[i] < minT) {
        minT = nextFailure[i];
        idx = i;
      }
    }
    return { time: minT, machine: idx };
  };

  const tryStartRepair = () => {
    if (mechanicBusy) return;
    if (queue.length === 0) return;
    const m = queue.shift()!;
    mechanicBusy = true;
    currentRepairMachine = m;
    const rep = generateRepairTimeHours();
    repairDoneTime = t + rep;
  };

  while (true) {
    const nf = getNextFailureEvent();
    const nextEventTime = Math.min(nf.time, repairDoneTime);

    if (nextEventTime > T) break;

    t = nextEventTime;

    if (nf.time <= repairDoneTime) {
      // Evento: máquina falla
      const m = nf.machine;
      if (m >= 0) {
        downStart[m] = t; // empieza downtime
        // se elimina su falla programada (hasta que se repare)
        nextFailure[m] = Infinity;
        queue.push(m);
        // si mecánico libre, iniciar
        tryStartRepair();
      }
    } else {
      // Evento: termina reparación
      const m = currentRepairMachine!;
      // acumular downtime
      const start = downStart[m];
      if (start !== null) idleMachineHours += t - start;

      // vuelve a operar
      downStart[m] = null;
      mechanicBusy = false;
      currentRepairMachine = null;
      repairDoneTime = Infinity;

      // programar próxima falla
      nextFailure[m] = t + generateFailureTimeHours();

      // tomar siguiente de cola si hay
      tryStartRepair();
    }
  }

  // cerrar downtime de máquinas que sigan caídas al final
  for (let i = 0; i < N; i++) {
    if (downStart[i] !== null) {
      idleMachineHours += T - downStart[i]!;
    }
  }

  return { idleMachineHours };
}

export function runMachineMechanicSizing(p: MachineMechanicParams): MachineMechanicOutput {
  const minN = Math.max(1, Math.floor(p.minMachines));
  const maxN = Math.max(minN, Math.floor(p.maxMachines));
  const T = Math.max(1, p.simHours);
  const reps = Math.max(1, Math.floor(p.replications));

  const rows: MachineMechanicRow[] = [];

  for (let N = minN; N <= maxN; N++) {
    let sumIdle = 0;

    for (let r = 0; r < reps; r++) {
      sumIdle += simulateOnce(N, T).idleMachineHours;
    }

    const idleMachineHours = sumIdle / reps;
    const avgDownMachines = idleMachineHours / T;

    const idleCostPerHourSystem = p.idleCostPerHour * avgDownMachines;
    const wagePerHourPerMachine = p.wagePerHour / N;
    const objectiveCost = idleCostPerHourSystem + wagePerHourPerMachine;

    rows.push({
      N,
      T,
      idleMachineHours,
      avgDownMachines,
      idleCostPerHourSystem,
      wagePerHourPerMachine,
      objectiveCost,
    });
  }

  const best = rows.reduce((a, b) => (b.objectiveCost < a.objectiveCost ? b : a), rows[0]);

  const columns = [
    'N (máquinas/mecánico)',
    'Ocio total (máquina-h)',
    'Prom. máquinas caídas',
    'Costo ocio ($/h)',
    'Salario/N ($/h)',
    'Costo objetivo ($/h)',
  ];

  const outRows = rows.map((r) => [
    r.N,
    Number(r.idleMachineHours.toFixed(2)),
    Number(r.avgDownMachines.toFixed(3)),
    Number(r.idleCostPerHourSystem.toFixed(2)),
    Number(r.wagePerHourPerMachine.toFixed(2)),
    Number(r.objectiveCost.toFixed(2)),
  ]);

  const chart = {
    labels: rows.map((r) => String(r.N)),
    objectiveCost: rows.map((r) => r.objectiveCost),
    idleCostPerHourSystem: rows.map((r) => r.idleCostPerHourSystem),
    avgDownMachines: rows.map((r) => r.avgDownMachines),
  };

  const metrics: Record<string, string | number> = {
    'Horizonte simulado (h)': T,
    'Réplicas (promedio)': reps,
    'Costo ociosa ($/h por máquina)': p.idleCostPerHour,
    'Salario mecánico ($/h)': p.wagePerHour,
    'Mejor N (máquinas por mecánico)': best.N,
    'Costo objetivo mínimo ($/h)': Number(best.objectiveCost.toFixed(2)),
    'Costo ocio en mejor N ($/h)': Number(best.idleCostPerHourSystem.toFixed(2)),
    'Prom. máquinas caídas (mejor N)': Number(best.avgDownMachines.toFixed(3)),
  };

  return {
    kind: 'machine-mechanic',
    metrics,
    columns,
    rows: outRows,
    chart,
    raw: rows,
  };
}
