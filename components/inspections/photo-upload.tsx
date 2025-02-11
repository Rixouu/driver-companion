"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera, X, Upload } from "lucide-react"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"

interface PhotoUploadProps {
  sectionId: string
  onPhotoAdd: (photo: Photo) => void
  onPhotoRemove: (photoId: string) => void
}

interface Photo {
  id: string
  url: string
  timestamp: string
  sectionId: string
}

export function PhotoUpload({ sectionId, onPhotoAdd, onPhotoRemove }: PhotoUploadProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isCapturing, setIsCapturing] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Here you would normally upload to your storage service
      // For now, we'll create a local URL
      const photo: Photo = {
        id: Date.now().toString(),
        url: URL.createObjectURL(file),
        timestamp: new Date().toISOString(),
        sectionId,
      }

      setPhotos([...photos, photo])
      onPhotoAdd(photo)

      toast({
        title: t("common.success"),
        description: t("inspections.photos.uploadSuccess"),
      })
    } catch (error) {
      toast({
        title: t("errors.error"),
        description: t("errors.somethingWentWrong"),
        variant: "destructive",
      })
    }
  }

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      setIsCapturing(true)
      // Implementation for camera capture would go here
    } catch (error) {
      toast({
        title: t("errors.error"),
        description: t("inspections.photos.cameraError"),
        variant: "destructive",
      })
    }
  }

  const handlePhotoRemove = (photoId: string) => {
    setPhotos(photos.filter(p => p.id !== photoId))
    onPhotoRemove(photoId)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("inspections.photos.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCameraCapture}
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              {t("inspections.photos.takePhoto")}
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <label>
                <Upload className="h-4 w-4" />
                {t("inspections.photos.upload")}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <div className="relative aspect-square">
                  <Image
                    src={photo.url}
                    alt="Inspection photo"
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handlePhotoRemove(photo.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(photo.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 