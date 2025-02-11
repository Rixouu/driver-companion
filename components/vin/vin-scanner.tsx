"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { VinScanner } from "@/utils/vin-scanner"
import { Scan } from "lucide-react"

export function VinScannerDialog({
  onVinDetected,
}: {
  onVinDetected: (vin: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const scannerRef = useRef<VinScanner | null>(null)

  useEffect(() => {
    if (isOpen && videoRef.current) {
      scannerRef.current = new VinScanner()
      scannerRef.current.initialize(videoRef.current)
      scannerRef.current.onDetected((vin) => {
        onVinDetected(vin)
        setIsOpen(false)
      })
    }

    return () => {
      scannerRef.current?.cleanup()
    }
  }, [isOpen, onVinDetected])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Scan className="mr-2 h-4 w-4" />
          Scan VIN
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Vehicle VIN</DialogTitle>
        </DialogHeader>
        <div className="aspect-video relative overflow-hidden rounded-lg">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay />
        </div>
      </DialogContent>
    </Dialog>
  )
}

