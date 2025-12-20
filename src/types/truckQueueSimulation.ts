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
  porTurno?: Record<number, TruckQueueCost[]>;
  stats?: Record<number, TruckQueueTurnStats>;
};

export type TruckQueueTraceRow = {
  i: number;
  rIA: number | null; 
  iaMin: number | null;
  llegadaMin: number; 
  rST: number;
  stMin: number; 
  inicioMin: number; 
  finMin: number; 
  esperaMin: number; 
  breakAplicadoAntesDeEste: boolean;
};

export type TruckQueueNightDetail = {
  team: TruckTeamSize;
  cost: TruckQueueCost;
  trace: TruckQueueTraceRow[];
  breakBeginMin: number | null;
  breakEndMin: number | null;
};
