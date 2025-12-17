import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
} from "recharts";

export default function PmfBarWithLine({
  data,
  xLabel = "x",
  yLabel = "Probabilidad",
}: {
  data: { x: number; emp: number; teor: number }[];
  xLabel?: string;
  yLabel?: string;
}) {
  return (
    <div className="w-full h-[380px]">
      <ResponsiveContainer>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="x"
            type="number"
            domain={["dataMin", "dataMax"]}
            allowDecimals={false}
            label={{ value: xLabel, position: "insideBottom", offset: -4 }}
          />

          <YAxis label={{ value: yLabel, angle: -90, position: "insideLeft" }} />

          <Tooltip
            labelFormatter={(x) => `x=${x}`}
            formatter={(v: any, name) => [Number(v).toFixed(6), name]}
          />

          <Legend />
          <Bar dataKey="emp" name="Empírica (sim)" />
          <Line dataKey="teor" name="Teórica (mezcla)" dot={true} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
