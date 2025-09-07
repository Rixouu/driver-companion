import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Assignment Center",
  description: "Manage driver and vehicle assignments for bookings"
}

export default function AssignmentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full">
      {children}
    </div>
  )
}
