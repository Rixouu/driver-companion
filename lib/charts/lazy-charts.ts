"use client"

import { lazy } from 'react';

// Lazy load chart libraries to reduce initial bundle size
export const LineChart = lazy(() => 
  import('recharts').then(mod => ({ default: mod.LineChart }))
);

export const BarChart = lazy(() => 
  import('recharts').then(mod => ({ default: mod.BarChart }))
);

export const PieChart = lazy(() => 
  import('recharts').then(mod => ({ default: mod.PieChart }))
);

export const AreaChart = lazy(() => 
  import('recharts').then(mod => ({ default: mod.AreaChart }))
);

export const ComposedChart = lazy(() => 
  import('recharts').then(mod => ({ default: mod.ComposedChart }))
);

export const ScatterChart = lazy(() => 
  import('recharts').then(mod => ({ default: mod.ScatterChart }))
);

export const RadarChart = lazy(() => 
  import('recharts').then(mod => ({ default: mod.RadarChart }))
);

export const RadialBarChart = lazy(() => 
  import('recharts').then(mod => ({ default: mod.RadialBarChart }))
);

// Lazy load chart components
export const Line = lazy(() => 
  import('recharts').then(mod => ({ default: mod.Line }))
);

export const Bar = lazy(() => 
  import('recharts').then(mod => ({ default: mod.Bar }))
);

export const Pie = lazy(() => 
  import('recharts').then(mod => ({ default: mod.Pie }))
);

export const Area = lazy(() => 
  import('recharts').then(mod => ({ default: mod.Area }))
);

export const XAxis = lazy(() => 
  import('recharts').then(mod => ({ default: mod.XAxis }))
);

export const YAxis = lazy(() => 
  import('recharts').then(mod => ({ default: mod.YAxis }))
);

export const CartesianGrid = lazy(() => 
  import('recharts').then(mod => ({ default: mod.CartesianGrid }))
);

export const Tooltip = lazy(() => 
  import('recharts').then(mod => ({ default: mod.Tooltip }))
);

export const Legend = lazy(() => 
  import('recharts').then(mod => ({ default: mod.Legend }))
);

export const ResponsiveContainer = lazy(() => 
  import('recharts').then(mod => ({ default: mod.ResponsiveContainer }))
);

export const Cell = lazy(() => 
  import('recharts').then(mod => ({ default: mod.Cell }))
);

export const ReferenceLine = lazy(() => 
  import('recharts').then(mod => ({ default: mod.ReferenceLine }))
);

export const ReferenceArea = lazy(() => 
  import('recharts').then(mod => ({ default: mod.ReferenceArea }))
);

// Lazy load chart utilities
export const Label = lazy(() => 
  import('recharts').then(mod => ({ default: mod.Label }))
);

export const LabelList = lazy(() => 
  import('recharts').then(mod => ({ default: mod.LabelList }))
);

export const Sector = lazy(() => 
  import('recharts').then(mod => ({ default: mod.Sector }))
);

// Chart loading skeleton component
export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div 
      className="animate-pulse bg-muted rounded-lg flex items-center justify-center"
      style={{ height }}
    >
      <div className="text-muted-foreground text-sm">Loading chart...</div>
    </div>
  );
}

// Chart error boundary component
export function ChartErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 text-center">
      <div className="text-destructive text-sm mb-2">Failed to load chart</div>
      <button 
        onClick={resetError}
        className="text-xs text-muted-foreground hover:text-foreground underline"
      >
        Try again
      </button>
    </div>
  );
}
