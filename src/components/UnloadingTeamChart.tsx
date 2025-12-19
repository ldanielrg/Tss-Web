// src/components/UnloadingTeamChart.tsx
import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend);

const PALETTE = ['#2563eb', '#f97316', '#16a34a', '#a855f7'];

export default function UnloadingTeamChart({
  title,
  labels,
  totalCost,
  laborCost,
  waitingCost,
}: {
  title: string;
  labels: string[];
  totalCost: number[];
  laborCost: number[];
  waitingCost: number[];
}) {
  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'Costo total ($)',
          data: totalCost,
          backgroundColor: PALETTE[0],
        },
        {
          label: 'Mano de obra ($)',
          data: laborCost,
          backgroundColor: PALETTE[1],
        },
        {
          label: 'Espera ($)',
          data: waitingCost,
          backgroundColor: PALETTE[2],
        },
      ],
    }),
    [labels, totalCost, laborCost, waitingCost]
  );

  const options = useMemo<ChartOptions<'bar'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' },
        title: { display: true, text: title, padding: { top: 6, bottom: 10 }, font: { size: 14, weight: 'normal' } },
        tooltip: { enabled: true },
      },
      layout: { padding: 12 },
      scales: {
        x: { title: { display: true, text: 'Trabajadores en el equipo' } },
        y: { title: { display: true, text: 'Costo ($)' } },
      },
    }),
    [title]
  );

  return (
    <div className="h-80 w-full">
      <Bar data={data} options={options} />
    </div>
  );
}
