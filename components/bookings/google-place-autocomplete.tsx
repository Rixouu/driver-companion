'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, AlertCircle } from 'lucide-react'

// Simplified type definition for Google Maps
declare global {
  interface Window {
    google: any
    initGoogleMapsCallback: () => void
  }
}

interface GooglePlaceAutocompleteProps {
  id: string
  name: string
  label: string
  value: string
  onChange: (name: string, value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
}

export function GooglePlaceAutocomplete({
  id,
  name,
  label,
  value,
  onChange,
  placeholder = 'Enter location',
  required = false,
  className = '',
}: GooglePlaceAutocompleteProps) {
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)

  useEffect(() => {
    // Define a global callback for the script to call
    window.initGoogleMapsCallback = () => {
      console.log("Google Maps API loaded successfully")
      setLoaded(true)
    }

    // Check if API is already loaded with required libraries
    if (window.google?.maps?.places) {
      console.log("Google Maps API already loaded with required libraries")
      setLoaded(true)
      return
    }

    // Load Google Maps API script
    if (typeof window !== 'undefined' && !window.google?.maps?.places) {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      if (!apiKey) {
        console.error("Google Maps API key is missing")
        setLoadError('Google Maps API key is not configured')
        return
      }
      
      // If script is already in the document, don't add it again
      if (document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)) {
        console.log("Google Maps script tag already exists")
        // Wait a bit for the existing script to load
        setTimeout(() => {
          if (window.google?.maps?.places) {
            setLoaded(true)
          } else {
            // If still not loaded after waiting, set as loaded to avoid infinite waiting
            setLoaded(true)
          }
        }, 1000)
        return
      }
      
      console.log("Loading Google Maps API script...")
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=ja&region=JP&callback=initGoogleMapsCallback`
      script.async = true
      script.defer = true
      script.onerror = (e) => {
        console.error("Error loading Google Maps API script:", e)
        setLoadError('Failed to load Google Maps API')
      }
      document.head.appendChild(script)
    } else if (window.google?.maps?.places) {
      console.log("Google Maps API already loaded")
      setLoaded(true)
    }

    // Clean up
    return () => {
      window.initGoogleMapsCallback = () => {}
    }
  }, [])

  useEffect(() => {
    if (loaded && inputRef.current && window.google?.maps?.places && !autocompleteRef.current) {
      try {
        console.log("Initializing Google Maps Autocomplete...")
        // Initialize autocomplete with Japan restriction
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode'],
          fields: ['formatted_address', 'geometry', 'name', 'address_components'],
          componentRestrictions: { country: 'jp' } // Restrict to Japan
        })

        // Add listener for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace()
          console.log("Place selected:", place)
          if (place?.formatted_address) {
            onChange(name, place.formatted_address)
          }
        })
        
        console.log("Google Maps Autocomplete initialized successfully")
      } catch (error) {
        console.error('Error initializing Google Maps Autocomplete:', error)
        setLoadError(`Failed to initialize Google Maps autocomplete: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }, [loaded, name, onChange])

  // Handle manual changes to the input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(name, e.target.value)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className="flex items-center">
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="relative">
        <MapPin className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
        <Input
          ref={inputRef}
          id={id}
          name={name}
          value={value || ''}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`pl-9 ${loadError ? 'border-yellow-300 focus-visible:ring-yellow-300' : ''}`}
          required={required}
        />
        {loadError && (
          <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-500 mt-1">
            <AlertCircle className="h-3 w-3" />
            <span>{loadError}. Manual address entry is available.</span>
          </div>
        )}
      </div>
    </div>
  )
} 