import { Badge } from "@/components/ui/badge"

interface InspectionStatusBadgeProps {
  status: string
}

export function InspectionStatusBadge({ status }: InspectionStatusBadgeProps) {
  const getVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'in_progress':
        return 'warning'
      case 'pending':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'in_progress':
        return 'In Progress'
      case 'pending':
        return 'Pending'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  return (
    <Badge variant={getVariant(status)}>
      {getLabel(status)}
    </Badge>
  )
} 