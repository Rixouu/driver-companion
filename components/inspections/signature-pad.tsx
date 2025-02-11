"use client"

import { useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pen, RotateCcw, Download } from "lucide-react"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/components/ui/use-toast"

interface SignatureMetadata {
  timestamp: string
  inspector: string
  location?: GeolocationCoordinates
  deviceInfo: {
    userAgent: string
    platform: string
    screenResolution: string
  }
}

interface SignatureData {
  image: string
  metadata: SignatureMetadata
}

interface SignaturePadProps {
  onSignatureCapture: (data: SignatureData) => void
  inspectorName: string
}

export function SignaturePad({ onSignatureCapture, inspectorName }: SignaturePadProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsDrawing(true)
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      const point = getEventPoint(e, canvas)
      ctx.moveTo(point.x, point.y)
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (ctx) {
      const point = getEventPoint(e, canvas)
      ctx.lineTo(point.x, point.y)
      ctx.stroke()
      setHasSignature(true)
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const getEventPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    let clientX, clientY

    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setHasSignature(false)
    }
  }

  const initializeCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }

  const getDeviceInfo = () => ({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
  })

  const saveSignature = async () => {
    if (!hasSignature) {
      toast({
        title: t("errors.error"),
        description: t("inspections.signature.required"),
        variant: "destructive",
      })
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    try {
      const signatureData: SignatureData = {
        image: canvas.toDataURL('image/png'),
        metadata: {
          timestamp: new Date().toISOString(),
          inspector: inspectorName,
          deviceInfo: getDeviceInfo(),
        }
      }

      // Try to get location if available
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject)
        })
        signatureData.metadata.location = position.coords
      } catch (error) {
        console.warn('Location not available')
      }

      onSignatureCapture(signatureData)
      toast({
        title: t("common.success"),
        description: t("inspections.signature.saved"),
      })
    } catch (error) {
      toast({
        title: t("errors.error"),
        description: t("errors.somethingWentWrong"),
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {t("inspections.signature.title")}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={clearSignature}
              title={t("inspections.signature.clear")}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={saveSignature}
              title={t("inspections.signature.save")}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative border rounded-lg">
            <canvas
              ref={(canvas) => {
                if (canvas) {
                  canvasRef.current = canvas
                  canvas.width = canvas.offsetWidth
                  canvas.height = 200
                  initializeCanvas(canvas)
                }
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full touch-none"
            />
            {!hasSignature && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
                <Pen className="h-4 w-4 mr-2" />
                {t("inspections.signature.instructions")}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 