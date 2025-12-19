import React, { useEffect, useMemo, useState } from 'react';
import { Play, Clock, Server } from 'lucide-react';
import Tooltip from './Tooltip';
import ServiceSystemsChart from './ServiceSystemsChart';
import {
  runSerie,
  runBanco,
  runEstacionamiento,
  type SimulationOutput,
  type SerieParams,
  type BancoParams,
  type EstacionamientoParams,
} from '../utils/serviceSystemsSimulator';

type Kind = 'serie' | 'banco' | 'estacionamiento';

type Props = {
  initialKind?: Kind;
  showSelector?: boolean;
};

const DEFAULT_SERIE: SerieParams = {
  lambdaPerHour: 20,
  mu1MeanMin: 2,
  s2MinMin: 1,
  s2MaxMin: 3,
  cierreHours: 8,
};

const DEFAULT_BANCO: BancoParams = {
  lambdaPerHour: 40,
  numeroCajeros: 3,
  sMinMin: 0,
  sMaxMin: 1,
  cierreHours: 8,
};

const DEFAULT_EST: EstacionamientoParams = {
  lambdaPerHour: 10,
  capacidad: 6,
  sMinMin: 10,
  sMaxMin: 30,
  cierreHours: 8,
};

export default function ServiceSystemsModule({
  initialKind = 'serie',
  showSelector = true,
}: Props) {
  const [kind, setKind] = useState<Kind>(initialKind);

  const [serie, setSerie] = useState<SerieParams>({ ...DEFAULT_SERIE });
  const [banco, setBanco] = useState<BancoParams>({ ...DEFAULT_BANCO });
  const [est, setEst] = useState<EstacionamientoParams>({ ...DEFAULT_EST });

  const [result, setResult] = useState<SimulationOutput | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
    setKind(initialKind);
    setResult(null);
    setError(null);
  }, [initialKind]);

  const MIN_PER_H = 60;

  const theme = useMemo(() => {
    if (kind === 'serie')
      return {
        btn: 'bg-indigo-600 hover:bg-indigo-700',
        ring: 'focus:ring-indigo-500',
        pill: 'border-indigo-500 bg-indigo-50 text-indigo-700',
      };
    if (kind === 'banco')
      return {
        btn: 'bg-green-600 hover:bg-green-700',
        ring: 'focus:ring-green-500',
        pill: 'border-green-500 bg-green-50 text-green-700',
      };
    return {
      btn: 'bg-orange-600 hover:bg-orange-700',
      ring: 'focus:ring-orange-500',
      pill: 'border-orange-500 bg-orange-50 text-orange-700',
    };
  }, [kind]);

  const validate = (): string | null => {
    if (kind === 'serie') {
      if (serie.lambdaPerHour <= 0) return 'Lambda debe ser > 0';
      if (serie.mu1MeanMin <= 0) return 'Media S1 debe ser > 0';
      if (serie.s2MaxMin <= serie.s2MinMin) return 'S2 max debe ser > S2 min';
      if (serie.cierreHours <= 0) return 'Cierre (horas) debe ser > 0';
    }
    if (kind === 'banco') {
      if (banco.lambdaPerHour <= 0) return 'Lambda debe ser > 0';
      if (banco.numeroCajeros < 1) return 'Cajeros debe ser >= 1';
      if (banco.sMaxMin <= banco.sMinMin) return 'Servicio max debe ser > min';
      if (banco.cierreHours <= 0) return 'Cierre (horas) debe ser > 0';
    }
    if (kind === 'estacionamiento') {
      if (est.lambdaPerHour <= 0) return 'Lambda debe ser > 0';
      if (est.capacidad < 1) return 'Capacidad debe ser >= 1';
      if (est.sMaxMin <= est.sMinMin) return 'Duración max debe ser > min';
      if (est.cierreHours <= 0) return 'Cierre (horas) debe ser > 0';
    }
    return null;
  };

  const run = () => {
    setError(null);
    const e = validate();
    if (e) return setError(e);

    setIsSimulating(true);
    setTimeout(() => {
      if (kind === 'serie') setResult(runSerie(serie));
      if (kind === 'banco') setResult(runBanco(banco));
      if (kind === 'estacionamiento') setResult(runEstacionamiento(est));
      setIsSimulating(false);
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Card de título (sin banner para evitar doble panel) */}

      {showSelector && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 rounded-lg flex items-center justify-center">
              <Server className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold">Seleccionar Sistema</h3>
            </div>
          </div>

          <p className="text-sm text-gray-600 mt-1">Serie / Banco / Estacionamiento</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <button
              type="button"
              onClick={() => {
                setKind('serie');
                setResult(null);
              }}
              className={`px-3 py-3 rounded-lg border-2 transition-colors text-left ${
                kind === 'serie' ? theme.pill : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">Serie</div>
              <div className="text-xs text-gray-500">2 estaciones (Exp + Uniforme)</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setKind('banco');
                setResult(null);
              }}
              className={`px-3 py-3 rounded-lg border-2 transition-colors text-left ${
                kind === 'banco' ? theme.pill : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">Banco</div>
              <div className="text-xs text-gray-500">N cajeros, servicio uniforme</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setKind('estacionamiento');
                setResult(null);
              }}
              className={`px-3 py-3 rounded-lg border-2 transition-colors text-left ${
                kind === 'estacionamiento' ? theme.pill : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">Estacionamiento</div>
              <div className="text-xs text-gray-500">Capacidad finita (sin cola)</div>
            </button>
          </div>
        </div>
      )}
      <ServiceHeader kind={kind} />
      <TheoryPanel kind={kind} serie={serie} banco={banco} est={est} />
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Panel de parámetros */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            {showSelector && (
              <>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center">
                    <Server className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold">Seleccionar Sistema</h3>
                  </div>
                </div>

                <p className="text-sm text-gray-600">Serie / Banco / Estacionamiento</p>

                <div className="grid grid-cols-1 gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setKind('serie');
                      setResult(null);
                    }}
                    className={`px-3 py-3 rounded-lg border-2 transition-colors text-left ${
                      kind === 'serie' ? theme.pill : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">Serie</div>
                    <div className="text-xs text-gray-500">2 estaciones (Exp + Uniforme)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setKind('banco');
                      setResult(null);
                    }}
                    className={`px-3 py-3 rounded-lg border-2 transition-colors text-left ${
                      kind === 'banco' ? theme.pill : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">Banco</div>
                    <div className="text-xs text-gray-500">N cajeros, servicio uniforme</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setKind('estacionamiento');
                      setResult(null);
                    }}
                    className={`px-3 py-3 rounded-lg border-2 transition-colors text-left ${
                      kind === 'estacionamiento' ? theme.pill : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">Estacionamiento</div>
                    <div className="text-xs text-gray-500">Capacidad finita (sin cola)</div>
                  </button>
                </div>
              </>
            )}

            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold">Parámetros de Sistema de Servicio</h3>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                {error}
              </div>
            )}

            <div className="mt-5 space-y-4">
              {kind === 'serie' && (
                <>
                  <Field
                    label="Lambda (clientes/hora)"
                    value={serie.lambdaPerHour}
                    onChange={(v) => setSerie((p) => ({ ...p, lambdaPerHour: v }))}
                    ring={theme.ring}
                  />
                  <Field
                    label="Media S1 Exp (min)"
                    value={serie.mu1MeanMin}
                    onChange={(v) => setSerie((p) => ({ ...p, mu1MeanMin: v }))}
                    ring={theme.ring}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="S2 min (min)"
                      value={serie.s2MinMin}
                      onChange={(v) => setSerie((p) => ({ ...p, s2MinMin: v }))}
                      ring={theme.ring}
                    />
                    <Field
                      label="S2 max (min)"
                      value={serie.s2MaxMin}
                      onChange={(v) => setSerie((p) => ({ ...p, s2MaxMin: v }))}
                      ring={theme.ring}
                    />
                  </div>
                  <Field
                    label="Hora de cierre (HORAS)"
                    tooltip="Después del cierre no entran más, pero se atiende lo que ya llegó."
                    value={serie.cierreHours}
                    onChange={(v) => setSerie((p) => ({ ...p, cierreHours: v }))}
                    ring={theme.ring}
                  />
                </>
              )}

              {kind === 'banco' && (
                <>
                  <Field
                    label="Lambda (clientes/hora)"
                    value={banco.lambdaPerHour}
                    onChange={(v) => setBanco((p) => ({ ...p, lambdaPerHour: v }))}
                    ring={theme.ring}
                  />
                  <Field
                    label="Cajeros (N)"
                    value={banco.numeroCajeros}
                    step={1}
                    min={1}
                    integer
                    onChange={(v) => setBanco((p) => ({ ...p, numeroCajeros: Math.max(1, v) }))}
                    ring={theme.ring}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Servicio min (min)"
                      value={banco.sMinMin}
                      onChange={(v) => setBanco((p) => ({ ...p, sMinMin: v }))}
                      ring={theme.ring}
                    />
                    <Field
                      label="Servicio max (min)"
                      value={banco.sMaxMin}
                      onChange={(v) => setBanco((p) => ({ ...p, sMaxMin: v }))}
                      ring={theme.ring}
                    />
                  </div>
                  <Field
                    label="Hora de cierre (HORAS)"
                    value={banco.cierreHours}
                    onChange={(v) => setBanco((p) => ({ ...p, cierreHours: v }))}
                    ring={theme.ring}
                  />
                </>
              )}

              {kind === 'estacionamiento' && (
                <>
                  <Field
                    label="Lambda (vehículos/hora)"
                    value={est.lambdaPerHour}
                    onChange={(v) => setEst((p) => ({ ...p, lambdaPerHour: v }))}
                    ring={theme.ring}
                  />
                  <Field
                    label="Capacidad"
                    value={est.capacidad}
                    step={1}
                    min={1}
                    integer
                    onChange={(v) => setEst((p) => ({ ...p, capacidad: Math.max(1, v) }))}
                    ring={theme.ring}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Duración min (min)"
                      value={est.sMinMin}
                      onChange={(v) => setEst((p) => ({ ...p, sMinMin: v }))}
                      ring={theme.ring}
                    />
                    <Field
                      label="Duración max (min)"
                      value={est.sMaxMin}
                      onChange={(v) => setEst((p) => ({ ...p, sMaxMin: v }))}
                      ring={theme.ring}
                    />
                  </div>
                  <Field
                    label="Hora de cierre (HORAS)"
                    value={est.cierreHours}
                    onChange={(v) => setEst((p) => ({ ...p, cierreHours: v }))}
                    ring={theme.ring}
                  />
                </>
              )}
            </div>

            <button
              onClick={run}
              disabled={isSimulating}
              className={`w-full mt-6 ${theme.btn} disabled:opacity-60 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2`}
            >
              <Play className="w-4 h-4" />
              <span>{isSimulating ? 'Simulando...' : 'Ejecutar Simulación'}</span>
            </button>
          </div>
        </div>

        {/* Panel de resultados */}
        <div className="lg:col-span-2 space-y-6">
          {!result && !isSimulating && (
            <div className="bg-white p-12 rounded-lg shadow-md text-center">
              <div className="text-gray-400 mb-4">
                <Clock className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin Simulación</h3>
              <p className="text-gray-600">
                Configura los parámetros y ejecuta una simulación para ver los resultados.
              </p>
            </div>
          )}

          {result && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3">Resultados (métricas)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border p-2 text-left">Métrica</th>
                        <th className="border p-2 text-left">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(result.metrics).map(([k, v]) => (
                        <tr key={k}>
                          <td className="border p-2 font-medium">{k}</td>
                          <td className="border p-2">{String(v)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {result.series?.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-3">Gráfica</h3>
                  <ServiceSystemsChart
                    title={result.kind === 'estacionamiento' ? 'Ocupación vs tiempo' : 'Cola vs tiempo'}
                    series={result.series}
                  />
                </div>
              )}

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3">Tabla de resultados</h3>

                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-auto">
                    <table className="min-w-full text-sm border-collapse">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          {result.columns.map((c) => (
                            <th key={c} className="border p-2 text-left whitespace-nowrap">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.map((row, i) => (
                          <tr key={i} className="odd:bg-white even:bg-gray-50/40">
                            {row.map((cell, j) => (
                              <td key={j} className="border p-2 whitespace-nowrap">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="text-sm text-gray-500 mt-2">
                  Mostrando {result.rows.length} filas (scroll dentro de la tabla)
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ServiceHeader({ kind }: { kind: Kind }) {
  const title =
    kind === 'serie'
      ? 'Servicio: Serie (2 estaciones)'
      : kind === 'banco'
      ? 'Servicio: Banco (N cajeros)'
      : 'Servicio: Estacionamiento (capacidad finita)';

  const desc =
    kind === 'serie'
      ? 'Simulación de un sistema en serie con llegadas Poisson: estación 1 con servicio exponencial y estación 2 con servicio uniforme.'
      : kind === 'banco'
      ? 'Simulación de una cola con llegadas Poisson y N servidores en paralelo, con tiempos de servicio uniformes.'
      : 'Simulación de un estacionamiento sin cola: si está lleno, las llegadas se pierden. Duraciones de estadía uniformes.';

  return (
    <div className="mt-10">
      <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
      <p className="text-gray-600 mt-2">{desc}</p>
    </div>
  );
}


function TheoryPanel({
  kind,
  serie,
  banco,
  est,
}: {
  kind: Kind;
  serie: SerieParams;
  banco: BancoParams;
  est: EstacionamientoParams;
}) {
  const MIN_PER_H = 60;

  const fmt = (x: number, d = 3) => (Number.isFinite(x) ? x.toFixed(d) : '-');

  const palette =
    kind === 'serie'
      ? {
          wrap: 'bg-indigo-50 border-indigo-200',
          title: 'text-indigo-900',
          subtitle: 'text-indigo-700',
        }
      : kind === 'banco'
      ? {
          wrap: 'bg-green-50 border-green-200',
          title: 'text-green-900',
          subtitle: 'text-green-700',
        }
      : {
          wrap: 'bg-orange-50 border-orange-200',
          title: 'text-orange-900',
          subtitle: 'text-orange-700',
        };

  const lambdaPerHour =
    kind === 'serie' ? serie.lambdaPerHour : kind === 'banco' ? banco.lambdaPerHour : est.lambdaPerHour;

  const cierreHours =
    kind === 'serie' ? serie.cierreHours : kind === 'banco' ? banco.cierreHours : est.cierreHours;

  // interarribo en minutos: Exp(rate = lambda/60)
  const ratePerMin = lambdaPerHour / MIN_PER_H;
  const meanInterMin = ratePerMin > 0 ? 1 / ratePerMin : 0;

  return (
    <div className={`mt-4 p-6 rounded-lg border ${palette.wrap}`}>


      {/* 2 cards arriba */}
      <div className="grid md:grid-cols-2 gap-4 mt-5">
        {/* Card 1: Modelo / Distribuciones */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900">Modelo del sistema</h4>

          <div className="mt-3">
            <div className="text-sm font-medium text-gray-800">Llegadas (común a los 3)</div>
            <pre className="mt-2 text-xs bg-gray-50 border border-gray-200 rounded-md p-3 overflow-auto">
{`Proceso de llegadas: Poisson(λ por hora)

Interarribo (min):  T = -ln(U) / (λ/60)    con U ~ U(0,1)

Cierre:
- Solo se generan llegadas si t <= cierre
- cierre = ${fmt(cierreHours, 2)} horas`}
            </pre>
            <div className="text-xs text-gray-600 mt-2">
              Con λ = {fmt(lambdaPerHour, 2)}/h ⇒ E[Interarribo] ≈ {fmt(meanInterMin, 3)} min
            </div>
          </div>

          {kind === 'serie' && (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-800">Servicio</div>
              <pre className="mt-2 text-xs bg-gray-50 border border-gray-200 rounded-md p-3 overflow-auto">
{`Estación 1:  S1 ~ Exponencial(media = μ̄1)
S1 (min) = -μ̄1 * ln(U)

Estación 2:  S2 ~ Uniforme(a,b)
S2 (min) = a + (b-a)*U

Parámetros actuales:
μ̄1 = ${fmt(serie.mu1MeanMin, 2)} min
a  = ${fmt(serie.s2MinMin, 2)} min
b  = ${fmt(serie.s2MaxMin, 2)} min`}
              </pre>
            </div>
          )}

          {kind === 'banco' && (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-800">Servicio</div>
              <pre className="mt-2 text-xs bg-gray-50 border border-gray-200 rounded-md p-3 overflow-auto">
{`Banco con N cajeros (una sola cola)

Servicio: S ~ Uniforme(a,b)
S (min) = a + (b-a)*U

Parámetros actuales:
N = ${Math.max(1, Math.floor(banco.numeroCajeros))}
a = ${fmt(banco.sMinMin, 2)} min
b = ${fmt(banco.sMaxMin, 2)} min`}
              </pre>
            </div>
          )}

          {kind === 'estacionamiento' && (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-800">Regla del sistema</div>
              <pre className="mt-2 text-xs bg-gray-50 border border-gray-200 rounded-md p-3 overflow-auto">
{`Capacidad finita C, sin cola:

Si ocupados < C  -> entra (Atendido)
Si ocupados = C  -> se pierde (Perdido)

Duración: D ~ Uniforme(a,b)
D (min) = a + (b-a)*U

Parámetros actuales:
C = ${Math.max(1, Math.floor(est.capacidad))}
a = ${fmt(est.sMinMin, 2)} min
b = ${fmt(est.sMaxMin, 2)} min`}
              </pre>
            </div>
          )}
        </div>

        {/* Card 2: Métricas / Fórmulas */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900">Fórmulas que calcula el script</h4>

          {kind === 'serie' && (
            <>
              <pre className="mt-3 text-xs bg-gray-50 border border-gray-200 rounded-md p-3 overflow-auto">
{`Se actualizan áreas por tramos:
areaQ1 += |cola1| * Δt
areaQ2 += |cola2| * Δt
areaB1 += 1{s1 ocupado} * Δt
areaB2 += 1{s2 ocupado} * Δt

Al final (T = tiempo real hasta vaciar el sistema):
Lq1  = areaQ1 / T
Lq2  = areaQ2 / T
ρ1   = areaB1 / T
ρ2   = areaB2 / T
W̄(min) = (Σ (fin2 - llegada)) / atendidos`}
              </pre>
              <div className="text-xs text-gray-600 mt-2">
                Nota: el sistema sigue después del cierre hasta terminar a todos (T = reloj final).
              </div>
            </>
          )}

          {kind === 'banco' && (
            <>
              <pre className="mt-3 text-xs bg-gray-50 border border-gray-200 rounded-md p-3 overflow-auto">
{`Se actualizan áreas por tramos:
areaQ   += |cola| * Δt
occ      = #cajeros ocupados
areaSys += (|cola| + occ) * Δt

Al final (T = tiempo real hasta vaciar):
Lq = areaQ / T
Ls = areaSys / T
W̄(min) = (Σ (salida - llegada)) / atendidos

Además por cliente (en tabla):
TiempoCola = inicioServ - llegada
TiempoServ = salida - inicioServ
TiempoSist = salida - llegada`}
              </pre>
            </>
          )}

          {kind === 'estacionamiento' && (
            <>
              <pre className="mt-3 text-xs bg-gray-50 border border-gray-200 rounded-md p-3 overflow-auto">
{`IMPORTANTE: aquí se integra EXACTAMENTE hasta el cierre.

tiempoEnEstado[ocup] += Δt     (para ocup=0..C)
tiempoAcumOcup       += ocup * Δt

T = cierre (min)

p_lleno = tiempoEnEstado[C] / T
p_libre = 1 - p_lleno
ocupados_prom = tiempoAcumOcup / T
libres_prom   = C - ocupados_prom
%perdidos = 100*(perdidos/llegadas)`}
              </pre>
              <div className="text-xs text-gray-600 mt-2">
                Nota: pueden existir salidas después del cierre, pero las probabilidades se miden hasta el cierre.
              </div>
            </>
          )}
        </div>
      </div>

      {/* Card inferior: algoritmo */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
        <h4 className="font-semibold text-gray-900">Algoritmo de simulación (eventos)</h4>
        <pre className="mt-3 text-xs bg-gray-50 border border-gray-200 rounded-md p-3 overflow-auto">
{`1) Inicializar lista de eventos (ordenada por tiempo)
2) Generar 1ra llegada con ExpInterarribo (si <= cierre)
3) Mientras haya eventos:
   - Sacar el evento más próximo
   - Actualizar áreas/tiempos con Δt
   - Ejecutar lógica del evento:
     SERIE: LLEG -> entra cola1 ; FIN1 -> pasa a cola2 ; FIN2 -> sale
     BANCO: LLEG -> si hay cajero libre inicia, si no a cola ; SAL -> libera cajero y toma siguiente
     EST:   LLEG -> si hay lugar entra, si no se pierde ; SAL -> libera lugar
4) Calcular métricas con áreas / T y promedios por cliente`}
        </pre>
      </div>
    </div>
  );
}


function Field({
  label,
  value,
  onChange,
  tooltip,
  ring,
  step = 0.1,
  min,
  integer = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  tooltip?: string;
  ring: string;
  step?: number;
  min?: number;
  integer?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {tooltip && (
          <Tooltip content={tooltip}>
            <span className="ml-1 text-gray-400 cursor-help">ⓘ</span>
          </Tooltip>
        )}
      </label>

      <input
        type="number"
        step={step}
        min={min}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isFinite(n)) return;

          onChange(integer ? Math.trunc(n) : n);
        }}
        className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 ${ring} focus:border-transparent`}
      />
    </div>
  );
}

