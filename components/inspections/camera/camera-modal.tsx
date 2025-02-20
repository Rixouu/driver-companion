"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, RotateCw, X, RefreshCw } from "lucide-react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"

interface CameraModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (photoUrl: string) => void
}

export function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen && !stream && !capturedImage) {
      startCamera()
    }
    if (!isOpen) {
      stopCamera()
      setCapturedImage(null)
    }
  }, [isOpen])

  const startCamera = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      })
      setStream(newStream)
      if (videoRef.current) {
        videoRef.current.srcObject = newStream
      }
      setError(null)
    } catch (err) {
      setError("Failed to access camera")
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const handleCapture = async () => {
    if (!videoRef.current || !stream) return

    try {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error("Could not get canvas context")
      
      ctx.drawImage(videoRef.current, 0, 0)
      const photoUrl = canvas.toDataURL("image/jpeg", 0.8)
      stopCamera() // Stop camera after capturing
      setCapturedImage(photoUrl)
    } catch (error) {
      console.error("Capture error:", error)
      setError(error instanceof Error ? error.message : "Failed to capture photo")
    }
  }

  const handleRetake = () => {
    setCapturedImage(null)
    startCamera()
  }

  const handleSave = () => {
    if (capturedImage) {
      onCapture(capturedImage)
      onClose()
    }
  }

  const toggleCamera = () => {
    const newMode = facingMode === "user" ? "environment" : "user"
    setFacingMode(newMode)
    if (stream) {
      stopCamera()
      setTimeout(startCamera, 300)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div className={`fixed inset-0 z-50 ${isOpen ? "" : "hidden"}`}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="relative w-full max-w-lg aspect-[3/4] bg-black">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-10 rounded-full bg-background/50 hover:bg-background/70"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>

          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-destructive text-center px-4">{error}</p>
            </div>
          )}

          {capturedImage ? (
            <>
              <img
                src={capturedImage}
                alt="Captured photo"
                className="absolute inset-0 w-full h-full object-contain"
              />
              <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4 px-4">
                <Button 
                  type="button"
                  className="px-6 py-3 bg-background/80 backdrop-blur rounded-full hover:bg-background/90"
                  onClick={handleRetake}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retake
                </Button>
                <Button 
                  type="button"
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                  onClick={handleSave}
                >
                  Save Photo
                </Button>
              </div>
            </>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4 px-4">
                <Button 
                  type="button"
                  className="p-3 bg-background/80 backdrop-blur rounded-full hover:bg-background/90"
                  onClick={toggleCamera}
                >
                  <RotateCw className="h-6 w-6" />
                </Button>
                <Button 
                  type="button"
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                  onClick={handleCapture}
                  disabled={!stream}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Take Photo
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
} 