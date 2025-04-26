'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Icons } from '@/components/icons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ApiConfigHelperProps {
  debugInfo: any
  onClose: () => void
}

export function ApiConfigHelper({ debugInfo, onClose }: ApiConfigHelperProps) {
  const [customPath, setCustomPath] = useState('')
  const [activeTab, setActiveTab] = useState('config')
  const [testUrl, setTestUrl] = useState(`${debugInfo?.baseUrl || ''}/driver/v1/bookings`)
  const [testMethod, setTestMethod] = useState('GET')
  const [testResponse, setTestResponse] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  
  // Extract potential endpoint suggestions from debug info
  const potentialEndpoints = debugInfo?.potentialBookingRoutes || []
  
  // Extract attempted endpoints and their results
  const attempts = debugInfo?.attempts || []
  
  const handleTestEndpoint = async () => {
    setTesting(true)
    setTestResponse(null)
    try {
      const response = await fetch(testUrl, {
        method: testMethod,
        headers: { 'Content-Type': 'application/json' }
      })
      
      const responseInfo = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
        ok: response.ok
      }
      
      // Try to get JSON response if status is OK
      if (response.ok) {
        try {
          const data = await response.json()
          setTestResponse({ ...responseInfo, body: data })
        } catch (e) {
          setTestResponse({ 
            ...responseInfo, 
            body: 'Response is not valid JSON',
            textContent: await response.text() 
          })
        }
      } else {
        setTestResponse(responseInfo)
      }
    } catch (error) {
      setTestResponse({ 
        error: true, 
        message: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setTesting(false)
    }
  }
  
  const handleCopyEnv = () => {
    // Create .env.local contents with the custom path
    const envContent = `NEXT_PUBLIC_WORDPRESS_API_URL=${debugInfo?.baseUrl || process.env.NEXT_PUBLIC_WORDPRESS_API_URL || ''}
NEXT_PUBLIC_WORDPRESS_API_KEY=${process.env.NEXT_PUBLIC_WORDPRESS_API_KEY || ''}
NEXT_PUBLIC_WORDPRESS_API_CUSTOM_PATH=${customPath}
`
    navigator.clipboard.writeText(envContent)
      .then(() => alert('Environment variables copied to clipboard! Paste these into your .env.local file.'))
      .catch(() => alert('Failed to copy to clipboard. Please copy the values manually.'))
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>WordPress API Configuration Helper</CardTitle>
        <CardDescription>
          Configure your WordPress API connection to fetch bookings
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6 pb-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="test">Test Endpoint</TabsTrigger>
            <TabsTrigger value="debug">Debug Info</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="config" className="space-y-4 p-6 pt-2">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Current Configuration</h3>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono">
              <p>NEXT_PUBLIC_WORDPRESS_API_URL: {debugInfo?.baseUrl || 'Not set'}</p>
              <p>NEXT_PUBLIC_WORDPRESS_API_KEY: {process.env.NEXT_PUBLIC_WORDPRESS_API_KEY ? '******' : 'Not set'}</p>
              <p>NEXT_PUBLIC_WORDPRESS_API_CUSTOM_PATH: {process.env.NEXT_PUBLIC_WORDPRESS_API_CUSTOM_PATH || 'Not set'}</p>
            </div>
          </div>

          {potentialEndpoints.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Detected Booking API Endpoints</h3>
              <p className="text-sm text-gray-500">
                The following endpoints were detected in your WordPress API. Click one to use it:
              </p>
              <div className="flex flex-wrap gap-2">
                {potentialEndpoints.map((route: string) => (
                  <Button 
                    key={route} 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCustomPath(route)}
                  >
                    {route}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Set Custom API Endpoint</h3>
            <p className="text-sm text-gray-500">
              Enter the exact path to your WordPress bookings API endpoint:
            </p>
            <div className="flex gap-2">
              <div className="text-gray-500 flex items-center">
                {debugInfo?.baseUrl}/
              </div>
              <Input
                placeholder="driver/v1/bookings"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="pt-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setCustomPath('driver/v1/bookings')
                }}
              >
                Use driver/v1/bookings
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Example paths: wp-json/wp/v2/bookings, driver/v1/bookings, wp-json/driver/v1/bookings
            </p>
          </div>
          
          {attempts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">API Attempts Summary</h3>
              <div className="border rounded-md divide-y">
                {attempts.slice(0, 5).map((attempt: any, index: number) => (
                  <div key={index} className="p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs">{attempt.endpoint}</span>
                      <Badge variant={attempt.result?.ok ? "success" : "destructive"}>
                        {attempt.result?.status || 'Error'}
                      </Badge>
                    </div>
                    {attempt.error && (
                      <p className="text-red-500 text-xs mt-1">{attempt.error}</p>
                    )}
                  </div>
                ))}
                {attempts.length > 5 && (
                  <div className="p-3 text-sm text-center text-gray-500">
                    + {attempts.length - 5} more attempts
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="test" className="p-6 pt-2 space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Test API Endpoint</h3>
            <p className="text-sm text-gray-500">
              Send a test request to your WordPress API endpoint to check if it's working:
            </p>
            
            <div className="flex gap-2 mt-4">
              <Select
                value={testMethod}
                onValueChange={setTestMethod}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="HEAD">HEAD</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Full URL to test"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                className="flex-1"
              />
              
              <Button
                onClick={handleTestEndpoint}
                disabled={testing}
              >
                {testing ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : "Test"}
              </Button>
            </div>
            
            {testResponse && (
              <div className="mt-4 border rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Response</h4>
                  <Badge variant={testResponse.ok ? "success" : "destructive"}>
                    {testResponse.status || (testResponse.error ? 'Error' : 'Unknown')}
                  </Badge>
                </div>
                
                {testResponse.error ? (
                  <div className="text-red-500 text-sm">{testResponse.message}</div>
                ) : (
                  <div className="space-y-2">
                    {testResponse.statusText && (
                      <p className="text-sm">Status: {testResponse.status} {testResponse.statusText}</p>
                    )}
                    
                    {testResponse.headers && (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="headers">
                          <AccordionTrigger className="text-sm font-medium">Headers</AccordionTrigger>
                          <AccordionContent>
                            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono">
                              {Object.entries(testResponse.headers || {}).map(([key, value]) => (
                                <div key={key}>
                                  {key}: {value as string}
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                    
                    {testResponse.body && (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="body">
                          <AccordionTrigger className="text-sm font-medium">Response Body</AccordionTrigger>
                          <AccordionContent>
                            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono max-h-96 overflow-auto">
                              <pre>{typeof testResponse.body === 'string' 
                                ? testResponse.body 
                                : JSON.stringify(testResponse.body, null, 2)}</pre>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                    
                    {testResponse.textContent && (
                      <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono max-h-56 overflow-auto">
                        {testResponse.textContent}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="debug" className="p-6 pt-2">
          <h3 className="text-sm font-medium mb-2">Debug Information</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded max-h-96 overflow-auto">
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onClose}>Close</Button>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleCopyEnv}
          >
            Copy .env.local settings
          </Button>
          <Button 
            variant="default"
            onClick={() => {
              if (customPath) {
                alert(`Add this to your .env.local file:\nNEXT_PUBLIC_WORDPRESS_API_CUSTOM_PATH=${customPath}\n\nThen restart your server.`)
              } else {
                alert('Please enter a custom API endpoint path first.')
              }
            }}
          >
            Use This Configuration
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
} 