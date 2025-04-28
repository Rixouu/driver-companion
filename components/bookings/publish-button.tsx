'use client'

import { Send } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { useState } from 'react'
import { BookingButton } from './booking-button'

interface PublishButtonProps {
  bookingId: string;
  onPublish?: () => void;
}

export function PublishButton({ bookingId, onPublish }: PublishButtonProps) {
  const { t } = useI18n()
  const [isPublishing, setIsPublishing] = useState(false)
  
  const handlePublish = async () => {
    setIsPublishing(true)
    
    try {
      // Here you would add API call logic to publish the booking
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (onPublish) {
        onPublish()
      }
    } catch (error) {
      console.error('Error publishing booking:', error)
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <BookingButton 
      variant="primary"
      icon={<Send className="h-5 w-5" />}
      onClick={handlePublish}
      disabled={isPublishing}
    >
      {isPublishing ? t('bookings.details.actions.publishing') || 'Publishing...' : 'publish'}
    </BookingButton>
  )
} 