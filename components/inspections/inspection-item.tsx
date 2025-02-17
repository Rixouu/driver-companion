"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CameraModal } from "./camera-modal"
import { InspectionItem } from "@/types/inspections"
import { Check, X, Camera } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface InspectionItemProps {
  item: InspectionItem
  photos: string[]
  onPhotoAdd: (photoUrl: string) => void
  onStatusChange: (status: 'pass' | 'fail') => void
  onNotesChange: (notes: string) => void
}

export function InspectionItemComponent({ 
  item,
  photos,
  onPhotoAdd,
  onStatusChange,
  onNotesChange 
}: InspectionItemProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const { toast } = useToast()

  const handlePhotoCapture = async (photoUrl: string) => {
    try {
      onPhotoAdd(photoUrl)
      setIsCameraOpen(false)
      
      toast({
        title: "Success",
        description: "Photo added successfully",
      })
    } catch (error: any) {
      console.error('Error adding photo:', error)
      toast({
        title: "Error",
        description: "Failed to add photo",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <span className="font-medium">{item.item}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "transition-colors",
              item.status === 'pass' && "bg-green-500 text-white hover:bg-green-600"
            )}
            onClick={() => onStatusChange('pass')}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "transition-colors",
              item.status === 'fail' && "bg-red-500 text-white hover:bg-red-600"
            )}
            onClick={() => onStatusChange('fail')}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCameraOpen(true)}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt={`Photo ${index + 1}`}
              className="w-full aspect-square object-cover rounded-lg"
            />
          ))}
        </div>
      )}

      <Textarea
        placeholder="Add notes..."
        value={item.notes || ''}
        onChange={(e) => onNotesChange(e.target.value)}
      />

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handlePhotoCapture}
      />
    </div>
  )
} 