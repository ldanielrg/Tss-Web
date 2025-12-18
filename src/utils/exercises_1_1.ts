/* ================================
   EJ 1 (Parte 1) - Rechazo
   (de Ejercicio1_Parte1.java) 
================================ */

export type RejectionPoint = {
  caso: number;
  R1: number;
  R2: number;
  x: number;
  funcion: "F1" | "F2";
  condicion: number;
  aceptado: boolean;
};

export type RejectionResult = {
  points: RejectionPoint[];
  acceptedX: number[];
  stats: {
    total: number;
    aceptados: number;
    rechazados: number;
    tasaAceptacion: number; // %
    tasaRechazo: number; // %
  };
  divisorX: number; // línea vertical (x=5 ó x=1)
};

export function runRejectionEj1Parte1(opts: {
  mode: "predef" | "random";
  nRandom?: number;
  min?: number;
  max?: number;
}): RejectionResult {
  const predef: Array<[number, number]> = [
    [0.24, 0.95],
    [0.02, 0.84],
    [0.67, 0.19],
    [0.71, 0.29],
  ];

  const pairs =
    opts.mode === "predef"
      ? predef
      : generatePairs(opts.nRandom ?? 50, clamp01(opts.min ?? 0), clamp01(opts.max ?? 1));

  const points: RejectionPoint[] = [];
  const acceptedX: number[] = [];

  pairs.forEach(([R1, R2], idx) => {
    const x = 4 + 2 * R1;
    let funcion: "F1" | "F2";
    let condicion: number;
    let aceptado: boolean;

    if (x <= 5) {
      funcion = "F1";
      condicion = 1 - (4 / 3) * R1;
      aceptado = R2 <= condicion;
    } else {
      funcion = "F2";
      condicion = (4 / 3) * R1 - 1 / 3;
      aceptado = R2 <= condicion;
    }

    const p: RejectionPoint = {
      caso: idx + 1,
      R1,
      R2,
      x,
      funcion,
      condicion,
      aceptado,
    };

    points.push(p);
    if (aceptado) acceptedX.push(x);
  });

  return buildRejectionResult(points, acceptedX, 5);
}

/* ================================
   EJ 2 (Parte 1) - Rechazo
   (de Ejercicio2_Parte1.java)
================================ */

export function runRejectionEj2Parte1(opts: {
  mode: "predef" | "random";
  nRandom?: number;
  min?: number;
  max?: number;
}): RejectionResult {
  const predef: Array<[number, number]> = [
    [0.24, 0.95],
    [0.02, 0.70],
    [0.67, 0.19],
    [0.71, 0.21],
  ];

  const pairs =
    opts.mode === "predef"
      ? predef
      : generatePairs(opts.nRandom ?? 50, clamp01(opts.min ?? 0), clamp01(opts.max ?? 1));

  const points: RejectionPoint[] = [];
  const acceptedX: number[] = [];

  pairs.forEach(([R1, R2], idx) => {
    const x = (3 / 2) * R1;
    let funcion: "F1" | "F2";
    let condicion: number;
    let aceptado: boolean;

    if (x <= 1) {
      funcion = "F1";
      condicion = 1 / 7;
      aceptado = R2 <= condicion;
    } else {
      funcion = "F2";
      condicion = (18 * R1 - 11) / 7;
      aceptado = R2 <= condicion;
    }

    const p: RejectionPoint = {
      caso: idx + 1,
      R1,
      R2,
      x,
      funcion,
      condicion,
      aceptado,
    };

    points.push(p);
    if (aceptado) acceptedX.push(x);
  });

  return buildRejectionResult(points, acceptedX, 1);
}

/* ================================
   EJ 3 (Parte 2) - Juego 7-11
   (de Ejercicio1_Parte2.java)
================================ */

export type Game711Result = {
  probGanarPartida: number; // estimada
  probQuiebra: number;
  probExito: number;
};

export function runGame711(opts: {
  totalPartidas?: number;
  capitalInicial?: number;
  metaCapital?: number;
  simulaciones?: number;
}): Game711Result {
  const totalPartidas = opts.totalPartidas ?? 100000;
  const capitalInicial = opts.capitalInicial ?? 20;
  const metaCapital = opts.metaCapital ?? 50;
  const simulaciones = opts.simulaciones ?? 100000;

  let ganadas = 0;
  for (let i = 0; i < totalPartidas; i++) {
    if (jugarPartida711()) ganadas++;
  }
  const probGanarPartida = ganadas / totalPartidas;

  let quiebras = 0;
  for (let sim = 0; sim < simulaciones; sim++) {
    let capital = capitalInicial;
    while (capital > 0 && capital < metaCapital) {
      capital += jugarPartida711() ? 1 : -1;
    }
    if (capital === 0) quiebras++;
  }
  const probQuiebra = quiebras / simulaciones;

  return {
    probGanarPartida,
    probQuiebra,
    probExito: 1 - probQuiebra,
  };
}

function lanzarDados(): number {
  return (randInt(1, 6) + randInt(1, 6));
}

function jugarPartida711(): boolean {
  const primer = lanzarDados();
  if (primer === 7 || primer === 11) return true;
  if (primer === 2 || primer === 3 || primer === 12) return false;

  const punto = primer;
  while (true) {
    const t = lanzarDados();
    if (t === punto) return true;
    if (t === 7) return false;
  }
}

/* ================================
   EJ 4 (Parte 2) - Ruleta
   (de Ejercicio2_Parte2.java)
================================ */

export type RouletteCompareRow = {
  sim: number;
  capFinalFija: number;
  capFinalMartingala: number;
  quiebraFija: boolean;
  quiebraMartingala: boolean;
};

export type RouletteCompareResult = {
  rows: RouletteCompareRow[];
  capitalFinalPromFija: number;
  capitalFinalPromMartingala: number;
  probQuiebraFija: number;
  probQuiebraMartingala: number;
};

export function compareRouletteStrategies(opts: {
  capitalInicial?: number;
  numJuegos?: number;
  simulaciones?: number;
}): RouletteCompareResult {
  const capitalInicial = opts.capitalInicial ?? 200;
  const numJuegos = opts.numJuegos ?? 1000;
  const simulaciones = opts.simulaciones ?? 10000;

  let sumFija = 0;
  let sumMart = 0;
  let qFija = 0;
  let qMart = 0;

  const rows: RouletteCompareRow[] = [];

  for (let sim = 1; sim <= simulaciones; sim++) {
    const capFija = estrategiaFija(capitalInicial, numJuegos);
    const capMart = estrategiaMartingala(capitalInicial, numJuegos);

    sumFija += capFija;
    sumMart += capMart;

    const quiebraFija = capFija === 0;
    const quiebraMart = capMart === 0;

    if (quiebraFija) qFija++;
    if (quiebraMart) qMart++;

    rows.push({
      sim,
      capFinalFija: capFija,
      capFinalMartingala: capMart,
      quiebraFija,
      quiebraMartingala: quiebraMart,
    });
  }

  return {
    rows,
    capitalFinalPromFija: sumFija / simulaciones,
    capitalFinalPromMartingala: sumMart / simulaciones,
    probQuiebraFija: qFija / simulaciones,
    probQuiebraMartingala: qMart / simulaciones,
  };
}

// 0-9 rojo, 10-19 negro, 20-21 verde (re-spin)
function girarRuleta(): number {
  return randInt(0, 21);
}

function apostarRojo(apuesta: number): number {
  while (true) {
    const r = girarRuleta();
    if (r < 10) return +apuesta;
    if (r < 20) return -apuesta;
    // verde: seguir girando
  }
}

function estrategiaFija(capitalInicial: number, numJuegos: number): number {
  let capital = capitalInicial;
  for (let i = 0; i < numJuegos && capital > 0; i++) {
    const apuesta = Math.min(1, capital);
    capital += apostarRojo(apuesta);
  }
  return capital;
}

function estrategiaMartingala(capitalInicial: number, numJuegos: number): number {
  let capital = capitalInicial;
  let apuestaActual = 1;

  for (let i = 0; i < numJuegos && capital > 0; i++) {
    const apuesta = Math.min(apuestaActual, Math.min(500, capital));
    const resultado = apostarRojo(apuesta);
    capital += resultado;

    if (resultado > 0) {
      apuestaActual = 1;
    } else {
      apuestaActual = Math.min(apuestaActual * 2, 500);
      if (apuesta === 500 && resultado < 0) {
        apuestaActual = 1;
      }
    }
  }
  return capital;
}

/* ================================
   Helpers
================================ */

function buildRejectionResult(points: RejectionPoint[], acceptedX: number[], divisorX: number): RejectionResult {
  const total = points.length;
  const aceptados = points.filter((p) => p.aceptado).length;
  const rechazados = total - aceptados;
  const tasaAceptacion = total ? (aceptados / total) * 100 : 0;
  const tasaRechazo = 100 - tasaAceptacion;

  return {
    points,
    acceptedX,
    divisorX,
    stats: { total, aceptados, rechazados, tasaAceptacion, tasaRechazo },
  };
}

function generatePairs(n: number, min: number, max: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  if (!(min >= 0 && max <= 1 && min < max)) {
    min = 0;
    max = 1;
  }
  for (let i = 0; i < n; i++) {
    out.push([randRange(min, max), randRange(min, max)]);
  }
  return out;
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function randRange(min: number, max: number): number {
  return min + (max - min) * Math.random();
}

function randInt(min: number, max: number): number {
  // inclusive
  return Math.floor(randRange(min, max + 1));
}
