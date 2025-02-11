"use client"

import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { addDays } from "date-fns"
import Link from "next/link"

const MOCK_EVENTS = [
  {
    id: 1,
    vehicle: "Toyota Alphard",
    type: "inspection",
    date: addDays(new Date(), 2),
    inspector: "John Doe",
  },
  {
    id: 2,
    vehicle: "Mercedes V-Class",
    type: "maintenance",
    date: addDays(new Date(), 4),
    inspector: "Jane Smith",
  },
  {
    id: 3,
    vehicle: "BMW 7 Series",
    type: "inspection",
    date: addDays(new Date(), 7),
    inspector: "Mike Johnson",
  },
]

export function InspectionCalendar() {
  const { t } = useLanguage()
  const [date, setDate] = useState<Date | undefined>(new Date())

  const selectedDateEvents = MOCK_EVENTS.filter(
    (event) => date && event.date.toDateString() === date.toDateString()
  )

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_300px]">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
        modifiers={{
          event: (date) =>
            MOCK_EVENTS.some(
              (event) => event.date.toDateString() === date.toDateString()
            ),
        }}
        modifiersStyles={{
          event: { fontWeight: "bold", backgroundColor: "hsl(var(--primary))" },
        }}
      />
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">{t("dashboard.calendar.today")}</h3>
          {selectedDateEvents.length > 0 ? (
            <div className="space-y-2">
              {selectedDateEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-2 rounded-lg border text-sm space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{event.vehicle}</span>
                    <Badge variant="outline">{event.type}</Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {t("inspections.details.inspector")}: {event.inspector}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("dashboard.calendar.noEvents")}
            </p>
          )}
        </div>
        <Button className="w-full" asChild>
          <Link href="/inspections/schedule">
            {t("inspections.schedule.title")}
          </Link>
        </Button>
      </div>
    </div>
  )
} 