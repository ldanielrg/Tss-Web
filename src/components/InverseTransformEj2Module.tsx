// src/components/InverseTransformEj2Module.tsx
import { useMemo, useState } from 'react';
import { Play, Clock, Divide } from 'lucide-react';
import Tooltip from './Tooltip';
import InverseTransformEj2HistChart from './InverseTransformEj2HistChart';
import InverseTransformEj2ScatterChart from './InverseTransformEj2ScatterChart';
import {
  runInverseTransformEj2,
  type InverseTransformEj2Output,
  type InverseTransformEj2Params,
  type InverseTransformEj2Side,
} from '../utils/inverseTransformEj2Simulator';

const DEFAULT_PARAMS: InverseTransformEj2Params = {
  a: 0,
  b: 2.5,
  c: 5,
  n: 10000,
  seed: 20250915,
  side: 'left',
  bins: 25,
};

export default function InverseTransformEj2Module() {
  const [showFullOverlay, setShowFullOverlay] = useState(true);
  const [p, setP] = useState<InverseTransformEj2Params>({ ...DEFAULT_PARAMS });
  const [result, setResult] = useState<InverseTransformEj2Output | null>(null);
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

  const validate = (): string | null => {
    if (!Number.isFinite(p.a) || !Number.isFinite(p.b) || !Number.isFinite(p.c)) return 'a, b, c deben ser numéricos';
    if (!(p.a < p.b && p.b < p.c)) return 'Debe cumplirse: a < b < c';
    if (p.n < 1 || p.n > 1_000_000) return 'n debe estar entre 1 y 1,000,000';
    if (p.bins < 5 || p.bins > 200) return 'bins debe estar entre 5 y 200';
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
      setP(paramsToRun);
      setResult(runInverseTransformEj2(paramsToRun));
      setIsSimulating(false);
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Transformada Inversa — Triangular</h2>
        <p className="text-gray-600 mt-2">
          Transformada inversa por tramo (seleccionas Izq [a,b] o Der [b,c]) para una densidad triangular normalizada
          en el intervalo elegido. (Basado en el algoritmo del Java). 
        </p>
      </div>

      {/* Fundamento matemático */}
      <div className={`${theme.box} rounded-lg p-6`}>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Tramo Izquierdo [a,b]</h3>
            <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800">{`Inversa:
x = a + (b-a)·√R

PDF:
f1(x) = 2(x-a)/(b-a)²,   a ≤ x ≤ b

Teórico:
E[X] = a + 2(b-a)/3
Var(X) = (b-a)²/18`}</pre>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Tramo Derecho [b,c]</h3>
            <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800">{`Inversa:
x = c - (c-b)·√(1-R)

PDF:
f2(x) = 2(c-x)/(c-b)²,   b ≤ x ≤ c

Teórico:
E[X] = c - 2(c-b)/3
Var(X) = (c-b)²/18`}</pre>
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-3">
          Fórmulas y validaciones tomadas del Java (comentarios y funciones f1/f2). 
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
                <p className="text-sm text-gray-600">a, b, c, lado, n, semilla</p>
              </div>
            </div>

            <hr className="my-4" />

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Field label="a (mín)" value={p.a} onChange={(v) => setP((x) => ({ ...x, a: v }))} ring={theme.ring} />
                <Field label="b (modo)" value={p.b} onChange={(v) => setP((x) => ({ ...x, b: v }))} ring={theme.ring} />
                <Field label="c (máx)" value={p.c} onChange={(v) => setP((x) => ({ ...x, c: v }))} ring={theme.ring} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lado
                  <Tooltip content="Equivale al combo del Java: Izq [a,b] o Der [b,c]">
                    <span className="ml-1 text-gray-400 cursor-help">ⓘ</span>
                  </Tooltip>
                </label>
                <select
                value={p.side}
                onChange={(e) => setP((x) => ({ ...x, side: e.target.value as any }))}
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 ${theme.ring} focus:border-transparent`}
                >
                <option value="left">Izq [a,b]</option>
                <option value="right">Der [b,c]</option>
                <option value="full">Triángulo completo [a,c]</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                    id="overlayFullTri"
                    type="checkbox"
                    checked={showFullOverlay}
                    onChange={(e) => setShowFullOverlay(e.target.checked)}
                    className="h-4 w-4"
                />
                <label htmlFor="overlayFullTri" className="text-sm text-gray-700">
                    Mostrar overlay del triángulo completo
                </label>
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
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="fixedSeedInv2"
                  type="checkbox"
                  checked={fixedSeed}
                  onChange={(e) => setFixedSeed(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="fixedSeedInv2" className="text-sm text-gray-700">
                  Usar semilla fija (repetible)
                </label>
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
                <h3 className="text-lg font-semibold mb-3">Histograma vs Teórico (en [a,c])</h3>
                <InverseTransformEj2HistChart
                title="Ej 2 — Histograma (densidad) vs f(x)"
                labels={result.hist.labels}
                histDensity={result.hist.histDensity}
                theoPdf={result.hist.theoPdf}
                fullTheoPdf={result.hist.fullTheoPdf}
                showFullOverlay={showFullOverlay}
                />
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3">Dispersión (x, f(x)) (como el Java)</h3>
                <InverseTransformEj2ScatterChart
                title="Ej 2 — Puntos (x,f(x)) + guía"
                x={result.scatter.x}
                fx={result.scatter.fx}
                theoLine={result.scatter.theoLine}
                fullTheoLine={result.scatter.fullTheoLine}
                showFullOverlay={showFullOverlay}
                />
                <div className="text-xs text-gray-500 mt-2">
                  Nota: se limita automáticamente la cantidad de puntos si n es muy grande.
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
