import { TriangularParams, DiscreteParams } from '../types';

export class RandomGenerator {
  private seed: number;
  
  constructor(seed?: number) {
    this.seed = seed ?? Date.now();
  }

  // Linear Congruential Generator for reproducible random numbers
  private lcg(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  random(): number {
    return this.seed ? this.lcg() : Math.random();
  }

  // Triangular Distribution using Inverse Transform Method
  triangular(params: TriangularParams): number {
    const { min, mode, max } = params;
    const u = this.random();
    const F_c = (mode - min) / (max - min); // Cumulative at mode

    if (u < F_c) {
      return min + Math.sqrt(u * (max - min) * (mode - min));
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    }
  }

  // Discrete Distribution using Cumulative Method
  discrete(params: DiscreteParams): number {
    const { values, probabilities } = params;
    const u = this.random();
    let cumulative = 0;
    
    for (let i = 0; i < probabilities.length; i++) {
      cumulative += probabilities[i];
      if (u <= cumulative) return values[i];
    }
    
    return values[values.length - 1];
  }

  // Uniform Distribution
  uniform(min: number, max: number): number {
    return min + this.random() * (max - min);
  }

  // Exponential Distribution (for the modified exponential exercise)
  exponential(lambda: number): number {
    return -Math.log(this.random()) / lambda;
  }

  // Sum of two exponentials for the λ=2 case
  erlang2(lambda: number): number {
    return this.exponential(2 * lambda) + this.exponential(2 * lambda);
  }
}

// Piecewise Linear PDF for Inverse Transform Method
export class PiecewiseLinearPDF {
  constructor(
    private segments: Array<{
      start: number;
      end: number;
      startValue: number;
      endValue: number;
    }>
  ) {}

  // Calculate PDF value at x
  pdf(x: number): number {
    for (const segment of this.segments) {
      if (x >= segment.start && x <= segment.end) {
        const ratio = (x - segment.start) / (segment.end - segment.start);
        return segment.startValue + ratio * (segment.endValue - segment.startValue);
      }
    }
    return 0;
  }

  // Calculate CDF value at x
  cdf(x: number): number {
    let cumulative = 0;
    
    for (const segment of this.segments) {
      if (x <= segment.start) break;
      
      const endPoint = Math.min(x, segment.end);
      const width = endPoint - segment.start;
      const avgHeight = (segment.startValue + 
        (segment.startValue + (endPoint - segment.start) / (segment.end - segment.start) * 
        (segment.endValue - segment.startValue))) / 2;
      
      cumulative += width * avgHeight;
    }
    
    return cumulative;
  }

  // Inverse transform method
  inverseCDF(u: number): number {
    // For the specific case from the exercise
    if (u <= 0.75) {
      // Solve quadratic equation for first segment [0,1]
      // -x²/2 + 5x/4 = u
      // -2x² + 5x - 4u = 0
      const a = -2;
      const b = 5;
      const c = -4 * u;
      const discriminant = b * b - 4 * a * c;
      
      if (discriminant >= 0) {
        const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        return (x1 >= 0 && x1 <= 1) ? x1 : x2;
      }
    } else {
      // Second segment [1,2]: x = 4(u - 0.5)
      return 4 * (u - 0.5);
    }
    
    return 0;
  }
}

// Create the default PDF from the exercise
export const createDefaultPDF = (): PiecewiseLinearPDF => {
  return new PiecewiseLinearPDF([
    { start: 0, end: 1, startValue: 5/4, endValue: 1/4 },
    { start: 1, end: 2, startValue: 1/4, endValue: 1/4 }
  ]);
};