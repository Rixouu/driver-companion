import { NextResponse } from "next/server"
import { mockApi } from "@/lib/mock-data"

export async function GET() {
  const vehicles = await mockApi.getVehicles()
  return NextResponse.json(vehicles)
}

export async function POST(request: Request) {
  const data = await request.json()
  const newVehicle = await mockApi.createVehicle(data)
  return NextResponse.json(newVehicle)
}

