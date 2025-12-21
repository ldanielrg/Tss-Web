// src/types/inventoryActividad14.ts
export type InventoryA14Problem = "P1" | "P2";
export type DiscreteOutcome<T extends number | string> = {
  value: T;
  p: number; 
};

export type DiscreteDistribution<T extends number> = {
  name: string;
  outcomes: DiscreteOutcome<T>[];
};

export type InventoryA14Costs = {
  orderCost: number; 
  holdingCostAnnual: number; 
  shortageCostP1: number; 
  shortageCostWaitP2: number; 
  shortageCostNoWaitP2: number; 
};

export type HookeJeevesSettings = {
  q0: number;
  R0: number;
  stepQ: number;
  stepR: number;
  reduceFactor: number; 
  minStepQ: number;
  minStepR: number;
  maxIter: number;
  qMin: number;
  qMax: number;
  RMin: number;
  RMax: number;
  replications: number; 
  seed: number; 
};

export type InventoryA14Params = {
  problem: InventoryA14Problem;
  days: number; 
  initialOnHand: number; 
  q: number;
  R: number;
  costs: InventoryA14Costs;
  demandDistP1: DiscreteDistribution<number>; 
  leadTimeDistP1: DiscreteDistribution<number>; 
  demandDistP2: DiscreteDistribution<number>; 
  leadTimeDistP2: DiscreteDistribution<number>; 
  waitDistP2: DiscreteDistribution<number>; 
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
  uWait?: number;
  waitDays?: number;
  expiredLost?: number; 
  waitAdded?: number; 
  waitFulfilled?: number;
  lostNoWait?: number; 
};

export type InventoryA14ReplicationResult = {
  rows: InventoryA14DayRow[];

  totalCost: number;
  costOrder: number;
  costHolding: number;
  costShortage: number;
  avgOnHand: number;
  stockoutDays: number;
  totalShortageUnits: number;
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

  meanAvgOnHand: number;
  meanStockoutDays: number;
  meanTotalShortageUnits: number;

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

  policyResult?: InventoryA14PolicyAggregate;
  oneReplicationExample?: InventoryA14ReplicationResult; 

  hookeJeeves?: HookeJeevesResult;

  paramsSnapshot: InventoryA14Params;
};