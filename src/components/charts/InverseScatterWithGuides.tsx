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
} from "recharts";

type LineSpec = {
  dataKey: string;
  name: string;
  type?: "monotone" | "linear" | "stepAfter";
};

export default function InverseScatterWithGuides({
  guideData,
  pointsData,
  lines,
  yMax,
  xLabel = "U",
  yLabel = "X",
}: {
  guideData: any[];
  pointsData: any[];
  lines: LineSpec[];
  yMax?: number;
  xLabel?: string;
  yLabel?: string;
}) {
  return (
    <div className="w-full h-[380px]">
      <ResponsiveContainer>
        <ComposedChart data={guideData}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="u"
            type="number"
            domain={[0, 1]}
            tickFormatter={(v) => Number(v).toFixed(2)}
            label={{ value: xLabel, position: "insideBottom", offset: -4 }}
          />

          <YAxis
            type="number"
            domain={yMax ? [0, yMax] : ["auto", "auto"]}
            label={{ value: yLabel, angle: -90, position: "insideLeft" }}
          />

          <Tooltip
            labelFormatter={(v) => `u=${Number(v).toFixed(4)}`}
            formatter={(val: any, name) => [Number(val).toFixed(6), name]}
          />

          <Legend />

          {lines.map((l) => (
            <Line
              key={l.dataKey}
              dataKey={l.dataKey}
              name={l.name}
              type={l.type ?? "monotone"}
              dot={false}
              connectNulls
            />
          ))}

          <Scatter name="Simulación" data={pointsData} dataKey="x" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
