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
import type { TruckSummaryRow } from '../utils/truckSimulator';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend);

interface TruckCostChartProps {
  summary: TruckSummaryRow[];
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const TruckCostChart: React.FC<TruckCostChartProps> = ({ summary }) => {
  const labels = summary.map((r) => String(r.camiones));
  const data = summary.map((r) => r.costoTotalProm);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Costo total promedio',
        data,
        tension: 0.2,
        pointRadius: 3,

        borderColor: '#2563eb',        // azul
        backgroundColor: '#2563eb',    // para puntos/leyenda
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
      title: {
        display: true,
        text: 'Costo total promedio vs número de camiones',
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${formatMoney(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (val: any) => {
            const n = Number(val);
            if (!Number.isFinite(n)) return String(val);
            return formatMoney(n);
          },
        },
      },
      x: {
        title: { display: true, text: 'Número de camiones' },
      },
    },
  };

  return (
    <div className="h-80 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default TruckCostChart;
