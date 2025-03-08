import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTheme } from "next-themes"
import { DateRange } from "react-day-picker"
import { addMonths } from "date-fns"
import { Wrench } from "lucide-react"

interface MaintenanceTypeData {
  name: string
  value: number
  color: string
}

interface MaintenanceTypeChartProps {
  dateRange: DateRange | undefined
}

const COLORS = ['#10B981', '#8B5CF6', '#3B82F6', '#F59E0B', '#EC4899']

export function MaintenanceTypeChart({ dateRange }: MaintenanceTypeChartProps) {
  const [data, setData] = useState<MaintenanceTypeData[]>([])
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const textColor = isDark ? "#9CA3AF" : "#6B7280"
  const backgroundColor = isDark ? "#18181B" : "#FFFFFF"
  const borderColor = isDark ? "#374151" : "#E5E7EB"

  useEffect(() => {
    async function fetchMaintenanceData() {
      const startDate = dateRange?.from || addMonths(new Date(), -6)
      const endDate = dateRange?.to || new Date()

      const { data: maintenanceTasks, error } = await supabase
        .from('maintenance_tasks')
        .select('title')
        .gte('completed_date', startDate.toISOString())
        .lte('completed_date', endDate.toISOString())
        .not('completed_date', 'is', null)

      if (error) {
        console.error('Error fetching maintenance data:', error)
        return
      }

      // Count tasks by title
      const typeCounts = maintenanceTasks.reduce((acc: { [key: string]: number }, task) => {
        // Extract the type from the title (e.g., "Repair for Alphard" -> "Repair")
        const type = task.title?.split(' ')[0] || 'Other'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {})

      // Convert to array format for chart
      const chartData = Object.entries(typeCounts)
        .map(([name, value], index) => ({
          name,
          value,
          color: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => b.value - a.value)

      setData(chartData)
    }

    fetchMaintenanceData()
  }, [dateRange])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium">Maintenance Type Distribution</CardTitle>
          <CardDescription>Breakdown of maintenance services by type</CardDescription>
        </div>
        <Wrench className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '6px'
                }}
                labelStyle={{ color: textColor }}
              />
              <Legend
                iconType="circle"
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{ color: textColor }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 