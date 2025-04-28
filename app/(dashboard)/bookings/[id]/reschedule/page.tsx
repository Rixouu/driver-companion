'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Booking } from '@/types/bookings'
import { rescheduleBookingAction } from '@/app/actions/bookings'
import { getBookingById } from '@/lib/api/booking-client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function RescheduleBookingPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null)

  // Fetch booking data
  useEffect(() => {
    async function loadBooking() {
      setIsLoading(true)
      try {
        const { booking: loadedBooking, error } = await getBookingById(id)
        
        if (error || !loadedBooking) {
          setError(error || 'Booking not found')
          setBooking(null)
        } else {
          setBooking(loadedBooking)
          // Initialize form data
          setDate(loadedBooking.date || '')
          setTime(loadedBooking.time || '')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadBooking()
  }, [id])

  // Save changes
  const handleSave = async () => {
    setIsSaving(true)
    setSaveResult(null)
    
    try {
      const result = await rescheduleBookingAction(id, date, time)
      setSaveResult(result)
      
      if (result.success) {
        // Navigate back to booking details after a short delay
        setTimeout(() => {
          router.push(`/bookings/${id}`)
        }, 1500)
      }
    } catch (err) {
      setSaveResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to reschedule booking'
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Booking not found'}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Reschedule Booking</CardTitle>
          <CardDescription>
            Change the date and time for booking #{id}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">New Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">New Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-md mt-4">
            <h3 className="text-sm font-medium mb-2">Booking Information</h3>
            <p className="text-sm text-muted-foreground mb-1">
              {booking.service_name || 'Unnamed Service'}
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              Current Date: {booking.date || 'Not set'} at {booking.time || 'Not set'}
            </p>
            {booking.customer_name && (
              <p className="text-sm text-muted-foreground">
                Customer: {booking.customer_name}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Reschedule
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {saveResult && (
        <Alert variant={saveResult.success ? "default" : "destructive"} className="mt-4">
          <AlertTitle>{saveResult.success ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{saveResult.message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
} 