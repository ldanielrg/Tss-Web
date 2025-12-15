export type InventorySimParams = {
  // Parámetros (como tu tabla)
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

  inventarioInicial: number;

  randDemanda: number;
  demandaBase: number;
  factorEstacional: number;
  demandaAjustada: number;

  inventarioFinal: number;
  faltante: number;

  randLeadTime: number | null;   // solo si hay pedido
  pedido: number;                // 0 o q
  llegadaOrdenMes: number | null; // mes en que llega (mes actual + lead time)

  inventarioPromedio: number;
};

export type InventorySimCosts = {
  costoOrdenar: number;
  costoInventario: number;
  costoFaltante: number;
  costoTotal: number;

  // extras útiles
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
  // rangos del experimento
  qMin: number;
  qMax: number;
  qStep: number;

  rMin: number;
  rMax: number;
  rStep: number;

  // replicaciones
  corridas: number;

  // parámetros base
  inventarioInicial: number;
  costoOrdenar: number;
  costoMantenerAnual: number;
  costoFaltante: number;
  mesesSimulacion: number;
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
  mejorTabla: InventorySimMonthRow[]; // tabla de simulación del mejor (q,R)
  top: InventoryGridPoint[]; // top 10
  todos?: InventoryGridPoint[]; // opcional si quieres tabla completa
};
