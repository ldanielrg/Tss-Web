export function u01(): number {
  return Math.random();
}

export function uniform(a: number, b: number, u: number = u01()): number {
  return a + (b - a) * u;
}

// Triangular (min=a, mode=b, max=c) por inversa CDF
export function triangular(a: number, b: number, c: number, u: number = u01()): number {
  if (c === a) return a;
  const F = (b - a) / (c - a);
  if (u < F) return a + Math.sqrt(u * (b - a) * (c - a));
  return c - Math.sqrt((1 - u) * (c - b) * (c - a));
}
