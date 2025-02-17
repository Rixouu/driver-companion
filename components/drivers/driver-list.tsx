"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

// Mock data - replace with actual data fetching
const MOCK_DRIVERS = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    license: "DL123456",
    status: "active",
    lastInspection: "2024-03-01",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    license: "DL789012",
    status: "inactive",
    lastInspection: "2024-02-15",
  },
]

export function DriverList() {
  const [drivers] = useState(MOCK_DRIVERS)

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>License</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Inspection</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map((driver) => (
            <TableRow key={driver.id}>
              <TableCell className="font-medium">{driver.name}</TableCell>
              <TableCell>{driver.email}</TableCell>
              <TableCell>{driver.license}</TableCell>
              <TableCell>
                <Badge
                  variant={driver.status === "active" ? "success" : "secondary"}
                >
                  {driver.status}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(driver.lastInspection)}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 