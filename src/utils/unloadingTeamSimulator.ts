// src/utils/unloadingTeamSimulator.ts
// Problema 2 (Parte 2): Tamaño óptimo de equipo de descarga (turno nocturno)
//
// Modelo (según enunciado):
// - Llegadas: Poisson con λ = 2 camiones/hora (interarribo ~ Exponencial)
// - Servicio: Uniforme (min,max) depende del tamaño del equipo (3..6)
// - Costos: $25/h por trabajador (turno de 8h), y $50/h por camión esperando

export type Workers = 3 | 4 | 5 | 6;

export type UnloadingTeamParams = {
  lambdaPerHour: number; // 2
  shifts: number; // ej 100
  shiftHours: number; // 8
  wagePerHour: number; // 25
  waitingCostPerHour: number; // 50
  workersOptions: Workers[]; // [3,4,5,6]
  replications: number; // para promediar y reducir ruido
};

export type UnloadingTeamRow = {
  workers: Workers;
  totalTimeHours: number;

  // Métricas base (promediadas por réplica)
  arrivals: number;
  avgWaitHours: number; // Wq estimado en horizonte
  avgWaitMin: number;
  avgQueueLength: number; // Lq
  utilization: number; // rho (aprox)

  // Costos
  laborCost: number;
  waitingCost: number;
  totalCost: number;
};

export type UnloadingTeamOutput = {
  kind: 'unloading-team';
  metrics: Record<string, string | number>;
  columns: string[];
  rows: (string | number)[][];
  chart: {
    labels: string[];
    totalCost: number[];
    laborCost: number[];
    waitingCost: number[];
    avgWaitMin: number[];
  };
  raw: UnloadingTeamRow[];
};

const clamp01 = (u: number) => (u <= 0 ? Number.MIN_VALUE : u >= 1 ? 1 - Number.EPSILON : u);

export function expInterarrivalHours(lambdaPerHour: number): number {
  // T = -ln(U)/λ
  const u = clamp01(Math.random());
  return -Math.log(u) / lambdaPerHour;
}

export function uniformHours(aHours: number, bHours: number): number {
  const u = clamp01(Math.random());
  return aHours + (bHours - aHours) * u;
}

export function serviceRangeMinutes(workers: Workers): { min: number; max: number } {
  // Según enunciado (minutos):
  // 3 -> U(20,30)
  // 4 -> U(15,25)
  // 5 -> U(10,20)
  // 6 -> U(5,15)
  switch (workers) {
    case 3:
      return { min: 20, max: 30 };
    case 4:
      return { min: 15, max: 25 };
    case 5:
      return { min: 10, max: 20 };
    case 6:
      return { min: 5, max: 15 };
  }
}

export function generateServiceTimeHours(workers: Workers): number {
  const r = serviceRangeMinutes(workers);
  const a = r.min / 60;
  const b = r.max / 60;
  return uniformHours(a, b);
}

function simulateSingleServerQueueOnce(params: UnloadingTeamParams, workers: Workers) {
  const totalTime = params.shiftHours * params.shifts;

  let t = 0;
  let nextArrival = expInterarrivalHours(params.lambdaPerHour);
  let nextDeparture = Infinity; // servidor libre si Infinity

  const queue: number[] = []; // guarda tiempos de llegada (FIFO)

  // Áreas para métricas/costos dentro del horizonte [0, totalTime]
  let queueArea = 0; // ∫ Q(t) dt  (Q = camiones esperando)
  let busyArea = 0; // ∫ I(busy) dt

  let arrivals = 0;

  const isBusy = () => nextDeparture < Infinity;

  while (true) {
    const nextEvent = Math.min(nextArrival, nextDeparture);
    if (nextEvent > totalTime) break;

    const dt = nextEvent - t;
    queueArea += queue.length * dt;
    busyArea += (isBusy() ? 1 : 0) * dt;

    t = nextEvent;

    if (nextArrival <= nextDeparture) {
      // Evento: llegada
      arrivals += 1;

      if (!isBusy()) {
        // inicia servicio inmediato
        const s = generateServiceTimeHours(workers);
        nextDeparture = t + s;
      } else {
        // entra a cola
        queue.push(t);
      }

      nextArrival = t + expInterarrivalHours(params.lambdaPerHour);
    } else {
      // Evento: fin de servicio
      if (queue.length > 0) {
        // toma siguiente
        queue.shift();
        const s = generateServiceTimeHours(workers);
        nextDeparture = t + s;
      } else {
        nextDeparture = Infinity;
      }
    }
  }

  // Cierra áreas hasta el final del horizonte
  const dtEnd = totalTime - t;
  if (dtEnd > 0) {
    queueArea += queue.length * dtEnd;
    busyArea += (isBusy() ? 1 : 0) * dtEnd;
  }

  const avgWaitHours = arrivals > 0 ? queueArea / arrivals : 0; // “promedio” en el horizonte
  const avgWaitMin = avgWaitHours * 60;
  const avgQueueLength = totalTime > 0 ? queueArea / totalTime : 0;
  const utilization = totalTime > 0 ? busyArea / totalTime : 0;

  const laborCost = workers * params.wagePerHour * params.shiftHours * params.shifts;
  const waitingCost = queueArea * params.waitingCostPerHour; // $/h * (camión-hora)
  const totalCost = laborCost + waitingCost;

  return {
    workers,
    totalTimeHours: totalTime,
    arrivals,
    avgWaitHours,
    avgWaitMin,
    avgQueueLength,
    utilization,
    laborCost,
    waitingCost,
    totalCost,
  };
}

export function runUnloadingTeamSizing(input: UnloadingTeamParams): UnloadingTeamOutput {
  const params: UnloadingTeamParams = {
    ...input,
    workersOptions: (input.workersOptions?.length ? input.workersOptions : [3, 4, 5, 6]).slice() as Workers[],
  };

  const reps = Math.max(1, Math.floor(params.replications));

  const rows: UnloadingTeamRow[] = params.workersOptions.map((w) => {
    let sumArr = 0;
    let sumWqH = 0;
    let sumWqM = 0;
    let sumLq = 0;
    let sumRho = 0;
    let sumWaitCost = 0;
    let sumTotalCost = 0;

    // laborCost no depende de la aleatoriedad (mismo turno)
    const laborCost = w * params.wagePerHour * params.shiftHours * params.shifts;
    const totalTimeHours = params.shiftHours * params.shifts;

    for (let r = 0; r < reps; r++) {
      const one = simulateSingleServerQueueOnce(params, w);
      sumArr += one.arrivals;
      sumWqH += one.avgWaitHours;
      sumWqM += one.avgWaitMin;
      sumLq += one.avgQueueLength;
      sumRho += one.utilization;
      sumWaitCost += one.waitingCost;
      sumTotalCost += one.totalCost;
    }

    const avgArrivals = sumArr / reps;

    const meanWaitingCost = sumWaitCost / reps;
    const meanTotalCost = sumTotalCost / reps;

    return {
      workers: w,
      totalTimeHours,
      arrivals: Math.round(avgArrivals),
      avgWaitHours: sumWqH / reps,
      avgWaitMin: sumWqM / reps,
      avgQueueLength: sumLq / reps,
      utilization: sumRho / reps,
      laborCost,
      waitingCost: meanWaitingCost,
      totalCost: meanTotalCost,
    };
  });

  const best = rows.reduce((a, b) => (b.totalCost < a.totalCost ? b : a), rows[0]);

  const columns = [
    'Trabajadores',
    'Llegadas (aprox)',
    'Wq prom (min)',
    'Lq prom',
    'ρ (utilización)',
    'Costo espera ($)',
    'Costo mano de obra ($)',
    'Costo total ($)',
  ];

  const outRows: (string | number)[][] = rows.map((r) => [
    r.workers,
    r.arrivals,
    Number(r.avgWaitMin.toFixed(2)),
    Number(r.avgQueueLength.toFixed(3)),
    Number(r.utilization.toFixed(3)),
    Number(r.waitingCost.toFixed(2)),
    Number(r.laborCost.toFixed(2)),
    Number(r.totalCost.toFixed(2)),
  ]);

  const labels = rows.map((r) => String(r.workers));
  const chart = {
    labels,
    totalCost: rows.map((r) => r.totalCost),
    laborCost: rows.map((r) => r.laborCost),
    waitingCost: rows.map((r) => r.waitingCost),
    avgWaitMin: rows.map((r) => r.avgWaitMin),
  };

  const metrics: Record<string, string | number> = {
    'λ (camiones/h)': params.lambdaPerHour,
    'Turnos simulados': params.shifts,
    'Horas por turno': params.shiftHours,
    'Réplicas (promedio)': reps,
    'Costo espera ($/h)': params.waitingCostPerHour,
    'Salario ($/h por trabajador)': params.wagePerHour,
    'Mejor tamaño del equipo (trabajadores)': best.workers,
    'Costo total mínimo ($)': Number(best.totalCost.toFixed(2)),
    'Wq del mejor (min)': Number(best.avgWaitMin.toFixed(2)),
  };

  return {
    kind: 'unloading-team',
    metrics,
    columns,
    rows: outRows,
    chart,
    raw: rows,
  };
}
