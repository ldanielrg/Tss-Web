import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";

export default function SimpleBarCompare({
  data,
  title,
  yLabel,
}: {
  data: { name: string; value: number }[];
  title: string;
  yLabel?: string;
}) {
  return (
    <div className="w-full">
      <div className="text-sm font-semibold mb-2">{title}</div>

      {/* ✅ height real + minWidth:0 */}
      <div style={{ width: "100%", height: 320, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis
              label={
                yLabel
                  ? { value: yLabel, angle: -90, position: "insideLeft" }
                  : undefined
              }
            />
            <Tooltip formatter={(v: any) => Number(v).toFixed(6)} />
            <Legend />

            {/* ✅ color explícito */}
            <Bar dataKey="value" name="Valor" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
