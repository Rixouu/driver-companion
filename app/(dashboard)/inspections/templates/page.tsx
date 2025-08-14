import { Metadata } from 'next'
import { EnhancedInspectionTemplateManager } from '@/components/inspections/enhanced-inspection-template-manager'

export const metadata: Metadata = {
  title: 'Inspection Templates',
  description: 'Manage inspection templates and assign them to vehicles or groups.',
}

export default function InspectionTemplatesPage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Inspection Templates</h1>
        <p className="text-muted-foreground">
          Manage inspection templates and assign them to vehicles or groups.
        </p>
      </div>

      <EnhancedInspectionTemplateManager />
    </div>
  )
}
