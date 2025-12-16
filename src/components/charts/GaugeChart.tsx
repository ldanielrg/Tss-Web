import React from 'react';

interface GaugeChartProps {
  value: number; // 0 to 1
  title: string;
  subtitle?: string;
  thresholds?: {
    good: number;
    acceptable: number;
  };
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  title,
  subtitle,
  thresholds = { good: 0.7, acceptable: 0.5 }
}) => {
  const percentage = Math.max(0, Math.min(100, value * 100));
  const angle = (percentage / 100) * 180 - 90; // -90 to 90 degrees

  let color = '#ef4444'; // red
  let status = 'REJECT';
  
  if (value >= thresholds.good) {
    color = '#22c55e'; // green
    status = 'ACCEPT';
  } else if (value >= thresholds.acceptable) {
    color = '#f59e0b'; // amber
    status = 'MARGINAL';
  }

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      
      <div className="relative w-48 h-24 mb-4">
        {/* Gauge Background */}
        <svg viewBox="0 0 200 100" className="w-full h-full">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          
          {/* Background Arc */}
          <path
            d="M 20 80 A 60 60 0 0 1 180 80"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
            strokeLinecap="round"
          />
          
          {/* Progress Arc */}
          <path
            d="M 20 80 A 60 60 0 0 1 180 80"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 1.6} 160`}
          />
          
          {/* Needle */}
          <line
            x1="100"
            y1="80"
            x2="100"
            y2="30"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${angle} 100 80)`}
          />
          
          {/* Center Dot */}
          <circle cx="100" cy="80" r="4" fill={color} />
        </svg>
        
        {/* Percentage Display */}
        <div className="absolute inset-0 flex items-end justify-center pb-2">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color }}>
              {percentage.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <div className={`text-xl font-bold mb-1 ${
          status === 'ACCEPT' ? 'text-green-600' :
          status === 'MARGINAL' ? 'text-amber-600' : 'text-red-600'
        }`}>
          {status}
        </div>
        {subtitle && (
          <p className="text-sm text-gray-600">{subtitle}</p>
        )}
      </div>
    </div>
  );
};