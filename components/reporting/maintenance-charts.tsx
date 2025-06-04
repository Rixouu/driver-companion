'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ChartDataItem {
  name: string;
  value: number;
}

interface CostDataItem {
  month: string;
  cost: number;
}

interface MaintenanceChartsProps {
  priorityData: ChartDataItem[];
  statusData: ChartDataItem[];
  costsByMonthData: CostDataItem[];
  tasksByPriorityTitle: string;
  tasksByStatusTitle: string;
  costOverTimeTitle: string;
}

export function MaintenanceCharts({ 
  priorityData, 
  statusData, 
  costsByMonthData,
  tasksByPriorityTitle,
  tasksByStatusTitle,
  costOverTimeTitle
}: MaintenanceChartsProps) {
  const noPriorityData = !priorityData || priorityData.every(item => item.value === 0);
  const noStatusData = !statusData || statusData.every(item => item.value === 0);
  const noCostData = !costsByMonthData || costsByMonthData.length === 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-[300px]">
        <h3 className="text-sm font-medium mb-2">{tasksByPriorityTitle}</h3>
        {noPriorityData ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">No data available.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number, name: string) => [value, name.charAt(0).toUpperCase() + name.slice(1)]} />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="h-[300px]">
        <h3 className="text-sm font-medium mb-2">{tasksByStatusTitle}</h3>
        {noStatusData ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">No data available.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number, name: string) => [value, name.charAt(0).toUpperCase() + name.slice(1)]} />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="h-[300px] md:col-span-2">
        <h3 className="text-sm font-medium mb-2">{costOverTimeTitle}</h3>
        {noCostData ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">No data available.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={costsByMonthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number, name: string) => [`${value.toLocaleString()} (cost)`, name]} />
              <Line type="monotone" dataKey="cost" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
} 