"use client"

import { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-10 px-6 text-center">
        <div className="rounded-full h-12 w-12 bg-muted flex items-center justify-center text-muted-foreground mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
        {action && <div>{action}</div>}
      </CardContent>
    </Card>
  )
} 