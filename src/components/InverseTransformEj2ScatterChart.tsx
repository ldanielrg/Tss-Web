// src/components/InverseTransformEj2ScatterChart.tsx
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

export default function InverseTransformEj2ScatterChart({
  title,
  x,
  fx,
  theoLine,
  fullTheoLine,
  showFullOverlay,
  maxPoints = 5000,
}: {
  title: string;
  x: number[];
  fx: number[];
  theoLine: { x: number; y: number }[];
  fullTheoLine?: { x: number; y: number }[];
  showFullOverlay?: boolean;
  maxPoints?: number;
}) {
  const points = useMemo(() => {
    const n = Math.min(x.length, fx.length);
    if (n <= maxPoints) return Array.from({ length: n }, (_, i) => ({ x: x[i], y: fx[i] }));

    const step = Math.ceil(n / maxPoints);
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < n; i += step) out.push({ x: x[i], y: fx[i] });
    return out;
  }, [x, fx, maxPoints]);

  const data = useMemo(() => {
    const datasets: any[] = [
      {
        type: 'scatter' as const,
        label: 'Puntos (x, f(x))',
        data: points,
        pointRadius: 2,
        backgroundColor: 'rgba(33, 150, 243, 0.65)',
      },
      {
        type: 'line' as const,
        label: 'Guía teórica (modo actual)',
        data: theoLine,
        borderWidth: 2,
        pointRadius: 0,
        borderColor: 'rgba(249, 115, 22, 0.95)',
        tension: 0,
      },
    ];

    if (showFullOverlay && fullTheoLine) {
      datasets.push({
        type: 'line' as const,
        label: 'Overlay: Triángulo completo',
        data: fullTheoLine,
        borderWidth: 2,
        pointRadius: 0,
        borderColor: 'rgba(120, 120, 120, 0.95)',
        tension: 0,
      });
    }

    return { datasets };
  }, [points, theoLine, fullTheoLine, showFullOverlay]);

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
        x: { type: 'linear', title: { display: true, text: 'x' }, grid: { color: 'rgba(0,0,0,0.08)' } },
        y: { title: { display: true, text: 'f(x)' }, grid: { color: 'rgba(0,0,0,0.08)' } },
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
