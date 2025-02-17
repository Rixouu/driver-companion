import { seedDatabase } from "@/lib/db/seed"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    await seedDatabase()
    return NextResponse.json({ message: "Database seeded successfully" })
  } catch (error) {
    console.error("Seeding error:", error)
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 })
  }
} 