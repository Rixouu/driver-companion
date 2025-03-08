"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, RotateCw, X } from "lucide-react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils/styles"

interface CameraModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (photoUrl: string) => void
}

export function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => {
      stopCamera()
    }
  }, [isOpen])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setIsCameraActive(true)
        setError(null)
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('カメラへのアクセスに失敗しました')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const context = canvas.getContext('2d')
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            onCapture(url)
            stopCamera()
            onClose()
          }
        }, 'image/jpeg', 0.8)
      }
    }
  }

  const handleRetake = () => {
    if (!isCameraActive) {
      startCamera()
    }
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Take Photo</DialogTitle>
          <DialogDescription>
            {error ? error : 'Use camera to take a photo'}
          </DialogDescription>
        </DialogHeader>
        <div className="relative aspect-video bg-black rounded-md overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={cn(
              "w-full h-full object-cover",
              !isCameraActive && "hidden"
            )}
          />
          <canvas
            ref={canvasRef}
            className="hidden"
          />
          {error && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-black/50">
              <p>{error}</p>
            </div>
          )}
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            {!isCameraActive && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleRetake}
              >
                Retake
              </Button>
            )}
            <Button
              type="button"
              onClick={handleCapture}
              disabled={!isCameraActive || !!error}
            >
              Capture
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 