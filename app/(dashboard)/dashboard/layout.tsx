import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Vehicle fleet management dashboard",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 