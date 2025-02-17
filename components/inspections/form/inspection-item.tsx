"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Check, X, Camera } from "lucide-react"
import { cn } from "@/lib/utils"

interface InspectionItemProps {
  item: {
    id: string
    label: string
    status: 'pass' | 'fail' | null
    notes: string
  }
  photos: string[]
  onStatusChange: (status: 'pass' | 'fail') => void
  onPhotoClick: () => void
  onNotesChange: (notes: string) => void
}

export function InspectionItem({
  item,
  photos,
  onStatusChange,
  onPhotoClick,
  onNotesChange
}: InspectionItemProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <span className="font-medium">{item.label}</span>
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
            onClick={onPhotoClick}
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
        value={item.notes}
        onChange={(e) => onNotesChange(e.target.value)}
      />
    </div>
  )
} 