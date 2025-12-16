export interface TruckSimulationParams {
  numSimulaciones: number;
  diasTrabajo: number;
  costoCamion: number;
  costoExternoTon: number;
  maxCamiones: number;
  /**
   * Semilla opcional para reproducibilidad.
   * Si no se provee, se usa Math.random().
   */
  seed?: number;
}

export interface DistributionRow {
  /** Probabilidad acumulada (0..1) */
  p: number;
  /** Rango mínimo */
  min: number;
  /** Rango máximo */
  max: number;
}

export interface TruckSampleRow {
  iteracion: number;
  r1Prod: number;
  produccion: number;
  r2Capacidad: number;
  capacidadCamion: number;
  excedente: number;
  costoExternoDia: number;
}

export interface TruckSummaryRow {
  camiones: number;
  costoCamiones: number;
  costoExternoProm: number;
  costoTotalProm: number;
}

export interface TruckSimulationResult {
  sample: TruckSampleRow[];
  summary: TruckSummaryRow[];
  bestCamiones: number;
  bestCosto: number;
}

/** RNG determinístico (Mulberry32) si hay seed, o Math.random() si no. */
function createRng(seed?: number): () => number {
  if (seed === undefined || seed === null) return Math.random;

  // Normalizar a uint32
  let a = (seed >>> 0) || 1;
  return function rng() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInRange(min: number, max: number, r: () => number): number {
  return min + (max - min) * r();
}

export function generateFromDistribution(R: number, dist: DistributionRow[], r: () => number): number {
  for (const row of dist) {
    if (R < row.p) {
      return randomInRange(row.min, row.max, r);
    }
  }
  // por si acaso, usar el último rango
  const last = dist[dist.length - 1];
  return randomInRange(last.min, last.max, r);
}

export function runTruckSimulation(
  params: TruckSimulationParams,
  produccionDist: DistributionRow[],
  capacidadDist: DistributionRow[]
): TruckSimulationResult {
  const {
    numSimulaciones,
    diasTrabajo,
    costoCamion,
    costoExternoTon,
    maxCamiones,
    seed,
  } = params;

  const r = createRng(seed);

  const sample: TruckSampleRow[] = [];
  const summary: TruckSummaryRow[] = [];

  let bestCosto = Number.POSITIVE_INFINITY;
  let bestCamiones = -1;

  for (let numCamiones = 1; numCamiones <= maxCamiones; numCamiones++) {
    let costoExternoTotal = 0;

    for (let i = 0; i < numSimulaciones; i++) {
      // Producción diaria
      const R1 = r();
      const produccion = generateFromDistribution(R1, produccionDist, r);

      // Capacidad de un camión
      const R2 = r();
      const capacidadCamion = generateFromDistribution(R2, capacidadDist, r);

      // Capacidad total
      const capacidadTotal = capacidadCamion * numCamiones;

      // Excedente
      const excedente = Math.max(0, produccion - capacidadTotal);

      // Costo externo por día
      const costoExternoDia = excedente * costoExternoTon;

      costoExternoTotal += costoExternoDia;

      // Guardar primeras 20 iteraciones (solo para 1 camión)
      if (numCamiones === 1 && i < 20) {
        sample.push({
          iteracion: i + 1,
          r1Prod: R1,
          produccion,
          r2Capacidad: R2,
          capacidadCamion,
          excedente,
          costoExternoDia,
        });
      }
    }

    const costoCamionesTotal = numCamiones * costoCamion;
    const costoExternoProm = (costoExternoTotal / numSimulaciones) * diasTrabajo;
    const costoTotalProm = costoCamionesTotal + costoExternoProm;

    summary.push({
      camiones: numCamiones,
      costoCamiones: costoCamionesTotal,
      costoExternoProm,
      costoTotalProm,
    });

    if (costoTotalProm < bestCosto) {
      bestCosto = costoTotalProm;
      bestCamiones = numCamiones;
    }
  }

  return { sample, summary, bestCamiones, bestCosto };
}
