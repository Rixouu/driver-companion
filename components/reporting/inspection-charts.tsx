'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ChartDataItem {
  name: string;
  value: number;
}

interface CommonFailureItem {
  category: string;
  count: number;
}

const DEFAULT_PIE_COLORS = ['#10B981', '#EF4444', '#F59E0B', '#6B7280']; // Green for pass, Red for fail

interface InspectionChartsProps {
  statusData: ChartDataItem[];
  passRateData: ChartDataItem[];
  commonFailuresData: CommonFailureItem[];
  inspectionsByStatusTitle: string;
  passRateTitle: string;
  commonFailuresTitle: string;
  pieColors?: string[];
}

export function InspectionCharts({ 
  statusData, 
  passRateData, 
  commonFailuresData, 
  inspectionsByStatusTitle, 
  passRateTitle, 
  commonFailuresTitle,
  pieColors = DEFAULT_PIE_COLORS
}: InspectionChartsProps) {

  const noStatusData = !statusData || statusData.every(item => item.value === 0);
  const noPassRateData = !passRateData || passRateData.every(item => item.value === 0);
  const noCommonFailuresData = !commonFailuresData || commonFailuresData.length === 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-[300px]">
        <h3 className="text-sm font-medium mb-2">{inspectionsByStatusTitle}</h3>
        {noStatusData ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">No data available.</div>
        ) : (
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
            </ResponsiveContainer>
        )}
      </div>

      <div className="h-[300px]">
        <h3 className="text-sm font-medium mb-2">{passRateTitle}</h3>
        {noPassRateData ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">No data available.</div>
        ) : (
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                data={passRateData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                {passRateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [value, name]} />
                <Legend />
            </PieChart>
            </ResponsiveContainer>
        )}
      </div>

      <div className="h-[300px] md:col-span-2">
        <h3 className="text-sm font-medium mb-2">{commonFailuresTitle}</h3>
        {noCommonFailuresData ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">No data available.</div>
        ) : (
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={commonFailuresData} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" width={150} />
                <Tooltip formatter={(value: number, name: string) => [value, name]}/>
                <Legend />
                <Bar dataKey="count" fill="#EF4444" />
            </BarChart>
            </ResponsiveContainer>
        )}
      </div>
    </div>
  );
} 