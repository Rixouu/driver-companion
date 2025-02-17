"use client"

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface ProgressSection {
  id: string
  total: number
  completed: number
  failed: number
}

interface InspectionProgressProps {
  sections: ProgressSection[]
  currentSection: string
}

export function InspectionProgress({ sections, currentSection }: InspectionProgressProps) {
  const totalItems = sections.reduce((sum, section) => sum + section.total, 0)
  const completedItems = sections.reduce((sum, section) => sum + section.completed, 0)
  const failedItems = sections.reduce((sum, section) => sum + section.failed, 0)
  const progress = Math.round((completedItems / totalItems) * 100)

  return (
    <Card className="sticky top-4 z-10 shadow-md">
      <CardContent className="pt-6">
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {progress}% {"common.completed"}
              </span>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{completedItems}</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span>{failedItems}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span>{totalItems - completedItems - failedItems}</span>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="capitalize">
              {currentSection}
            </Badge>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <div className="grid grid-cols-4 gap-2">
            {sections.map((section) => (
              <div key={section.id} className="text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-muted-foreground capitalize",
                    currentSection === section.id && "text-primary font-medium"
                  )}>
                    {section.id}
                  </span>
                  <span className="font-medium">
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
        </div>
      </CardContent>
    </Card>
  )
} 