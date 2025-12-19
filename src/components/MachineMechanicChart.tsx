// src/components/MachineMechanicChart.tsx
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

const PALETTE = ['#7c3aed', '#ef4444', '#0ea5e9'];

export default function MachineMechanicChart({
  labels,
  objectiveCost,
  idleCostPerHourSystem,
}: {
  labels: string[];
  objectiveCost: number[];
  idleCostPerHourSystem: number[];
}) {
  const data = useMemo(
    () => ({
      labels,
      datasets: [
        { label: 'Costo objetivo ($/h)', data: objectiveCost, backgroundColor: PALETTE[0] },
        { label: 'Costo ocio ($/h)', data: idleCostPerHourSystem, backgroundColor: PALETTE[1] },
      ],
    }),
    [labels, objectiveCost, idleCostPerHourSystem]
  );

  const options = useMemo<ChartOptions<'bar'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' },
        title: { display: true, text: 'Costo vs N (máquinas por mecánico)' },
      },
      scales: {
        x: { title: { display: true, text: 'N' } },
        y: { title: { display: true, text: 'Costo ($/h)' } },
      },
    }),
    []
  );

  return (
    <div className="h-80 w-full">
      <Bar data={data} options={options} />
    </div>
  );
}
