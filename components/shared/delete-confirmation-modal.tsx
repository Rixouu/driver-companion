'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isDeleting?: boolean
  title: string
  description: string
  itemName: string
  itemCount: number
  warningItems: string[]
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  title,
  description,
  itemName,
  itemCount,
  warningItems
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-md">
            <h4 className="font-medium text-sm text-red-900 dark:text-red-100 mb-2">
              ⚠️ Warning
            </h4>
            <ul className="text-xs text-red-800 dark:text-red-200 space-y-1">
              {warningItems.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete {itemCount} {itemName}{itemCount > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
