"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// Global type declarations for Google Maps
declare global {
  interface Window {
    google: any
    initGoogleMapsCallback: () => void
  }
}

interface GoogleMapsContextType {
  isLoaded: boolean
  loadError: string | null
  loadGoogleMaps: () => Promise<void>
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined)

export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext)
  if (context === undefined) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider')
  }
  return context
}

interface GoogleMapsProviderProps {
  children: ReactNode
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadGoogleMaps = async () => {
    if (isLoaded || isLoading) return

    // Check if already loaded
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      setIsLoaded(true)
      return
    }

    // Check if script is already in the document
    if (typeof window !== 'undefined' && document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)) {
      // Wait for the existing script to load
      const checkLoaded = () => {
        if (window.google?.maps?.places) {
          setIsLoaded(true)
        } else {
          setTimeout(checkLoaded, 100)
        }
      }
      checkLoaded()
      return
    }

    setIsLoading(true)
    setLoadError(null)

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      if (!apiKey) {
        throw new Error('Google Maps API key is missing')
      }

      // Create a promise to handle script loading
      const loadScript = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=ja&region=JP&callback=initGoogleMapsCallback`
        script.async = true
        script.defer = true
        
        script.onerror = () => reject(new Error('Failed to load Google Maps API'))
        
        // Set up global callback
        window.initGoogleMapsCallback = () => {
          setIsLoaded(true)
          resolve()
        }
        
        document.head.appendChild(script)
      })

      await loadScript
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error loading Google Maps'
      setLoadError(errorMessage)
      console.error('Error loading Google Maps API:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Auto-load Google Maps when provider mounts
    loadGoogleMaps()
  }, [])

  const value: GoogleMapsContextType = {
    isLoaded,
    loadError,
    loadGoogleMaps
  }

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  )
}
