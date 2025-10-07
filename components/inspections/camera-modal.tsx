"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, RotateCw, X, Flashlight, FlashlightOff } from "lucide-react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils/styles"
import { useIsMobile } from "@/lib/hooks/use-mobile"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

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
  const [isFlashOn, setIsFlashOn] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const isMobile = useIsMobile()

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
        video: { 
          facingMode: facingMode,
          width: { ideal: isMobile ? 1280 : 1920 },
          height: { ideal: isMobile ? 720 : 1080 }
        },
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

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
    stopCamera()
    setTimeout(() => startCamera(), 100)
  }

  const toggleFlash = () => {
    setIsFlashOn(prev => !prev)
    // Flash functionality would need to be implemented with proper camera controls
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className={cn(
          "p-0 gap-0",
          isMobile ? "w-full h-full max-w-none max-h-none rounded-none [&>button]:hidden" : "sm:max-w-md"
        )}
      >
        <VisuallyHidden>
          <DialogTitle>Take Photo</DialogTitle>
          <DialogDescription>
            {error ? error : 'Use camera to take a photo for inspection'}
          </DialogDescription>
        </VisuallyHidden>

        {/* Camera View - Full Screen */}
        <div className={cn(
          "relative bg-black overflow-hidden",
          isMobile ? "flex-1 min-h-0" : "aspect-video rounded-md"
        )}>
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
          
          {/* Top Controls - Only on mobile */}
          {isMobile && (
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-10 w-10 text-white hover:bg-white/20 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleCamera}
                  className="h-10 w-10 text-white hover:bg-white/20 rounded-full"
                >
                  <RotateCw className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFlash}
                  className="h-10 w-10 text-white hover:bg-white/20 rounded-full"
                >
                  {isFlashOn ? <FlashlightOff className="h-5 w-5" /> : <Flashlight className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          )}
          
          {/* Focus frame for mobile */}
          {isMobile && isCameraActive && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/50 rounded-lg" />
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-black/50">
              <div className="text-center">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className={cn(
          "p-4",
          isMobile ? "bg-black" : "border-t"
        )}>
          {isMobile ? (
            // Mobile layout - Clean bottom controls
            <div className="flex items-center justify-center">
              <Button
                onClick={handleCapture}
                disabled={!isCameraActive || !!error}
                className="h-16 w-16 rounded-full bg-white text-black hover:bg-gray-200 disabled:bg-gray-500 disabled:text-gray-300 shadow-lg"
              >
                <Camera className="h-8 w-8" />
              </Button>
            </div>
          ) : (
            // Desktop layout
            <div className="flex justify-between">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleCamera}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFlash}
                >
                  {isFlashOn ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
                </Button>
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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 