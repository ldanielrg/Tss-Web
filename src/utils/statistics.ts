export class Statistics {
  static mean(data: number[]): number {
    return data.reduce((sum, x) => sum + x, 0) / data.length;
  }

  static variance(data: number[]): number {
    const mean = this.mean(data);
    const squaredDiffs = data.map(x => Math.pow(x - mean, 2));
    return squaredDiffs.reduce((sum, x) => sum + x, 0) / (data.length - 1);
  }

  static standardDeviation(data: number[]): number {
    return Math.sqrt(this.variance(data));
  }

  static histogram(data: number[], bins: number = 20): { bins: number[], frequencies: number[], density: number[] } {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / bins;
    
    const binEdges: number[] = [];
    const frequencies: number[] = new Array(bins).fill(0);
    
    for (let i = 0; i <= bins; i++) {
      binEdges.push(min + i * binWidth);
    }

    data.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
      frequencies[binIndex]++;
    });

    const density = frequencies.map(freq => freq / (data.length * binWidth));

    return {
      bins: binEdges.slice(0, -1), // Remove last edge
      frequencies,
      density
    };
  }

  // Funciones de densidad teóricas
  static uniformPDF(x: number, a: number, b: number): number {
    return x >= a && x <= b ? 1 / (b - a) : 0;
  }

  static exponentialPDF(x: number, lambda: number): number {
    return x >= 0 ? lambda * Math.exp(-lambda * x) : 0;
  }

  static normalPDF(x: number, mu: number, sigma: number): number {
    const coefficient = 1 / (sigma * Math.sqrt(2 * Math.PI));
    const exponent = -0.5 * Math.pow((x - mu) / sigma, 2);
    return coefficient * Math.exp(exponent);
  }
}