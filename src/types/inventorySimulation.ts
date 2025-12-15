export type InventorySimParams = {
  inventarioInicial: number;     // 150
  q: number;                     // cantidad a ordenar
  R: number;                     // punto de reorden

  costoOrdenar: number;          // 100 Bs/orden
  costoMantenerAnual: number;    // 20 Bs/unidad/año
  costoFaltante: number;         // 50 Bs/unidad

  mesesSimulacion: number;       // 12
};

export type InventorySimMonthRow = {
  mes: number;

  // inventario luego de recibir orden y cubrir backlog (antes de demanda del mes)
  inventarioInicial: number;

  // backlog (faltante acumulado) luego de recibir orden y cubrir backlog (antes de demanda)
  backlogInicial: number;

  randDemanda: number;
  demandaBase: number;
  factorEstacional: number;
  demandaAjustada: number;

  inventarioFinal: number;

  // faltante NUEVO del mes
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
  top: InventoryGridPoint[];
  todos?: InventoryGridPoint[];
};
