"use client"

import { Sidebar } from "@/components/settings/settings-sidebar"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  )
} 