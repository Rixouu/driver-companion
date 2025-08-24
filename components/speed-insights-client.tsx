'use client'

import { useEffect, useState } from 'react'

export default function SpeedInsightsClient() {
  const [SpeedInsights, setSpeedInsights] = useState<any>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadSpeedInsights = async () => {
      try {
        const { default: SpeedInsightsComponent } = await import('@vercel/speed-insights')
        setSpeedInsights(() => SpeedInsightsComponent)
      } catch (err) {
        console.warn('Failed to load Speed Insights:', err)
        setError(err as Error)
      }
    }

    loadSpeedInsights()
  }, [])

  if (error) {
    console.warn('Speed Insights failed to load:', error.message)
    return null
  }

  if (!SpeedInsights) {
    return null
  }

  return <SpeedInsights />
}
