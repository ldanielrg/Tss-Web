export type DistributionType =
  | 'uniform'
  | 'exponential'
  | 'normal'
  | 'triangular'
  | 'studentT'
  | 'chiSquare'
  | 'fisherF'
  | 'bernoulli'
  | 'binomial'
  | 'poisson'
  | 'geometric'
  | 'multinomial';

export interface Distribution {
  name: string;
  type: DistributionType;

  // Para cumplir “discretas y continuas”
  kind: 'continuous' | 'discrete';

  // OJO: esto son etiquetas para el formulario (no valores numéricos)
  parameters: { [key: string]: string };

  description: string;
  formula: string;

  // opcional, si lo usás en el panel de ayuda
  method?: string;
}

export interface SimulationResult {
  data: number[];
  theoretical: {
    mean: number;
    variance: number;
  };
  empirical: {
    mean: number;
    variance: number;
    standardDeviation: number;
  };
  histogram: {
    bins: number[];
    frequencies: number[];
    density: number[];
  };

  // opcional: si lo estás seteando en GeneratorModule
  meta?: {
    distributionName: string;
    kind: 'continuous' | 'discrete';
  };

  multinomial?: {
    probs: number[];
    vectors: number[][];   // cada muestra: [x1,x2,...,xk]
    categoryIndex: number; // 0-based
    n: number;
  };
}

export interface EventSimulation {
  time: number;
  type: string;
  description: string;
  systemState: { [key: string]: number };
}
