// src/types/truckQueueSimulation.ts

export type TruckTeamSize = 3 | 4 | 5 | 6;

export type TruckQueueParams = {
  horaInicio: string;
  limiteLlegadas: string;
  horaBreak: string;
  duracionBreak: string;

  salarioHora: number;
  salarioExtraHora: number;
  costoEsperaCamionHora: number;
  costoOperacionAlmacenHora: number;

  duracionJornadaHoras: number;
  nTurnos: number;
  personas: 'AUTO' | TruckTeamSize;

  /** Semilla opcional para reproducibilidad */
  seed?: number;
};

export type TruckQueueCost = {
  salarioNormal: number;
  salarioExtra: number;
  costoEspera: number;
  costoOperacion: number;
  costoTotal: number;

  camionesServidos: number;
  esperaTotalMin: number;
  tiempoExtraMin: number;
  operacionMin: number;
};

export type TruckQueueTurnStats = {
  stdCostoTotal: number;
  ci95Low: number;
  ci95High: number;
};

export type TruckQueueSummary = {
  nTurnos: number;
  porEquipo: Record<number, TruckQueueCost>;
  equipoOptimo: number;

  /** Paso 5: costos por turno (replicación) */
  porTurno?: Record<number, TruckQueueCost[]>;

  /** Paso 6: dispersión / confianza del costo total */
  stats?: Record<number, TruckQueueTurnStats>;
};

/** =========================
 * PASO 3: TRACE (tabla por camión)
 * ========================= */
export type TruckQueueTraceRow = {
  i: number;

  // Llegadas
  rIA: number | null; // R usado para interllegada (null si era camión inicial)
  iaMin: number | null; // interllegada (null si inicial)
  llegadaMin: number; // A_i

  // Servicio
  rST: number; // R usado para servicio
  stMin: number; // ST_i
  inicioMin: number; // S_i
  finMin: number; // D_i
  esperaMin: number; // W_i

  // Break
  breakAplicadoAntesDeEste: boolean;
};

export type TruckQueueNightDetail = {
  team: TruckTeamSize;
  cost: TruckQueueCost;
  trace: TruckQueueTraceRow[];
  breakBeginMin: number | null;
  breakEndMin: number | null;
};
