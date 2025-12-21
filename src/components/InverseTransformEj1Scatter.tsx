// src/components/InverseTransformEj1Scatter.tsx
import { useMemo } from 'react';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend);

export default function InverseTransformEj1Scatter({
  title,
  r,
  x,
  maxPoints = 5000,
}: {
  title: string;
  r: number[];
  x: number[];
  maxPoints?: number;
}) {
  const points = useMemo(() => {
    const n = Math.min(r.length, x.length);
    if (n <= maxPoints) return Array.from({ length: n }, (_, i) => ({ x: r[i], y: x[i] }));

    // downsample simple: toma cada k
    const step = Math.ceil(n / maxPoints);
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < n; i += step) out.push({ x: r[i], y: x[i] });
    return out;
  }, [r, x, maxPoints]);

  // curva teórica: ordenar por R y unir
  const sortedLine = useMemo(() => {
    const n = Math.min(r.length, x.length);
    const idx = Array.from({ length: n }, (_, i) => i).sort((i, j) => r[i] - r[j]);
    const take = Math.min(n, maxPoints);
    const step = Math.ceil(n / take);
    const out: { x: number; y: number }[] = [];
    for (let k = 0; k < n; k += step) {
      const i = idx[k];
      out.push({ x: r[i], y: x[i] });
    }
    return out;
  }, [r, x, maxPoints]);

  const data = useMemo(
    () => ({
      datasets: [
        {
          type: 'scatter' as const,
          label: 'Puntos (R, X)',
          data: points,
          pointRadius: 2,
          backgroundColor: 'rgba(33, 150, 243, 0.65)',
        },
        {
          type: 'line' as const,
          label: 'Curva teórica (ordenada)',
          data: sortedLine,
          borderWidth: 2,
          pointRadius: 0,
          borderColor: 'rgba(249, 115, 22, 0.9)',
          tension: 0,
        },
      ],
    }),
    [points, sortedLine]
  );

  const options = useMemo<ChartOptions<'scatter'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' },
        title: { display: true, text: title, font: { size: 14, weight: 'normal' } },
        tooltip: { enabled: true },
      },
      layout: { padding: 12 },
      scales: {
        x: {
          type: 'linear',
          min: 0,
          max: 1,
          title: { display: true, text: 'R ~ U(0,1)' },
          grid: { color: 'rgba(0,0,0,0.08)' },
        },
        y: {
          title: { display: true, text: 'X' },
          grid: { color: 'rgba(0,0,0,0.08)' },
        },
      },
    }),
    [title]
  );

  return (
    <div className="h-80 w-full">
      <Chart type="scatter" data={data as any} options={options} />
    </div>
  );
}
