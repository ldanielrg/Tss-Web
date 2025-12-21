import { useState } from "react";
import { Link } from "react-router-dom";
import DataTableModal from "../components/DataTableModal";
import HistogramWithLine from "../components/charts/HistogramWithLine";
import { u01 } from "../utils/random";
import { histogramDensity, linspace, trapz } from "../utils/math";

export default function Opcion1() {
  const [a, setA] = useState("2");
  const [b, setB] = useState("5");
  const [c, setC] = useState("9");
  const [n, setN] = useState("2000");
  const [intervalos, setIntervalos] = useState("30");

  const [result, setResult] = useState<string>("");
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [showTable, setShowTable] = useState(false);

  const [hist, setHist] = useState<{ x: number; density: number }[]>([]);
  const [pdfLine, setPdfLine] = useState<{ x: number; pdf: number }[]>([]);

  const run = () => {
    const A = Number(a), B = Number(b), C = Number(c);
    const N = Number(n), I = Number(intervalos);

    if (![A, B, C, N, I].every((v) => Number.isFinite(v)) || N <= 0 || I <= 0) {
      setResult("Ingresa valores válidos");
      return;
    }

    const denom = (-A + B + C);
    if (denom === 0) {
      setResult("Denominador inválido (-a+b+c = 0)");
      return;
    }

    const A1 = A / denom;
    const A2 = (2 * (B - A)) / denom;
    const A3 = (C - B) / denom;

    const outX: number[] = [];
    const outRows: Record<string, any>[] = [];

    for (let i = 0; i < N; i++) {
      const R1 = u01();
      const R2 = u01();

      let x = 0;
      if (R1 < A1) x = Math.sqrt(A * A * R2);
      else if (R1 < A1 + A2) x = A + (B - A) * R2;
      else x = C - (C - B) * Math.sqrt(1 - R2);

      outX.push(x);
      outRows.push({ a: A, b: B, c: C, R1, R2, x });
    }

    const h = histogramDensity(outX, I).map((p) => ({ x: p.x, density: p.density }));
    setHist(h);

    const xs = linspace(Math.min(...outX), Math.max(...outX), 300);
    let pdf = xs.map((v) => {
      if (v < A) return v / A;
      if (v < B) return 1;
      if (v <= C) return (C - v) / (C - B);
      return 0;
    });

    const area = trapz(pdf, xs) || 1;
    pdf = pdf.map((p) => p / area);

    const pdfOnBins = h.map((bin) => {
      let bestI = 0, bestD = Infinity;
      for (let i = 0; i < xs.length; i++) {
        const d = Math.abs(xs[i] - bin.x);
        if (d < bestD) { bestD = d; bestI = i; }
      }
      return { x: bin.x, pdf: pdf[bestI] };
    });

    setPdfLine(pdfOnBins);
    setRows(outRows);
    setResult(`Resultado: ${(A1 + A2 + A3).toFixed(6)}`);
  };

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Opción 1 (Ejemplo 1)</h2>
          <p className="text-sm text-gray-500">Simulación vs PDF teórica</p>
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
        <label className="text-sm">a
          <input className="mt-1 w-full border rounded px-2 py-1" value={a} onChange={(e) => setA(e.target.value)} />
        </label>
        <label className="text-sm">b
          <input className="mt-1 w-full border rounded px-2 py-1" value={b} onChange={(e) => setB(e.target.value)} />
        </label>
        <label className="text-sm">c
          <input className="mt-1 w-full border rounded px-2 py-1" value={c} onChange={(e) => setC(e.target.value)} />
        </label>
        <label className="text-sm">Iteraciones (n)
          <input className="mt-1 w-full border rounded px-2 py-1" value={n} onChange={(e) => setN(e.target.value)} />
        </label>
        <label className="text-sm">Intervalos
          <input className="mt-1 w-full border rounded px-2 py-1" value={intervalos} onChange={(e) => setIntervalos(e.target.value)} />
        </label>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button onClick={run} className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:opacity-95">
          Calcular
        </button>
        <div className="text-sm text-gray-700">{result}</div>
      </div>

      <div className="mt-6">
        {hist.length > 0 ? (
          <HistogramWithLine bars={hist} line={pdfLine} xLabel="Valor" yLabel="Densidad" />
        ) : (
          <div className="text-sm text-gray-500">Ejecuta “Calcular” para ver la gráfica.</div>
        )}
      </div>

      {showTable && (
        <DataTableModal
          title="Tabla de resultados (Opción 1)"
          rows={rows}
          onClose={() => setShowTable(false)}
          fileName="opcion1_resultados.csv"
        />
      )}
    </div>
  );
}
