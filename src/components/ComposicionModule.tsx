// src/components/ComposicionModule.tsx
import React, { useMemo, useState } from 'react';
import { Play, Clock, Divide } from 'lucide-react';
import Tooltip from './Tooltip';
import ComposicionChart from './ComposicionChart';
import { runComposicion, type ComposicionOutput, type ComposicionParams } from '../utils/composicionSimulator';


const DEFAULT_PARAMS: ComposicionParams = {
  a: 3,
  b: 7,
  c: 10,
  n: 10000,
  seed: 12345,
  bins: 25,
};

export default function ComposicionModule() {
  const [p, setP] = useState<ComposicionParams>({ ...DEFAULT_PARAMS });
  const [result, setResult] = useState<ComposicionOutput | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fixedSeed, setFixedSeed] = useState(false);

  const theme = useMemo(
    () => ({
      btn: 'bg-teal-600 hover:bg-teal-700',
      ring: 'focus:ring-teal-500',
    }),
    []
  );

    // === Bloque teórico (fórmulas) para mostrar en UI ===
    const theory = useMemo(() => {
      const a = p.a;
      const b = p.b;
      const c = p.c;

      // Altura normalizada (misma lógica que en tu simulación)
      // Área total = (h*a)/2 + h*(b-a) + (h*(c-b))/2 = 1
      const h = 2 / (a + 2 * (b - a) + (c - b));

      // Áreas (probabilidades) por región
      const A1 = (h * a) / 2;
      const A2 = h * (b - a);
      const A3 = (h * (c - b)) / 2;

      return { a, b, c, h, A1, A2, A3 };
    }, [p.a, p.b, p.c]);

    const f6 = (x: number) => x.toFixed(6);
    const f4 = (x: number) => x.toFixed(4);


  const validate = (): string | null => {
    if (!(p.a > 0)) return 'a debe ser > 0';
    if (!(p.a < p.b && p.b < p.c)) return 'Debe cumplirse: 0 < a < b < c';
    if (p.n < 1 || p.n > 1_000_000) return 'Simulaciones n debe estar entre 1 y 1,000,000';
    if (p.bins < 5 || p.bins > 200) return 'Bins debe estar entre 5 y 200';
    if (fixedSeed && !Number.isFinite(p.seed)) return 'Semilla inválida';

    return null;
  };

  const run = () => {
    setError(null);
    const e = validate();
    if (e) return setError(e);

    setIsSimulating(true);

    setTimeout(() => {
        let seedToUse = Math.trunc(p.seed);

        if (!fixedSeed) {
        // Semilla aleatoria real
        if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
            const arr = new Uint32Array(1);
            crypto.getRandomValues(arr);
            seedToUse = (arr[0] % 2147483646) + 1;
        } else {
            seedToUse = Math.floor(Math.random() * 2147483646) + 1;
        }
        }

        const paramsToRun = { ...p, seed: seedToUse };
        setP(paramsToRun);               // para que se vea la semilla usada
        setResult(runComposicion(paramsToRun));

        setIsSimulating(false);
    }, 200);
  };

  return (
    <div className="space-y-6">
        {/* ===== Encabezado (FUERA del panel, como Inventarios) ===== */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Método de Composición – Distribución Trapezoidal</h2>
        <p className="text-gray-600 mt-2">
          Generación de una variable aleatoria X con densidad trapezoidal usando composición en 3 sub-distribuciones:
          f₁ (triangular creciente), f₂ (uniforme) y f₃ (triangular decreciente).
        </p>
      </div>
      {/* ===== Fundamento Matemático (como en tus ejemplos) ===== */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">


        <div className="grid md:grid-cols-2 gap-6 mt-5">
          {/* Densidad por partes */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Función de densidad por partes</h3>

            <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800">
{`Sea 0 < a < b < c y soporte [0, c].

f(x) =
  (h/a)·x,                 0 ≤ x ≤ a
  h,                       a < x ≤ b
  (h/(c-b))·(c - x),        b < x ≤ c
  0,                       otro caso

Con tus parámetros actuales:
a=${theory.a}, b=${theory.b}, c=${theory.c}, h=${f6(theory.h)}`}
            </pre>
          </div>

          {/* Normalización + áreas */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Normalización (altura h) y probabilidades</h3>

            <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800">
{`Área total = A₁ + A₂ + A₃ = 1

A₁ = (h·a)/2          (triángulo izq)
A₂ = h·(b-a)          (rectángulo)
A₃ = (h·(c-b))/2      (triángulo der)

⇒ h = 2 / (a + 2(b-a) + (c-b))

Valores actuales:
A₁=${f6(theory.A1)}   (${f4(theory.A1 * 100)}%)
A₂=${f6(theory.A2)}   (${f4(theory.A2 * 100)}%)
A₃=${f6(theory.A3)}   (${f4(theory.A3 * 100)}%)
A₁+A₂+A₃=${f6(theory.A1 + theory.A2 + theory.A3)}`}
            </pre>
          </div>
        </div>

        {/* Algoritmo */}
        <div className="mt-6 bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Algoritmo del método de Composición (paso a paso)</h3>

          <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800">
{`Paso 1) Generar dos uniformes independientes:
        U₁ ~ U(0,1)  (selección de región)
        U₂ ~ U(0,1)  (generación del valor)

Paso 2) Seleccionar la región por “ruleta” usando A₁, A₂, A₃:
        Si U₁ ≤ A₁              ⇒ región f₁
        Si A₁ < U₁ ≤ A₁ + A₂     ⇒ región f₂
        Si U₁ > A₁ + A₂          ⇒ región f₃

Paso 3) Generar X condicionado a la región (transformada inversa condicional):

   Región f₁ (triangular creciente en [0,a]):
        X = a · √(U₂)

   Región f₂ (uniforme en [a,b]):
        X = a + (b-a) · U₂

   Región f₃ (triangular decreciente en [b,c]):
        X = c - (c-b) · √(1 - U₂)

Paso 4) Repetir n veces para obtener la muestra simulada y comparar:
        - Histograma (densidad)
        - Curva teórica f(x)
        - % por región simulado vs % teórico (A₁,A₂,A₃)`}
          </pre>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Panel parámetros */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center space-x-3">
              <Divide className="w-6 h-6 text-teal-600" />
              <div className="text-left">
                <h3 className="text-lg font-semibold">Composición</h3>
                <p className="text-sm text-gray-600">Distribución trapezoidal (f₁, f₂, f₃)</p>
              </div>
            </div>

            <hr className="my-4" />

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Field label="a" value={p.a} onChange={(v) => setP((x) => ({ ...x, a: v }))} ring={theme.ring} />
                <Field label="b" value={p.b} onChange={(v) => setP((x) => ({ ...x, b: v }))} ring={theme.ring} />
                <Field label="c" value={p.c} onChange={(v) => setP((x) => ({ ...x, c: v }))} ring={theme.ring} />
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
                    id="fixedSeed"
                    type="checkbox"
                    checked={fixedSeed}
                    onChange={(e) => setFixedSeed(e.target.checked)}
                    className="h-4 w-4"
                />
                <label htmlFor="fixedSeed" className="text-sm text-gray-700">
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
                <ComposicionChart
                  title="Distribución Trapezoidal (Composición)"
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
