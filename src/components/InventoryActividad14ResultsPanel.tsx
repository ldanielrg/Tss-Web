// src/components/InventoryActividad14ResultsPanel.tsx
import { useMemo, useState } from "react";
import { BarChart2, Table2, LineChart as LineIcon } from "lucide-react";
import type { InventoryA14Summary } from "../types/inventoryActividad14";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

type Props = {
  summary: InventoryA14Summary | null;
  isSimulating: boolean;
};

function fmt(n: number, d = 2) {
  if (!Number.isFinite(n)) return "-";
  return n.toFixed(d);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function InventoryActividad14ResultsPanel({ summary, isSimulating }: Props) {
  const [showDays, setShowDays] = useState(20);
  const [showHJ, setShowHJ] = useState(20);

  const policy = summary?.policyResult;
  const rows = summary?.oneReplicationExample?.rows ?? [];
  const hj = summary?.hookeJeeves;

  const maxDays = rows.length;

  //Columnas tabla diaria
  const dayCols = useMemo(() => {
    const isP2 = summary?.problem === "P2";
    const base = [
      "R",
      "Día",
      "Inv Inicial",
      "u( Dem )",
      "Demanda",
      "Inv Final",
      "Faltante",
      "Faltante acum",
      "¿Ordenar?",
      "u( LT )",
      "LT (días)",
      "Día de llegada",
      "Costo ordenar",
      "Costo faltante",
      "Prom. Inventario",
    ];
    if (!isP2) return base;

    return [
      ...base,
      "u( W )",
      "W (días)",
      "Expira (perdido)",
      "Agrega a espera",
      "Atiende espera",
      "Pierde (W=0)",
    ];
  }, [summary?.problem]);

  //Datos para gráficas diarias
  const chartDaily = useMemo(() => {
    if (!summary || rows.length === 0) return [];

    const days = summary.paramsSnapshot.days;
    const hDaily = summary.paramsSnapshot.costs.holdingCostAnnual / days;

    return rows.map((r) => {
      const holdCost = hDaily * r.invAvg;

      return {
        day: r.day,

        // inventarios
        invInitial: r.invInitial,
        invFinal: r.invFinal,
        invAvg: r.invAvg,

        // demanda y faltantes
        demand: r.demand,
        shortage: r.shortage,
        shortageAccum: r.shortageAccum,

        // costos diarios
        costOrder: r.costOrder ?? 0,
        costHolding: holdCost,
        costShortage: r.costShortage ?? 0,
        costTotal: (r.costOrder ?? 0) + holdCost + (r.costShortage ?? 0),

        // extras P2 (si existen)
        expiredLost: r.expiredLost ?? 0,
        lostNoWait: r.lostNoWait ?? 0,
        waitAdded: r.waitAdded ?? 0,
        waitFulfilled: r.waitFulfilled ?? 0,
      };
    });
  }, [summary, rows]);

  const chartHJ = useMemo(() => {
    if (!hj) return [];

    const byIter = new Map<number, { iter: number; minCost: number; bestCost: number }>();

    for (const row of hj.table) {
      const it = row.iter;
      const prev = byIter.get(it);
      if (!prev) {
        byIter.set(it, { iter: it, minCost: row.cost, bestCost: row.bestCost });
      } else {
        prev.minCost = Math.min(prev.minCost, row.cost);
        prev.bestCost = row.bestCost;
      }
    }

    const arr = Array.from(byIter.values()).sort((a, b) => a.iter - b.iter);

    let running = Number.POSITIVE_INFINITY;
    return arr.map((x) => {
      running = Math.min(running, x.bestCost);
      return { iter: x.iter, minCost: x.minCost, bestCost: running };
    });
  }, [hj]);

  if (!summary && !isSimulating) {
    return (
      <div className="bg-white p-10 rounded-lg shadow-md text-center">
        <div className="text-gray-400 mb-3">
          <BarChart2 className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sin resultados</h3>
        <p className="text-gray-600 text-sm">Ejecuta la simulación para ver tablas, gráficas y optimización.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen*/}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-purple-600" />
          Resultados
        </h3>

        {isSimulating && <p className="text-sm text-gray-500 mt-2">Procesando...</p>}

        {summary && policy && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-purple-50">
              <div className="text-xs text-purple-700">Política</div>
              <div className="text-lg font-semibold text-purple-900">
                q = {policy.q} | R = {policy.R}
              </div>
              <div className="text-xs text-purple-700 mt-1">Replicaciones: {policy.replications}</div>
              <div className="text-xs text-purple-700 mt-1">
                Problema: {summary.problem === "P1" ? "P1 (Backorder)" : "P2 (Espera + pérdidas)"}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-xs text-gray-600">Costo promedio</div>
              <div className="text-lg font-semibold text-gray-900">{fmt(policy.meanCost, 2)}</div>
              <div className="text-xs text-gray-600 mt-1">Desv.: {fmt(policy.stdCost, 2)}</div>
            </div>

            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-xs text-gray-600">Desglose (promedio)</div>
              <div className="text-sm text-gray-800 mt-1 space-y-1">
                <div>Ordenar: {fmt(policy.meanCostOrder, 2)}</div>
                <div>Mantener: {fmt(policy.meanCostHolding, 2)}</div>
                <div>Faltante: {fmt(policy.meanCostShortage, 2)}</div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-xs text-gray-600">Métricas</div>
              <div className="text-sm text-gray-800 mt-1 space-y-1">
                <div>Inventario promedio: {fmt(policy.meanAvgOnHand, 2)}</div>
                <div>Días stockout: {fmt(policy.meanStockoutDays, 2)}</div>
                <div>Unidades faltantes: {fmt(policy.meanTotalShortageUnits, 2)}</div>
              </div>
            </div>

            {summary.problem === "P2" && (
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-xs text-gray-600">P2: Espera / Pérdidas</div>
                <div className="text-sm text-gray-800 mt-1 space-y-1">
                  <div>Unidades perdidas: {fmt(policy.meanTotalLostUnits ?? 0, 2)}</div>
                  <div>Atendidas en espera: {fmt(policy.meanTotalWaitFulfilledUnits ?? 0, 2)}</div>
                </div>
              </div>
            )}

            {summary.hookeJeeves && (
              <div className="p-4 rounded-lg bg-indigo-50">
                <div className="text-xs text-indigo-700">Óptimo (Hooke & Jeeves)</div>
                <div className="text-lg font-semibold text-indigo-900">
                  q* = {summary.hookeJeeves.best.q} | R* = {summary.hookeJeeves.best.R}
                </div>
                <div className="text-xs text-indigo-700 mt-1">Costo* = {fmt(summary.hookeJeeves.best.meanCost, 2)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gráficas */}
      {summary && chartDaily.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <LineIcon className="w-5 h-5 text-emerald-600" />
            Gráficas (replicación de ejemplo)
          </h3>

          {/* Gráfica 1: Inventario */}
          <div className="w-full">
            <div className="text-sm font-medium text-gray-900 mb-2">1) Evolución del inventario</div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartDaily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <RTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="invInitial" name="Inv Inicial" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="invFinal" name="Inv Final" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Muestra cómo la política (q,R) controla el nivel de inventario día a día.
            </p>
          </div>

          {/* Gráfica 2: Faltantes */}
          <div className="w-full">
            <div className="text-sm font-medium text-gray-900 mb-2">
              2) Faltantes (del día y acumulados)
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartDaily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <RTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="shortage" name="Faltante día" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="shortageAccum" name="Faltante acumulado" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {summary.problem === "P1" ? (
              <p className="text-xs text-gray-500 mt-2">
                En P1, “faltante acumulado” corresponde al <b>Backorder (BO)</b>.
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-2">
                En P2, “faltante acumulado” corresponde a la <b>cola de espera</b> (clientes esperando).
              </p>
            )}
          </div>

          {/* Gráfica 3: Costos diarios */}
          <div className="w-full">
            <div className="text-sm font-medium text-gray-900 mb-2">3) Costos diarios</div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDaily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <RTooltip />
                  <Legend />
                  <Bar dataKey="costOrder" name="Costo ordenar" />
                  <Bar dataKey="costHolding" name="Costo mantener" />
                  <Bar dataKey="costShortage" name="Costo faltante" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              El costo de mantener se calcula con: <b>h_diario = h_anual / 260</b> y <b>costo = h_diario · InvProm</b>.
            </p>
          </div>

          {/* Extra P2: pérdidas vs espera */}
          {summary.problem === "P2" && (
            <div className="w-full">
              <div className="text-sm font-medium text-gray-900 mb-2">4) P2: pérdidas y espera</div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDaily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <RTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="waitAdded" name="Entra a espera" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="waitFulfilled" name="Atiende espera" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="lostNoWait" name="Pierde (W=0)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="expiredLost" name="Expira (pierde)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Aquí se ve qué parte del faltante se recupera por espera y qué parte se pierde (por no esperar o por expirar).
              </p>
            </div>
          )}
        </div>
      )}

      {/* tabla*/}
      {summary && rows.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Table2 className="w-5 h-5 text-emerald-600" />
              Tabla de simulación (una replicación de ejemplo)
            </h3>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Filas:</span>
              <select
                value={showDays}
                onChange={(e) => setShowDays(parseInt(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                {[20, 50, 100, 260].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">/ {maxDays}</span>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[1200px] w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  {dayCols.map((c) => (
                    <th key={c} className="px-2 py-2 border text-left whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, Math.min(showDays, rows.length)).map((r, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-2 py-1 border">{r.R}</td>
                    <td className="px-2 py-1 border">{r.day}</td>

                    <td className="px-2 py-1 border">{r.invInitial}</td>
                    <td className="px-2 py-1 border">{fmt(r.uDemand, 9)}</td>
                    <td className="px-2 py-1 border">{r.demand}</td>

                    <td className="px-2 py-1 border">{r.invFinal}</td>

                    <td className="px-2 py-1 border">{r.shortage}</td>
                    <td className="px-2 py-1 border">{r.shortageAccum}</td>

                    <td className="px-2 py-1 border">{r.orderPlaced ? "SI" : ""}</td>
                    <td className="px-2 py-1 border">{r.uLeadTime != null ? fmt(r.uLeadTime, 9) : ""}</td>
                    <td className="px-2 py-1 border">{r.leadTimeDays ?? ""}</td>
                    <td className="px-2 py-1 border">{r.arrivalDay ?? ""}</td>

                    <td className="px-2 py-1 border">{r.costOrder ? fmt(r.costOrder, 2) : ""}</td>
                    <td className="px-2 py-1 border">{r.costShortage ? fmt(r.costShortage, 2) : ""}</td>
                    <td className="px-2 py-1 border">{fmt(r.invAvg, 9)}</td>

                    {summary.problem === "P2" && (
                      <>
                        <td className="px-2 py-1 border">{r.uWait != null ? fmt(r.uWait, 9) : ""}</td>
                        <td className="px-2 py-1 border">{r.waitDays ?? ""}</td>
                        <td className="px-2 py-1 border">{r.expiredLost ?? ""}</td>
                        <td className="px-2 py-1 border">{r.waitAdded ?? ""}</td>
                        <td className="px-2 py-1 border">{r.waitFulfilled ?? ""}</td>
                        <td className="px-2 py-1 border">{r.lostNoWait ?? ""}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            La columna “Prom. Inventario” replica el cálculo tipo Excel (incluye el caso stockout con consumo lineal).
          </p>
        </div>
      )}

      {/* Hooke & Jeeves: tabla + gráfica convergencia */}
      {summary?.hookeJeeves && (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-lg font-semibold">Hooke & Jeeves — iteraciones</h3>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Filas:</span>
              <select
                value={showHJ}
                onChange={(e) => setShowHJ(parseInt(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                {[20, 50, 100, 200].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">/ {summary.hookeJeeves.table.length}</span>
            </div>
          </div>

          {/* Gráfica convergencia */}
          {chartHJ.length > 0 && (
            <div className="w-full">
              <div className="text-sm font-medium text-gray-900 mb-2">Convergencia (mejor costo)</div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartHJ}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="iter" />
                    <YAxis domain={["auto", "auto"]} />
                    <RTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="minCost" name="Mejor costo (en iteración)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="bestCost" name="Mejor costo (acumulado)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Se observa cómo el algoritmo va reduciendo el costo hasta estabilizarse en la política óptima.
              </p>
            </div>
          )}

          {/* Tabla H&J */}
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  {["Iter", "q", "R", "Costo", "Acción", "Paso q", "Paso R", "Mejor q", "Mejor R", "Mejor Costo"].map(
                    (c) => (
                      <th key={c} className="px-2 py-2 border text-left whitespace-nowrap">
                        {c}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {summary.hookeJeeves.table
                  .slice(0, clamp(showHJ, 1, summary.hookeJeeves.table.length))
                  .map((r, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-2 py-1 border">{r.iter}</td>
                      <td className="px-2 py-1 border">{r.q}</td>
                      <td className="px-2 py-1 border">{r.R}</td>
                      <td className="px-2 py-1 border">{fmt(r.cost, 2)}</td>
                      <td className="px-2 py-1 border">{r.action}</td>
                      <td className="px-2 py-1 border">{r.stepQ}</td>
                      <td className="px-2 py-1 border">{r.stepR}</td>
                      <td className="px-2 py-1 border">{r.bestQ}</td>
                      <td className="px-2 py-1 border">{r.bestR}</td>
                      <td className="px-2 py-1 border">{fmt(r.bestCost, 2)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500">
            “Costo” es el promedio de N replicaciones por punto (q,R). La reducción de pasos afina la búsqueda hasta estabilizar.
          </p>
        </div>
      )}
    </div>
  );
}
