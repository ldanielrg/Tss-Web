import React from 'react';

interface HeatmapGridProps {
  matrix: number[][];
  title: string;
  xLabel?: string;
  yLabel?: string;
  cellSizePx?: number;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const HeatmapGrid: React.FC<HeatmapGridProps> = ({
  matrix,
  title,
  xLabel = 'columna',
  yLabel = 'fila',
  cellSizePx = 34,
}) => {
  const k = matrix.length;
  const flat = matrix.flat();
  const max = Math.max(1, ...flat);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <div className="text-xs text-gray-500">
          {yLabel} × {xLabel}
        </div>
      </div>

      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${k}, ${cellSizePx}px)`,
          gap: 4,
        }}
      >
        {matrix.map((row, i) =>
          row.map((val, j) => {
            const a = clamp01(val / max);
            return (
              <div
                key={`${i}-${j}`}
                className="rounded flex items-center justify-center text-[11px] font-medium border"
                style={{
                  width: cellSizePx,
                  height: cellSizePx,
                  background: `rgba(37, 99, 235, ${0.08 + 0.72 * a})`,
                  borderColor: 'rgba(0,0,0,0.08)',
                  color: a > 0.55 ? 'white' : 'rgba(17,24,39,0.9)',
                }}
                title={`(${i + 1}, ${j + 1}) = ${val}`}
              >
                {val}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-3 text-xs text-gray-600">
        Más oscuro = más frecuencia. (max: {max})
      </div>
    </div>
  );
};

export default HeatmapGrid;
