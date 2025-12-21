import React, { useMemo, useState } from "react";
import DataTableModal from "./DataTableModal";
import InverseScatterWithGuides from "./charts/InverseScatterWithGuides";

import {
  simulateExpMixtureByComposition,
  type ExpMixResult,
} from "../utils/exponentialMixtureComposition";

import {
  Ej1_8AreaDiagram,
  Ej1_8ChartSelector,
  Ej1_8ChartHistogramVsPdf,
  Ej1_8ChartEcdfVsCdf,
  Ej1_8StatsCards,
} from "./Ej1_8Charts";

const ComposicionExponencialMixtureModule: React.FC = () => {
  const [beta1, setBeta1] = useState("1.0");
  const [beta2, setBeta2] = useState("2.0");
  const [p, setP] = useState("0.5");
  const [N, setN] = useState("500");
  const [bins, setBins] = useState("40");

  const [result, setResult] = useState<ExpMixResult | null>(null);
  const [msg, setMsg] = useState("");
  const [showTable, setShowTable] = useState(false);

  const run = () => {
    const b1 = Number(beta1);
    const b2 = Number(beta2);
    const pp = Number(p);
    const n = Number(N);
    const bb = Number(bins);

    if (![b1, b2, pp, n, bb].every(Number.isFinite)) {
      setMsg("Ingresa valores válidos.");
      return;
    }
    if (b1 <= 0 || b2 <= 0) {
      setMsg("β1 y β2 deben ser > 0.");
      return;
    }
    if (pp < 0 || pp > 1) {
      setMsg("p debe estar en [0, 1].");
      return;
    }
    if (!Number.isInteger(n) || n <= 0) {
      setMsg("N debe ser un entero > 0.");
      return;
    }
    if (!Number.isInteger(bb) || bb < 10) {
      setMsg("bins debe ser un entero >= 10.");
      return;
    }

    const out = simulateExpMixtureByComposition({
      beta1: b1,
      beta2: b2,
      p: pp,
      N: n,
      bins: bb,
    });

    setResult(out);
    setMsg(`Simulación lista: N=${n}`);
  };

  const rowsForModal = useMemo(() => {
    if (!result?.rows?.length) return [];
    return result.rows.map((r) => ({
      ...r,
      R_sel: Number(r.R_sel).toFixed(4),
      U: Number(r.U).toFixed(4),
      X: Number(r.X).toFixed(6),
    }));
  }, [result]);

  const b1n = Number(beta1) || 0;
  const b2n = Number(beta2) || 0;
  const pn = Number(p) || 0;
  const Nn = Number(N) || 0;

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">
            Ejercicio 1–8 — Mezcla de dos Exponenciales (Método de Composición)
          </h3>
          <p className="text-sm text-gray-600">
            Simular X ~ p·Exp(β1) + (1−p)·Exp(β2) usando selección por composición + transformada inversa.
          </p>
        </div>

        <button
          onClick={() => setShowTable(true)}
          className="px-3 py-2 rounded border text-sm hover:bg-gray-50"
          disabled={!result?.rows?.length}
        >
          Ver tabla
        </button>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-5">
        <label className="text-sm">
          β1
          <input
            className="mt-1 w-full border rounded px-2 py-1"
            value={beta1}
            onChange={(e) => setBeta1(e.target.value)}
          />
        </label>
        <label className="text-sm">
          β2
          <input
            className="mt-1 w-full border rounded px-2 py-1"
            value={beta2}
            onChange={(e) => setBeta2(e.target.value)}
          />
        </label>
        <label className="text-sm">
          p
          <input
            className="mt-1 w-full border rounded px-2 py-1"
            value={p}
            onChange={(e) => setP(e.target.value)}
          />
        </label>
        <label className="text-sm">
          N
          <input
            className="mt-1 w-full border rounded px-2 py-1"
            value={N}
            onChange={(e) => setN(e.target.value)}
          />
        </label>
        <label className="text-sm">
          bins
          <input
            className="mt-1 w-full border rounded px-2 py-1"
            value={bins}
            onChange={(e) => setBins(e.target.value)}
          />
        </label>

        <div className="flex items-end">
          <button
            onClick={run}
            className="w-full px-4 py-2 rounded bg-blue-600 text-white text-sm hover:opacity-95"
          >
            Calcular
          </button>
        </div>
      </div>

      {/* ✅ Bloque debajo de parámetros */}
      <div className="mt-4 border rounded bg-gray-50 p-3">
        <div className="font-semibold text-sm mb-2">Parámetros de entrada</div>
        <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
          <li>
            <b>β1 (beta1):</b> tasa del componente 1 (Exponencial 1). Controla qué tan rápido ocurren los eventos:
            a β1 &gt; 0, menor tiempo esperado .
          </li>
          <li>
            <b>β2 (beta2):</b> tasa del componente 2 (Exponencial 2). Controla la segunda funsion:
            a β2 &gt; 0, menor tiempo esperado.
          </li>
          <li>
            <b>p (peso de mezcla):</b> probabilidad de elegir el componente 1 en el método de composición. En cada iteración:
            si R1 ≤ p se usa Exp(β1); si no, se usa Exp(β2). (Requisito: 0 ≤ p ≤ 1).
          </li>
          <li>
            <b>N (tamaño de muestra):</b> Número total de valores simulados.
          </li>
          <li>
            <b>bins:</b> número de barras del histograma que se mostrará.
          </li>
        </ul>
      </div>

      <div className="mt-3 text-sm text-gray-700">{msg}</div>

      {/* PASOS */}
      <div className="mt-6 space-y-4">
        {/* Paso 1 */}
        <StepCard title="Paso 1 — Planteamiento del modelo">
          <p className="text-sm text-gray-700">
            Queremos simular una variable aleatoria continua X cuya densidad es una mezcla de dos exponenciales:
          </p>

          {/* Texto estilizado (Opción 2) */}
          <div className="border rounded bg-gray-50 p-3 overflow-auto">
            <div className="font-serif italic text-[15px] leading-relaxed whitespace-nowrap">
              f(x)= pβ₁ e<sup>−β₁x</sup> + (1−p) β₂ e<sup>−β₂x</sup> , 0≤x&lt;∞, 0≤p≤1
            </div>
          </div>

          <p className="text-sm text-gray-700">
            Interpretación: con probabilidad <b>p</b> la observación proviene de Exp(β1) y con probabilidad <b>1−p</b> proviene de Exp(β2).
          </p>
        </StepCard>

        {/* Paso 2 — SOLUCIÓN (método de composición, 7 pasos) */}
        <StepCard title="Paso 2 — SOLUCIÓN (método de composición, 7 pasos)">
          <ol className="list-decimal pl-5 text-sm text-gray-800 space-y-4">
            <li>
              <b>Contar con la función f(x) y dividir en sub áreas</b> (componentes).
              <div className="mt-2 border rounded bg-gray-50 p-3 text-sm">
                <div className="font-medium text-gray-800">Subáreas (pesos) del modelo:</div>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
                  <li>
                    <b>A₁ = p</b> (peso del componente 1)
                  </li>
                  <li>
                    <b>A₂ = 1−p</b> (peso del componente 2)
                  </li>
                </ul>
              </div>
            </li>

            <li>
              <b>Para cada subárea determinar su subfunción</b> fᵢ(x):
              <div className="mt-2 border rounded bg-gray-50 p-3 overflow-auto">
                <div className="font-serif italic text-[14px] whitespace-nowrap">
                  f₁(x)= β₁ e<sup>−β₁x</sup>, x≥0 &nbsp;&nbsp; y &nbsp;&nbsp; f₂(x)= β₂ e<sup>−β₂x</sup>, x≥0
                </div>
              </div>
            </li>

            <li>
              <b>Reescribir la función original en términos de subfunciones y pesos</b>:
              <div className="mt-2 border rounded bg-gray-50 p-3 overflow-auto">
                <div className="font-serif italic text-[14px] whitespace-nowrap">
                  f(x)= ∑ Aᵢ · fᵢ(x) , &nbsp;&nbsp; ∑ Aᵢ = 1
                </div>
              </div>

              <div className="mt-3 border rounded bg-white p-3">
                <div className="text-sm font-medium text-gray-800">Calculamos ∑Aᵢ = 1:</div>
                <div className="mt-2 text-sm text-gray-700 space-y-1">
                  <div>A₁ + A₂ = 1</div>
                  <div>Remplazamos los valores:</div>
                  <div className="font-mono">p + (1−p) = 1</div>
                  <div className="font-mono">1 = 1</div>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-700">y despues de eso:</div>
              <div className="mt-2 border rounded bg-gray-50 p-3 overflow-auto">
                <div className="font-serif italic text-[14px] whitespace-nowrap">
                  f(x)= pβ₁ e<sup>−β₁x</sup> + (1−p) β₂ e<sup>−β₂x</sup>
                </div>
              </div>
            </li>

            <li>
              <b>Establecer relación “gráfica”</b> entre subfunciones y acumuladas de área:
              <div className="mt-3">
                <Ej1_8AreaDiagram />
              </div>
            </li>

            <li>
              <b>Generar dos números aleatorios</b> independientes R1 y R2 en (0,1):
              <div className="mt-2 border rounded bg-gray-50 p-3">
                <pre className="text-xs bg-white border rounded p-2 overflow-auto">
                  {`const R1 = Math.random(); // selector (U0)
                  const R2 = Math.random(); // inversa  (U1)`}
                </pre>
              </div>
            </li>

            <li>
              <b>Escoger con R1 una subfunción</b>:
              <div className="mt-2 border rounded bg-gray-50 p-3 overflow-auto">
                <pre className="text-xs bg-white border rounded p-2">
                  {`si (R1 < p)
                      escoger f1(x) → simulara valores de la distribucion para x1
                  sino
                      escoger f2(x) → simulara valores de la distribucion para x2
                  Finsi`}
                </pre>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Aquí R1 decide el componente según su peso (A₁=p y A₂=1−p).
              </div>
            </li>

            <li>
              <b>Con la subfunción escogida determinar X</b> aplicando transformada inversa:
              <div className="mt-2 border rounded bg-gray-50 p-3 text-xs text-gray-700 space-y-2">
                <div className="font-mono">Si se escogió f₁: &nbsp; X = −ln(1−R2)/β1</div>
                <div className="font-mono">Si se escogió f₂: &nbsp; X = −ln(1−R2)/β2</div>
              </div>
            </li>
          </ol>
        </StepCard>

        {/* Resto de pasos (como ya los tienes) */}
        <StepCard title="Paso 3 — Función acumulada (CDF) de la mezcla">
          <p className="text-sm text-gray-700">La CDF de la mezcla es la mezcla de las CDFs:</p>
          <div className="border rounded bg-gray-50 p-3 overflow-auto">
            <div className="font-serif italic text-[14px] leading-relaxed whitespace-nowrap">
              F(x)= p(1−e<sup>−β₁x</sup>) + (1−p)(1−e<sup>−β₂x</sup>), &nbsp; x≥0
            </div>
          </div>
        </StepCard>

        <StepCard title="Paso 4 — Transformada inversa de la Exponencial">
          <p className="text-sm text-gray-700">Si X ~ Exp(β), entonces:</p>
          <div className="border rounded bg-gray-50 p-3 overflow-auto">
            <div className="font-serif italic text-[14px] leading-relaxed whitespace-nowrap">
              F(x)=1−e<sup>−βx</sup> ⇒ X = F⁻¹(U) = −ln(1−U)/β
            </div>
          </div>
        </StepCard>

        <StepCard title="Paso 5 — Pseudocódigo (implementación)">
          <pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto">
          {`Para i=1..N:
            R1 ← U(0,1)   # selector
            R2 ← U(0,1)   # inversa
            Si R1 ≤ p:
              X ← -ln(1-R2)/β1
            Si no:
              X ← -ln(1-R2)/β2
            guardar (i, R1, R2, X, componente)`}
          </pre>
        </StepCard>

        <StepCard title="Paso 6 — Visualizar la selección por composición (R1 vs p)">
          {result ? (
            <Ej1_8ChartSelector data={result.selectorPoints} p={pn} />
          ) : (
            <div className="text-sm text-gray-500">Ejecuta “Calcular” para ver la gráfica.</div>
          )}
        </StepCard>

        <StepCard title="Paso 7 — Inversa (R2 → X) con guías de β1 y β2">
          {result ? (
            <InverseScatterWithGuides
              guideData={result.guide}
              pointsData={result.points}
              yMax={result.yMax}
              lines={[
                { dataKey: "x1", name: "Guía inv Exp(β1)", type: "monotone" },
                { dataKey: "x2", name: "Guía inv Exp(β2)", type: "monotone" },
              ]}
              xLabel="R2"
              yLabel="X = F^{-1}(R2)"
            />
          ) : (
            <div className="text-sm text-gray-500">Ejecuta “Calcular” para ver la gráfica.</div>
          )}
        </StepCard>

        <StepCard title="Paso 8 — Validación 1: Histograma (densidad empírica) vs PDF teórica">
          {result ? (
            <Ej1_8ChartHistogramVsPdf data={result.histogram} />
          ) : (
            <div className="text-sm text-gray-500">Ejecuta “Calcular” para ver la validación.</div>
          )}
        </StepCard>

        <StepCard title="Paso 9 — Validación 2 + métricas (ECDF vs CDF)">
          {result ? (
            <>
              <Ej1_8ChartEcdfVsCdf data={result.ecdf} />
              <div className="mt-4">
                <Ej1_8StatsCards stats={result.stats} beta1={b1n} beta2={b2n} p={pn} N={Nn} />
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500">Ejecuta “Calcular” para obtener la validación completa.</div>
          )}
        </StepCard>
      </div>

      {showTable && (
        <DataTableModal
          title="Tabla — Ejercicio 1–8 (Mezcla Exponencial por Composición)"
          rows={rowsForModal}
          onClose={() => setShowTable(false)}
          fileName="ej1_8_mezcla_exponencial_composicion.csv"
        />
      )}
    </div>
  );
};

export default ComposicionExponencialMixtureModule;

function StepCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="font-semibold mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
