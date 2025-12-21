// src/types/inventoryActividad14.ts

export type InventoryA14Problem = "P1" | "P2";

export type DiscreteOutcome<T extends number | string> = {
  value: T;
  p: number; // Probabilidad (0..1), debe sumar 1 en total
};

export type DiscreteDistribution<T extends number> = {
  name: string;
  outcomes: DiscreteOutcome<T>[];
};

export type InventoryA14Costs = {
  orderCost: number; // K: costo por orden
  holdingCostAnnual: number; // h anual por unidad (p.ej. 26)
  shortageCostP1: number; // p1: costo por unidad faltante (P1)
  shortageCostWaitP2: number; // P2: costo si espera (por unidad) (20)
  shortageCostNoWaitP2: number; // P2: costo si no espera / se pierde (50)
};

export type HookeJeevesSettings = {
  q0: number;
  R0: number;
  stepQ: number;
  stepR: number;
  reduceFactor: number; // 0<factor<1
  minStepQ: number;
  minStepR: number;
  maxIter: number;

  // límites (para evitar valores imposibles)
  qMin: number;
  qMax: number;
  RMin: number;
  RMax: number;

  replications: number; // N simulaciones por punto (q,R)
  seed: number; // semilla base (reproducible)
};

export type InventoryA14Params = {
  problem: InventoryA14Problem;

  days: number; // 260
  initialOnHand: number; // 15

  q: number;
  R: number;

  costs: InventoryA14Costs;

  demandDistP1: DiscreteDistribution<number>; // 0..8
  leadTimeDistP1: DiscreteDistribution<number>; // 1..4

  demandDistP2: DiscreteDistribution<number>; // 25..34
  leadTimeDistP2: DiscreteDistribution<number>; // 1..4
  waitDistP2: DiscreteDistribution<number>; // 0..4

  // Replicaciones para evaluar una política fija (no H&J)
  replications: number;
  seed: number;
};

export type InventoryA14DayRow = {
  R: number;
  day: number;

  invInitial: number;
  uDemand: number;
  demand: number;

  invFinal: number;

  shortage: number;
  shortageAccum: number;

  orderPlaced: boolean;
  uLeadTime?: number;
  leadTimeDays?: number;
  arrivalDay?: number | null;

  costOrder: number;
  costShortage: number;
  invAvg: number;

  // extras P2 (opcionales)
  uWait?: number;
  waitDays?: number;
  expiredLost?: number; // unidades que expiraron hoy (se pierden)
  waitAdded?: number; // unidades que entraron a cola de espera hoy
  waitFulfilled?: number; // unidades atendidas hoy desde espera
  lostNoWait?: number; // unidades perdidas por W=0 hoy
};

export type InventoryA14ReplicationResult = {
  rows: InventoryA14DayRow[];

  totalCost: number;
  costOrder: number;
  costHolding: number;
  costShortage: number;

  // métricas útiles para gráficas
  avgOnHand: number;
  stockoutDays: number;
  totalShortageUnits: number;

  // P2 extras
  totalLostUnits?: number;
  totalWaitFulfilledUnits?: number;
};

export type InventoryA14PolicyAggregate = {
  q: number;
  R: number;

  replications: number;
  meanCost: number;
  stdCost: number;

  meanCostOrder: number;
  meanCostHolding: number;
  meanCostShortage: number;

  // métricas
  meanAvgOnHand: number;
  meanStockoutDays: number;
  meanTotalShortageUnits: number;

  // P2 extras
  meanTotalLostUnits?: number;
  meanTotalWaitFulfilledUnits?: number;
};

export type HookeJeevesRow = {
  iter: number;
  q: number;
  R: number;
  cost: number;

  action: string;

  stepQ: number;
  stepR: number;

  bestQ: number;
  bestR: number;
  bestCost: number;
};

export type HookeJeevesResult = {
  best: InventoryA14PolicyAggregate;
  table: HookeJeevesRow[];
};

export type InventoryA14Summary = {
  problem: InventoryA14Problem;

  // Resultado de simular una política fija (q,R)
  policyResult?: InventoryA14PolicyAggregate;
  oneReplicationExample?: InventoryA14ReplicationResult; // para tabla diaria (formato Excel)

  // Resultado de optimización H&J
  hookeJeeves?: HookeJeevesResult;

  // Para mostrar en panel “parámetros usados”
  paramsSnapshot: InventoryA14Params;
};
