"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/components/providers/language-provider"
import { Edit2, Target } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface MileageGoal {
  id: string
  type: 'daily' | 'monthly' | 'yearly'
  target: number
  current: number
  startDate: Date
  endDate: Date
}

interface MileageGoalsProps {
  vehicleId: string
  currentMileage: number
  dailyAverage: number
}

export function MileageGoals({ vehicleId, currentMileage, dailyAverage }: MileageGoalsProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [editingGoal, setEditingGoal] = useState<MileageGoal | null>(null)

  // TODO: Replace with actual API call
  const goals: MileageGoal[] = [
    {
      id: "1",
      type: "monthly",
      target: 3000,
      current: 2100,
      startDate: new Date(2024, 1, 1),
      endDate: new Date(2024, 1, 31),
    },
    {
      id: "2",
      type: "yearly",
      target: 36000,
      current: 24000,
      startDate: new Date(2024, 0, 1),
      endDate: new Date(2024, 11, 31),
    },
  ]

  const handleSaveGoal = async () => {
    if (!editingGoal) return

    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    toast({
      title: t("common.success"),
      description: t("vehicles.management.mileage.goals.updated"),
    })

    setIsEditing(false)
    setEditingGoal(null)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-green-500"
    if (percentage >= 75) return "bg-yellow-500"
    return "bg-blue-500"
  }

  const calculateProgress = (goal: MileageGoal) => {
    const progress = (goal.current / goal.target) * 100
    return Math.min(progress, 100)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("vehicles.management.mileage.goals.title")}</CardTitle>
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Edit2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("vehicles.management.mileage.goals.edit")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>{t("vehicles.management.mileage.goals.monthly")}</Label>
                <Input
                  type="number"
                  value={editingGoal?.target || goals[0].target}
                  onChange={(e) => setEditingGoal({
                    ...goals[0],
                    target: parseInt(e.target.value)
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("vehicles.management.mileage.goals.yearly")}</Label>
                <Input
                  type="number"
                  value={editingGoal?.target || goals[1].target}
                  onChange={(e) => setEditingGoal({
                    ...goals[1],
                    target: parseInt(e.target.value)
                  })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSaveGoal}>
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals.map((goal) => {
          const progress = calculateProgress(goal)
          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">
                    {t(`vehicles.management.mileage.goals.${goal.type}`)}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {goal.current.toLocaleString()} / {goal.target.toLocaleString()} km
                  </p>
                </div>
                <Target className={`h-4 w-4 ${
                  progress >= 100 ? 'text-green-500' : 'text-muted-foreground'
                }`} />
              </div>
              <Progress
                value={progress}
                className={getProgressColor(progress)}
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
} 