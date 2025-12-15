// src/components/ServiceSystemsChart.tsx
import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { TimeSeries } from '../utils/serviceSystemsSimulator';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend);

const PALETTE = ['#2563eb', '#f97316', '#16a34a', '#a855f7', '#0ea5e9', '#ef4444'];

export default function ServiceSystemsChart({
  title,
  series,
}: {
  title: string;
  series: TimeSeries | TimeSeries[];
}) {
  const all = Array.isArray(series) ? series : [series];

  const labels = all[0]?.xHours?.map((x) => x.toFixed(2)) ?? [];

  const chartData = useMemo(() => {
    return {
      labels,
      datasets: all.map((s, idx) => ({
        label: s.name,
        data: s.y,
        tension: 0.35,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 3,
        borderColor: PALETTE[idx % PALETTE.length],
        backgroundColor: PALETTE[idx % PALETTE.length],
      })),
    };
  }, [all, labels]);

  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            boxWidth: 10,
            boxHeight: 10,
          },
        },
        title: {
          display: true,
          text: title,
          padding: { top: 6, bottom: 10 },
          font: { size: 14, weight: 'normal' },
        },
        tooltip: { enabled: true },
      },

      // ✅ opción A: padding como número (nunca falla)
      layout: { padding: 12 },

      // ✅ opción B (si prefieres objeto):
      // layout: { padding: { top: 8, right: 12, bottom: 6, left: 8 } },

      scales: {
        x: {
          title: { display: true, text: 'Tiempo (h)' },
          grid: { color: 'rgba(0,0,0,0.08)' },
          ticks: { maxRotation: 0, autoSkip: true },
        },
        y: {
          title: { display: true, text: 'Valor' },
          grid: { color: 'rgba(0,0,0,0.08)' },
          // si te daba error "precision", quítalo:
          // ticks: { precision: 0 },
        },
      },
    }),
    [title]
  );


  return (
    <div className="h-80 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}
