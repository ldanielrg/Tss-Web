import React, { useMemo } from 'react';
import type { InventorySimMonthRow } from '../types/inventorySimulation';

type Props = {
  tabla: InventorySimMonthRow[];
  R: number;
};

type Point = { x: number; y: number };

function niceStep(range: number) {
  if (range <= 0) return 1;
  const rough = range / 6;
  const pow10 = Math.pow(10, Math.floor(Math.log10(rough)));
  const scaled = rough / pow10;
  const nice =
    scaled <= 1 ? 1 :
    scaled <= 2 ? 2 :
    scaled <= 5 ? 5 : 10;
  return nice * pow10;
}

const InventoryLevelChart: React.FC<Props> = ({ tabla, R }) => {
  const { points, yMin, yMax, orders } = useMemo(() => {
    if (!tabla.length) return { points: [] as Point[], yMin: 0, yMax: 1, orders: [] as number[] };

    // Inventario neto: inv - backlog
    const netStart = tabla[0].inventarioInicial - tabla[0].backlogInicial;
    const pts: Point[] = [{ x: 0, y: netStart }];

    const orderMonths: number[] = [];
    for (const row of tabla) {
      const netEnd = row.inventarioFinal - row.backlogFinal;
      pts.push({ x: row.mes, y: netEnd });
      if (row.pedido > 0) orderMonths.push(row.mes);
    }

    const ys = pts.map(p => p.y).concat([0, R]);
    let min = Math.min(...ys);
    let max = Math.max(...ys);

    // un poco de margen visual
    const pad = (max - min) * 0.12 || 10;
    min -= pad;
    max += pad;

    return { points: pts, yMin: min, yMax: max, orders: orderMonths };
  }, [tabla, R]);

  if (!points.length) return null;

  // SVG settings
  const W = 900;
  const H = 320;
  const padL = 55;
  const padR = 20;
  const padT = 20;
  const padB = 40;

  const xMax = points[points.length - 1].x;
  const xMin = 0;

  const sx = (x: number) =>
    padL + ((x - xMin) / (xMax - xMin || 1)) * (W - padL - padR);

  const sy = (y: number) =>
    padT + ((yMax - y) / (yMax - yMin || 1)) * (H - padT - padB);

  const poly = points.map(p => `${sx(p.x)},${sy(p.y)}`).join(' ');

  // ticks Y
  const step = niceStep(yMax - yMin);
  const yTickStart = Math.floor(yMin / step) * step;
  const yTicks: number[] = [];
  for (let y = yTickStart; y <= yMax + 1e-9; y += step) yTicks.push(y);

  // ticks X (meses)
  const xTicks = Array.from({ length: xMax + 1 }, (_, i) => i);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* fondo */}
        <rect x="0" y="0" width={W} height={H} fill="white" />

        {/* grid Y */}
        {yTicks.map((y, i) => (
          <g key={`ygrid-${i}`}>
            <line
              x1={padL}
              x2={W - padR}
              y1={sy(y)}
              y2={sy(y)}
              stroke="#E5E7EB"
              strokeWidth={1}
            />
            <text
              x={padL - 8}
              y={sy(y) + 4}
              textAnchor="end"
              fontSize="10"
              fill="#6B7280"
            >
              {Math.round(y)}
            </text>
          </g>
        ))}

        {/* grid X */}
        {xTicks.map((x) => (
          <g key={`xgrid-${x}`}>
            <line
              x1={sx(x)}
              x2={sx(x)}
              y1={padT}
              y2={H - padB}
              stroke="#F3F4F6"
              strokeWidth={1}
            />
            <text
              x={sx(x)}
              y={H - padB + 18}
              textAnchor="middle"
              fontSize="10"
              fill="#6B7280"
            >
              {x}
            </text>
          </g>
        ))}

        {/* ejes */}
        <line x1={padL} x2={padL} y1={padT} y2={H - padB} stroke="#9CA3AF" strokeWidth={1.2} />
        <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} stroke="#9CA3AF" strokeWidth={1.2} />

        {/* línea y=0 */}
        <line
          x1={padL}
          x2={W - padR}
          y1={sy(0)}
          y2={sy(0)}
          stroke="#111827"
          strokeWidth={1}
          strokeDasharray="5 4"
        />
        <text x={W - padR} y={sy(0) - 6} textAnchor="end" fontSize="10" fill="#111827">
          0
        </text>

        {/* línea R */}
        <line
          x1={padL}
          x2={W - padR}
          y1={sy(R)}
          y2={sy(R)}
          stroke="#F59E0B"
          strokeWidth={2}
        />
        <text x={W - padR} y={sy(R) - 6} textAnchor="end" fontSize="10" fill="#B45309">
          R = {R}
        </text>

        {/* trayectoria inventario neto */}
        <polyline
          points={poly}
          fill="none"
          stroke="#2563EB"
          strokeWidth={2.5}
        />

        {/* puntos */}
        {points.map((p, idx) => (
          <circle key={`pt-${idx}`} cx={sx(p.x)} cy={sy(p.y)} r={3} fill="#2563EB" />
        ))}

        {/* marcadores de órdenes */}
        {orders.map((m, idx) => (
          <g key={`ord-${m}-${idx}`}>
            <circle cx={sx(m)} cy={sy(R)} r={4} fill="#F59E0B" />
            <text
              x={sx(m) + 6}
              y={sy(R) - 6}
              fontSize="10"
              fill="#B45309"
            >
              Orden {idx + 1}
            </text>
          </g>
        ))}

        {/* títulos de ejes */}
        <text x={(padL + (W - padR)) / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="#111827">
          Mes
        </text>

        <text
          x={16}
          y={(padT + (H - padB)) / 2}
          textAnchor="middle"
          fontSize="12"
          fill="#111827"
          transform={`rotate(-90 16 ${(padT + (H - padB)) / 2})`}
        >
          Inventario neto (unidades) = Inventario - Backlog
        </text>
      </svg>
    </div>
  );
};

export default InventoryLevelChart;
