import type {
  InventoryGridPoint,
  InventoryGridSearchParams,
  InventorySimCosts,
  InventorySimMonthRow,
  InventorySimParams,
  InventorySimRunResult,
  InventorySimulationSummary,
} from '../types/inventorySimulation';

/** ================= RNG con semilla (LCG) ================= */
function makeLCG(seed: number) {
  let x = seed >>> 0;
  return () => {
    x = (1103515245 * x + 12345) >>> 0;
    return x / 2 ** 32;
  };
}

/** ================= Transformada inversa discreta ================= */
function invDiscrete(u: number, values: number[], cdf: number[]) {
  for (let i = 0; i < cdf.length; i++) {
    if (u <= cdf[i] + 1e-12) return values[i];
  }
  return values[values.length - 1];
}

/** ================= Tablas del enunciado (TU IMAGEN) ================= */
// Demanda base: cantidades 35..60 con su prob acumulada (columna C)
const DEMAND_VALUES = [
  35, 36, 37, 38, 39, 40, 41, 42, 43,
  44, 45, 46, 47, 48, 49, 50, 51, 52,
  53, 54, 55, 56, 57, 58, 59, 60
];

const DEMAND_CDF = [
  0.01, 0.025, 0.045, 0.065, 0.087, 0.11, 0.135, 0.162, 0.19,
  0.219, 0.254, 0.299, 0.359, 0.424, 0.494, 0.574, 0.649, 0.719,
  0.784, 0.844, 0.894, 0.934, 0.964, 0.98, 0.995, 1.0
];

// Lead time (meses) con prob 0.3, 0.4, 0.3 => CDF 0.3, 0.7, 1.0
const LT_VALUES = [1, 2, 3];
const LT_CDF = [0.3, 0.7, 1.0];

// Factores estacionales por mes (tu tabla)
// Nota: en tu imagen se ve hasta mes 11; si tienes mes 12 = 1.4, lo ponemos.
const SEASONAL: Record<number, number> = {
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

/** ================= 1 corrida (12 meses) =================
 * Replica tu Excel:
 * - DemandaBase: inversa con CDF
 * - DemandaAjustada: round(base * factorMes)
 * - InvFinal: MAX(0, InvIni - DemAjust)
 * - Faltante: MAX(0, DemAjust - InvIni)
 * - Pedido: si InvFinal <= R => q, sino 0
 * - LeadTime: inversa (1..3)
 * - LlegadaOrden: mes + leadTime
 * - Inventario promedio: (InvIni + InvFinal)/2
 *
 * Nota: Para poder sumar la llegada en el mes correcto,
 * manejamos un "pipeline" de pedidos: arrivals[mes] = cantidad que llega.
 * Tu Excel muestra "Llegada orden" como mes, acá lo guardamos también.
 */
export function simulateInventoryRun(params: InventorySimParams, seed: number): InventorySimRunResult {
  const rnd = makeLCG(seed);

  const meses = Math.max(1, Math.floor(params.mesesSimulacion));
  const arrivals: number[] = new Array(meses + 10).fill(0); // buffer extra por leadtime
  const tabla: InventorySimMonthRow[] = [];

  let inv = Math.max(0, params.inventarioInicial);

  let numeroOrdenes = 0;
  let faltanteTotal = 0;
  let invPromTotal = 0;

  for (let mes = 1; mes <= meses; mes++) {
    // 1) Recibir órdenes que llegan este mes
    if (arrivals[mes] > 0) {
      inv += arrivals[mes];
    }

    const invIni = inv;

    // 2) Demanda base por inversa
    const uD = rnd();
    const demandaBase = invDiscrete(uD, DEMAND_VALUES, DEMAND_CDF);

    // 3) Ajustar por estacionalidad
    const factor = seasonalFactor(mes);
    const demandaAjustada = Math.round(demandaBase * factor);

    // 4) Inventario final y faltante (ventas perdidas)
    const invFinal = Math.max(0, invIni - demandaAjustada);
    const faltante = Math.max(0, demandaAjustada - invIni);

    // 5) Pedido si InvFinal <= R
    let pedido = 0;
    let uLT: number | null = null;
    let llegadaMes: number | null = null;

    if (invFinal <= params.R) {
      pedido = params.q;
      numeroOrdenes++;

      uLT = rnd();
      const lt = invDiscrete(uLT, LT_VALUES, LT_CDF);
      llegadaMes = mes + lt;

      // Programar llegada si cae dentro o después del horizonte
      if (llegadaMes < arrivals.length) {
        arrivals[llegadaMes] += pedido;
      }
    }

    // 6) Inventario promedio
    const invProm = (invIni + invFinal) / 2;

    // guardar fila
    tabla.push({
      mes,
      inventarioInicial: invIni,
      randDemanda: uD,
      demandaBase,
      factorEstacional: factor,
      demandaAjustada,
      inventarioFinal: invFinal,
      faltante,
      randLeadTime: uLT,
      pedido,
      llegadaOrdenMes: llegadaMes,
      inventarioPromedio: invProm,
    });

    // actualizar estado para siguiente mes
    inv = invFinal;

    // acumular métricas
    faltanteTotal += faltante;
    invPromTotal += invProm;
  }

  // Costos
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

/** ================= Experimento (grid search) ================= */
export function gridSearchInventory(params: InventoryGridSearchParams): InventorySimulationSummary {
  const corridas = Math.max(1, Math.floor(params.corridas));

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

        const seed = Date.now() + i * 10007 + q * 97 + R * 31;
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

  // Simular una corrida del mejor (q, R) para obtener la tabla
  const mejorParams: InventorySimParams = {
    inventarioInicial: params.inventarioInicial,
    q: mejor.q,
    R: mejor.R,
    costoOrdenar: params.costoOrdenar,
    costoMantenerAnual: params.costoMantenerAnual,
    costoFaltante: params.costoFaltante,
    mesesSimulacion: params.mesesSimulacion,
  };
  const mejorSeed = Date.now() + 99991;
  const mejorRun = simulateInventoryRun(mejorParams, mejorSeed);
  const mejorTabla = mejorRun.tabla;

  return { mejor, mejorTabla, top, todos: points };
}
