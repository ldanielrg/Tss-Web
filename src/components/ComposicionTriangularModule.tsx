// src/components/ConposicionTriangularModule.tsx
import React, { useMemo, useState } from 'react';
import { Play, Clock, Divide } from 'lucide-react';
import Tooltip from './Tooltip';
import DistributionChart from './ComposicionTriangularChart';
import { runExercise12, type Exercise12Output, type Exercise12Params } from '../utils/composicionTriangularSimulator';

const DEFAULT_PARAMS: Exercise12Params = {
  x1: 8,
  y1: 0.25,
  x2: 9,
  y2: 0.75,
  x3: 10,
  y3: 0.25,
  n: 10000,
  seed: 12345,
  bins: 25
};

export default function ConposicionTriangularModule() {
  const [p, setP] = useState<Exercise12Params>({ ...DEFAULT_PARAMS });
  const [result, setResult] = useState<Exercise12Output | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fixedSeed, setFixedSeed] = useState(false);

  const theme = useMemo(
    () => ({
      btn: 'bg-cyan-600 hover:bg-cyan-700',
      ring: 'focus:ring-cyan-500',
    }),
    []
  );

  const validate = (): string | null => {
    if (!(p.x1 < p.x2 && p.x2 < p.x3)) return 'Debe cumplirse: x1 < x2 < x3';
    if (p.y1 < 0 || p.y2 < 0 || p.y3 < 0) return 'Los valores y deben ser ≥ 0';
    if (p.n < 1 || p.n > 1_000_000) return 'Simulaciones n debe estar entre 1 y 1,000,000';
    if (p.bins < 5 || p.bins > 200) return 'Bins debe estar entre 5 y 200';
    if (fixedSeed && !Number.isFinite(p.seed)) return 'Semilla inválida';
    return null;
  };

  const theory = useMemo(() => {
    const { x1, y1, x2, y2, x3, y3 } = p;

    const A1 = 0.5 * (x2 - x1) * (y1 + y2);
    const A2 = 0.5 * (x3 - x2) * (y2 + y3);
    const AT = A1 + A2;

    const p1 = AT > 0 ? A1 / AT : 0.5;
    const p2 = 1 - p1;

    const m1 = (y2 - y1) / (x2 - x1);
    const m2 = (y3 - y2) / (x3 - x2);

    const isDefault =
      Math.abs(x1 - 8) < 1e-12 &&
      Math.abs(x2 - 9) < 1e-12 &&
      Math.abs(x3 - 10) < 1e-12 &&
      Math.abs(y1 - 0.25) < 1e-12 &&
      Math.abs(y2 - 0.75) < 1e-12 &&
      Math.abs(y3 - 0.25) < 1e-12;

    return { A1, A2, AT, p1, p2, m1, m2, isDefault };
  }, [p]);

  const f6 = (x: number) => x.toFixed(6);
  const f4 = (x: number) => x.toFixed(4);

  const run = () => {
    setError(null);
    const e = validate();
    if (e) return setError(e);

    setIsSimulating(true);

    setTimeout(() => {
      let seedToUse = Math.trunc(p.seed);

      if (!fixedSeed) {
        if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
          const arr = new Uint32Array(1);
          crypto.getRandomValues(arr);
          seedToUse = (arr[0] % 2147483646) + 1;
        } else {
          seedToUse = Math.floor(Math.random() * 2147483646) + 1;
        }
      }

      const paramsToRun = { ...p, seed: seedToUse };
      setP(paramsToRun);
      setResult(runExercise12(paramsToRun));
      setIsSimulating(false);
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Método de Composición – Distribución Triangular</h2>
        <p className="text-gray-600 mt-2">
          Generación de X con densidad lineal por tramos definida por tres puntos (x1,y1)-(x2,y2)-(x3,y3).
          Se usa composición para elegir región y transformada inversa condicional para generar el valor.
        </p>
      </div>

{/* Fundamento Matemático (APARTADO DE FÓRMULAS) */}
<div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
  <div className="grid md:grid-cols-2 gap-6 mt-2">
    {/* Caja 1: densidad por partes */}
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-semibold text-gray-900 mb-2">Función de densidad por partes</h3>

      <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800">{`Sea x1 < x2 < x3 y soporte [x1, x3].

Pendientes:
m1 = (y2 - y1)/(x2 - x1) = ${f6(theory.m1)}
m2 = (y3 - y2)/(x3 - x2) = ${f6(theory.m2)}

Densidad NO normalizada (lineal por tramos):
g(x) =
  y1 + m1(x - x1),           x1 ≤ x ≤ x2
  y2 + m2(x - x2),           x2 < x ≤ x3
  0,                         otro caso

Densidad final (normalizada):
f(x) = g(x) / A

Con tus parámetros actuales:
x1=${p.x1}, y1=${p.y1}
x2=${p.x2}, y2=${p.y2}
x3=${p.x3}, y3=${p.y3}`}</pre>
    </div>

    {/* Caja 2: normalización y probabilidades */}
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-semibold text-gray-900 mb-2">Normalización y probabilidades</h3>

      <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800">{`Área total:
A = A1 + A2

A1 = 0.5 (x2 - x1) (y1 + y2)    (tramo izq)
A2 = 0.5 (x3 - x2) (y2 + y3)    (tramo der)

Valores actuales:
A1 = ${f6(theory.A1)}   (${f4((theory.A1 / (theory.AT || 1)) * 100)}%)
A2 = ${f6(theory.A2)}   (${f4((theory.A2 / (theory.AT || 1)) * 100)}%)
A  = ${f6(theory.AT)}

Probabilidades para composición:
p1 = A1 / A = ${f6(theory.p1)}  (${f4(theory.p1 * 100)}%)
p2 = A2 / A = ${f6(theory.p2)}  (${f4(theory.p2 * 100)}%)`}</pre>
    </div>
  </div>

  {/* Caja grande: algoritmo */}
  <div className="mt-6 bg-white rounded-lg border p-4">
    <h3 className="font-semibold text-gray-900 mb-2">Algoritmo del método de Composición (paso a paso)</h3>

    <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800">{`Paso 1) Generar dos uniformes independientes:
   U1 ~ U(0,1)   (selección de región)
   U2 ~ U(0,1)   (generación del valor)

Paso 2) Seleccionar la región por "ruleta":
   Si U1 ≤ p1  ⇒ región 1  [x1, x2]
   Si U1 > p1  ⇒ región 2  [x2, x3]

Paso 3) Generar X condicionado a la región (transformada inversa condicional):
   En cada tramo la densidad es LINEAL:
     h(x) = h0 + m (x - x0)
   y su CDF (en t = x - x0) es CUADRÁTICA:
     F(t) = (h0·t + 0.5·m·t²) / ÁreaTramo

   Para invertir, resolvemos:
     0.5·m·t² + h0·t - U2·ÁreaTramo = 0
   y tomamos la raíz que deja x = x0 + t dentro del intervalo.

${theory.isDefault ? `Con los valores por defecto (8,0.25)-(9,0.75)-(10,0.25):
   Región 1: x = (15 + sqrt(8·u + 1)) / 2
   Región 2: x = (21 - sqrt(-8·u + 9)) / 2` : `Nota: si cambias (x1,y1,x2,y2,x3,y3), la inversa se obtiene igual
(resolviendo la cuadrática) y el simulador lo hace automáticamente.`}

Paso 4) Repetir n veces:
   - Histograma (densidad)
   - Curva teórica f(x)
   - % por región simulado vs teórico (p1, p2)`}</pre>
  </div>
</div>


      <div className="grid lg:grid-cols-3 gap-6">
        {/* Panel parámetros */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center space-x-3">
              <Divide className="w-6 h-6 text-cyan-600" />
              <div className="text-left">
                <h3 className="text-lg font-semibold">Parámetros</h3>
                <p className="text-sm text-gray-600">Distribución triangular (f₁, f₂)</p>
              </div>
            </div>

            <hr className="my-4" />

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Field label="x1" value={p.x1} onChange={(v) => setP((x) => ({ ...x, x1: v }))} ring={theme.ring} />
                <Field label="y1" value={p.y1} onChange={(v) => setP((x) => ({ ...x, y1: v }))} ring={theme.ring} />
                <div />
                <Field label="x2" value={p.x2} onChange={(v) => setP((x) => ({ ...x, x2: v }))} ring={theme.ring} />
                <Field label="y2" value={p.y2} onChange={(v) => setP((x) => ({ ...x, y2: v }))} ring={theme.ring} />
                <div />
                <Field label="x3" value={p.x3} onChange={(v) => setP((x) => ({ ...x, x3: v }))} ring={theme.ring} />
                <Field label="y3" value={p.y3} onChange={(v) => setP((x) => ({ ...x, y3: v }))} ring={theme.ring} />
                <div />
              </div>

              <Field
                label="Número de simulaciones (n)"
                value={p.n}
                integer
                step={1}
                min={1}
                onChange={(v) => setP((x) => ({ ...x, n: Math.max(1, v) }))}
                ring={theme.ring}
              />

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Semilla (LCG)"
                  tooltip="Semilla del generador congruencial mixto"
                  value={p.seed}
                  integer
                  step={1}
                  onChange={(v) => setP((x) => ({ ...x, seed: v }))}
                  ring={theme.ring}
                />
                <Field
                  label="Bins (histograma)"
                  value={p.bins}
                  integer
                  step={1}
                  min={5}
                  onChange={(v) => setP((x) => ({ ...x, bins: Math.max(5, v) }))}
                  ring={theme.ring}
                />

                <div className="flex items-center gap-2 mt-2">
                  <input
                    id="fixedSeedEx2"
                    type="checkbox"
                    checked={fixedSeed}
                    onChange={(e) => setFixedSeed(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="fixedSeedEx2" className="text-sm text-gray-700">
                    Usar semilla fija (repetible)
                  </label>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                {error}
              </div>
            )}

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

        {/* Panel resultados */}
        <div className="lg:col-span-2 space-y-6">
          {!result && !isSimulating && (
            <div className="bg-white p-12 rounded-lg shadow-md text-center">
              <div className="text-gray-400 mb-4">
                <Clock className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin Simulación</h3>
              <p className="text-gray-600">Configura parámetros y ejecuta para ver resultados.</p>
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

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3">Histograma vs Teórico</h3>
                <DistributionChart
                  title="Distribución triangular (f₁, f₂) – Histograma (densidad) vs f(x) teórica"
                  labels={result.chart.labels}
                  histDensity={result.chart.histDensity}
                  theoPdf={result.chart.theoPdf}
                />
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3">Estadísticas por región</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border p-2 text-left">Región</th>
                        <th className="border p-2 text-left">Conteo</th>
                        <th className="border p-2 text-left">% Sim</th>
                        <th className="border p-2 text-left">% Teórico</th>
                        <th className="border p-2 text-left">Diff</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.regionStats.map((r) => (
                        <tr key={r.region}>
                          <td className="border p-2 font-medium">{r.region}</td>
                          <td className="border p-2">{r.count}</td>
                          <td className="border p-2">{r.pct.toFixed(2)}%</td>
                          <td className="border p-2">{r.theoPct.toFixed(2)}%</td>
                          <td className="border p-2">{r.diffPct.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3">Primeras 20 simulaciones</h3>

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

                <div className="text-sm text-gray-500 mt-2">Mostrando 20 filas</div>
              </div>
            </>
          )}
        </div>
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
