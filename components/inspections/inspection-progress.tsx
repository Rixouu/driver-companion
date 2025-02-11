"use client"

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/providers/language-provider"
import { CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface InspectionProgressProps {
  sections: {
    id: string
    total: number
    completed: number
    failed: number
  }[]
  currentSection: string
}

export function InspectionProgress({ sections, currentSection }: InspectionProgressProps) {
  const { t } = useLanguage()
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
              <span className="text-sm font-medium transition-all duration-300 ease-in-out">
                {progress}% {t("common.completed")}
              </span>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1 hover:scale-105 transition-transform duration-200">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="transition-opacity duration-200">
                    {completedItems}
                  </span>
                </div>
                <div className="flex items-center gap-1 hover:scale-105 transition-transform duration-200">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="transition-opacity duration-200">
                    {failedItems}
                  </span>
                </div>
                <div className="flex items-center gap-1 hover:scale-105 transition-transform duration-200">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="transition-opacity duration-200">
                    {totalItems - completedItems - failedItems}
                  </span>
                </div>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className="capitalize transition-all duration-300 ease-in-out"
            >
              {t(`inspections.sections.${currentSection}`)}
            </Badge>
          </div>
          <div className="transition-all duration-500 ease-in-out">
            <Progress value={progress} className="h-2" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {sections.map((section) => (
              <div 
                key={section.id} 
                className="text-sm transition-all duration-300 ease-in-out"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-muted-foreground capitalize transition-colors duration-200",
                    currentSection === section.id && "text-primary font-medium"
                  )}>
                    {t(`inspections.sections.${section.id}`)}
                  </span>
                  <span className="font-medium transition-all duration-200">
                    {Math.round((section.completed / section.total) * 100)}%
                  </span>
                </div>
                <div className="transition-all duration-300 ease-in-out">
                  <Progress 
                    value={(section.completed / section.total) * 100} 
                    className="h-1"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 