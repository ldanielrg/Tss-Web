// src/components/ServiceSystemsChart.tsx
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { TimeSeries } from '../utils/serviceSystemsSimulator';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend);

export default function ServiceSystemsChart({
  title,
  series,
}: {
  title: string;
  series: TimeSeries;
}) {
  const labels = series.xHours.map((x) => x.toFixed(2)); // horas
  const data = series.y;

  const chartData = {
    labels,
    datasets: [
      {
        label: series.name,
        data,
        tension: 0.2,
        pointRadius: 2,
        borderColor: '#2563eb',
        backgroundColor: '#2563eb',
        borderWidth: 3,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#2563eb',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false as const,
    plugins: {
      legend: { display: true },
      title: { display: true, text: title },
    },
    scales: {
      x: { title: { display: true, text: 'Tiempo (h)' } },
      y: { title: { display: true, text: 'Valor' } },
    },
  };

  return (
    <div className="h-80 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}
