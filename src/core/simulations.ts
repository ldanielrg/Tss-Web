import { RandomGenerator, createDefaultPDF } from './distributions';
import { 
  MagazineResult, 
  InvestmentResult, 
  InverseTransformResult,
  SimulationConfig,
  TriangularParams,
  DiscreteParams 
} from '../types';

export class InverseTransformSimulation {
  private pdf = createDefaultPDF();
  private generator: RandomGenerator;

  constructor(seed?: number) {
    this.generator = new RandomGenerator(seed);
  }

  simulate(iterations: number): InverseTransformResult[] {
    const results: InverseTransformResult[] = [];

    for (let i = 0; i < iterations; i++) {
      const randomValue = this.generator.random();
      const transformedValue = this.pdf.inverseCDF(randomValue);
      
      results.push({
        iteration: i,
        randomValue,
        transformedValue
      });
    }

    return results;
  }

  getPDFValues(xValues: number[]): number[] {
    return xValues.map(x => this.pdf.pdf(x));
  }
}

export class MagazineVendorSimulation {
  private generator: RandomGenerator;

  // Default demand distributions from the exercise
  private demandPhase1: DiscreteParams = {
    values: [8, 9, 10, 11, 12],
    probabilities: [0.15, 0.20, 0.30, 0.25, 0.10]
  };

  private demandPhase2: DiscreteParams = {
    values: [6, 7, 8, 9, 10, 11, 12],
    probabilities: [0.10, 0.15, 0.20, 0.25, 0.15, 0.10, 0.05]
  };

  // Costs and prices from exercise
  private readonly costs = {
    initialCost: 1.50,
    sellingPrice: 2.00,
    returnPriceDay10: 0.90,
    additionalCostDay10: 1.20,
    returnPriceDay30: 0.60
  };

  constructor(seed?: number) {
    this.generator = new RandomGenerator(seed);
  }

  simulate(policyQ: number, iterations: number): MagazineResult[] {
    const results: MagazineResult[] = [];

    for (let i = 0; i < iterations; i++) {
      const demand1 = this.generator.discrete(this.demandPhase1);
      const demand2 = this.generator.discrete(this.demandPhase2);

      let profit = 0;
      let phase1Sales = 0;
      let phase2Sales = 0;
      let totalRevenue = 0;
      let totalCosts = policyQ * this.costs.initialCost;

      // Phase 1 (Days 1-10)
      if (policyQ >= demand1) {
        // We have enough magazines
        phase1Sales = demand1;
        const leftover = policyQ - demand1;
        const returnRevenue = leftover * this.costs.returnPriceDay10;
        totalRevenue += returnRevenue;
        
        // Phase 2: Start with 0 inventory (returned everything)
        // Need to buy for phase 2 based on expected demand or fixed policy
        const phase2Stock = Math.ceil(this.demandPhase2.values.reduce((a, b) => a + b) / this.demandPhase2.values.length);
        totalCosts += phase2Stock * this.costs.additionalCostDay10;
        
        phase2Sales = Math.min(phase2Stock, demand2);
        const phase2Leftover = Math.max(0, phase2Stock - demand2);
        totalRevenue += phase2Leftover * this.costs.returnPriceDay30;
        
      } else {
        // Not enough magazines for phase 1
        phase1Sales = policyQ;
        
        // Buy additional for phase 2
        const shortfall = demand1 - policyQ;
        const phase2Stock = shortfall + Math.ceil(this.demandPhase2.values.reduce((a, b) => a + b) / this.demandPhase2.values.length);
        totalCosts += phase2Stock * this.costs.additionalCostDay10;
        
        phase2Sales = Math.min(phase2Stock, demand2);
        const phase2Leftover = Math.max(0, phase2Stock - demand2);
        totalRevenue += phase2Leftover * this.costs.returnPriceDay30;
      }

      totalRevenue += (phase1Sales + phase2Sales) * this.costs.sellingPrice;
      profit = totalRevenue - totalCosts;

      results.push({
        iteration: i,
        demandPhase1: demand1,
        demandPhase2: demand2,
        profit,
        policyQ,
        phase1Sales,
        phase2Sales,
        totalRevenue,
        totalCosts
      });
    }

    return results;
  }
}

export class InvestmentSimulation {
  private generator: RandomGenerator;

  // Distribution parameters from exercise
  private investmentParams: TriangularParams = {
    min: 80000, mode: 100000, max: 130000
  };

  private salvageParams: TriangularParams = {
    min: 16000, mode: 20000, max: 26000
  };

  private inflationParams: TriangularParams = {
    min: 0.15, mode: 0.20, max: 0.25
  };

  private flowParams: DiscreteParams = {
    values: [20000, 30000, 40000, 50000, 60000],
    probabilities: [0.20, 0.20, 0.20, 0.20, 0.20]
  };

  private readonly TREMA = 0.20; // 20% discount rate
  private readonly TAX_RATE = 0.50; // 50% tax rate
  private readonly PROJECT_YEARS = 5;

  constructor(seed?: number) {
    this.generator = new RandomGenerator(seed);
  }

  simulate(iterations: number): InvestmentResult[] {
    const results: InvestmentResult[] = [];

    for (let i = 0; i < iterations; i++) {
      // Generate stochastic variables
      const initialInvestment = -this.generator.triangular(this.investmentParams);
      const salvageValue = this.generator.triangular(this.salvageParams);
      const inflation = this.generator.triangular(this.inflationParams);

      // Generate annual flows
      const flows = Array(this.PROJECT_YEARS).fill(0).map(() => 
        this.generator.discrete(this.flowParams)
      );

      // Calculate depreciation
      const annualDepreciation = (Math.abs(initialInvestment) - salvageValue) / this.PROJECT_YEARS;

      // Calculate net cash flows (after taxes)
      const netCashFlows = flows.map(grossFlow => {
        const earningsBeforeTax = grossFlow - annualDepreciation;
        const taxes = earningsBeforeTax * this.TAX_RATE;
        const netEarnings = earningsBeforeTax - taxes;
        return netEarnings + annualDepreciation; // Add back depreciation for cash flow
      });

      // Calculate NPV
      let npv = initialInvestment; // Year 0 flow
      
      for (let t = 1; t <= this.PROJECT_YEARS; t++) {
        npv += netCashFlows[t - 1] / Math.pow(1 + this.TREMA, t);
      }
      
      // Add salvage value
      npv += salvageValue / Math.pow(1 + this.TREMA, this.PROJECT_YEARS);

      results.push({
        iteration: i,
        initialInvestment,
        flows,
        salvageValue,
        inflation,
        npv,
        isAcceptable: npv >= 0,
        netCashFlows
      });
    }

    return results;
  }
}