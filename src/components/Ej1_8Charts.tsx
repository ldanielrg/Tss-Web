// src/components/Ej1_8Charts.tsx

//import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Scatter,
  Line,
  Bar,
  ReferenceLine,
} from "recharts";

/** Diagrama tipo “áreas acumuladas” como la imagen (A1 y A1+A2) */
export function Ej1_8AreaDiagram({
  a1Label = "A₁",
  a12Label = "A₁ + A₂",
  f1Label = "f₁(x)",
  f2Label = "f₂(x)",
}: {
  a1Label?: string;
  a12Label?: string;
  f1Label?: string;
  f2Label?: string;
}) {
  return (
    <div className="w-full overflow-auto">
      <div className="border rounded bg-gray-50 p-3 inline-block">
        <svg width="520" height="220" viewBox="0 0 520 220">
          {/* Axes */}
          <line x1="40" y1="190" x2="500" y2="190" stroke="#1f3b6d" strokeWidth="4" />
          <line x1="40" y1="190" x2="40" y2="20" stroke="#1f3b6d" strokeWidth="4" />

          {/* y labels */}
          <text x="15" y="195" fontSize="14" fill="#1f3b6d">0</text>

          <text x="15" y="120" fontSize="14" fill="#2b6cb0">{a1Label}</text>
          <text x="15" y="55" fontSize="14" fill="#2b6cb0">{a12Label}</text>

          {/* dashed horizontal guides */}
          <line x1="40" y1="110" x2="430" y2="110" stroke="#2f855a" strokeWidth="2" strokeDasharray="6 6" />
          <line x1="40" y1="45" x2="430" y2="45" stroke="#2f855a" strokeWidth="2" strokeDasharray="6 6" />

          {/* Rectangles */}
          {/* f1 area (orange outline) */}
          <rect x="155" y="110" width="110" height="80" fill="none" stroke="#dd6b20" strokeWidth="3" />
          <text x="275" y="175" fontSize="16" fill="#111827">{f1Label}</text>

          {/* f2 area (red outline) */}
          <rect x="265" y="45" width="110" height="65" fill="none" stroke="#e53e3e" strokeWidth="3" />
          <text x="385" y="85" fontSize="16" fill="#111827">{f2Label}</text>

          {/* A1 bracket-ish marker (orange vertical line) */}
          <line x1="155" y1="190" x2="155" y2="110" stroke="#dd6b20" strokeWidth="3" />

          {/* right bracket for A1+A2 (red vertical line) */}
          <line x1="430" y1="45" x2="430" y2="110" stroke="#e53e3e" strokeWidth="3" />
        </svg>

        <div className="text-xs text-gray-600 mt-2">
          Este esquema representa “áreas acumuladas” (pesos) para decidir con <b>R1</b> qué subfunción se elige.
        </div>
      </div>
    </div>
  );
}

export function Ej1_8ChartSelector({
  data,
  p,
}: {
  data: { i: number; r: number; picked: 1 | 2 }[];
  p: number;
}) {
  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="i"
            type="number"
            domain={["dataMin", "dataMax"]}
            label={{ value: "i (iteración)", position: "insideBottom", offset: -4 }}
          />
          <YAxis domain={[0, 1]} label={{ value: "R_sel (R1)", angle: -90, position: "insideLeft" }} />
          <Tooltip
            formatter={(v: any, name) => [Number(v).toFixed(4), name]}
            labelFormatter={(v) => `i=${v}`}
          />
          <Legend />
          <ReferenceLine y={p} strokeDasharray="6 6" label={{ value: `p=${p}`, position: "right" }} />
          <Scatter name="R_sel" dataKey="r" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Ej1_8ChartHistogramVsPdf({
  data,
}: {
  data: { x: number; hist: number; pdf: number }[];
}) {
  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" type="number" domain={["dataMin", "dataMax"]} label={{ value: "x", position: "insideBottom", offset: -4 }} />
          <YAxis label={{ value: "Densidad", angle: -90, position: "insideLeft" }} />
          <Tooltip
            labelFormatter={(x) => `x=${Number(x).toFixed(4)}`}
            formatter={(v: any, name) => [Number(v).toFixed(6), name]}
          />
          <Legend />
          <Bar dataKey="hist" name="Histograma (densidad empírica)" />
          <Line dataKey="pdf" name="PDF teórica mezcla" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Ej1_8ChartEcdfVsCdf({
  data,
}: {
  data: { x: number; ecdf: number; cdf: number }[];
}) {
  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" type="number" domain={["dataMin", "dataMax"]} label={{ value: "x", position: "insideBottom", offset: -4 }} />
          <YAxis domain={[0, 1]} label={{ value: "Probabilidad acumulada", angle: -90, position: "insideLeft" }} />
          <Tooltip
            labelFormatter={(x) => `x=${Number(x).toFixed(4)}`}
            formatter={(v: any, name) => [Number(v).toFixed(6), name]}
          />
          <Legend />
          <Line dataKey="ecdf" name="ECDF empírica" dot={false} />
          <Line dataKey="cdf" name="CDF teórica mezcla" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Ej1_8StatsCards({
  stats,
  beta1,
  beta2,
  p,
  N,
}: {
  stats: {
    n1: number;
    n2: number;
    pHat: number;
    meanEmp: number;
    varEmp: number;
    meanTheor: number;
    varTheor: number;
    ks: number;
    maxXUsed: number;
  };
  beta1: number;
  beta2: number;
  p: number;
  N: number;
}) {
  const fmt = (x: number, d = 6) => Number(x).toFixed(d);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      <Card title="Parámetros" lines={[
        `β1=${fmt(beta1, 4)}`,
        `β2=${fmt(beta2, 4)}`,
        `p=${fmt(p, 4)}`,
        `N=${N}`,
      ]} />

      <Card title="Composición" lines={[
        `n1=${stats.n1} (≈ p·N)`,
        `n2=${stats.n2}`,
        `p̂=n1/N=${fmt(stats.pHat, 4)}`,
        `|p̂−p|=${fmt(Math.abs(stats.pHat - p), 4)}`,
      ]} />

      <Card title="Momentos" lines={[
        `E[X] emp=${fmt(stats.meanEmp, 6)}`,
        `E[X] teór=${fmt(stats.meanTheor, 6)}`,
        `Var emp=${fmt(stats.varEmp, 6)}`,
        `Var teór=${fmt(stats.varTheor, 6)}`,
      ]} />

      <Card title="Validación" lines={[
        `KS≈${fmt(stats.ks, 6)}`,
        `maxX (robusto)=${fmt(stats.maxXUsed, 4)}`,
        `Hist vs PDF`,
        `ECDF vs CDF`,
      ]} />
    </div>
  );
}

function Card({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="font-semibold text-sm mb-2">{title}</div>
      <div className="text-xs text-gray-700 space-y-1">
        {lines.map((t, i) => <div key={i}>{t}</div>)}
      </div>
    </div>
  );
}
