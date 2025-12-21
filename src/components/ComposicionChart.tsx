// src/components/ComposicionChart.tsx
import  { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, ChartTooltip, Legend);

export default function ComposicionChart({
  title,
  labels,
  histDensity,
  theoPdf,
}: {
  title: string;
  labels: string[];
  histDensity: number[];
  theoPdf: number[];
}) {
  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
            type: 'bar' as const,
            label: 'Histograma (densidad)',
            data: histDensity,
            borderWidth: 1,
            backgroundColor: 'rgba(59, 130, 246, 0.45)', // celeste/azul
            borderColor: 'rgba(59, 130, 246, 0.45)',
        },
        {
            type: 'line' as const,
            label: 'Teórico f(x)',
            data: theoPdf,
            borderWidth: 2,
            tension: 0.25,
            pointRadius: 0,
            borderColor: 'rgba(249, 22, 22, 1)',       // naranja
            backgroundColor: 'rgba(249, 115, 22, 0.15)',
        },
    ],
    }),
    [labels, histDensity, theoPdf]
  );

  const options = useMemo<ChartOptions<'bar'>>(
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
          title: { display: true, text: 'x (centros de intervalos)' },
          ticks: { maxRotation: 0, autoSkip: true },
          grid: { color: 'rgba(0,0,0,0.08)' },
        },
        y: {
          title: { display: true, text: 'Densidad' },
          grid: { color: 'rgba(0,0,0,0.08)' },
        },
      },
    }),
    [title]
  );

  return (
    <div className="h-80 w-full">
      {/* TS de Chart.js se pone quisquilloso con mixed charts; esto va perfecto en runtime */}
      <Chart type="bar" data={data as any} options={options} />
    </div>
  );
}
