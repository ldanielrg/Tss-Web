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

export type TruckQueueSummary = {
  nTurnos: number;
  porEquipo: Record<number, TruckQueueCost>;
  equipoOptimo: number;
};
