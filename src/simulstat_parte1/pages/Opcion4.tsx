import { useState } from "react";
import { Link } from "react-router-dom";
import DataTableModal from "../components/DataTableModal";
import { u01, uniform } from "../utils/random";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";

type Row = { min: string; max: string; prob: string };

function normalizeTable(rows: { min: number; max: number; prob: number }[]) {
  const sum = rows.reduce((a, r) => a + r.prob, 0) || 1;
  return rows.map((r) => ({ ...r, prob: r.prob / sum }));
}

function cumulative(rows: { prob: number }[]) {
  let s = 0;
  return rows.map((r) => (s += r.prob));
}

function sampleFromTable(
  rows: { min: number; max: number; prob: number }[],
  uSel: number,
  uUni: number
) {
  const probs = cumulative(rows);
  let idx = probs.findIndex((p) => uSel < p);
  if (idx === -1) idx = rows.length - 1;
  const r = rows[idx];
  return uniform(r.min, r.max, uUni);
}

function excedentes(dias: number, camiones: number, t1: any[], t2: any[]) {
  const tabla1 = normalizeTable(t1);
  const tabla2 = normalizeTable(t2);

  let total = 0;
  for (let d = 0; d < dias; d++) {
    const prod = sampleFromTable(tabla1, u01(), u01());

    let traslado = 0;
    for (let c = 0; c < camiones; c++) {
      traslado += sampleFromTable(tabla2, u01(), u01());
    }

    const exced = Math.max(prod - traslado, 0);
    total += exced * 100;
  }
  return total;
}

export default function Opcion4() {
  const [tabla1, setTabla1] = useState<Row[]>([
    { min: "50", max: "55", prob: "0.10" },
    { min: "55", max: "60", prob: "0.15" },
    { min: "60", max: "65", prob: "0.30" },
    { min: "65", max: "70", prob: "0.35" },
    { min: "75", max: "80", prob: "0.08" },
    { min: "80", max: "85", prob: "0.02" },
  ]);

  const [tabla2, setTabla2] = useState<Row[]>([
    { min: "4", max: "4.5", prob: "0.30" },
    { min: "4.5", max: "5", prob: "0.40" },
    { min: "5", max: "5.5", prob: "0.20" },
    { min: "5.5", max: "6", prob: "0.10" },
  ]);

  const [minC, setMinC] = useState("1");
  const [maxC, setMaxC] = useState("18");
  const [iter, setIter] = useState("200");

  const [best, setBest] = useState<number | null>(null);
  const [chart, setChart] = useState<{ camiones: number; costo: number }[]>([]);
  const [tableRows, setTableRows] = useState<Record<string, any>[]>([]);
  const [showTable, setShowTable] = useState(false);

  const setRow = (which: "t1" | "t2", idx: number, k: keyof Row, v: string) => {
    if (which === "t1") setTabla1((p) => p.map((r, i) => (i === idx ? { ...r, [k]: v } : r)));
    else setTabla2((p) => p.map((r, i) => (i === idx ? { ...r, [k]: v } : r)));
  };

  const run = () => {
    const minCam = Number(minC);
    const maxCam = Number(maxC);
    const N = Number(iter);

    const t1 = tabla1.map((r) => ({ min: Number(r.min), max: Number(r.max), prob: Number(r.prob) }));
    const t2 = tabla2.map((r) => ({ min: Number(r.min), max: Number(r.max), prob: Number(r.prob) }));

    if (![minCam, maxCam, N].every(Number.isFinite) || minCam <= 0 || maxCam < minCam || N <= 0) return;

    const resultados: { camiones: number; costo: number }[] = [];
    const filas: Record<string, any>[] = [];

    for (let c = minCam; c <= maxCam; c++) {
      const costos: number[] = [];
      const exceds: number[] = [];

      for (let j = 0; j < N; j++) {
        const a = c * 100000;
        const b = excedentes(250, c, t1, t2);
        exceds.push(b);
        costos.push(a + b);
      }

      const promEx = exceds.reduce((s, v) => s + v, 0) / exceds.length;
      const promCosto = costos.reduce((s, v) => s + v, 0) / costos.length;

      resultados.push({ camiones: c, costo: promCosto });
      filas.push({ Camiones: c, "Excedentes promedio": promEx, "Costo anual total": promCosto });
    }

    let bestCam = resultados[0]?.camiones ?? null;
    let bestVal = resultados[0]?.costo ?? Infinity;
    for (const r of resultados) {
      if (r.costo < bestVal) {
        bestVal = r.costo;
        bestCam = r.camiones;
      }
    }

    setBest(bestCam);
    setChart(resultados);
    setTableRows(filas);
  };

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Opción 4 (Problema 2 - Camiones)</h2>
          <p className="text-sm text-gray-500">Costo anual = inversión + excedentes</p>
        </div>
        <div className="flex gap-2">
          <Link to="/simulstat/parte1" className="px-3 py-2 rounded border text-sm hover:bg-gray-50">Volver</Link>
          <button
            onClick={() => setShowTable(true)}
            className="px-3 py-2 rounded border text-sm"
            disabled={!tableRows.length}
          >
            Ver tabla
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="font-medium text-sm mb-2">Tabla 1 - Producción diaria</div>
          <table className="w-full text-sm border">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-2 py-1">Mín</th>
                <th className="border px-2 py-1">Máx</th>
                <th className="border px-2 py-1">Prob</th>
              </tr>
            </thead>
            <tbody>
              {tabla1.map((r, i) => (
                <tr key={i}>
                  <td className="border px-2 py-1">
                    <input className="w-full border rounded px-2 py-1" value={r.min} onChange={(e) => setRow("t1", i, "min", e.target.value)} />
                  </td>
                  <td className="border px-2 py-1">
                    <input className="w-full border rounded px-2 py-1" value={r.max} onChange={(e) => setRow("t1", i, "max", e.target.value)} />
                  </td>
                  <td className="border px-2 py-1">
                    <input className="w-full border rounded px-2 py-1" value={r.prob} onChange={(e) => setRow("t1", i, "prob", e.target.value)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div className="font-medium text-sm mb-2">Tabla 2 - Capacidad camiones</div>
          <table className="w-full text-sm border">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-2 py-1">Mín</th>
                <th className="border px-2 py-1">Máx</th>
                <th className="border px-2 py-1">Prob</th>
              </tr>
            </thead>
            <tbody>
              {tabla2.map((r, i) => (
                <tr key={i}>
                  <td className="border px-2 py-1">
                    <input className="w-full border rounded px-2 py-1" value={r.min} onChange={(e) => setRow("t2", i, "min", e.target.value)} />
                  </td>
                  <td className="border px-2 py-1">
                    <input className="w-full border rounded px-2 py-1" value={r.max} onChange={(e) => setRow("t2", i, "max", e.target.value)} />
                  </td>
                  <td className="border px-2 py-1">
                    <input className="w-full border rounded px-2 py-1" value={r.prob} onChange={(e) => setRow("t2", i, "prob", e.target.value)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 items-end">
        <label className="text-sm">Min camiones
          <input className="mt-1 border rounded px-2 py-1" value={minC} onChange={(e) => setMinC(e.target.value)} />
        </label>
        <label className="text-sm">Max camiones
          <input className="mt-1 border rounded px-2 py-1" value={maxC} onChange={(e) => setMaxC(e.target.value)} />
        </label>
        <label className="text-sm">Iteraciones (por camión)
          <input className="mt-1 border rounded px-2 py-1" value={iter} onChange={(e) => setIter(e.target.value)} />
        </label>

        <button onClick={run} className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:opacity-95">
          Calcular
        </button>

        {best != null && (
          <div className="text-sm text-gray-700">
            Resultado: <span className="font-semibold">{best}</span> camiones
          </div>
        )}
      </div>

      <div className="mt-6 border rounded p-3">
        <div className="text-sm font-medium mb-2">Costo anual según número de camiones</div>
        <div className="w-full h-[340px]">
          <ResponsiveContainer>
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="camiones" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="costo" name="Costo anual promedio" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {showTable && (
        <DataTableModal
          title="Resultados por número de camiones (Opción 4)"
          rows={tableRows}
          onClose={() => setShowTable(false)}
          fileName="opcion4_resultados.csv"
        />
      )}
    </div>
  );
}
