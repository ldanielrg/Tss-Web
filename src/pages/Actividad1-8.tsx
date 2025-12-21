// src/simulstat_parte1/pages/Parte1_Ej1_Ej2_Composicion.tsx

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DataTableModal from "../components/DataTableModal";
import InverseScatterWithGuides from "../components/charts/InverseScatterWithGuides";
import PmfBarWithLine from "../components/charts/PmfBarWithLine";
import {
  simulateExponentialMixtureInverse,
  simulateBinomialMixture,
} from "../utils/mixtures";

type Tab = "ej1" | "ej2";

export default function Actividad1_8() {
  const [tab, setTab] = useState<Tab>("ej1");

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Parte 1 — Por Composición</h2>
          <p className="text-sm text-gray-500">
            Ejercicio 1 (Mezcla Exponencial) y Ejercicio 2 (Mezcla Binomial)
          </p>
        </div>
        <Link
          to="/simulstat/parte1"
          className="px-3 py-2 rounded border text-sm hover:bg-gray-50"
        >
          Volver
        </Link>
      </div>

      {/* Barra de cambio */}
      <div className="mt-4 flex gap-2 border-b">
        <button
          className={`px-4 py-2 text-sm rounded-t ${
            tab === "ej1" ? "bg-gray-900 text-white" : "bg-gray-100 hover:bg-gray-200"
          }`}
          onClick={() => setTab("ej1")}
        >
          Ejercicio 1
        </button>
        <button
          className={`px-4 py-2 text-sm rounded-t ${
            tab === "ej2" ? "bg-gray-900 text-white" : "bg-gray-100 hover:bg-gray-200"
          }`}
          onClick={() => setTab("ej2")}
        >
          Ejercicio 2
        </button>
      </div>

      <div className="mt-6">
        {tab === "ej1" ? <Ejercicio1 /> : <Ejercicio2 />}
      </div>
    </div>
  );
}

/* ================= EJERCICIO 1: Mezcla Exponencial ================= */

function Ejercicio1() {
  const [beta1, setBeta1] = useState("1.0");
  const [beta2, setBeta2] = useState("2.0");
  const [p, setP] = useState("0.5");
  const [N, setN] = useState("500");

  const [resultMsg, setResultMsg] = useState<string>("");
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [showTable, setShowTable] = useState(false);

  const [guide, setGuide] = useState<{ u: number; x1: number; x2: number }[]>([]);
  const [points, setPoints] = useState<{ u: number; x: number }[]>([]);
  const [yMax, setYMax] = useState<number | undefined>(undefined);

  const run = () => {
    const b1 = Number(beta1);
    const b2 = Number(beta2);
    const pp = Number(p);
    const nIter = Number(N);

    if (![b1, b2, pp, nIter].every(Number.isFinite)) {
      setResultMsg("Ingresa valores válidos.");
      return;
    }
    if (b1 <= 0 || b2 <= 0) {
      setResultMsg("β1 y β2 deben ser > 0.");
      return;
    }
    if (pp < 0 || pp > 1) {
      setResultMsg("p debe estar en [0, 1].");
      return;
    }
    if (!Number.isInteger(nIter) || nIter <= 0) {
      setResultMsg("N debe ser un entero > 0.");
      return;
    }

    const out = simulateExponentialMixtureInverse({ beta1: b1, beta2: b2, p: pp, N: nIter });
    setRows(out.rows);
    setGuide(out.guide);
    setPoints(out.points);
    setYMax(out.yMax);
    setResultMsg(`Simulación lista: N=${nIter}`);
  };

  const rowsForModal = useMemo(() => {
    // formateo suave para la tabla
    return rows.map((r) => ({
      ...r,
      R_sel: Number(r.R_sel).toFixed(4),
      U: Number(r.U).toFixed(4),
      X: Number(r.X).toFixed(6),
    }));
  }, [rows]);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-md font-semibold">Ejercicio 1 — Mezcla Exponencial (Inversa)</h3>
          <p className="text-sm text-gray-500">
            Selección por composición + transformada inversa exponencial.
          </p>
        </div>

        <button
          onClick={() => setShowTable(true)}
          className="px-3 py-2 rounded border text-sm"
          disabled={!rows.length}
        >
          Ver tabla
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <label className="text-sm">β1
          <input className="mt-1 w-full border rounded px-2 py-1" value={beta1} onChange={(e) => setBeta1(e.target.value)} />
        </label>
        <label className="text-sm">β2
          <input className="mt-1 w-full border rounded px-2 py-1" value={beta2} onChange={(e) => setBeta2(e.target.value)} />
        </label>
        <label className="text-sm">p
          <input className="mt-1 w-full border rounded px-2 py-1" value={p} onChange={(e) => setP(e.target.value)} />
        </label>
        <label className="text-sm">N
          <input className="mt-1 w-full border rounded px-2 py-1" value={N} onChange={(e) => setN(e.target.value)} />
        </label>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={run}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:opacity-95"
        >
          Calcular
        </button>
        <div className="text-sm text-gray-700">{resultMsg}</div>
      </div>

      <div className="mt-6">
        {points.length ? (
          <InverseScatterWithGuides
            guideData={guide}
            pointsData={points}
            yMax={yMax}
            lines={[
              { dataKey: "x1", name: "Guía inv Exp(β1)", type: "monotone" },
              { dataKey: "x2", name: "Guía inv Exp(β2)", type: "monotone" },
            ]}
            xLabel="U"
            yLabel="X = F^{-1}(U)"
          />
        ) : (
          <div className="text-sm text-gray-500">Ejecuta “Calcular” para ver la gráfica.</div>
        )}
      </div>

      {showTable && (
        <DataTableModal
          title="Tabla — Ejercicio 1 (Mezcla Exponencial)"
          rows={rowsForModal}
          onClose={() => setShowTable(false)}
          fileName="ej1_mezcla_exponencial.csv"
        />
      )}
    </div>
  );
}

/* ================= EJERCICIO 2: Mezcla Binomial ================= */

function Ejercicio2() {
  const [n, setN] = useState("5");
  const [theta1, setTheta1] = useState("0.6");
  const [theta2, setTheta2] = useState("0.3");
  const [p, setP] = useState("0.4");
  const [N, setNN] = useState("200");

  const [resultMsg, setResultMsg] = useState<string>("");
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [showTable, setShowTable] = useState(false);

  const [pmfData, setPmfData] = useState<{ x: number; emp: number; teor: number }[]>([]);
  const [inverseGuide, setInverseGuide] = useState<{ u: number; inv1: number; inv2: number }[]>([]);
  const [inversePoints, setInversePoints] = useState<{ u: number; x: number }[]>([]);

  const run = () => {
    const nn = Number(n);
    const t1 = Number(theta1);
    const t2 = Number(theta2);
    const pp = Number(p);
    const it = Number(N);

    if (![nn, t1, t2, pp, it].every(Number.isFinite)) {
      setResultMsg("Ingresa valores válidos.");
      return;
    }
    if (!Number.isInteger(nn) || nn <= 0) {
      setResultMsg("n debe ser un entero > 0.");
      return;
    }
    if (t1 < 0 || t1 > 1 || t2 < 0 || t2 > 1 || pp < 0 || pp > 1) {
      setResultMsg("θ1, θ2 y p deben estar en [0, 1].");
      return;
    }
    if (!Number.isInteger(it) || it <= 0) {
      setResultMsg("N debe ser un entero > 0.");
      return;
    }

    const out = simulateBinomialMixture({ n: nn, theta1: t1, theta2: t2, p: pp, N: it });
    setRows(out.rows);
    setPmfData(out.pmfData);
    setInverseGuide(out.inverseGuide);
    setInversePoints(out.inversePoints);
    setResultMsg(`Simulación lista: N=${it}`);
  };

  const rowsForModal = useMemo(() => {
    return rows.map((r) => ({
      ...r,
      R_sel: Number(r.R_sel).toFixed(4),
      U: Number(r.U).toFixed(4),
    }));
  }, [rows]);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-md font-semibold">Ejercicio 2 — Mezcla Binomial (PMF + Inversa)</h3>
          <p className="text-sm text-gray-500">
            PMF empírica vs teórica y gráfica de la inversa discreta.
          </p>
        </div>

        <button
          onClick={() => setShowTable(true)}
          className="px-3 py-2 rounded border text-sm"
          disabled={!rows.length}
        >
          Ver tabla
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
        <label className="text-sm">n
          <input className="mt-1 w-full border rounded px-2 py-1" value={n} onChange={(e) => setN(e.target.value)} />
        </label>
        <label className="text-sm">θ1
          <input className="mt-1 w-full border rounded px-2 py-1" value={theta1} onChange={(e) => setTheta1(e.target.value)} />
        </label>
        <label className="text-sm">θ2
          <input className="mt-1 w-full border rounded px-2 py-1" value={theta2} onChange={(e) => setTheta2(e.target.value)} />
        </label>
        <label className="text-sm">p
          <input className="mt-1 w-full border rounded px-2 py-1" value={p} onChange={(e) => setP(e.target.value)} />
        </label>
        <label className="text-sm">N
          <input className="mt-1 w-full border rounded px-2 py-1" value={N} onChange={(e) => setNN(e.target.value)} />
        </label>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={run}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:opacity-95"
        >
          Calcular
        </button>
        <div className="text-sm text-gray-700">{resultMsg}</div>
      </div>

      <div className="mt-6">
        {pmfData.length ? (
          <PmfBarWithLine data={pmfData} xLabel="x" yLabel="PMF" />
        ) : (
          <div className="text-sm text-gray-500">Ejecuta “Calcular” para ver la PMF.</div>
        )}
      </div>

      <div className="mt-6">
        {inversePoints.length ? (
          <InverseScatterWithGuides
            guideData={inverseGuide}
            pointsData={inversePoints}
            lines={[
              { dataKey: "inv1", name: "Guía inv Bin(n,θ1)", type: "stepAfter" },
              { dataKey: "inv2", name: "Guía inv Bin(n,θ2)", type: "stepAfter" },
            ]}
            xLabel="U"
            yLabel="X = F^{-1}(U)"
          />
        ) : (
          <div className="text-sm text-gray-500">Ejecuta “Calcular” para ver la inversa.</div>
        )}
      </div>

      {showTable && (
        <DataTableModal
          title="Tabla — Ejercicio 2 (Mezcla Binomial)"
          rows={rowsForModal}
          onClose={() => setShowTable(false)}
          fileName="ej2_mezcla_binomial.csv"
        />
      )}
    </div>
  );
}
