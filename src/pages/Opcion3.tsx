import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DataTableModal from "../components/DataTableModal";
import { triangular } from "../utils/random";
import { irr, productorio, histogramDensity } from "../utils/math";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
} from "recharts";

type TriRow = { pes: string; prob: string; opt: string };

const defaults: Record<string, TriRow> = {
  "Activo fijo inicial": { pes: "-100000", prob: "-70000", opt: "-60000" },
  "Activo circulante inicial": { pes: "-40000", prob: "-30000", opt: "-25000" },
  "Flujo antes de impuestos": { pes: "30000", prob: "40000", opt: "45000" },
  "Tasa inflación año 1": { pes: "18", prob: "15", opt: "12" },
  "Tasa año 2": { pes: "18", prob: "15", opt: "12" },
  "Tasa año 3": { pes: "22", prob: "18", opt: "15" },
  "Tasa año 4": { pes: "25", prob: "20", opt: "18" },
  "Tasa año 5": { pes: "28", prob: "22", opt: "19" },
};

export default function Opcion3() {
  const [n, setN] = useState("1000");
  const [form, setForm] = useState<Record<string, TriRow>>(defaults);

  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [showTable, setShowTable] = useState(false);

  const [prob, setProb] = useState<number | null>(null);
  const [maxTir, setMaxTir] = useState<number | null>(null);

  const [hist, setHist] = useState<{ x: number; density: number }[]>([]);
  const [cdf, setCdf] = useState<{ x: number; cdf: number }[]>([]);

  const TREMA = 0.15;

  const update = (k: string, field: keyof TriRow, v: string) => {
    setForm((p) => ({ ...p, [k]: { ...p[k], [field]: v } }));
  };

  const fields = useMemo(() => Object.keys(form), [form]);

  const run = () => {
    const N = Number(n);
    if (!Number.isFinite(N) || N <= 0) return;

    const data: Record<string, any>[] = [];
    const tirs: number[] = [];

    for (let i = 0; i < N; i++) {
      const fijo = triangular(
        Number(form["Activo fijo inicial"].pes),
        Number(form["Activo fijo inicial"].prob),
        Number(form["Activo fijo inicial"].opt)
      ) * -1;

      const circulante = triangular(
        Number(form["Activo circulante inicial"].pes),
        Number(form["Activo circulante inicial"].prob),
        Number(form["Activo circulante inicial"].opt)
      ) * -1;

      const flujoBase = triangular(
        Number(form["Flujo antes de impuestos"].pes),
        Number(form["Flujo antes de impuestos"].prob),
        Number(form["Flujo antes de impuestos"].opt)
      );

      // Igual que tu Python: (opt, prob, pes)/100
      const tasa1 = triangular(
        Number(form["Tasa inflación año 1"].opt),
        Number(form["Tasa inflación año 1"].prob),
        Number(form["Tasa inflación año 1"].pes)
      ) / 100;
      const tasa2 = triangular(Number(form["Tasa año 2"].opt), Number(form["Tasa año 2"].prob), Number(form["Tasa año 2"].pes)) / 100;
      const tasa3 = triangular(Number(form["Tasa año 3"].opt), Number(form["Tasa año 3"].prob), Number(form["Tasa año 3"].pes)) / 100;
      const tasa4 = triangular(Number(form["Tasa año 4"].opt), Number(form["Tasa año 4"].prob), Number(form["Tasa año 4"].pes)) / 100;
      const tasa5 = triangular(Number(form["Tasa año 5"].opt), Number(form["Tasa año 5"].prob), Number(form["Tasa año 5"].pes)) / 100;

      const tasas = [tasa1, tasa2, tasa3, tasa4, tasa5];

      // Flujo nominal
      const x = [
        flujoBase * (1 + tasas[0]),
        flujoBase * (1 + tasas[0]) * (1 + tasas[1]),
        flujoBase * (1 + tasas[0]) * (1 + tasas[1]) * (1 + tasas[2]),
        flujoBase * (1 + tasas[0]) * (1 + tasas[1]) * (1 + tasas[2]) * (1 + tasas[3]),
        flujoBase * (1 + tasas[0]) * (1 + tasas[1]) * (1 + tasas[2]) * (1 + tasas[3]) * (1 + tasas[4]),
      ];

      // S(t)
      const S: number[] = [];
      for (let t = 1; t <= 5; t++) {
        const num =
          x[t - 1] * (1 - 0.5) +
          0.2 * fijo * 0.5 -
          (circulante * tasas[0]) * productorio(2, t, tasas);

        const den = productorio(1, t, tasas);
        S.push(num / den);
      }

      const VR = circulante + 0.2 * fijo * (1 - 0.5);
      const flujo = [-(fijo + circulante), S[0], S[1], S[2], S[3], S[4] + VR];

      const tir = irr(flujo);
      tirs.push(tir);

      data.push({
        Iteración: i + 1,
        Fijo: fijo,
        Circulante: circulante,
        Flujo: flujoBase,
        Tasa1: tasa1,
        Tasa2: tasa2,
        Tasa3: tasa3,
        Tasa4: tasa4,
        Tasa5: tasa5,
        TIR: tir,
      });
    }

    const valid = tirs.filter((v) => Number.isFinite(v));
    const p = (valid.filter((v) => v > TREMA).length / valid.length) * 100;

    setProb(p);
    setMaxTir(valid.length ? Math.max(...valid) : null);

    setHist(histogramDensity(valid, 30).map((b) => ({ x: b.x, density: b.density })));

    const sorted = [...valid].sort((a, b) => a - b);
    setCdf(sorted.map((x, idx) => ({ x, cdf: (idx + 1) / sorted.length })));

    setRows(data);
  };

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Opción 3 (Problema 1 - Inversión)</h2>
          <p className="text-sm text-gray-500">TIR simulada + Histograma y CDF</p>
        </div>
        <div className="flex gap-2">
          <Link to="/simulstat/parte1" className="px-3 py-2 rounded border text-sm hover:bg-gray-50">Volver</Link>
          <button
            onClick={() => setShowTable(true)}
            className="px-3 py-2 rounded border text-sm"
            disabled={!rows.length}
          >
            Ver tabla
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="border px-2 py-1 text-left">Variable</th>
              <th className="border px-2 py-1">Pesimista</th>
              <th className="border px-2 py-1">Más probable</th>
              <th className="border px-2 py-1">Optimista</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((k) => (
              <tr key={k}>
                <td className="border px-2 py-1">{k}</td>
                <td className="border px-2 py-1">
                  <input className="w-full border rounded px-2 py-1" value={form[k].pes}
                    onChange={(e) => update(k, "pes", e.target.value)} />
                </td>
                <td className="border px-2 py-1">
                  <input className="w-full border rounded px-2 py-1" value={form[k].prob}
                    onChange={(e) => update(k, "prob", e.target.value)} />
                </td>
                <td className="border px-2 py-1">
                  <input className="w-full border rounded px-2 py-1" value={form[k].opt}
                    onChange={(e) => update(k, "opt", e.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 items-end">
        <label className="text-sm">
          Iteraciones (n)
          <input className="mt-1 border rounded px-2 py-1" value={n} onChange={(e) => setN(e.target.value)} />
        </label>

        <button onClick={run} className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:opacity-95">
          Calcular
        </button>

        <div className="text-sm text-gray-700">
          {prob == null ? "" : `P(TIR > ${TREMA}) = ${prob.toFixed(2)}%`}
          {maxTir == null ? "" : ` | Max TIR: ${maxTir.toFixed(6)}`}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="border rounded p-3">
          <div className="text-sm font-medium mb-2">Histograma de TIR (densidad)</div>
          <div className="w-full h-[320px]">
            <ResponsiveContainer>
              <BarChart data={hist}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" type="number" domain={["dataMin", "dataMax"]} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="density" name="Densidad" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border rounded p-3">
          <div className="text-sm font-medium mb-2">CDF del TIR</div>
          <div className="w-full h-[320px]">
            <ResponsiveContainer>
              <LineChart data={cdf}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" type="number" domain={["dataMin", "dataMax"]} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cdf" name="CDF" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {showTable && (
        <DataTableModal
          title="Resultados por iteración (Opción 3)"
          rows={rows}
          onClose={() => setShowTable(false)}
          fileName="opcion3_resultados.csv"
        />
      )}
    </div>
  );
}
