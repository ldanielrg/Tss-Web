import type {
  InventoryGridPoint,
  InventoryGridSearchParams,
  InventorySimCosts,
  InventorySimMonthRow,
  InventorySimParams,
  InventorySimRunResult,
  InventorySimulationSummary,
} from '../types/inventorySimulation';

//generador de numeros aleatorios
function makeLCG(seed: number) {
  let x = seed >>> 0;
  return () => {
    x = (1103515245 * x + 12345) >>> 0;
    return x / 2 ** 32;
  };
}

// funcion inversa para distribucion discreta
function invDiscrete(u: number, values: number[], cdf: number[]) {
  for (let i = 0; i < cdf.length; i++) {
    if (u <= cdf[i] + 1e-12) return values[i];
  }
  return values[values.length - 1];
}

// demanda mensual
export const DEMAND_VALUES = [
  35, 36, 37, 38, 39, 40, 41, 42, 43,
  44, 45, 46, 47, 48, 49, 50, 51, 52,
  53, 54, 55, 56, 57, 58, 59, 60
];

// CDF acumulada
export const DEMAND_CDF = [
  0.01, 0.025, 0.045, 0.065, 0.087, 0.11, 0.135, 0.162, 0.19,
  0.219, 0.254, 0.299, 0.359, 0.424, 0.494, 0.574, 0.649, 0.719,
  0.784, 0.844, 0.894, 0.934, 0.964, 0.98, 0.995, 1.0
];

export const LT_VALUES = [1, 2, 3];
export const LT_CDF = [0.3, 0.7, 1.0];

// factores estacionales por mes
export const SEASONAL: Record<number, number> = {
  1: 1.2,
  2: 1.0,
  3: 0.9,
  4: 0.8,
  5: 0.8,
  6: 0.7,
  7: 0.8,
  8: 0.9,
  9: 1.0,
  10: 1.2,
  11: 1.3,
  12: 1.4,
};

function seasonalFactor(month: number) {
  return SEASONAL[month] ?? 1.0;
}

export function simulateInventoryRun(params: InventorySimParams, seed: number): InventorySimRunResult {
  const rnd = makeLCG(seed);
  const meses = Math.max(1, Math.floor(params.mesesSimulacion));
  const tabla: InventorySimMonthRow[] = [];

  let inv = Math.max(0, params.inventarioInicial);
  let backlog = 0;

  // orden pendiente (una sola)
  let pending = false;
  let pendingArrivalMonth: number | null = null;

  let numeroOrdenes = 0;
  let faltanteTotal = 0;
  let invPromTotal = 0;

  for (let mes = 1; mes <= meses; mes++) {
    // 1) llega orden al inicio del mes
    if (pending && pendingArrivalMonth === mes) {
      inv += params.q;
      pending = false;
      pendingArrivalMonth = null;
    }

    // 2) cubrir backlog primero
    if (backlog > 0 && inv > 0) {
      const served = Math.min(inv, backlog);
      inv -= served;
      backlog -= served;
    }

    const invIni = inv;
    const backlogIni = backlog;

    // 3) demanda
    const uD = rnd();
    const demandaBase = invDiscrete(uD, DEMAND_VALUES, DEMAND_CDF);
    const factor = seasonalFactor(mes);
    const demandaAjustada = Math.round(demandaBase * factor);

    // 4) atender demanda
    let invFinal = 0;
    let faltanteMes = 0;

    if (invIni >= demandaAjustada) {
      invFinal = invIni - demandaAjustada;
    } else {
      invFinal = 0;
      faltanteMes = demandaAjustada - invIni;
      backlog += faltanteMes;
    }

    // 5) regla de pedido: si invFinal <= R y NO hay orden pendiente
    let pedido = 0;
    let uLT: number | null = null;
    let llegadaMes: number | null = null;

    if (!pending && invFinal <= params.R) {
      pedido = params.q;
      numeroOrdenes++;

      uLT = rnd();
      const lt = invDiscrete(uLT, LT_VALUES, LT_CDF);

      // modo libro: llega al inicio del mes mes + lt + 1
      llegadaMes = mes + lt + 1;
      pending = true;
      pendingArrivalMonth = llegadaMes;
    }

    // 6) inventario promedio (modo libro)
    let invProm = 0;
    if (faltanteMes === 0) {
      invProm = (invIni + invFinal) / 2;
    } else {
      invProm = invIni > 0 ? (invIni * invIni) / (2 * demandaAjustada) : 0;
    }

    tabla.push({
      mes,
      inventarioInicial: invIni,
      backlogInicial: backlogIni,

      randDemanda: uD,
      demandaBase,
      factorEstacional: factor,
      demandaAjustada,

      inventarioFinal: invFinal,
      faltante: faltanteMes,
      backlogFinal: backlog,

      randLeadTime: uLT,
      pedido,
      llegadaOrdenMes: llegadaMes,

      inventarioPromedio: invProm,
    });

    inv = invFinal;
    faltanteTotal += faltanteMes;
    invPromTotal += invProm;
  }

  // costos
  const costoOrdenar = numeroOrdenes * params.costoOrdenar;
  const hMensual = params.costoMantenerAnual / 12;
  const costoInventario = invPromTotal * hMensual;
  const costoFaltante = faltanteTotal * params.costoFaltante;
  const costoTotal = costoOrdenar + costoInventario + costoFaltante;

  const costos: InventorySimCosts = {
    costoOrdenar,
    costoInventario,
    costoFaltante,
    costoTotal,
    numeroOrdenes,
    faltanteTotalUnidades: faltanteTotal,
    inventarioPromedioTotal: invPromTotal,
  };

  return { params, tabla, costos };
}

export function gridSearchInventory(params: InventoryGridSearchParams): InventorySimulationSummary {
  const corridas = Math.max(1, Math.floor(params.corridas));
  const baseSeed = (params.baseSeed ?? 123456789) >>> 0;

  const points: InventoryGridPoint[] = [];

  for (let q = params.qMin; q <= params.qMax; q += params.qStep) {
    for (let R = params.rMin; R <= params.rMax; R += params.rStep) {
      let accOrd = 0;
      let accInv = 0;
      let accFal = 0;
      let accTot = 0;

      for (let i = 0; i < corridas; i++) {
        const runParams: InventorySimParams = {
          inventarioInicial: params.inventarioInicial,
          q,
          R,
          costoOrdenar: params.costoOrdenar,
          costoMantenerAnual: params.costoMantenerAnual,
          costoFaltante: params.costoFaltante,
          mesesSimulacion: params.mesesSimulacion,
        };

        const seed = (baseSeed + q * 1000003 + R * 9176 + i * 101) >>> 0;
        const r = simulateInventoryRun(runParams, seed);

        accOrd += r.costos.costoOrdenar;
        accInv += r.costos.costoInventario;
        accFal += r.costos.costoFaltante;
        accTot += r.costos.costoTotal;
      }

      points.push({
        q,
        R,
        costoPromedio: accTot / corridas,
        costoOrdenarProm: accOrd / corridas,
        costoInventarioProm: accInv / corridas,
        costoFaltanteProm: accFal / corridas,
      });
    }
  }

  points.sort((a, b) => a.costoPromedio - b.costoPromedio);

  const mejor = points[0];
  const top = points.slice(0, 10);

  // corrida ejemplo del mejor (para tabla + desglose)
  const mejorParams: InventorySimParams = {
    inventarioInicial: params.inventarioInicial,
    q: mejor.q,
    R: mejor.R,
    costoOrdenar: params.costoOrdenar,
    costoMantenerAnual: params.costoMantenerAnual,
    costoFaltante: params.costoFaltante,
    mesesSimulacion: params.mesesSimulacion,
  };

  const mejorSeed = (baseSeed + 9999991) >>> 0;
  const mejorRun = simulateInventoryRun(mejorParams, mejorSeed);

  return {
    mejor,
    mejorTabla: mejorRun.tabla,
    mejorCostos: mejorRun.costos,
    top,
    todos: points,
  };
}
