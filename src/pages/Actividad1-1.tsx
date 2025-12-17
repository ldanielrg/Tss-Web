
import { useMemo, useState } from "react";
import DataTableModal from "../simulstat_parte1/components/DataTableModal";
import RejectionScatter from "../components/charts/RejectionScatter";
import SimpleBarCompare from "../components/charts/SimpleBarCompare";
import {
  runRejectionEj1Parte1,
  runRejectionEj2Parte1,
  runGame711,
  compareRouletteStrategies,
} from "../utils/exercises_1_1";

type Tab = "ej1" | "ej2" | "ej3" | "ej4";

export default function Actividad1_1() {
  const [tab, setTab] = useState<Tab>("ej1");

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">Actividad / Parte 2 — Ejercicios 1 a 4</h2>
        <p className="text-sm text-gray-500">Método de rechazo (2), Juego 7-11, Ruleta (comparación)</p>
      </div>

      {/* Barra tabs */}
      <div className="mt-4 flex gap-2 border-b">
        {[
          { key: "ej1", label: "Ejercicio 1" },
          { key: "ej2", label: "Ejercicio 2" },
          { key: "ej3", label: "Ejercicio 3" },
          { key: "ej4", label: "Ejercicio 4" },
        ].map((t) => (
          <button
            key={t.key}
            className={`px-4 py-2 text-sm rounded-t ${
              tab === (t.key as Tab) ? "bg-gray-900 text-white" : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => setTab(t.key as Tab)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "ej1" && <Ej1Rechazo />}
        {tab === "ej2" && <Ej2Rechazo />}
        {tab === "ej3" && <Ej3Juego711 />}
        {tab === "ej4" && <Ej4Ruleta />}
      </div>
    </div>
  );
}

/* ===================== EJ 1: Rechazo ===================== */

function Ej1Rechazo() {
  const [mode, setMode] = useState<"predef" | "random">("predef");
  const [nRandom, setNRandom] = useState("50");
  const [min, setMin] = useState("0");
  const [max, setMax] = useState("1");

  const [msg, setMsg] = useState("");
  const [tableRows, setTableRows] = useState<Record<string, any>[]>([]);
  const [showTable, setShowTable] = useState(false);

  const [acceptedF1, setAcceptedF1] = useState<{ x: number; y: number }[]>([]);
  const [acceptedF2, setAcceptedF2] = useState<{ x: number; y: number }[]>([]);
  const [rejected, setRejected] = useState<{ x: number; y: number }[]>([]);
  const [stats, setStats] = useState<any>(null);

  const run = () => {
    const out = runRejectionEj1Parte1({
      mode,
      nRandom: Number(nRandom),
      min: Number(min),
      max: Number(max),
    });

    const aF1 = out.points.filter((p) => p.aceptado && p.funcion === "F1").map((p) => ({ x: p.x, y: p.R2 }));
    const aF2 = out.points.filter((p) => p.aceptado && p.funcion === "F2").map((p) => ({ x: p.x, y: p.R2 }));
    const rej = out.points.filter((p) => !p.aceptado).map((p) => ({ x: p.x, y: p.R2 }));

    setAcceptedF1(aF1);
    setAcceptedF2(aF2);
    setRejected(rej);
    setStats(out.stats);

    setTableRows(
      out.points.map((p) => ({
        caso: p.caso,
        R1: p.R1.toFixed(4),
        R2: p.R2.toFixed(4),
        x: p.x.toFixed(6),
        funcion: p.funcion,
        condicion: p.condicion.toFixed(6),
        aceptado: p.aceptado ? "SI" : "NO",
      }))
    );

    setMsg(`Listo. Total=${out.stats.total} | Aceptados=${out.stats.aceptados} | Tasa=${out.stats.tasaAceptacion.toFixed(2)}%`);
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-md font-semibold">Ejercicio 1 — Método de Rechazo</h3>
          <p className="text-sm text-gray-500">x = 4 + 2·R1, divisor en x=5</p>
        </div>
        <button className="px-3 py-2 rounded border text-sm" disabled={!tableRows.length} onClick={() => setShowTable(true)}>
          Ver tabla
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 items-end">
        <label className="text-sm">
          Modo
          <select className="mt-1 border rounded px-2 py-1" value={mode} onChange={(e) => setMode(e.target.value as any)}>
            <option value="predef">Predefinido</option>
            <option value="random">Aleatorio</option>
          </select>
        </label>

        <label className="text-sm">
          n (si aleatorio)
          <input className="mt-1 border rounded px-2 py-1 w-28" value={nRandom} onChange={(e) => setNRandom(e.target.value)} />
        </label>

        <label className="text-sm">
          min
          <input className="mt-1 border rounded px-2 py-1 w-24" value={min} onChange={(e) => setMin(e.target.value)} />
        </label>

        <label className="text-sm">
          max
          <input className="mt-1 border rounded px-2 py-1 w-24" value={max} onChange={(e) => setMax(e.target.value)} />
        </label>

        <button onClick={run} className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:opacity-95">
          Calcular
        </button>

        <div className="text-sm text-gray-700">{msg}</div>
      </div>

      {stats && (
        <div className="mt-4 text-sm text-gray-700">
          Aceptados: <b>{stats.aceptados}</b> | Rechazados: <b>{stats.rechazados}</b> | Tasa: <b>{stats.tasaAceptacion.toFixed(2)}%</b>
        </div>
      )}

      <div className="mt-6">
        <RejectionScatter
          acceptedF1={acceptedF1}
          acceptedF2={acceptedF2}
          rejected={rejected}
          divisorX={5}
          xLabel="X"
          yLabel="R2"
        />
      </div>

      {showTable && (
        <DataTableModal
          title="Tabla — Ejercicio 1 (Rechazo)"
          rows={tableRows}
          onClose={() => setShowTable(false)}
          fileName="ej1_rechazo.csv"
        />
      )}
    </div>
  );
}

/* ===================== EJ 2: Rechazo ===================== */

function Ej2Rechazo() {
  const [mode, setMode] = useState<"predef" | "random">("predef");
  const [nRandom, setNRandom] = useState("50");
  const [min, setMin] = useState("0");
  const [max, setMax] = useState("1");

  const [msg, setMsg] = useState("");
  const [tableRows, setTableRows] = useState<Record<string, any>[]>([]);
  const [showTable, setShowTable] = useState(false);

  const [acceptedF1, setAcceptedF1] = useState<{ x: number; y: number }[]>([]);
  const [acceptedF2, setAcceptedF2] = useState<{ x: number; y: number }[]>([]);
  const [rejected, setRejected] = useState<{ x: number; y: number }[]>([]);
  const [stats, setStats] = useState<any>(null);

  const run = () => {
    const out = runRejectionEj2Parte1({
      mode,
      nRandom: Number(nRandom),
      min: Number(min),
      max: Number(max),
    });

    const aF1 = out.points.filter((p) => p.aceptado && p.funcion === "F1").map((p) => ({ x: p.x, y: p.R2 }));
    const aF2 = out.points.filter((p) => p.aceptado && p.funcion === "F2").map((p) => ({ x: p.x, y: p.R2 }));
    const rej = out.points.filter((p) => !p.aceptado).map((p) => ({ x: p.x, y: p.R2 }));

    setAcceptedF1(aF1);
    setAcceptedF2(aF2);
    setRejected(rej);
    setStats(out.stats);

    setTableRows(
      out.points.map((p) => ({
        caso: p.caso,
        R1: p.R1.toFixed(4),
        R2: p.R2.toFixed(4),
        x: p.x.toFixed(6),
        funcion: p.funcion,
        condicion: p.condicion.toFixed(6),
        aceptado: p.aceptado ? "SI" : "NO",
      }))
    );

    setMsg(`Listo. Total=${out.stats.total} | Aceptados=${out.stats.aceptados} | Tasa=${out.stats.tasaAceptacion.toFixed(2)}%`);
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-md font-semibold">Ejercicio 2 — Método de Rechazo</h3>
          <p className="text-sm text-gray-500">x = (3/2)·R1, divisor en x=1</p>
        </div>
        <button className="px-3 py-2 rounded border text-sm" disabled={!tableRows.length} onClick={() => setShowTable(true)}>
          Ver tabla
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 items-end">
        <label className="text-sm">
          Modo
          <select className="mt-1 border rounded px-2 py-1" value={mode} onChange={(e) => setMode(e.target.value as any)}>
            <option value="predef">Predefinido</option>
            <option value="random">Aleatorio</option>
          </select>
        </label>

        <label className="text-sm">
          n (si aleatorio)
          <input className="mt-1 border rounded px-2 py-1 w-28" value={nRandom} onChange={(e) => setNRandom(e.target.value)} />
        </label>

        <label className="text-sm">
          min
          <input className="mt-1 border rounded px-2 py-1 w-24" value={min} onChange={(e) => setMin(e.target.value)} />
        </label>

        <label className="text-sm">
          max
          <input className="mt-1 border rounded px-2 py-1 w-24" value={max} onChange={(e) => setMax(e.target.value)} />
        </label>

        <button onClick={run} className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:opacity-95">
          Calcular
        </button>

        <div className="text-sm text-gray-700">{msg}</div>
      </div>

      {stats && (
        <div className="mt-4 text-sm text-gray-700">
          Aceptados: <b>{stats.aceptados}</b> | Rechazados: <b>{stats.rechazados}</b> | Tasa: <b>{stats.tasaAceptacion.toFixed(2)}%</b>
        </div>
      )}

      <div className="mt-6">
        <RejectionScatter
          acceptedF1={acceptedF1}
          acceptedF2={acceptedF2}
          rejected={rejected}
          divisorX={1}
          xLabel="X"
          yLabel="R2"
        />
      </div>

      {showTable && (
        <DataTableModal
          title="Tabla — Ejercicio 2 (Rechazo)"
          rows={tableRows}
          onClose={() => setShowTable(false)}
          fileName="ej2_rechazo.csv"
        />
      )}
    </div>
  );
}

/* ===================== EJ 3: Juego 7-11 ===================== */

function Ej3Juego711() {
  const [totalPartidas, setTotalPartidas] = useState("100000");
  const [capitalInicial, setCapitalInicial] = useState("20");
  const [metaCapital, setMetaCapital] = useState("50");
  const [simulaciones, setSimulaciones] = useState("100000");

  const [res, setRes] = useState<any>(null);
  const [msg, setMsg] = useState("");

  const run = () => {
    const out = runGame711({
      totalPartidas: Number(totalPartidas),
      capitalInicial: Number(capitalInicial),
      metaCapital: Number(metaCapital),
      simulaciones: Number(simulaciones),
    });
    setRes(out);
    setMsg("Listo.");
  };

  const bars = useMemo(() => {
    if (!res) return [];
    return [
      { name: "Quiebra", value: res.probQuiebra },
      { name: "Éxito", value: res.probExito },
    ];
  }, [res]);

  return (
    <div>
      <div>
        <h3 className="text-md font-semibold">Ejercicio 3 — Juego 7-11</h3>
        <p className="text-sm text-gray-500">Prob ganar una partida + prob de quiebra (ruina del jugador)</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <label className="text-sm">Total partidas (p̂ ganar)
          <input className="mt-1 w-full border rounded px-2 py-1" value={totalPartidas} onChange={(e) => setTotalPartidas(e.target.value)} />
        </label>
        <label className="text-sm">Capital inicial
          <input className="mt-1 w-full border rounded px-2 py-1" value={capitalInicial} onChange={(e) => setCapitalInicial(e.target.value)} />
        </label>
        <label className="text-sm">Meta capital
          <input className="mt-1 w-full border rounded px-2 py-1" value={metaCapital} onChange={(e) => setMetaCapital(e.target.value)} />
        </label>
        <label className="text-sm">Simulaciones (ruina)
          <input className="mt-1 w-full border rounded px-2 py-1" value={simulaciones} onChange={(e) => setSimulaciones(e.target.value)} />
        </label>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button onClick={run} className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:opacity-95">
          Calcular
        </button>
        <div className="text-sm text-gray-700">{msg}</div>
      </div>

      {res && (
        <div className="mt-4 text-sm text-gray-800">
          p̂(ganar partida): <b>{res.probGanarPartida.toFixed(6)}</b> | p(quiebra): <b>{res.probQuiebra.toFixed(6)}</b>
        </div>
      )}

      {res && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SimpleBarCompare
            title="Probabilidad de ganar una partida"
            data={[{ name: "Ganar", value: res.probGanarPartida }, { name: "Perder", value: 1 - res.probGanarPartida }]}
            yLabel="Prob"
          />
          <SimpleBarCompare title="Resultado final (meta vs quiebra)" data={bars} yLabel="Prob" />
        </div>
      )}
    </div>
  );
}

/* ===================== EJ 4: Ruleta ===================== */

function Ej4Ruleta() {
  const [capitalInicial, setCapitalInicial] = useState("200");
  const [numJuegos, setNumJuegos] = useState("1000");
  const [simulaciones, setSimulaciones] = useState("10000");

  const [res, setRes] = useState<any>(null);
  const [msg, setMsg] = useState("");

  const [showTable, setShowTable] = useState(false);

  const run = () => {
    const out = compareRouletteStrategies({
      capitalInicial: Number(capitalInicial),
      numJuegos: Number(numJuegos),
      simulaciones: Number(simulaciones),
    });
    setRes(out);
    setMsg("Listo.");
  };

  const tableRows = useMemo(() => {
    if (!res?.rows) return [];
    return res.rows.map((r: any) => ({
      sim: r.sim,
      capFinalFija: r.capFinalFija,
      capFinalMartingala: r.capFinalMartingala,
      quiebraFija: r.quiebraFija ? "SI" : "NO",
      quiebraMartingala: r.quiebraMartingala ? "SI" : "NO",
    }));
  }, [res]);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-md font-semibold">Ejercicio 4 — Ruleta (Comparación)</h3>
          <p className="text-sm text-gray-500">Estrategia fija vs Martingala</p>
        </div>
        <button className="px-3 py-2 rounded border text-sm" disabled={!tableRows.length} onClick={() => setShowTable(true)}>
          Ver tabla
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        <label className="text-sm">Capital inicial
          <input className="mt-1 w-full border rounded px-2 py-1" value={capitalInicial} onChange={(e) => setCapitalInicial(e.target.value)} />
        </label>
        <label className="text-sm">Juegos por sesión
          <input className="mt-1 w-full border rounded px-2 py-1" value={numJuegos} onChange={(e) => setNumJuegos(e.target.value)} />
        </label>
        <label className="text-sm">Simulaciones
          <input className="mt-1 w-full border rounded px-2 py-1" value={simulaciones} onChange={(e) => setSimulaciones(e.target.value)} />
        </label>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button onClick={run} className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:opacity-95">
          Calcular
        </button>
        <div className="text-sm text-gray-700">{msg}</div>
      </div>

      {res && (
        <div className="mt-4 text-sm text-gray-800">
          Capital prom (Fija): <b>{res.capitalFinalPromFija.toFixed(3)}</b> | Capital prom (Martingala):{" "}
          <b>{res.capitalFinalPromMartingala.toFixed(3)}</b>
          <br />
          p(quiebra) Fija: <b>{res.probQuiebraFija.toFixed(6)}</b> | p(quiebra) Martingala:{" "}
          <b>{res.probQuiebraMartingala.toFixed(6)}</b>
        </div>
      )}

      {res && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SimpleBarCompare
            title="Capital final promedio"
            yLabel="Bs"
            data={[
              { name: "Fija", value: res.capitalFinalPromFija },
              { name: "Martingala", value: res.capitalFinalPromMartingala },
            ]}
          />
          <SimpleBarCompare
            title="Probabilidad de quiebra"
            yLabel="Prob"
            data={[
              { name: "Fija", value: res.probQuiebraFija },
              { name: "Martingala", value: res.probQuiebraMartingala },
            ]}
          />
        </div>
      )}

      {showTable && (
        <DataTableModal
          title="Tabla — Ejercicio 4 (Ruleta)"
          rows={tableRows}
          onClose={() => setShowTable(false)}
          fileName="ej4_ruleta.csv"
        />
      )}
    </div>
  );
}
