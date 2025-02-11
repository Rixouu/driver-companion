"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, RotateCw, X } from "lucide-react"
import { useLanguage } from "@/components/providers/language-provider"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"

interface CameraModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (photoUrl: string) => void
}

export function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const { t } = useLanguage()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen && !stream) {
      startCamera()
    }
    return () => {
      if (stream) {
        stopCamera()
      }
    }
  }, [isOpen, stream])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error("Camera access error:", error)
      setError(error instanceof Error ? error.message : "Failed to access camera")
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const handleCapture = () => {
    if (!videoRef.current) return

    try {
      const canvas = document.createElement("canvas")
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not get canvas context")
      
      ctx.drawImage(videoRef.current, 0, 0)
      const photoUrl = canvas.toDataURL("image/jpeg")
      onCapture(photoUrl)
      onClose()
    } catch (error) {
      console.error("Capture error:", error)
      setError(error instanceof Error ? error.message : "Failed to capture photo")
    }
  }

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user")
    if (stream) {
      stopCamera()
      setTimeout(startCamera, 0)
    }
  }

  if (!mounted || !isOpen) return null

  const modal = (
    <div className="fixed inset-0 bg-background z-50 md:flex md:items-center md:justify-center">
      <div className="flex flex-col h-full w-full md:h-auto md:max-h-[90vh] md:w-auto md:min-w-[600px] md:max-w-3xl md:rounded-lg md:shadow-lg">
        {/* Header */}
        <div className="relative flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button 
            type="button"
            className="absolute left-2 p-2 hover:bg-accent rounded-full md:hidden"
            onClick={() => {
              stopCamera()
              onClose()
            }}
          >
            <X className="h-5 w-5" />
          </Button>
          
          <h2 className="flex-1 text-center text-base font-semibold md:text-lg">
            {t("inspections.photos.takePhoto")}
          </h2>

          {/* Close button for desktop */}
          <Button 
            type="button"
            className="hidden md:flex p-2 hover:bg-accent rounded-full absolute right-2"
            onClick={() => {
              stopCamera()
              onClose()
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Camera View */}
        <div className="flex-1 relative bg-black">
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <p className="text-destructive text-center px-4">{error}</p>
            </div>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Camera Controls */}
          <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4 px-4">
            <Button 
              type="button"
              className="p-3 bg-background/80 backdrop-blur hover:bg-background/90 rounded-full transition-colors"
              onClick={toggleCamera}
            >
              <RotateCw className="h-6 w-6" />
            </Button>
            <Button 
              type="button"
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center gap-2 transition-colors"
              onClick={handleCapture}
              disabled={!stream}
            >
              <Camera className="h-6 w-6" />
              <span className="font-medium">
                {t("inspections.photos.takePhoto")}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
} 