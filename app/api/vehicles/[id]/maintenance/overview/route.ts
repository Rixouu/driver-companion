import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: tasks } = await db
      .from("maintenance_tasks")
      .select("*")
      .eq("vehicle_id", params.id)
      .order("due_date", { ascending: true })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("Error fetching maintenance overview:", error)
    return new NextResponse("Error fetching maintenance overview", { status: 500 })
  }
} 