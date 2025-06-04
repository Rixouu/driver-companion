'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface FleetPieChartProps {
  data: Array<{ name: string; value: number }>;
  colors: string[];
}

export function FleetPieChart({ data, colors }: FleetPieChartProps) {
  if (!data || data.every(item => item.value === 0)) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available for chart.
      </div>
    );
  }
  
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string, props) => [`${value} vehicles`, name]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
} 