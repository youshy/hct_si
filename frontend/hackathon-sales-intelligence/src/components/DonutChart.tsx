interface ChartSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: ChartSegment[];
  centerLabel?: string;
  centerValue?: string | number;
  size?: number;
  showLegend?: boolean;
}

export function DonutChart({ segments, centerLabel, centerValue, size = 200, showLegend = true }: DonutChartProps) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-400"
        style={{ width: size, height: size }}
      >
        No data
      </div>
    );
  }

  const strokeWidth = size * 0.15;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let currentOffset = 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {segments.map((segment, index) => {
            const percentage = segment.value / total;
            const dashLength = circumference * percentage;
            const dashOffset = circumference * currentOffset;
            currentOffset += percentage;

            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={-dashOffset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue !== undefined && (
            <div className="text-2xl font-bold text-gray-900">{centerValue}</div>
          )}
          {centerLabel && (
            <div className="text-xs text-gray-500 uppercase tracking-wide">{centerLabel}</div>
          )}
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-sm text-gray-600">
                {segment.label} ({segment.value})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
