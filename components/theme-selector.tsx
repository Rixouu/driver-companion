"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ClientThemeSelector() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by mounting after initial render
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <Select defaultValue={theme} onValueChange={setTheme}>
      <SelectTrigger>
        <SelectValue>
          {theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
        <SelectItem value="system">System</SelectItem>
      </SelectContent>
    </Select>
  )
} 