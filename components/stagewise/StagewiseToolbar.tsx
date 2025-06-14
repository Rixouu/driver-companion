"use client"

import { ReactPlugin } from "@stagewise-plugins/react"
import { StagewiseToolbar } from "@stagewise/toolbar-next"

export function StagewiseToolbarWrapper() {
  return (
    <StagewiseToolbar
      config={{
        plugins: [ReactPlugin],
      }}
    />
  )
} 