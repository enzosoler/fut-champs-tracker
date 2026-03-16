'use client';

import { LineChart, Line, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';

interface SparklineChartProps {
  data: number[];
  color?: string;
  height?: number;
  showTooltip?: boolean;
}

export function SparklineChart({ data, color = '#6366f1', height = 56, showTooltip = true }: SparklineChartProps) {
  if (!data || data.length < 2) return null;
  const chartData = data.map((value, i) => ({ i: i + 1, value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <ReferenceLine y={50} stroke="#ffffff10" strokeDasharray="4 4" />
        {showTooltip && (
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              return (
                <div className="bg-card border border-[#273246] rounded-lg px-2 py-1 text-xs text-white shadow-xl">
                  {payload[0].value}%
                </div>
              );
            }}
          />
        )}
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3, fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
