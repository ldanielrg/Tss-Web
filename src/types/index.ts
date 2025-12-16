export type DistributionType = 'triangular' | 'uniform' | 'discrete' | 'exponential';

export interface TriangularParams {
  min: number;
  mode: number;
  max: number;
}

export interface DiscreteParams {
  values: number[];
  probabilities: number[];
}

export interface SimulationConfig {
  iterations: number;
  seed?: number;
}

export interface InverseTransformResult {
  iteration: number;
  randomValue: number;
  transformedValue: number;
}

export interface MagazineResult {
  iteration: number;
  demandPhase1: number;
  demandPhase2: number;
  profit: number;
  policyQ: number;
  phase1Sales: number;
  phase2Sales: number;
  totalRevenue: number;
  totalCosts: number;
}

export interface InvestmentResult {
  iteration: number;
  initialInvestment: number;
  flows: number[];
  salvageValue: number;
  inflation: number;
  npv: number;
  isAcceptable: boolean;
  netCashFlows: number[];
}

export interface MagazinePolicy {
  quantity: number;
  averageProfit: number;
  profitVariance: number;
  successRate: number;
}

export interface InvestmentSummary {
  probabilityPositiveNPV: number;
  averageNPV: number;
  maxNPV: number;
  minNPV: number;
  standardDeviation: number;
  acceptanceRecommendation: 'ACCEPT' | 'REJECT' | 'MARGINAL';
}