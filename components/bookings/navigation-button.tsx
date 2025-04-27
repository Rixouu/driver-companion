"use client"

import { Button } from "@/components/ui/button"
import { Navigation } from "lucide-react"

interface NavigationButtonProps {
  pickupLocation: string
  dropoffLocation: string
}

export function NavigationButton({
  pickupLocation,
  dropoffLocation,
}: NavigationButtonProps) {
  const handleNavigate = () => {
    const encodedPickup = encodeURIComponent(pickupLocation)
    const encodedDropoff = encodeURIComponent(dropoffLocation)
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodedPickup}&destination=${encodedDropoff}`
    window.open(mapsUrl, '_blank')
  }

  return (
    <Button
      className="w-full"
      variant="outline"
      onClick={handleNavigate}
    >
      <Navigation className="mr-2 h-4 w-4" />
      Get Directions
    </Button>
  )
} 