import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: stats } = await db
      .from("vehicle_statistics")
      .select("*")
      .eq("vehicle_id", params.id)
      .single()

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error fetching vehicle statistics:", error)
    return new NextResponse("Error fetching vehicle statistics", { status: 500 })
  }
} 