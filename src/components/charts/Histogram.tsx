import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface HistogramProps {
  data: number[];
  bins?: number;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  referenceValue?: number;
  referenceName?: string;
}

export const Histogram: React.FC<HistogramProps> = ({
  data,
  bins = 20,
  title,
  xAxisLabel,
  yAxisLabel = 'Frequency',
  referenceValue,
  referenceName
}) => {
  // Calculate histogram bins
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / bins;

  const histogramData = Array.from({ length: bins }, (_, i) => {
    const binStart = min + i * binWidth;
    const binEnd = min + (i + 1) * binWidth;
    const count = data.filter(value => value >= binStart && (i === bins - 1 ? value <= binEnd : value < binEnd)).length;
    
    return {
      bin: `${binStart.toFixed(0)}-${binEnd.toFixed(0)}`,
      binMidpoint: binStart + binWidth / 2,
      count,
      frequency: count / data.length
    };
  });

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={histogramData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="bin"
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
            label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
          />
          <YAxis 
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [value, 'Frequency']}
            labelFormatter={(label: string) => `Range: ${label}`}
          />
          <Bar dataKey="count" fill="#3b82f6" stroke="#1d4ed8" strokeWidth={1} />
          {referenceValue !== undefined && (
            <ReferenceLine 
              x={referenceValue} 
              stroke="#ef4444" 
              strokeDasharray="5 5"
              label={{ value: referenceName || 'Reference', position: 'topRight' }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};