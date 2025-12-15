import React, { useMemo, useState } from 'react';
import { BarChart } from 'lucide-react';
import type { InventorySimulationSummary } from '../types/inventorySimulation';
import InventoryLevelChart from './InventoryLevelChart';
import { DEMAND_VALUES, DEMAND_CDF, LT_VALUES, LT_CDF, SEASONAL } from '../utils/inventorySimulator';

type Props = {
  summary: InventorySimulationSummary | null;
  isSimulating: boolean;
};

const money = (n: number) => `Bs. ${n.toFixed(2)}`;

function diffProb(cdf: number[]) {
  return cdf.map((v, i) => (i === 0 ? v : v - cdf[i - 1]));
}

// Histograma genérico
type HistogramProps = {
  data: number[];
  title?: string;
  xLabel?: string;
  yLabel?: string;
  bins?: number;
};

function niceStep(range: number) {
  if (range <= 0) return 1;
  const rough = range / 6;
  const pow10 = Math.pow(10, Math.floor(Math.log10(rough)));
  const scaled = rough / pow10;
  const nice = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
  return nice * pow10;
}

const HistogramSVG: React.FC<HistogramProps> = ({
  data,
  title = 'Histograma',
  xLabel = 'Valor',
  yLabel = 'Frecuencia',
  bins = 8,
}) => {
  const { counts, maxCount, xMin, xMax } = useMemo(() => {
    if (!data.length) return { counts: [], maxCount: 1, xMin: 0, xMax: 1 };
    const min = Math.min(...data);
    const max = Math.max(...data);
    if (min === max) return { counts: [data.length], maxCount: data.length, xMin: min, xMax: max };

    const b = Math.max(3, Math.min(20, bins));
    const width = (max - min) / b;
    const c = new Array(b).fill(0);

    for (const v of data) {
      let idx = Math.floor((v - min) / width);
      if (idx >= b) idx = b - 1;
      if (idx < 0) idx = 0;
      c[idx]++;
    }

    return { counts: c, maxCount: Math.max(...c, 1), xMin: min, xMax: max };
  }, [data, bins]);

  const W = 900, H = 320;
  const padL = 55, padR = 20, padT = 28, padB = 45;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const yMax = maxCount;
  const sy = (y: number) => padT + ((yMax - y) / (yMax || 1)) * plotH;

  const binW = counts.length ? plotW / counts.length : plotW;

  const yStep = niceStep(yMax);
  const yTicks: number[] = [];
  for (let y = 0; y <= yMax + 1e-9; y += yStep) yTicks.push(y);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <rect x="0" y="0" width={W} height={H} fill="white" />

        <text x={padL} y={18} fontSize="12" fill="#111827" fontWeight={600}>
          {title}
        </text>

        {yTicks.map((y, i) => (
          <g key={`yt-${i}`}>
            <line x1={padL} x2={W - padR} y1={sy(y)} y2={sy(y)} stroke="#E5E7EB" strokeWidth={1} />
            <text x={padL - 8} y={sy(y) + 4} textAnchor="end" fontSize="10" fill="#6B7280">
              {Math.round(y)}
            </text>
          </g>
        ))}

        <line x1={padL} x2={padL} y1={padT} y2={H - padB} stroke="#9CA3AF" strokeWidth={1.2} />
        <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} stroke="#9CA3AF" strokeWidth={1.2} />

        {counts.map((c, i) => {
          const x = padL + i * binW + 2;
          const h = (c / (yMax || 1)) * plotH;
          const y = (H - padB) - h;
          return (
            <g key={`bar-${i}`}>
              <rect x={x} y={y} width={Math.max(0, binW - 4)} height={h} fill="#60A5FA" />
              <text
                x={x + Math.max(0, binW - 4) / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize="10"
                fill="#374151"
              >
                {c > 0 ? c : ''}
              </text>
            </g>
          );
        })}

        <text x={padL} y={H - padB + 18} textAnchor="start" fontSize="10" fill="#6B7280">
          {xMin.toFixed(0)}
        </text>
        <text x={W - padR} y={H - padB + 18} textAnchor="end" fontSize="10" fill="#6B7280">
          {xMax.toFixed(0)}
        </text>

        <text x={(padL + (W - padR)) / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="#111827">
          {xLabel}
        </text>
        <text
          x={16}
          y={(padT + (H - padB)) / 2}
          textAnchor="middle"
          fontSize="12"
          fill="#111827"
          transform={`rotate(-90 16 ${(padT + (H - padB)) / 2})`}
        >
          {yLabel}
        </text>
      </svg>
    </div>
  );
};

const InventoryResultsPanel: React.FC<Props> = ({ summary, isSimulating }) => {
  const [histVar, setHistVar] = useState<'demanda' | 'neto' | 'faltante'>('demanda');

  const demandRows = useMemo(() => {
    const p = diffProb(DEMAND_CDF);
    return DEMAND_VALUES.map((x, i) => ({ x, p: p[i], cdf: DEMAND_CDF[i] }));
  }, []);

  const ltRows = useMemo(() => {
    const p = diffProb(LT_CDF);
    return LT_VALUES.map((lt, i) => ({ lt, p: p[i], cdf: LT_CDF[i] }));
  }, []);

  const seasonalRows = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, factor: SEASONAL[i + 1] ?? 1.0 }));
  }, []);

  const histData = useMemo(() => {
    const t = summary?.mejorTabla ?? [];
    if (histVar === 'demanda') return t.map(r => r.demandaAjustada);
    if (histVar === 'faltante') return t.map(r => r.faltante);
    return t.map(r => r.inventarioFinal - r.backlogFinal); 
  }, [summary, histVar]);

  const histTitle =
    histVar === 'demanda'
      ? 'Histograma de Demanda Ajustada (12 meses)'
      : histVar === 'faltante'
      ? 'Histograma de Faltante (unidades por mes)'
      : 'Histograma de Inventario Neto Final (Inv - Backlog)';

  const histXLabel =
    histVar === 'demanda'
      ? 'Demanda ajustada (unidades)'
      : histVar === 'faltante'
      ? 'Faltante (unidades)'
      : 'Inventario neto final (unidades)';

  //Estados
  if (isSimulating) {
    return (
      <div className="bg-white p-12 rounded-lg shadow-md text-center">
        <div className="text-gray-400 mb-4">
          <BarChart className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Simulando...</h3>
        <p className="text-gray-600">Buscando (q, R) óptimos por simulación.</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white p-12 rounded-lg shadow-md text-center">
        <div className="text-gray-400 mb-4">
          <BarChart className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sin resultados</h3>
        <p className="text-gray-600">Configura parámetros y ejecuta la búsqueda.</p>
      </div>
    );
  }

  const best = summary.mejor;
  const bestCosts = summary.mejorCostos;

  //Para el eje Y adaptativo del chart
  const invIni = summary.mejorTabla[0]?.inventarioInicial ?? 0;
  const yMaxFixed = Math.max(invIni, best.R + best.q);

  return (
    <div className="space-y-6">
      {/* Datos de entrada */}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-3">
        <h3 className="text-lg font-semibold">Datos de entrada (Distribuciones y Estacionalidad)</h3>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 font-semibold text-sm">Demanda base (PMF/CDF)</div>
            <div className="max-h-80 overflow-auto">
              <table className="min-w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th className="border px-2 py-2 text-left">Cantidad</th>
                    <th className="border px-2 py-2 text-right">Prob</th>
                    <th className="border px-2 py-2 text-right">CDF</th>
                  </tr>
                </thead>
                <tbody>
                  {demandRows.map((r) => (
                    <tr key={r.x}>
                      <td className="border px-2 py-2">{r.x}</td>
                      <td className="border px-2 py-2 text-right">{r.p.toFixed(3)}</td>
                      <td className="border px-2 py-2 text-right">{r.cdf.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 font-semibold text-sm">Lead time (PMF/CDF)</div>
            <div className="max-h-80 overflow-auto">
              <table className="min-w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th className="border px-2 py-2 text-left">Meses</th>
                    <th className="border px-2 py-2 text-right">Prob</th>
                    <th className="border px-2 py-2 text-right">CDF</th>
                  </tr>
                </thead>
                <tbody>
                  {ltRows.map((r) => (
                    <tr key={r.lt}>
                      <td className="border px-2 py-2">{r.lt}</td>
                      <td className="border px-2 py-2 text-right">{r.p.toFixed(3)}</td>
                      <td className="border px-2 py-2 text-right">{r.cdf.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 font-semibold text-sm">Factores estacionales</div>
            <div className="max-h-80 overflow-auto">
              <table className="min-w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th className="border px-2 py-2 text-left">Mes</th>
                    <th className="border px-2 py-2 text-right">Factor</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonalRows.map((r) => (
                    <tr key={r.mes}>
                      <td className="border px-2 py-2">{r.mes}</td>
                      <td className="border px-2 py-2 text-right">{r.factor.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen del mejor */}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Resumen del mejor (q, R)</h3>
          <div className="px-3 py-1 rounded bg-amber-50 text-amber-700 text-sm font-medium">
            Óptimo: q = {best.q} | R = {best.R}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="border rounded-lg p-4">
            <div className="font-semibold mb-2">Métricas (corrida ejemplo)</div>
            <div className="space-y-1 text-gray-700">
              <div>Órdenes emitidas: <b>{bestCosts.numeroOrdenes}</b></div>
              <div>Faltante total (unidades): <b>{bestCosts.faltanteTotalUnidades}</b></div>
              <div>Inventario promedio total: <b>{bestCosts.inventarioPromedioTotal.toFixed(2)}</b></div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="font-semibold mb-2">Costos (corrida ejemplo)</div>
            <div className="space-y-1 text-gray-700">
              <div>Costo ordenar: <b>{money(bestCosts.costoOrdenar)}</b></div>
              <div>Costo inventario: <b>{money(bestCosts.costoInventario)}</b></div>
              <div>Costo faltante: <b>{money(bestCosts.costoFaltante)}</b></div>
              <div className="pt-2 border-t">Costo total: <b>{money(bestCosts.costoTotal)}</b></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla mes a mes */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">
          Tabla de Simulación (modo libro) - q={best.q}, R={best.R}
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs border-collapse">
            <thead className="bg-blue-50">
              <tr>
                <th className="border px-2 py-2 text-left">Mes</th>
                <th className="border px-2 py-2 text-right">Inv Ini</th>
                <th className="border px-2 py-2 text-right">Backlog Ini</th>
                <th className="border px-2 py-2 text-right">Rand(D)</th>
                <th className="border px-2 py-2 text-right">D Base</th>
                <th className="border px-2 py-2 text-right">Factor</th>
                <th className="border px-2 py-2 text-right">D Ajust</th>
                <th className="border px-2 py-2 text-right">Inv Fin</th>
                <th className="border px-2 py-2 text-right">Faltante</th>
                <th className="border px-2 py-2 text-right">Backlog Fin</th>
                <th className="border px-2 py-2 text-right">Rand(LT)</th>
                <th className="border px-2 py-2 text-right">Pedido</th>
                <th className="border px-2 py-2 text-right">Llega Mes</th>
                <th className="border px-2 py-2 text-right">Inv Prom</th>
              </tr>
            </thead>
            <tbody>
              {summary.mejorTabla.map((row) => (
                <tr key={row.mes} className={row.mes % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="border px-2 py-2 font-medium">{row.mes}</td>
                  <td className="border px-2 py-2 text-right">{row.inventarioInicial}</td>
                  <td className="border px-2 py-2 text-right">{row.backlogInicial}</td>
                  <td className="border px-2 py-2 text-right">{row.randDemanda.toFixed(5)}</td>
                  <td className="border px-2 py-2 text-right">{row.demandaBase}</td>
                  <td className="border px-2 py-2 text-right">{row.factorEstacional.toFixed(2)}</td>
                  <td className="border px-2 py-2 text-right">{row.demandaAjustada}</td>
                  <td className="border px-2 py-2 text-right">{row.inventarioFinal}</td>
                  <td className="border px-2 py-2 text-right">{row.faltante}</td>
                  <td className="border px-2 py-2 text-right">{row.backlogFinal}</td>
                  <td className="border px-2 py-2 text-right">
                    {row.randLeadTime !== null ? row.randLeadTime.toFixed(5) : '-'}
                  </td>
                  <td className="border px-2 py-2 text-right">{row.pedido}</td>
                  <td className="border px-2 py-2 text-right">{row.llegadaOrdenMes ?? '-'}</td>
                  <td className="border px-2 py-2 text-right">{row.inventarioPromedio.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top 10 */}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart className="w-5 h-5 text-amber-600" />
            Resultados Inventario (R, q) - Top 10
          </h3>

          <div className="px-3 py-1 rounded bg-amber-50 text-amber-700 text-sm font-medium">
            Óptimo: q = {best.q} | R = {best.R}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-2 py-2">q</th>
                <th className="border px-2 py-2">R</th>
                <th className="border px-2 py-2">Ordenar</th>
                <th className="border px-2 py-2">Inventario</th>
                <th className="border px-2 py-2">Faltante</th>
                <th className="border px-2 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {summary.top.map((row, idx) => {
                const isBest = row.q === best.q && row.R === best.R;
                return (
                  <tr key={`${row.q}-${row.R}-${idx}`} className={isBest ? 'bg-amber-50' : ''}>
                    <td className="border px-2 py-2 font-medium">{row.q}</td>
                    <td className="border px-2 py-2 font-medium">{row.R}</td>
                    <td className="border px-2 py-2">{row.costoOrdenarProm.toFixed(2)}</td>
                    <td className="border px-2 py-2">{row.costoInventarioProm.toFixed(2)}</td>
                    <td className="border px-2 py-2">{row.costoFaltanteProm.toFixed(2)}</td>
                    <td className="border px-2 py-2 font-semibold">{row.costoPromedio.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráfica Figura 5.2 */}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-3">
        <h3 className="text-lg font-semibold">Gráfica de Inventario (tipo Figura 5.2)</h3>
        <p className="text-sm text-gray-600">
          Se grafica el <b>inventario neto</b> = Inventario - Backlog. Valores negativos representan faltantes.
          La línea horizontal marca el punto de reorden <b>R</b>. El bracket indica <b>q</b>.
        </p>

        <InventoryLevelChart
          tabla={summary.mejorTabla}
          R={best.R}
          q={best.q}
          yMaxFixed={yMaxFixed}
        />
      </div>

      {/* Histograma */}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h3 className="text-lg font-semibold">Histograma (corrida del mejor q,R)</h3>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Variable:</span>
            <select
              value={histVar}
              onChange={(e) => setHistVar(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="demanda">Demanda ajustada</option>
              <option value="neto">Inventario neto final</option>
              <option value="faltante">Faltante</option>
            </select>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          Eje Y = número de meses (frecuencia) que caen en cada rango de valores (bins).
        </p>

        <HistogramSVG
          data={histData}
          title={histTitle}
          xLabel={histXLabel}
          yLabel="Frecuencia (meses)"
          bins={8}
        />
      </div>
    </div>
  );
};

export default InventoryResultsPanel;
