'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function SetupHelper() {
  const [copied, setCopied] = useState(false)
  
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 3000)
      return () => clearTimeout(timeout)
    }
  }, [copied])
  
  const handleCopyConfig = () => {
    const config = `NEXT_PUBLIC_WORDPRESS_API_URL=http://localhost:10047
NEXT_PUBLIC_WORDPRESS_API_KEY=ceb709657ff29e49d82796f7b98798a7
NEXT_PUBLIC_WORDPRESS_API_CUSTOM_PATH=wp-json/driver/v1/bookings`
    
    navigator.clipboard.writeText(config)
      .then(() => setCopied(true))
      .catch(err => console.error('Failed to copy:', err))
  }
  
  return (
    <Card className="w-full max-w-2xl mx-auto mb-8">
      <CardHeader>
        <CardTitle>WordPress Bookings API Setup</CardTitle>
        <CardDescription>
          We found your WordPress API endpoint! Follow these steps to connect to it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
          <Icons.calendar className="h-4 w-4" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            We detected that your bookings are available at <code className="font-mono bg-green-100 dark:bg-green-900/50 px-1 py-0.5 rounded">wp-json/driver/v1/bookings</code>
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Steps to fix your connection:</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Open your <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">.env.local</code> file</li>
            <li>Update or add the following environment variables:</li>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono whitespace-pre">
              NEXT_PUBLIC_WORDPRESS_API_URL=http://localhost:10047
              NEXT_PUBLIC_WORDPRESS_API_KEY=ceb709657ff29e49d82796f7b98798a7
              NEXT_PUBLIC_WORDPRESS_API_CUSTOM_PATH=wp-json/driver/v1/bookings
            </div>
            <li>Save the file and restart your development server</li>
          </ol>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleCopyConfig}
          variant={copied ? "outline" : "default"}
        >
          {copied ? (
            <>
              <Icons.arrowPath className="h-4 w-4 mr-2" />
              Copied to clipboard!
            </>
          ) : (
            <>
              Copy configuration
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
} 