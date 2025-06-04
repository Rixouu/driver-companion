"use client"

import * as React from "react"
import { ImageIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Image as NextImage } from "@/components/shared/image"
import { cn } from "@/lib/utils/styles"

interface ImageUploadProps {
  initialValue?: string | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  className?: string;
  buttonText?: string;
  dragText?: string;
  sizeLimit?: string;
  aspectRatio?: "video" | "square" | "auto";
}

export function ImageUpload({
  initialValue,
  onChange,
  disabled,
  className,
  buttonText = "Upload Image",
  dragText = "Drag and drop an image here, or click to select",
  sizeLimit = "Maximum file size: 5MB",
  aspectRatio = "video"
}: ImageUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [preview, setPreview] = React.useState<string | null>(initialValue || null)

  React.useEffect(() => {
    setPreview(initialValue || null);
  }, [initialValue]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      onChange(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
        console.error("Invalid file type. Please upload an image.");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        onChange(null);
        return;
    }
    
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        console.error(`File is too large. Maximum size is ${sizeLimit}.`);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        onChange(null);
        return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setPreview(localPreviewUrl);
    onChange(file);
  }

  const handleClear = () => {
    setPreview(null)
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  const aspectRatioClass = {
    "video": "aspect-video",
    "square": "aspect-square",
    "auto": ""
  }[aspectRatio];

  return (
    <div className={cn("space-y-2", className)}>
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
        <div className={cn("relative w-full overflow-hidden rounded-md border", aspectRatioClass)}>
          <NextImage
            src={preview}
            alt="Upload preview"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {!disabled && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
              className="absolute right-2 top-2 z-10 h-7 w-7"
            onClick={handleClear}
              aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </Button>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full py-6"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <ImageIcon className="mr-2 h-5 w-5" />
          {buttonText}
        </Button>
      )}
      <p className="text-xs text-muted-foreground">{sizeLimit}</p>
    </div>
  )
} 