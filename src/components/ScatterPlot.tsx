import React from 'react';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip as ChartTooltip,
  Legend,
  Title,
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(LinearScale, PointElement, ChartTooltip, Legend, Title);

type Point = { x: number; y: number };

export interface ScatterDataset {
  label: string;
  data: Point[];
  color?: string;
  pointRadius?: number;
}

interface ScatterPlotProps {
  title: string;
  xLabel?: string;
  yLabel?: string;
  datasets: ScatterDataset[];
  heightClassName?: string;
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({
  title,
  xLabel = 'x',
  yLabel = 'y',
  datasets,
  heightClassName = 'h-80',
}) => {
  const chartData = {
    datasets: datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.data,
      pointRadius: ds.pointRadius ?? 2,
      pointBackgroundColor: ds.color ?? (i === 0 ? 'rgba(37,99,235,0.8)' : 'rgba(220,38,38,0.55)'),
      pointBorderColor: ds.color ?? (i === 0 ? 'rgba(37,99,235,0.8)' : 'rgba(220,38,38,0.55)'),
      showLine: false,
    })),
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: true, text: title },
    },
    scales: {
      x: { type: 'linear', title: { display: true, text: xLabel } },
      y: { type: 'linear', title: { display: true, text: yLabel } },
    },
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow-md ${heightClassName}`}>
      <Scatter data={chartData} options={options} />
    </div>
  );
};

export default ScatterPlot;
