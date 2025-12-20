export class RandomGenerator {
  private static seed = Date.now();
  private static _hasSpare = false;
  private static _spare = 0;

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

    // --- DISCRETAS ---

  static bernoulli(p: number, count: number): number[] {
    const results: number[] = [];
    for (let i = 0; i < count; i++) {
      results.push(Math.random() < p ? 1 : 0);
    }
    return results;
  }

  static binomial(n: number, p: number, count: number): number[] {
    const results: number[] = [];
    for (let i = 0; i < count; i++) {
      let x = 0;
      for (let j = 0; j < n; j++) {
        if (Math.random() < p) x++;
      }
      results.push(x);
    }
    return results;
  }

  static poisson(lambda: number, count: number): number[] {
    // Método de Knuth
    const results: number[] = [];
    const L = Math.exp(-lambda);

    for (let i = 0; i < count; i++) {
      let k = 0;
      let prod = 1;

      do {
        k++;
        prod *= Math.random();
      } while (prod > L);

      results.push(k - 1);
    }

    return results;
  }

  static geometric(p: number, count: number): number[] {
    // Convención: k = 1,2,3,... (intentos hasta primer éxito)
    const results: number[] = [];
    for (let i = 0; i < count; i++) {
      let k = 1;
      while (Math.random() >= p) k++;
      results.push(k);
    }
    return results;
  }

  static multinomial(n: number, probs: number[], count: number): number[][] {
  const results: number[][] = [];
  const k = probs.length;

  for (let i = 0; i < count; i++) {
    const x = new Array(k).fill(0);

    let remainingN = n;
    let remainingP = 1;

    for (let j = 0; j < k - 1; j++) {
      const pj = probs[j];
      const adjP = remainingP > 0 ? pj / remainingP : 0;

      // Generar Binomial(remainingN, adjP) usando tu generator binomial
      const bj = this.binomial(remainingN, adjP, 1)[0];

      x[j] = bj;
      remainingN -= bj;
      remainingP -= pj;
    }

    x[k - 1] = remainingN;
    results.push(x);
  }

  return results;
}

  static standardNormal(): number {
    if (this._hasSpare) {
      this._hasSpare = false;
      return this._spare;
    }
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const mag = Math.sqrt(-2.0 * Math.log(u));
    const z0 = mag * Math.cos(2.0 * Math.PI * v);
    const z1 = mag * Math.sin(2.0 * Math.PI * v);
    this._spare = z1;
    this._hasSpare = true;
    return z0;
  }

  // --- Triangular(a,b,c): a=min, b=max, c=moda ---
  static triangular(a: number, b: number, c: number, count: number): number[] {
    const out: number[] = [];
    const fc = (c - a) / (b - a);
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      if (u < fc) out.push(a + Math.sqrt(u * (b - a) * (c - a)));
      else out.push(b - Math.sqrt((1 - u) * (b - a) * (b - c)));
    }
    return out;
  }

  // --- Chi-cuadrado(df): suma de df normales estándar^2 ---
  static chiSquare(df: number, count: number): number[] {
    const out: number[] = [];
    for (let i = 0; i < count; i++) {
      let s = 0;
      for (let j = 0; j < df; j++) {
        const z = this.standardNormal();
        s += z * z;
      }
      out.push(s);
    }
    return out;
  }

  // --- t de Student(df) = Z / sqrt(X/df), X~Chi^2(df) ---
  static studentT(df: number, count: number): number[] {
    const out: number[] = [];
    for (let i = 0; i < count; i++) {
      const z = this.standardNormal();
      // Chi^2(df) de un solo valor:
      let x = 0;
      for (let j = 0; j < df; j++) {
        const u = this.standardNormal();
        x += u * u;
      }
      out.push(z / Math.sqrt(x / df));
    }
    return out;
  }

  // --- F(d1,d2) = (X1/d1)/(X2/d2), Xi~Chi^2(di) ---
  static fisherF(d1: number, d2: number, count: number): number[] {
    const out: number[] = [];
    for (let i = 0; i < count; i++) {
      let x1 = 0;
      for (let j = 0; j < d1; j++) {
        const z = this.standardNormal();
        x1 += z * z;
      }
      let x2 = 0;
      for (let j = 0; j < d2; j++) {
        const z = this.standardNormal();
        x2 += z * z;
      }
      out.push((x1 / d1) / (x2 / d2));
    }
    return out;
  }

}