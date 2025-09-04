"use client"

import { MetricsCard } from './metrics-card'
import { 
  DollarSign, 
  FileText, 
  Calendar, 
  Car, 
  User, 
  ClipboardCheck, 
  Wrench,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

interface MetricsGridProps {
  data: {
    // Financial metrics
    totalRevenue?: number
    totalQuotations?: number
    avgQuoteValue?: number
    approvalRate?: number
    conversionRate?: number
    activeBookings?: number
    
    // Vehicle metrics
    totalVehicles?: number
    activeVehicles?: number
    vehiclesInMaintenance?: number
    
    // Driver metrics
    totalDrivers?: number
    activeDrivers?: number
    driversOnDuty?: number
    
    // Inspection metrics
    totalInspections?: number
    completedInspections?: number
    pendingInspections?: number
    failedInspections?: number
    
    // Maintenance metrics
    totalMaintenanceTasks?: number
    completedTasks?: number
    pendingTasks?: number
    overdueTasks?: number
  }
  className?: string
}

export function MetricsGrid({ data, className }: MetricsGridProps) {
  const metrics = [
    // Financial metrics
    {
      title: "Total Revenue",
      value: `¥${((data.totalRevenue || 0) / 1000000).toFixed(1)}M`,
      description: "Last 30 days",
      icon: DollarSign,
      iconColor: "text-green-600",
      valueColor: "text-green-600"
    },
    {
      title: "Total Quotations",
      value: data.totalQuotations || 0,
      description: "Generated this period",
      icon: FileText,
      iconColor: "text-blue-600"
    },
    {
      title: "Average Quote Value",
      value: `¥${((data.avgQuoteValue || 0) / 1000).toFixed(0)}k`,
      description: "Per quotation",
      icon: TrendingUp,
      iconColor: "text-purple-600"
    },
    {
      title: "Approval Rate",
      value: `${data.approvalRate || 0}%`,
      description: "Quotes approved",
      icon: CheckCircle,
      iconColor: "text-green-600",
      valueColor: data.approvalRate && data.approvalRate >= 70 ? "text-green-600" : "text-orange-600"
    },
    {
      title: "Conversion Rate",
      value: `${data.conversionRate || 0}%`,
      description: "Quotes converted",
      icon: TrendingUp,
      iconColor: "text-purple-600",
      valueColor: data.conversionRate && data.conversionRate >= 20 ? "text-green-600" : "text-orange-600"
    },
    {
      title: "Active Bookings",
      value: data.activeBookings || 0,
      description: "Pending & confirmed",
      icon: Calendar,
      iconColor: "text-purple-600"
    },
    
    // Vehicle metrics
    {
      title: "Total Vehicles",
      value: data.totalVehicles || 0,
      description: "In fleet",
      icon: Car,
      iconColor: "text-blue-600"
    },
    {
      title: "Active Vehicles",
      value: data.activeVehicles || 0,
      description: "Available for service",
      icon: Car,
      iconColor: "text-green-600"
    },
    {
      title: "In Maintenance",
      value: data.vehiclesInMaintenance || 0,
      description: "Currently serviced",
      icon: Wrench,
      iconColor: "text-orange-600"
    },
    
    // Driver metrics
    {
      title: "Total Drivers",
      value: data.totalDrivers || 0,
      description: "Registered drivers",
      icon: User,
      iconColor: "text-blue-600"
    },
    {
      title: "Active Drivers",
      value: data.activeDrivers || 0,
      description: "Available drivers",
      icon: User,
      iconColor: "text-green-600"
    },
    {
      title: "On Duty",
      value: data.driversOnDuty || 0,
      description: "Currently working",
      icon: User,
      iconColor: "text-purple-600"
    },
    
    // Inspection metrics
    {
      title: "Total Inspections",
      value: data.totalInspections || 0,
      description: "This period",
      icon: ClipboardCheck,
      iconColor: "text-blue-600"
    },
    {
      title: "Completed",
      value: data.completedInspections || 0,
      description: "Successfully finished",
      icon: CheckCircle,
      iconColor: "text-green-600"
    },
    {
      title: "Pending",
      value: data.pendingInspections || 0,
      description: "Awaiting completion",
      icon: AlertTriangle,
      iconColor: "text-yellow-600"
    },
    {
      title: "Failed",
      value: data.failedInspections || 0,
      description: "Require attention",
      icon: AlertTriangle,
      iconColor: "text-red-600"
    },
    
    // Maintenance metrics
    {
      title: "Total Tasks",
      value: data.totalMaintenanceTasks || 0,
      description: "This period",
      icon: Wrench,
      iconColor: "text-blue-600"
    },
    {
      title: "Completed",
      value: data.completedTasks || 0,
      description: "Successfully finished",
      icon: CheckCircle,
      iconColor: "text-green-600"
    },
    {
      title: "Pending",
      value: data.pendingTasks || 0,
      description: "Awaiting completion",
      icon: AlertTriangle,
      iconColor: "text-yellow-600"
    },
    {
      title: "Overdue",
      value: data.overdueTasks || 0,
      description: "Past due date",
      icon: AlertTriangle,
      iconColor: "text-red-600",
      badge: data.overdueTasks && data.overdueTasks > 0 ? {
        text: "Action Required",
        variant: "destructive"
      } : undefined
    }
  ]

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 ${className || ''}`}>
      {metrics.map((metric, index) => (
        <MetricsCard
          key={index}
          title={metric.title}
          value={metric.value}
          description={metric.description}
          icon={metric.icon}
          iconColor={metric.iconColor}
          valueColor={metric.valueColor}
          badge={metric.badge}
        />
      ))}
    </div>
  )
}
