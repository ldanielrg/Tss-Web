export function trapz(y: number[], x: number[]): number {
  let area = 0;
  for (let i = 1; i < y.length; i++) {
    area += 0.5 * (y[i] + y[i - 1]) * (x[i] - x[i - 1]);
  }
  return area;
}

export function linspace(min: number, max: number, n: number): number[] {
  if (n <= 1) return [min];
  const step = (max - min) / (n - 1);
  return Array.from({ length: n }, (_, i) => min + i * step);
}

export function histogramDensity(values: number[], bins: number) {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const w = (max - min) / bins || 1;

  const counts = Array.from({ length: bins }, () => 0);
  for (const v of values) {
    let idx = Math.floor((v - min) / w);
    if (idx < 0) idx = 0;
    if (idx >= bins) idx = bins - 1;
    counts[idx]++;
  }

  return counts.map((count, i) => {
    const center = min + (i + 0.5) * w;
    const density = count / (values.length * w);
    return { x: center, density, count };
  });
}

// productorio de (1+i), j..t (incluye t), tasas index 0..4
export function productorio(j: number, t: number, tasas: number[]): number {
  let resp = 1;
  for (let k = j; k <= t; k++) resp *= 1 + tasas[k - 1];
  return resp;
}

// IRR / TIR: Newton + fallback bisección
export function irr(cashflows: number[], guess = 0.1): number {
  const npv = (r: number) =>
    cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + r, t), 0);

  const dnpv = (r: number) =>
    cashflows.reduce((acc, cf, t) => {
      if (t === 0) return acc;
      return acc - (t * cf) / Math.pow(1 + r, t + 1);
    }, 0);

  let r = guess;
  for (let i = 0; i < 50; i++) {
    const f = npv(r);
    const df = dnpv(r);
    if (!isFinite(f) || !isFinite(df)) break;
    if (Math.abs(f) < 1e-10) return r;
    const nr = r - f / df;
    if (!isFinite(nr) || nr <= -0.9999) break;
    if (Math.abs(nr - r) < 1e-10) return nr;
    r = nr;
  }

  let lo = -0.9;
  let hi = 5.0;
  let fLo = npv(lo);
  let fHi = npv(hi);

  for (let k = 0; k < 20 && fLo * fHi > 0; k++) {
    hi *= 2;
    fHi = npv(hi);
    if (hi > 1e6) break;
  }
  if (fLo * fHi > 0) return NaN;

  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid);
    if (Math.abs(fMid) < 1e-10) return mid;
    if (fLo * fMid < 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}
