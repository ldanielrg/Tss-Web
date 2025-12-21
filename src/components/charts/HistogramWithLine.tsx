import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line,
  Legend,
} from "recharts";

export default function HistogramWithLine({
  bars,
  line,
  xLabel,
  yLabel,
}: {
  bars: { x: number; density: number }[];
  line: { x: number; pdf: number }[];
  xLabel: string;
  yLabel: string;
}) {
  const lineMap = new Map(line.map((p) => [p.x, p.pdf]));
  const data = bars.map((b) => ({ ...b, pdf: lineMap.get(b.x) ?? null }));

  return (
    <div className="w-full h-[380px]">
      <ResponsiveContainer>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="x"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(v) => Number(v).toFixed(2)}
            label={{ value: xLabel, position: "insideBottom", offset: -4 }}
          />
          <YAxis label={{ value: yLabel, angle: -90, position: "insideLeft" }} />
          <Tooltip
            formatter={(v: any, name) => [
              Number(v).toFixed(6),
              name === "density" ? "Densidad" : "PDF",
            ]}
            labelFormatter={(x) => `x=${Number(x).toFixed(4)}`}
          />
          <Legend />
          <Bar dataKey="density" name="Simulación (hist)" />
          <Line type="monotone" dataKey="pdf" name="Teórica (PDF)" dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
