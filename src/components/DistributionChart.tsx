import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  ChartTooltip,
  Legend
);

interface DistributionChartProps {
  histogramData: {
    bins: number[];
    frequencies: number[];
    density: number[];
  };
  theoreticalData: {
    x: number[];
    y: number[];
  };
  title: string;
}

const DistributionChart: React.FC<DistributionChartProps> = ({ histogramData, theoreticalData, title }) => {
  const data = {
    labels: histogramData.bins.map(bin => bin.toFixed(2)),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Histograma (Datos Simulados)',
        data: histogramData.density,
        backgroundColor: 'rgba(37, 99, 235, 0.6)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        type: 'line' as const,
        label: 'Densidad Teórica',
        data: theoreticalData.y,
        borderColor: 'rgba(234, 88, 12, 1)',
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
        borderWidth: 3,
        pointRadius: 0,
        yAxisID: 'y',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Valor',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Densidad',
        },
      },
    },
    interaction: {
      intersect: false,
    },
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <Chart type="bar" data={data} options={options} />
    </div>
  );
};

export default DistributionChart;