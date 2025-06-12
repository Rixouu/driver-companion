"use client"

import { Sidebar } from "@/components/settings/settings-sidebar"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col md:flex-row w-full h-full">
      <Sidebar />
      <main className="flex-1">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
} 