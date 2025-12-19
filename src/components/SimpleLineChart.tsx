import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend,
  Title,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTooltip, Legend, Title);

interface SimpleLineChartProps {
  title: string;
  labels: string[];
  yLabel?: string;
  datasetLabel: string;
  data: number[];
  heightClassName?: string;
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  title,
  labels,
  yLabel = 'valor',
  datasetLabel,
  data,
  heightClassName = 'h-80',
}) => {
  const chartData = {
    labels,
    datasets: [
      {
        label: datasetLabel,
        data,
        tension: 0.2,
        pointRadius: 2,
        borderColor: 'rgba(37,99,235,0.9)',
        backgroundColor: 'rgba(37,99,235,0.9)',
        borderWidth: 2,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: true, text: title },
    },
    scales: {
      y: { title: { display: true, text: yLabel } },
      x: { title: { display: true, text: 'iteración' } },
    },
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow-md ${heightClassName}`}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default SimpleLineChart;
