"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function InspectionSchedule() {

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{"vehicles.details.inspections.title"}</CardTitle>
        <Button>
          {"vehicles.details.inspections.schedule"}
        </Button>
      </CardHeader>
      <CardContent>
        <div>
          <h3>{"vehicles.details.inspections.title"}</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{"vehicles.details.inspections.date"}</TableHead>
                <TableHead>{"vehicles.details.inspections.time"}</TableHead>
                <TableHead>{"vehicles.details.inspections.status"}</TableHead>
                <TableHead>{"vehicles.details.inspections.actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>February 12th, 2025</TableCell>
                <TableCell>10:00</TableCell>
                <TableCell>{"status.scheduled"}</TableCell>
                <TableCell>
                  <Button variant="outline">{"vehicles.details.inspections.reschedule"}</Button>
                  <Button variant="destructive">{"vehicles.details.inspections.cancel"}</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
} 