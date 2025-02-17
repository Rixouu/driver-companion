"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface Section {
  id: string
  total: number
  completed: number
  failed: number
}

interface InspectionProgressProps {
  sections: Section[]
  currentSection: string
}

export function InspectionProgress({ sections, currentSection }: InspectionProgressProps) {
  const getSectionLabel = (id: string) => {
    return id.charAt(0).toUpperCase() + id.slice(1)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid gap-4 md:grid-cols-4">
          {sections.map((section) => (
            <div key={section.id}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  "text-sm font-medium",
                  currentSection === section.id && "text-primary"
                )}>
                  {getSectionLabel(section.id)}
                </span>
                <span className="text-sm font-medium">
                  {Math.round((section.completed / section.total) * 100)}%
                </span>
              </div>
              <Progress 
                value={(section.completed / section.total) * 100} 
                className="h-1"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 