import { InvestmentSimulation, MagazineVendorSimulation } from '../core/simulations';
import { InvestmentResult, MagazineResult } from '../types';

// Handle different simulation types
self.onmessage = (e: MessageEvent) => {
  const { type, iterations, params, seed } = e.data;

  switch (type) {
    case 'investment':
      runInvestmentSimulation(iterations, seed);
      break;
    case 'magazine':
      runMagazineSimulation(iterations, params.policyQ, seed);
      break;
    default:
      self.postMessage({ error: 'Unknown simulation type' });
  }
};

function runInvestmentSimulation(iterations: number, seed?: number) {
  const simulation = new InvestmentSimulation(seed);
  const results: InvestmentResult[] = [];
  let successCount = 0;

  // Send progress updates
  const progressInterval = Math.max(1, Math.floor(iterations / 20));

  for (let i = 0; i < iterations; i++) {
    const result = simulation.simulate(1)[0];
    results.push(result);
    
    if (result.isAcceptable) {
      successCount++;
    }

    // Send progress update
    if (i % progressInterval === 0 || i === iterations - 1) {
      self.postMessage({
        type: 'progress',
        progress: ((i + 1) / iterations) * 100,
        currentIteration: i + 1,
        totalIterations: iterations
      });
    }
  }

  // Calculate summary statistics
  const npvValues = results.map(r => r.npv);
  const averageNPV = npvValues.reduce((sum, npv) => sum + npv, 0) / iterations;
  const maxNPV = Math.max(...npvValues);
  const minNPV = Math.min(...npvValues);
  const variance = npvValues.reduce((sum, npv) => sum + Math.pow(npv - averageNPV, 2), 0) / iterations;
  const standardDeviation = Math.sqrt(variance);
  const probabilityPositiveNPV = successCount / iterations;

  let recommendation: 'ACCEPT' | 'REJECT' | 'MARGINAL';
  if (probabilityPositiveNPV >= 0.70) {
    recommendation = 'ACCEPT';
  } else if (probabilityPositiveNPV >= 0.50) {
    recommendation = 'MARGINAL';
  } else {
    recommendation = 'REJECT';
  }

  self.postMessage({
    type: 'complete',
    results,
    summary: {
      probabilityPositiveNPV,
      averageNPV,
      maxNPV,
      minNPV,
      standardDeviation,
      acceptanceRecommendation: recommendation
    }
  });
}

function runMagazineSimulation(iterations: number, policyQ: number, seed?: number) {
  const simulation = new MagazineVendorSimulation(seed);
  const results = simulation.simulate(policyQ, iterations);
  
  const profits = results.map(r => r.profit);
  const averageProfit = profits.reduce((sum, profit) => sum + profit, 0) / iterations;
  const profitVariance = profits.reduce((sum, profit) => sum + Math.pow(profit - averageProfit, 2), 0) / iterations;
  const successRate = profits.filter(p => p > 0).length / iterations;

  self.postMessage({
    type: 'complete',
    results,
    summary: {
      quantity: policyQ,
      averageProfit,
      profitVariance,
      successRate
    }
  });
}