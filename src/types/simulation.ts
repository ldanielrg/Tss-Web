export interface Distribution {
  name: string;
  type: 'uniform' | 'exponential' | 'normal';
  parameters: { [key: string]: number };
  description: string;
  formula: string;
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
}

export interface EventSimulation {
  time: number;
  type: string;
  description: string;
  systemState: { [key: string]: number };
}