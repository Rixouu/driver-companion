import { NextResponse } from "next/server"
import { mockApi } from "@/lib/mock-data"

export async function GET() {
  const inspections = await mockApi.getInspections()
  return NextResponse.json(inspections)
}

export async function POST(request: Request) {
  const data = await request.json()
  const newInspection = await mockApi.createInspection(data)
  return NextResponse.json(newInspection)
}

