"use client"

import * as React from "react"
import { ImageIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Image } from "@/components/shared/image"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  buttonText?: string
  dragText?: string
  sizeLimit?: string
}

export function ImageUpload({
  value,
  onChange,
  disabled,
  className,
  buttonText = "Upload Image",
  dragText = "Drag and drop an image here, or click to select",
  sizeLimit = "Maximum file size: 5MB"
}: ImageUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [preview, setPreview] = React.useState<string | null>(value || null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Convert to WebP and resize
      const image = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set max dimensions
      const maxWidth = 800
      const maxHeight = 800

      let width = image.width
      let height = image.height

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(image, 0, 0, width, height)

      const webpUrl = canvas.toDataURL('image/webp', 0.8)
      setPreview(webpUrl)
      onChange(webpUrl)
    } catch (error) {
      console.error('Error processing image:', error)
    }
  }

  const handleClear = () => {
    setPreview(null)
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        aria-label="Upload image"
        title="Upload image"
      />
      {preview ? (
        <div className="relative aspect-video">
          <Image
            src={preview}
            alt="Upload preview"
            fill
            className="object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <ImageIcon className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      )}
    </div>
  )
} 