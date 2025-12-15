// src/utils/serviceSystemsSimulator.ts
export type SystemKind = 'serie' | 'banco' | 'estacionamiento';

export interface BaseParams {
  /** Hora de cierre en HORAS: después de esto no entran más */
  cierreHours: number;
  /** Semilla opcional (para resultados repetibles) */
  seed?: number;
}

/** Sistema en Serie (2 estaciones) */
export interface SerieParams extends BaseParams {
  lambdaPerHour: number;   // llegadas / hora
  mu1MeanMin: number;      // media servicio est 1 (min) - Exp(media)
  s2MinMin: number;        // servicio est 2 min (min) - Uniforme
  s2MaxMin: number;        // servicio est 2 max (min) - Uniforme
}

/** Banco con N cajeros */
export interface BancoParams extends BaseParams {
  lambdaPerHour: number;   // llegadas / hora
  numeroCajeros: number;   // N
  sMinMin: number;         // servicio min (min) - Uniforme
  sMaxMin: number;         // servicio max (min) - Uniforme
}

/** Estacionamiento con capacidad C (sin cola: si está lleno se pierde) */
export interface EstacionamientoParams extends BaseParams {
  lambdaPerHour: number;   // llegadas / hora
  capacidad: number;       // C
  sMinMin: number;         // duración min (min) - Uniforme
  sMaxMin: number;         // duración max (min) - Uniforme
}

export type ServiceSystemsParams = SerieParams | BancoParams | EstacionamientoParams;

export interface TimeSeries {
  name: string;
  xHours: number[];
  y: number[];
}

export interface SimulationOutput {
  kind: SystemKind;
  /** Encabezados (como en tus tablas Java) */
  columns: string[];
  /** Filas completas (UI normalmente muestra primeras 20 como en Java) */
  rows: (string | number)[][];
  /** Métricas calculadas (separadas de la tabla) */
  metrics: Record<string, number | string>;
  /** Series listas para graficar */
  series: TimeSeries[];
}

const MIN_PER_H = 60;

const minToH = (m: number) => m / 60;
const fmtH = (m: number) => Number.isFinite(m) ? minToH(m).toFixed(6) : '-';
const fmtN = (x: number) => Number.isFinite(x) ? x.toFixed(6) : '-';

/** RNG determinístico (Mulberry32) si hay seed, o Math.random() si no. (igual a truckSimulator) */
function createRng(seed?: number): () => number {
  if (seed === undefined || seed === null) return Math.random;

  let a = (seed >>> 0) || 1;
  return function rng() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function expInterarrivalMin(lambdaPerHour: number, r: () => number): number {
  // interarrivals en minutos: Exp(rate = lambda/60)
  const ratePerMin = lambdaPerHour / MIN_PER_H;
  const u = Math.max(r(), 1e-12);
  return -Math.log(u) / ratePerMin;
}

function expWithMeanMin(meanMin: number, r: () => number): number {
  const u = Math.max(r(), 1e-12);
  return -meanMin * Math.log(u);
}

function uniformMin(a: number, b: number, r: () => number): number {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return lo + (hi - lo) * r();
}

type Ev<T extends string> = { t: number; type: T; cid?: number };
function pushSorted<T extends string>(list: Ev<T>[], ev: Ev<T>) {
  let i = 0;
  while (i < list.length && list[i].t <= ev.t) i++;
  list.splice(i, 0, ev);
}

/** ============ 1) SERIE ============ */
export function runSerie(p: SerieParams): SimulationOutput {
  const r = createRng(p.seed);
  const cierreMin = p.cierreHours * 60;

  type Cliente = {
    id: number;
    lleg: number;
    ini1?: number; fin1?: number;
    ini2?: number; fin2?: number;
  };

  const clientes = new Map<number, Cliente>();
  const cola1: number[] = [];
  const cola2: number[] = [];

  let reloj = 0;
  let nextId = 1;
  let s1Busy = false;
  let s2Busy = false;

  // stats (tipo “Excel” de Java)
  let atendidos = 0;
  let totalTSist = 0;
  let maxQ1 = 0, maxQ2 = 0;
  let areaQ1 = 0, areaQ2 = 0, areaB1 = 0, areaB2 = 0;
  let tLast = 0;

  const seriesQ1: {t:number,q:number}[] = [];
  const seriesQ2: {t:number,q:number}[] = [];

  const evs: Ev<'LLEG'|'FIN1'|'FIN2'>[] = [];

  const updateAreas = (tNew: number) => {
    const dt = tNew - tLast;
    if (dt > 0) {
      areaQ1 += cola1.length * dt;
      areaQ2 += cola2.length * dt;
      areaB1 += (s1Busy ? 1 : 0) * dt;
      areaB2 += (s2Busy ? 1 : 0) * dt;
      tLast = tNew;
    }
  };

  const tryStartS1 = () => {
    if (!s1Busy && cola1.length > 0) {
      const cid = cola1.shift()!;
      const c = clientes.get(cid)!;
      s1Busy = true;
      c.ini1 = reloj;
      const serv = expWithMeanMin(p.mu1MeanMin, r);
      c.fin1 = reloj + serv;
      pushSorted(evs, { t: c.fin1, type: 'FIN1', cid });
    }
  };

  const tryStartS2 = () => {
    if (!s2Busy && cola2.length > 0) {
      const cid = cola2.shift()!;
      const c = clientes.get(cid)!;
      s2Busy = true;
      c.ini2 = reloj;
      const serv = uniformMin(p.s2MinMin, p.s2MaxMin, r);
      c.fin2 = reloj + serv;
      pushSorted(evs, { t: c.fin2, type: 'FIN2', cid });
    }
  };

  // 1ra llegada (solo si cae antes del cierre)
  const t1 = expInterarrivalMin(p.lambdaPerHour, r);
  if (t1 <= cierreMin) pushSorted(evs, { t: t1, type: 'LLEG' });

  while (evs.length > 0) {
    const ev = evs.shift()!;
    updateAreas(ev.t);
    reloj = ev.t;

    seriesQ1.push({ t: reloj, q: cola1.length });
    seriesQ2.push({ t: reloj, q: cola2.length });

    if (ev.type === 'LLEG') {
      if (reloj > cierreMin) continue;

      const cid = nextId++;
      clientes.set(cid, { id: cid, lleg: reloj });
      cola1.push(cid);
      maxQ1 = Math.max(maxQ1, cola1.length);

      // próxima llegada SOLO si <= cierre
      const tNext = reloj + expInterarrivalMin(p.lambdaPerHour, r);
      if (tNext <= cierreMin) pushSorted(evs, { t: tNext, type: 'LLEG' });

      tryStartS1();
    }

    if (ev.type === 'FIN1') {
      s1Busy = false;
      cola2.push(ev.cid!);
      maxQ2 = Math.max(maxQ2, cola2.length);
      tryStartS2();
      tryStartS1();
    }

    if (ev.type === 'FIN2') {
      s2Busy = false;
      atendidos++;
      const c = clientes.get(ev.cid!)!;
      totalTSist += (reloj - c.lleg);
      tryStartS2();
    }
  }

  const T = Math.max(reloj, 1e-12);
  const Lq1 = areaQ1 / T;
  const Lq2 = areaQ2 / T;
  const rho1 = areaB1 / T;
  const rho2 = areaB2 / T;
  const WpromMin = atendidos > 0 ? totalTSist / atendidos : 0;

  // Tabla (cliente por fila)
  const columns = ['ID','tLlegada(h)','IniS1(h)','FinS1(h)','IniS2(h)','FinS2(h)','TSist(h)'];
  const rows: (string|number)[][] = [];
  const ids = Array.from(clientes.keys()).sort((a,b)=>a-b);
  for (const id of ids) {
    const c = clientes.get(id)!;
    if (c.fin2 == null) continue; // solo los que terminaron
    rows.push([
      c.id,
      fmtH(c.lleg),
      fmtH(c.ini1 ?? 0),
      fmtH(c.fin1 ?? 0),
      fmtH(c.ini2 ?? 0),
      fmtH(c.fin2 ?? 0),
      fmtH(c.fin2 - c.lleg),
    ]);
  }

  return {
    kind: 'serie',
    columns,
    rows,
    metrics: {
      cierre_h: p.cierreHours,
      fin_real_h: minToH(reloj),
      atendidos,
      Lq1,
      Lq2,
      rho1,
      rho2,
      W_prom_h: minToH(WpromMin),
      maxQ1,
      maxQ2,
    },
    series: [
      { name: 'Cola 1', xHours: seriesQ1.map(s=>minToH(s.t)), y: seriesQ1.map(s=>s.q) },
      { name: 'Cola 2', xHours: seriesQ2.map(s=>minToH(s.t)), y: seriesQ2.map(s=>s.q) },
    ],
  };
}

/** ============ 2) BANCO (N CAJEROS) ============ */
export function runBanco(p: BancoParams): SimulationOutput {
  const r = createRng(p.seed);
  const cierreMin = p.cierreHours * 60;
  const N = Math.max(1, Math.floor(p.numeroCajeros));

  type Cliente = {
    id: number;
    lleg: number;
    ini?: number;
    sal?: number;
    caj?: number;
  };

  const clientes = new Map<number, Cliente>();
  const cola: number[] = [];
  const busy: boolean[] = Array(N).fill(false);

  let reloj = 0;
  let nextId = 1;
  const evs: Ev<'LLEG'|'SAL'>[] = [];

  let atendidos = 0;
  let totalTSist = 0;
  let areaQ = 0;
  let areaSys = 0;
  let tLast = 0;
  let maxQ = 0;

  const seriesQ: {t:number,q:number}[] = [];

  const updateAreas = (tNew: number) => {
    const dt = tNew - tLast;
    if (dt > 0) {
      areaQ += cola.length * dt;
      const occ = busy.filter(Boolean).length;
      areaSys += (cola.length + occ) * dt;
      tLast = tNew;
    }
  };

  const freeCashier = () => busy.findIndex(b=>!b);

  const startService = (cid: number, caj: number) => {
    const c = clientes.get(cid)!;
    c.ini = reloj;
    c.caj = caj;
    busy[caj] = true;

    const serv = uniformMin(p.sMinMin, p.sMaxMin, r);
    c.sal = reloj + serv;
    pushSorted(evs, { t: c.sal, type: 'SAL', cid });
  };

  // 1ra llegada
  const t1 = expInterarrivalMin(p.lambdaPerHour, r);
  if (t1 <= cierreMin) {
    clientes.set(nextId, { id: nextId, lleg: t1 });
    pushSorted(evs, { t: t1, type: 'LLEG', cid: nextId });
    nextId++;
  }

  while (evs.length > 0) {
    const ev = evs.shift()!;
    updateAreas(ev.t);
    reloj = ev.t;

    seriesQ.push({ t: reloj, q: cola.length });

    if (ev.type === 'LLEG') {
      if (reloj > cierreMin) continue;

      const caj = freeCashier();
      if (caj !== -1) startService(ev.cid!, caj);
      else {
        cola.push(ev.cid!);
        maxQ = Math.max(maxQ, cola.length);
      }

      const tNext = reloj + expInterarrivalMin(p.lambdaPerHour, r);
      if (tNext <= cierreMin) {
        clientes.set(nextId, { id: nextId, lleg: tNext });
        pushSorted(evs, { t: tNext, type: 'LLEG', cid: nextId });
        nextId++;
      }
    }

    if (ev.type === 'SAL') {
      atendidos++;
      const c = clientes.get(ev.cid!)!;
      totalTSist += (reloj - c.lleg);

      const caj = c.caj!;
      busy[caj] = false;

      if (cola.length > 0) {
        const nxt = cola.shift()!;
        startService(nxt, caj);
      }
    }
  }

  const T = Math.max(reloj, 1e-12);
  const Lq = areaQ / T;
  const Ls = areaSys / T;
  const WpromMin = atendidos > 0 ? totalTSist / atendidos : 0;

  // Tabla EXACTA a la del Java (pero en horas): ID, tLlegada, tInicioServ, tSalida, TiempoCola, TiempoServ, TiempoSist, Cajero
  const columns = ['ID','tLlegada(h)','tInicioServ(h)','tSalida(h)','TiempoCola(h)','TiempoServ(h)','TiempoSist(h)','Cajero'];
  const rows: (string|number)[][] = [];
  const ids = Array.from(clientes.keys()).sort((a,b)=>a-b);
  for (const id of ids) {
    const c = clientes.get(id)!;
    if (c.sal == null) continue;
    const tCola = (c.ini! - c.lleg);
    const tServ = (c.sal! - c.ini!);
    const tSist = (c.sal! - c.lleg);
    rows.push([
      c.id,
      fmtH(c.lleg),
      fmtH(c.ini ?? 0),
      fmtH(c.sal ?? 0),
      fmtH(tCola),
      fmtH(tServ),
      fmtH(tSist),
      (c.caj ?? 0) + 1,
    ]);
  }

  return {
    kind: 'banco',
    columns,
    rows,
    metrics: {
      cierre_h: p.cierreHours,
      fin_real_h: minToH(reloj),
      atendidos,
      Lq,
      Ls,
      W_prom_h: minToH(WpromMin),
      maxQ,
    },
    series: [
      { name: 'Cola Banco', xHours: seriesQ.map(s=>minToH(s.t)), y: seriesQ.map(s=>s.q) },
    ],
  };
}

/** ============ 3) ESTACIONAMIENTO (C lugares, sin cola) ============ */
export function runEstacionamiento(p: EstacionamientoParams): SimulationOutput {
  const r = createRng(p.seed);
  const cierreMin = p.cierreHours * 60;
  const C = Math.max(1, Math.floor(p.capacidad));

  type Cliente = { id: number; lleg: number; ini?: number; sal?: number; lugar?: number };
  const clientes = new Map<number, Cliente>();

  // lugares (cid o null)
  const lugares: (number | null)[] = Array(C).fill(null);
  let ocup = 0;

  const evs: Ev<'LLEG'|'SAL'>[] = [];
  let reloj = 0;
  let nextId = 1;

  // stats (como el Java: tiempo en estado 0..C, ocupación promedio, etc.)
  const tiempoEnEstado = Array(C + 1).fill(0);
  let tiempoAcumOcup = 0;
  let tLast = 0;

  let llegadas = 0, atendidos = 0, perdidos = 0;

  const seriesOcc: {t:number, occ:number}[] = [];

  const integrarHasta = (tNew: number) => {
    const t2 = Math.min(tNew, cierreMin);
    const dt = t2 - tLast;
    if (dt > 0) {
      tiempoEnEstado[ocup] += dt;
      tiempoAcumOcup += ocup * dt;
      tLast = t2;
    }
  };

  const firstFree = () => lugares.findIndex(x => x === null);

  // 1ra llegada
  const t1 = expInterarrivalMin(p.lambdaPerHour, r);
  if (t1 <= cierreMin) {
    clientes.set(nextId, { id: nextId, lleg: t1 });
    pushSorted(evs, { t: t1, type: 'LLEG', cid: nextId });
    nextId++;
  }

  // Tabla EXACTA a la del Java (pero en horas): ID, tLlegada, Resultado, Lugar, tInicio, tSalida, Duración, Ocupados
  const columns = ['ID','tLlegada(h)','Resultado','Lugar','tInicio(h)','tSalida(h)','Duración(h)','Ocupados'];
  const rows: (string|number)[][] = [];

  while (evs.length > 0) {
    const ev = evs.shift()!;
    integrarHasta(ev.t);
    reloj = ev.t;

    seriesOcc.push({ t: reloj, occ: ocup });

    if (ev.type === 'LLEG') {
      if (reloj > cierreMin) continue;
      llegadas++;

      const c = clientes.get(ev.cid!)!;
      c.lleg = reloj;

      const idx = firstFree();
      if (idx !== -1) {
        // entra
        lugares[idx] = ev.cid!;
        ocup++;
        atendidos++;

        const dur = uniformMin(p.sMinMin, p.sMaxMin, r);
        c.lugar = idx;
        c.ini = reloj;
        c.sal = reloj + dur;
        pushSorted(evs, { t: c.sal, type: 'SAL', cid: ev.cid });

        rows.push([
          c.id,
          fmtH(c.lleg),
          'Atendido',
          String(idx),
          fmtH(c.ini),
          fmtH(c.sal),
          fmtH(dur),
          ocup,
        ]);
      } else {
        // perdido
        perdidos++;
        rows.push([
          c.id,
          fmtH(c.lleg),
          'Perdido',
          '-',
          '-',
          '-',
          '-',
          ocup,
        ]);
      }

      // próxima llegada
      const tNext = reloj + expInterarrivalMin(p.lambdaPerHour, r);
      if (tNext <= cierreMin) {
        clientes.set(nextId, { id: nextId, lleg: tNext });
        pushSorted(evs, { t: tNext, type: 'LLEG', cid: nextId });
        nextId++;
      }
    }

    if (ev.type === 'SAL') {
      const c = clientes.get(ev.cid!)!;
      const idx = c.lugar!;
      if (idx >= 0 && idx < C && lugares[idx] === ev.cid) {
        lugares[idx] = null;
        ocup--;
      }
    }
  }

  // integrar exactamente hasta el cierre
  integrarHasta(cierreMin);

  const T = Math.max(cierreMin, 1e-12);
  const pLleno = tiempoEnEstado[C] / T;
  const pLibre = 1 - pLleno;
  const ocupProm = tiempoAcumOcup / T;
  const libresProm = C - ocupProm;
  const perdPct = llegadas > 0 ? (100 * perdidos / llegadas) : 0;

  return {
    kind: 'estacionamiento',
    columns,
    rows,
    metrics: {
      cierre_h: p.cierreHours,
      fin_real_h: minToH(reloj),
      llegadas,
      atendidos,
      perdidos,
      perdidos_pct: Number(perdPct.toFixed(2)),
      p_disponible_pct: Number((100 * pLibre).toFixed(2)),
      p_lleno_pct: Number((100 * pLleno).toFixed(2)),
      ocupados_prom: Number(ocupProm.toFixed(3)),
      libres_prom: Number(libresProm.toFixed(3)),
    },
    series: [
      { name: 'Ocupación', xHours: seriesOcc.map(s=>minToH(s.t)), y: seriesOcc.map(s=>s.occ) },
    ],
  };
}
