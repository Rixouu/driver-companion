'use client'

import { Component, ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class BookingsErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Bookings error boundary caught an error:', error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Card className="border-red-300 dark:border-red-700">
          <CardContent className="pt-6">
            <div className="text-center text-red-500">
              <h3 className="text-sm font-medium">Error loading bookings</h3>
              <p className="mt-2 text-sm">
                There was an error loading your bookings. Please try again.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                <Icons.arrowPath className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
} 