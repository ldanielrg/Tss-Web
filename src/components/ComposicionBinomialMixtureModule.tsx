import { useMemo, useState } from "react";
import { Divide, Play, Clock } from "lucide-react";

import DataTableModal from "./DataTableModal";
import PmfBarWithLine from "../components/charts/PmfBarWithLine";
import InverseScatterWithGuides from "../components/charts/InverseScatterWithGuides";

import { simulateBinomialMixture } from "../utils/mixtures";

export default function ComposicionBinomialMixtureModule() {
  const [n, setN] = useState("10");
  const [theta1, setTheta1] = useState("0.6");
  const [theta2, setTheta2] = useState("0.3");
  const [p, setP] = useState("0.4");
  const [Nsim, setNsim] = useState("500");

  const [resultMsg, setResultMsg] = useState<string>("");
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [pmfData, setPmfData] = useState<{ x: number; emp: number; teor: number }[]>([]);
  const [inverseGuide, setInverseGuide] = useState<{ u: number; inv1: number; inv2: number }[]>([]);
  const [inversePoints, setInversePoints] = useState<{ u: number; x: number }[]>([]);

  const [showTable, setShowTable] = useState(false);

  const run = () => {
    const nn = Number(n);
    const t1 = Number(theta1);
    const t2 = Number(theta2);
    const pp = Number(p);
    const it = Number(Nsim);

    if (![nn, t1, t2, pp, it].every(Number.isFinite)) {
      setResultMsg("Ingresa valores válidos.");
      return;
    }
    if (!Number.isInteger(nn) || nn <= 0) {
      setResultMsg("n debe ser un entero > 0.");
      return;
    }
    if (t1 < 0 || t1 > 1 || t2 < 0 || t2 > 1 || pp < 0 || pp > 1) {
      setResultMsg("θ1, θ2 y p deben estar en [0,1].");
      return;
    }
    if (!Number.isInteger(it) || it <= 0) {
      setResultMsg("N (simulaciones) debe ser un entero > 0.");
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
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Método de Composición — Mezcla Binomial</h2>
        <p className="text-gray-600 mt-2">
          Simulación de una variable discreta X con mezcla:
          <span className="font-semibold"> p·Bin(n,θ1) + (1−p)·Bin(n,θ2) </span>
          usando composición (selección de componente) + inversa discreta.
        </p>
      </div>

      {/* Fundamento / pasos */}
      <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-lg p-6">
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Modelo</h3>
          <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800">
{`X | componente 1 ~ Bin(n, θ1)    con probabilidad p
X | componente 2 ~ Bin(n, θ2)    con probabilidad (1-p)

PMF mezcla:
P(X=x) = p·C(n,x)·θ1^x·(1-θ1)^(n-x) + (1-p)·C(n,x)·θ2^x·(1-θ2)^(n-x)

Composición:
1) Generar R_sel ~ U(0,1)  (selector)
2) Si R_sel ≤ p -> usar Bin(n,θ1); si no -> Bin(n,θ2)
3) Generar U ~ U(0,1) y aplicar inversa discreta con CDF del componente elegido`}
          </pre>
        </div>
      </div>

      {/* Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Panel parámetros */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center space-x-3">
              <Divide className="w-6 h-6 text-fuchsia-600" />
              <div className="text-left">
                <h3 className="text-lg font-semibold">Parámetros</h3>
                <p className="text-sm text-gray-600">Mezcla Binomial por Composición</p>
              </div>
            </div>

            <hr className="my-4" />

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                n
                <input
                  className="mt-1 w-full border rounded px-2 py-1"
                  value={n}
                  onChange={(e) => setN(e.target.value)}
                />
              </label>

              <label className="text-sm">
                N (simulaciones)
                <input
                  className="mt-1 w-full border rounded px-2 py-1"
                  value={Nsim}
                  onChange={(e) => setNsim(e.target.value)}
                />
              </label>

              <label className="text-sm">
                θ1
                <input
                  className="mt-1 w-full border rounded px-2 py-1"
                  value={theta1}
                  onChange={(e) => setTheta1(e.target.value)}
                />
              </label>

              <label className="text-sm">
                θ2
                <input
                  className="mt-1 w-full border rounded px-2 py-1"
                  value={theta2}
                  onChange={(e) => setTheta2(e.target.value)}
                />
              </label>

              <label className="text-sm col-span-2">
                p (peso de mezcla)
                <input
                  className="mt-1 w-full border rounded px-2 py-1"
                  value={p}
                  onChange={(e) => setP(e.target.value)}
                />
              </label>
            </div>

            <button
              onClick={run}
              className="w-full mt-6 bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Calcular</span>
            </button>

            <div className="mt-3 text-sm text-gray-700">{resultMsg}</div>

            <button
              onClick={() => setShowTable(true)}
              className="w-full mt-3 px-4 py-2 rounded border text-sm"
              disabled={!rows.length}
            >
              Ver tabla (CSV)
            </button>
          </div>
        </div>

        {/* Panel resultados */}
        <div className="lg:col-span-2 space-y-6">
          {!pmfData.length && (
            <div className="bg-white p-12 rounded-lg shadow-md text-center">
              <div className="text-gray-400 mb-4">
                <Clock className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin Simulación</h3>
              <p className="text-gray-600">Configura parámetros y presiona “Calcular” para ver las gráficas.</p>
            </div>
          )}

          {pmfData.length > 0 && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3">PMF empírica vs teórica</h3>
                <PmfBarWithLine data={pmfData} xLabel="x" yLabel="PMF" />
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3">Inversa discreta (guías por componente)</h3>
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
              </div>
            </>
          )}
        </div>
      </div>

      {showTable && (
        <DataTableModal
          title="Tabla — Mezcla Binomial (Composición)"
          rows={rowsForModal}
          onClose={() => setShowTable(false)}
          fileName="ej_mix_binomial_composicion.csv"
        />
      )}
    </div>
  );
}
