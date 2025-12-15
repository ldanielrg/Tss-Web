export type InventorySimParams = {
  inventarioInicial: number;     
  q: number;                     
  R: number;                   

  costoOrdenar: number;       
  costoMantenerAnual: number;   
  costoFaltante: number;    

  mesesSimulacion: number;    
};

export type InventorySimMonthRow = {
  mes: number;

  // Inventario disponible al inicio del mes
  inventarioInicial: number;

  // backlog acumulado al inicio del mes
  backlogInicial: number;

  randDemanda: number;
  demandaBase: number;
  factorEstacional: number;
  demandaAjustada: number;

  inventarioFinal: number;

  // faltante NUEVO generado en el mes
  faltante: number;

  // backlog acumulado al final del mes
  backlogFinal: number;

  randLeadTime: number | null;    
  pedido: number;                
  llegadaOrdenMes: number | null; 

  inventarioPromedio: number;
};

export type InventorySimCosts = {
  costoOrdenar: number;
  costoInventario: number;
  costoFaltante: number;
  costoTotal: number;

  numeroOrdenes: number;
  faltanteTotalUnidades: number;
  inventarioPromedioTotal: number;
};

export type InventorySimRunResult = {
  params: InventorySimParams;
  tabla: InventorySimMonthRow[];
  costos: InventorySimCosts;
};

export type InventoryGridSearchParams = {
  qMin: number;
  qMax: number;
  qStep: number;

  rMin: number;
  rMax: number;
  rStep: number;

  corridas: number;

  inventarioInicial: number;
  costoOrdenar: number;
  costoMantenerAnual: number;
  costoFaltante: number;
  mesesSimulacion: number;

  baseSeed?: number; 
};

export type InventoryGridPoint = {
  q: number;
  R: number;
  costoPromedio: number;
  costoOrdenarProm: number;
  costoInventarioProm: number;
  costoFaltanteProm: number;
};

export type InventorySimulationSummary = {
  mejor: InventoryGridPoint;
  mejorTabla: InventorySimMonthRow[];

  // desglose de una corrida ejemplo del mejor (q,R)
  mejorCostos: InventorySimCosts;

  top: InventoryGridPoint[];
  todos?: InventoryGridPoint[];
};
