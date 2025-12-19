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

    // --- HISTOGRAMA DISCRETO (frecuencia relativa) ---
  static discreteHistogram(data: number[]): { bins: number[], frequencies: number[], density: number[] } {
    const counts = new Map<number, number>();
    for (const v of data) {
      const k = Math.round(v);
      counts.set(k, (counts.get(k) || 0) + 1);
    }

    const bins = Array.from(counts.keys()).sort((a, b) => a - b);
    const frequencies = bins.map(b => counts.get(b) || 0);
    const n = data.length;
    const density = frequencies.map(f => f / n);

    return { bins, frequencies, density };
  }

  // --- PMFs ---
  static bernoulliPMF(k: number, p: number): number {
    if (k === 1) return p;
    if (k === 0) return 1 - p;
    return 0;
  }

  private static factorial(n: number): number {
    if (n < 0) return NaN;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  private static comb(n: number, k: number): number {
    if (k < 0 || k > n) return 0;
    k = Math.min(k, n - k);
    let res = 1;
    for (let i = 1; i <= k; i++) {
      res = (res * (n - (k - i))) / i;
    }
    return res;
  }

  static binomialPMF(k: number, n: number, p: number): number {
    if (k < 0 || k > n) return 0;
    return this.comb(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
  }

  static poissonPMF(k: number, lambda: number): number {
    if (k < 0) return 0;
    return Math.exp(-lambda) * Math.pow(lambda, k) / this.factorial(k);
  }

  static geometricPMF(k: number, p: number): number {
    if (k < 1) return 0;
    return Math.pow(1 - p, k - 1) * p;
  }

    // --- logGamma (Lanczos) para constantes de PDFs ---
  static logGamma(z: number): number {
    // Lanczos approximation
    const p = [
      0.99999999999980993,
      676.5203681218851,
      -1259.1392167224028,
      771.32342877765313,
      -176.61502916214059,
      12.507343278686905,
      -0.13857109526572012,
      0.000009984369578019572,
      0.00000015056327351493116
    ];
    if (z < 0.5) {
      // reflection: Gamma(z)Gamma(1-z)=pi/sin(pi z)
      return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - this.logGamma(1 - z);
    }
    z -= 1;
    let x = p[0];
    for (let i = 1; i < p.length; i++) x += p[i] / (z + i);
    const t = z + (p.length - 1) - 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }

  static triangularPDF(x: number, a: number, b: number, c: number): number {
    if (x < a || x > b) return 0;
    if (x === c) return 2 / (b - a);
    if (x < c) return (2 * (x - a)) / ((b - a) * (c - a));
    return (2 * (b - x)) / ((b - a) * (b - c));
  }

  static chiSquarePDF(x: number, k: number): number {
    if (x < 0) return 0;
    // f(x)=1/(2^{k/2} Γ(k/2)) x^{k/2-1} e^{-x/2}
    const half = k / 2;
    const logCoef = -half * Math.log(2) - this.logGamma(half);
    const logVal = logCoef + (half - 1) * Math.log(x) - x / 2;
    return Math.exp(logVal);
  }

  static studentTPDF(x: number, nu: number): number {
    // Γ((ν+1)/2) / (sqrt(νπ) Γ(ν/2)) * (1 + x^2/ν)^(-(ν+1)/2)
    const a = (nu + 1) / 2;
    const b = nu / 2;
    const logCoef = this.logGamma(a) - this.logGamma(b) - 0.5 * (Math.log(nu) + Math.log(Math.PI));
    const logPow = -a * Math.log(1 + (x * x) / nu);
    return Math.exp(logCoef + logPow);
  }

  static fisherFPDF(x: number, d1: number, d2: number): number {
    if (x <= 0) return 0;
    // f(x)= [Γ((d1+d2)/2)/(Γ(d1/2)Γ(d2/2))] * (d1/d2)^(d1/2) * x^(d1/2-1) / (1+(d1/d2)x)^((d1+d2)/2)
    const a = d1 / 2;
    const b = d2 / 2;
    const logC = this.logGamma(a + b) - this.logGamma(a) - this.logGamma(b);
    const logScale = a * (Math.log(d1) - Math.log(d2));
    const logNum = (a - 1) * Math.log(x);
    const logDen = (a + b) * Math.log(1 + (d1 / d2) * x);
    return Math.exp(logC + logScale + logNum - logDen);
  }

}