// src/components/InventoryActividad14SimulationModule.tsx
import { useMemo, useState } from "react";
import { Play, Package, Search } from "lucide-react";
import type {
  InventoryA14Params,
  InventoryA14Summary,
  InventoryA14Problem,
} from "../types/inventoryActividad14";
import { evaluatePolicy, runHookeJeeves } from "../utils/inventoryActividad14Simulator";

type Props = {
  isSimulating: boolean;
  setIsSimulating: (v: boolean) => void;
  onSimulated: (summary: InventoryA14Summary) => void;
};

const DEFAULTS = {
  days: 260,
  initialOnHand: 15,
  costs: {
    orderCost: 50,
    holdingCostAnnual: 26,
    shortageCostP1: 25,
    shortageCostWaitP2: 20,
    shortageCostNoWaitP2: 50,
  },
  demandDistP1: {
    name: "Demanda P1",
    outcomes: [
      { value: 0, p: 0.04 },
      { value: 1, p: 0.06 },
      { value: 2, p: 0.10 },
      { value: 3, p: 0.20 },
      { value: 4, p: 0.30 },
      { value: 5, p: 0.18 },
      { value: 6, p: 0.08 },
      { value: 7, p: 0.03 },
      { value: 8, p: 0.01 },
    ],
  },
  leadTimeDistP1: {
    name: "Lead Time P1",
    outcomes: [
      { value: 1, p: 0.25 },
      { value: 2, p: 0.50 },
      { value: 3, p: 0.20 },
      { value: 4, p: 0.05 },
    ],
  },
  demandDistP2: {
    name: "Demanda P2",
    outcomes: [
      { value: 25, p: 0.02 },
      { value: 26, p: 0.04 },
      { value: 27, p: 0.06 },
      { value: 28, p: 0.12 },
      { value: 29, p: 0.20 },
      { value: 30, p: 0.24 },
      { value: 31, p: 0.15 },
      { value: 32, p: 0.10 },
      { value: 33, p: 0.05 },
      { value: 34, p: 0.02 },
    ],
  },
  leadTimeDistP2: {
    name: "Lead Time P2",
    outcomes: [
      { value: 1, p: 0.20 },
      { value: 2, p: 0.30 },
      { value: 3, p: 0.25 },
      { value: 4, p: 0.25 },
    ],
  },
  waitDistP2: {
    name: "Espera P2",
    outcomes: [
      { value: 0, p: 0.40 },
      { value: 1, p: 0.20 },
      { value: 2, p: 0.15 },
      { value: 3, p: 0.15 },
      { value: 4, p: 0.10 },
    ],
  },
};

export default function InventoryActividad14SimulationModule({
  isSimulating,
  setIsSimulating,
  onSimulated,
}: Props) {
  const [problem, setProblem] = useState<InventoryA14Problem>("P1");

  // Política base
  const [q, setQ] = useState(220);
  const [R, setR] = useState(115);

  // Replicaciones (para evaluar costo promedio)
  const [replications, setReplications] = useState(20);
  const [seed, setSeed] = useState(12345);

  // Hooke & Jeeves settings
  const [stepQ, setStepQ] = useState(10);
  const [stepR, setStepR] = useState(5);
  const [reduceFactor, setReduceFactor] = useState(0.5);
  const [minStepQ, setMinStepQ] = useState(1);
  const [minStepR, setMinStepR] = useState(1);
  const [maxIter, setMaxIter] = useState(60);

  const [qMin, setQMin] = useState(1);
  const [qMax, setQMax] = useState(800);
  const [RMin, setRMin] = useState(0);
  const [RMax, setRMax] = useState(400);

  const baseParams: InventoryA14Params = useMemo(
    () => ({
      problem,
      days: DEFAULTS.days,
      initialOnHand: DEFAULTS.initialOnHand,
      q,
      R,
      costs: DEFAULTS.costs,
      demandDistP1: DEFAULTS.demandDistP1,
      leadTimeDistP1: DEFAULTS.leadTimeDistP1,
      demandDistP2: DEFAULTS.demandDistP2,
      leadTimeDistP2: DEFAULTS.leadTimeDistP2,
      waitDistP2: DEFAULTS.waitDistP2,
      replications: Math.max(1, Math.floor(replications)),
      seed: seed >>> 0,
    }),
    [problem, q, R, replications, seed]
  );

  const handleSimulatePolicy = async () => {
    setIsSimulating(true);
    try {
      const { aggregate, exampleReplication } = evaluatePolicy(baseParams);

      const summary: InventoryA14Summary = {
        problem,
        policyResult: aggregate,
        oneReplicationExample: exampleReplication,
        paramsSnapshot: baseParams,
      };

      onSimulated(summary);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleOptimizeHJ = async () => {
    setIsSimulating(true);
    try {
      const hj = runHookeJeeves(baseParams, {
        q0: q,
        R0: R,
        stepQ,
        stepR,
        reduceFactor,
        minStepQ,
        minStepR,
        maxIter,
        qMin,
        qMax,
        RMin,
        RMax,
      });

      const bestParams: InventoryA14Params = {
        ...baseParams,
        q: hj.best.q,
        R: hj.best.R,
      };

      const { aggregate, exampleReplication } = evaluatePolicy(bestParams);

      const summary: InventoryA14Summary = {
        problem,
        policyResult: aggregate,
        oneReplicationExample: exampleReplication,
        hookeJeeves: hj,
        paramsSnapshot: bestParams,
      };

      onSimulated(summary);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-5">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Package className="w-5 h-5 text-amber-600" />
        Inventario (q, R) — Actividad 1_4 (Parte 2)
      </h3>

      {/* Selector problema */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Problema</label>
        <div className="flex gap-2">
          <button
            onClick={() => setProblem("P1")}
            className={`px-3 py-2 rounded border text-sm ${
              problem === "P1" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200"
            }`}
          >
            Problema 1 (Backorder)
          </button>
          <button
            onClick={() => setProblem("P2")}
            className={`px-3 py-2 rounded border text-sm ${
              problem === "P2" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200"
            }`}
          >
            Problema 2 (Espera + Pérdidas)
          </button>
        </div>

        <p className="text-xs text-gray-500">
          P1: faltante acumula (BO). P2: faltante puede esperar W días; si expira se pierde.
        </p>
      </div>

      {/* Política */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">q (lote)</label>
          <input
            type="number"
            min={1}
            value={q}
            onChange={(e) => setQ(parseInt(e.target.value) || 1)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">R (reorden)</label>
          <input
            type="number"
            min={0}
            value={R}
            onChange={(e) => setR(parseInt(e.target.value) || 0)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Replicaciones */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Replicaciones (N)</label>
          <input
            type="number"
            min={1}
            value={replications}
            onChange={(e) => setReplications(parseInt(e.target.value) || 1)}
            className="w-full border rounded px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            El costo usado en optimización es el promedio de N simulaciones (reduce ruido).
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Seed</label>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
            className="w-full border rounded px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">Permite reproducir resultados.</p>
        </div>
      </div>

      {/* Hooke & Jeeves */}
      <div className="border rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-gray-900">Búsqueda Hooke & Jeeves</h4>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paso q (Δq)</label>
            <input
              type="number"
              min={1}
              value={stepQ}
              onChange={(e) => setStepQ(parseInt(e.target.value) || 1)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paso R (ΔR)</label>
            <input
              type="number"
              min={1}
              value={stepR}
              onChange={(e) => setStepR(parseInt(e.target.value) || 1)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Factor reducción</label>
            <input
              type="number"
              step="0.05"
              min={0.1}
              max={0.9}
              value={reduceFactor}
              onChange={(e) => setReduceFactor(parseFloat(e.target.value) || 0.5)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Máx. iter</label>
            <input
              type="number"
              min={1}
              value={maxIter}
              onChange={(e) => setMaxIter(parseInt(e.target.value) || 1)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min paso q</label>
            <input
              type="number"
              min={1}
              value={minStepQ}
              onChange={(e) => setMinStepQ(parseInt(e.target.value) || 1)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min paso R</label>
            <input
              type="number"
              min={1}
              value={minStepR}
              onChange={(e) => setMinStepR(parseInt(e.target.value) || 1)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">q min / q max</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={qMin}
                onChange={(e) => setQMin(parseInt(e.target.value) || 1)}
                className="w-full border rounded px-3 py-2"
              />
              <input
                type="number"
                value={qMax}
                onChange={(e) => setQMax(parseInt(e.target.value) || 1)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">R min / R max</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={RMin}
                onChange={(e) => setRMin(parseInt(e.target.value) || 0)}
                className="w-full border rounded px-3 py-2"
              />
              <input
                type="number"
                value={RMax}
                onChange={(e) => setRMax(parseInt(e.target.value) || 0)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={handleSimulatePolicy}
          disabled={isSimulating}
          className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          {isSimulating ? "Simulando..." : "Simular política (q, R)"}
        </button>

        <button
          onClick={handleOptimizeHJ}
          disabled={isSimulating}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          {isSimulating ? "Optimizando..." : "Buscar óptimo (Hooke & Jeeves)"}
        </button>
      </div>

      <div className="text-xs text-gray-500">
        Sugerencia: usa N ≥ 20 replicaciones para estabilizar el costo promedio y que Hooke & Jeeves compare mejor.
      </div>
    </div>
  );
}
