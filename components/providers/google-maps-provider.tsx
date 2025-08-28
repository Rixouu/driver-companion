'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface GoogleMapsContextType {
  isLoaded: boolean
  loadError: string | null
  google: any
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: null,
  google: null
})

interface GoogleMapsProviderProps {
  children: ReactNode
  apiKey: string
  libraries?: string[]
}

export function GoogleMapsProvider({ children, apiKey, libraries = ['places'] }: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [google, setGoogle] = useState<any>(null)

  useEffect(() => {
    // If already loaded, don't load again
    if (window.google?.maps) {
      setIsLoaded(true)
      setGoogle(window.google)
      return
    }

    // If script is already in the document, wait for it to load
    if (document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)) {
      const checkGoogleMaps = () => {
        if (window.google?.maps) {
          setIsLoaded(true)
          setGoogle(window.google)
        } else {
          setTimeout(checkGoogleMaps, 100)
        }
      }
      checkGoogleMaps()
      return
    }

    // Load Google Maps API script
    if (apiKey) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}&loading=async`
      script.async = true
      script.defer = true
      
      script.onload = () => {
        if (window.google?.maps) {
          setIsLoaded(true)
          setGoogle(window.google)
        } else {
          setLoadError('Google Maps failed to load properly')
        }
      }
      
      script.onerror = () => {
        setLoadError('Failed to load Google Maps API')
      }
      
      document.head.appendChild(script)
    } else {
      setLoadError('Google Maps API key is not configured')
    }
  }, [apiKey, libraries])

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError, google }}>
      {children}
    </GoogleMapsContext.Provider>
  )
}

export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext)
  if (!context) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider')
  }
  return context
}
