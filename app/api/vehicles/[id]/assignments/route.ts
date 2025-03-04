import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: assignments } = await db
      .from("vehicle_assignments")
      .select(`
        id,
        status,
        created_at,
        driver:driver_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("vehicle_id", params.id)
      .order("created_at", { ascending: false })

    return NextResponse.json({
      assignments: assignments?.map((assignment) => ({
        id: assignment.id,
        status: assignment.status,
        createdAt: assignment.created_at,
        driver: assignment.driver,
      })),
    })
  } catch (error) {
    console.error("Error fetching vehicle assignments:", error)
    return new NextResponse("Error fetching vehicle assignments", { status: 500 })
  }
} 