// src/components/InverseTransformEj2HistChart.tsx
import { useMemo } from 'react';
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

export default function InverseTransformEj2HistChart({
  title,
  labels,
  histDensity,
  theoPdf,
  fullTheoPdf,
  showFullOverlay,
}: {
  title: string;
  labels: string[];
  histDensity: number[];
  theoPdf: number[];
  fullTheoPdf?: number[];
  showFullOverlay?: boolean;
}) {
  const data = useMemo(() => {
    const datasets: any[] = [
      {
        type: 'bar' as const,
        label: 'Histograma (densidad)',
        data: histDensity,
        borderWidth: 1,
        backgroundColor: 'rgba(59, 130, 246, 0.45)',
        borderColor: 'rgba(59, 130, 246, 0.45)',
      },
      {
        type: 'line' as const,
        label: 'Teórico (modo actual)',
        data: theoPdf,
        borderWidth: 2,
        tension: 0.2,
        pointRadius: 0,
        borderColor: 'rgba(249, 115, 22, 0.95)',
        backgroundColor: 'rgba(249, 115, 22, 0.10)',
      },
    ];

    if (showFullOverlay && fullTheoPdf) {
      datasets.push({
        type: 'line' as const,
        label: 'Overlay: Triángulo completo',
        data: fullTheoPdf,
        borderWidth: 2,
        tension: 0.2,
        pointRadius: 0,
        borderColor: 'rgba(120, 120, 120, 0.95)',
      });
    }

    return { labels, datasets };
  }, [labels, histDensity, theoPdf, fullTheoPdf, showFullOverlay]);

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
        x: { title: { display: true, text: 'x (centros)' }, grid: { color: 'rgba(0,0,0,0.08)' } },
        y: { title: { display: true, text: 'Densidad' }, grid: { color: 'rgba(0,0,0,0.08)' } },
      },
    }),
    [title]
  );

  return (
    <div className="h-80 w-full">
      <Chart type="bar" data={data as any} options={options} />
    </div>
  );
}
