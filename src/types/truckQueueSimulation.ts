export type TruckQueueParams = {
  horaInicio: string;               // "23:00:00"
  limiteLlegadas: string;           // "07:00:00"
  horaBreak: string;                // "03:00:00"
  duracionBreak: string;            // "00:30:00"

  salarioHora: number;              // 25
  salarioExtraHora: number;         // 37.5
  costoEsperaCamionHora: number;    // 100
  costoOperacionAlmacenHora: number;// 500

  duracionJornadaHoras: number;     // 8
  nTurnos: number;                  // 60
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
  porEquipo: Record<number, TruckQueueCost>; // 3,4,5,6
  equipoOptimo: number;
};
