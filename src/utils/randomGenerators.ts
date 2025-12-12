export class RandomGenerator {
  private static seed = Date.now();

  // Generador congruencial lineal básico (opcional, por defecto usa Math.random)
  static lcg(): number {
    this.seed = (this.seed * 1103515245 + 12345) % Math.pow(2, 31);
    return this.seed / Math.pow(2, 31);
  }

  // Distribución Uniforme (a, b)
  static uniform(a: number, b: number, count: number): number[] {
    const results: number[] = [];
    for (let i = 0; i < count; i++) {
      const r = Math.random();
      results.push(a + (b - a) * r);
    }
    return results;
  }

  // Distribución Exponencial (λ)
  static exponential(lambda: number, count: number): number[] {
    const results: number[] = [];
    for (let i = 0; i < count; i++) {
      const r = Math.random();
      results.push(-Math.log(1 - r) / lambda);
    }
    return results;
  }

  // Distribución Normal (μ, σ) - Método Box-Muller
  static normal(mu: number, sigma: number, count: number): number[] {
    const results: number[] = [];
    for (let i = 0; i < count; i += 2) {
      const r1 = Math.random();
      const r2 = Math.random();
      
      const z1 = Math.sqrt(-2 * Math.log(r1)) * Math.cos(2 * Math.PI * r2);
      const z2 = Math.sqrt(-2 * Math.log(r1)) * Math.sin(2 * Math.PI * r2);
      
      results.push(mu + sigma * z1);
      if (i + 1 < count) {
        results.push(mu + sigma * z2);
      }
    }
    return results.slice(0, count);
  }
}