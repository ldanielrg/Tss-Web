import {
  ResponsiveContainer,
  ScatterChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Scatter,
  ReferenceLine,
} from "recharts";

export default function RejectionScatter({
  acceptedF1,
  acceptedF2,
  rejected,
  divisorX,
  xLabel,
  yLabel,
}: {
  acceptedF1: { x: number; y: number }[];
  acceptedF2: { x: number; y: number }[];
  rejected: { x: number; y: number }[];
  divisorX: number;
  xLabel: string;
  yLabel: string;
}) {
  const allX = [...acceptedF1, ...acceptedF2, ...rejected].map((p) => p.x);
  const minX = allX.length ? Math.min(...allX) : 0;
  const maxX = allX.length ? Math.max(...allX) : 1;

  // ✅ Importantísimo: minWidth:0 para contenedores flex/grid, y height fijo real
  return (
    <div style={{ width: "100%", height: 420, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            type="number"
            dataKey="x"
            domain={[minX, maxX]}
            label={{ value: xLabel, position: "insideBottom", offset: -4 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 1]}
            label={{ value: yLabel, angle: -90, position: "insideLeft" }}
          />

          <Tooltip
            formatter={(v: any, name) => [Number(v).toFixed(6), name]}
          />
          <Legend />

          <ReferenceLine x={divisorX} stroke="#6b7280" strokeDasharray="5 5" />

          {/* ✅ Colores explícitos para diferenciar */}
          <Scatter name="Aceptado F1" data={acceptedF1} fill="#22c55e" />
          <Scatter name="Aceptado F2" data={acceptedF2} fill="#3b82f6" />
          <Scatter name="Rechazado" data={rejected} fill="#ef4444" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
