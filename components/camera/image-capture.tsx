"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Camera } from "lucide-react"

interface ImageCaptureProps {
  onCapture: (imageData: string) => void
}

export function ImageCapture({ onCapture }: ImageCaptureProps) {
  const [isOpen, setIsOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error("Error accessing the camera", err)
      }
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
    }
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d")
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
        const imageData = canvasRef.current.toDataURL("image/jpeg")
        onCapture(imageData)
        setIsOpen(false)
      }
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (open) {
          startCamera()
        } else {
          stopCamera()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Camera className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Capture Image</DialogTitle>
        </DialogHeader>
      </DialogContent>
      <div className="mt-2">
        <video ref={videoRef} autoPlay playsInline className="w-full" />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={captureImage}>Capture</Button>
      </div>
    </Dialog>
  )
}

