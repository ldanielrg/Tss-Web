// src/components/InverseTransformEj1Module.tsx
import { useMemo, useState } from 'react';
import { Play, Clock, Divide } from 'lucide-react';
import Tooltip from './Tooltip';
import InverseTransformEj1Chart from './InverseTransformEj1Chart';
import InverseTransformEj1Scatter from './InverseTransformEj1Scatter';
import {
  runInverseTransformEj1,
  type InverseTransformEj1Output,
  type InverseTransformEj1Params,
} from '../utils/inverseTransformEj1Simulator';

const DEFAULT_PARAMS: InverseTransformEj1Params = {
  L: 0,
  U: 6,
  n: 10000,
  seed: 20250915,
  bins: 25,
};

export default function InverseTransformEj1Module() {
  const [p, setP] = useState<InverseTransformEj1Params>({ ...DEFAULT_PARAMS });
  const [result, setResult] = useState<InverseTransformEj1Output | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fixedSeed, setFixedSeed] = useState(false);

  const theme = useMemo(
    () => ({
      btn: 'bg-cyan-600 hover:bg-cyan-700',
      ring: 'focus:ring-cyan-500',
      box: 'bg-cyan-50 border border-cyan-200',
    }),
    []
  );

  const theory = useMemo(() => {
    const L = p.L;
    const U = p.U;
    const a = (L + U) / 2;
    const d = (U - L) / 2;

    // f(x) = 3/(2 d^3) (x-a)^2
    const K = d > 0 ? 3 / (2 * d * d * d) : NaN;

    // Inversa: x = a + d*cbrt(2R-1)
    const meanTheo = a;
    const varTheo = (3 * d * d) / 5;

    return { L, U, a, d, K, meanTheo, varTheo };
  }, [p.L, p.U]);

  const f6 = (x: number) => (Number.isFinite(x) ? x.toFixed(6) : 'NaN');

  const validate = (): string | null => {
    if (!Number.isFinite(p.L) || !Number.isFinite(p.U)) return 'L y U deben ser numéricos';
    if (!(p.U > p.L)) return 'Debe cumplirse: U > L';
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
        if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
          const arr = new Uint32Array(1);
          crypto.getRandomValues(arr);
          seedToUse = (arr[0] % 2147483646) + 1;
        } else {
          seedToUse = Math.floor(Math.random() * 2147483646) + 1;
        }
      }

      const paramsToRun = { ...p, seed: seedToUse };
      setP(paramsToRun); // mostrar semilla usada
      setResult(runInverseTransformEj1(paramsToRun));
      setIsSimulating(false);
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Transformada Inversa — Parabola</h2>
        <p className="text-gray-600 mt-2">
        Generación de X con densidad proporcional a (x-a)² en un soporte finito [L,U]. En el enunciado original:
        f(x) = (x - 3)² / 18 para 0 ≤ x ≤ 6.
        </p>
      </div>

      {/* Fundamento matemático */}
      <div className={`${theme.box} rounded-lg p-6`}>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Densidad (parametrizada)</h3>
            <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800">{`Parámetros:
L=${theory.L}, U=${theory.U}
a=(L+U)/2 = ${f6(theory.a)}
d=(U-L)/2 = ${f6(theory.d)}

f(x) = (3 / (2·d^3)) · (x - a)^2,   L ≤ x ≤ U
     = 0,                          otro caso

K = 3/(2·d^3) = ${f6(theory.K)}`}</pre>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-900 mb-2">CDF e Inversa</h3>
            <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800">{`F(x) = 1/2 + (x-a)^3 / (2·d^3),   L ≤ x ≤ U

Si R ~ U(0,1):
X = F^{-1}(R) = a + d·cbrt(2R - 1)

Caso original del Java:
X = cbrt(54·(R-1/2)) + 3  (equivalente cuando L=0, U=6).`}</pre>
            <div className="text-xs text-gray-500 mt-2">
              Referencia al Java original (fórmula fija) 
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Valores teóricos esperados</h3>
          <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800">{`E[X] = a = ${(theory.meanTheo).toFixed(6)}
Var(X) = 3·d^2/5 = ${(theory.varTheo).toFixed(6)}`}</pre>
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
                <p className="text-sm text-gray-600">Soporte [L,U], n, semilla, bins</p>
              </div>
            </div>

            <hr className="my-4" />

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="L (mín)" value={p.L} onChange={(v) => setP((x) => ({ ...x, L: v }))} ring={theme.ring} />
                <Field label="U (máx)" value={p.U} onChange={(v) => setP((x) => ({ ...x, U: v }))} ring={theme.ring} />
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
                  tooltip="Semilla del generador congruencial (como en otros módulos)"
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
                    id="fixedSeedInv"
                    type="checkbox"
                    checked={fixedSeed}
                    onChange={(e) => setFixedSeed(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="fixedSeedInv" className="text-sm text-gray-700">
                    Usar semilla fija (repetible)
                  </label>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
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
                <InverseTransformEj1Chart
                  title="Transformada Inversa (Ej 1) — Histograma (densidad) vs f(x)"
                  labels={result.chart.labels}
                  histDensity={result.chart.histDensity}
                  theoPdf={result.chart.theoPdf}
                />
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3">Relación (R, X)</h3>
                <InverseTransformEj1Scatter title="Relación (R, X)" r={result.scatter.r} x={result.scatter.x} />
                <div className="text-xs text-gray-500 mt-2">
                  (Se limita automáticamente la cantidad de puntos si n es muy grande)
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
