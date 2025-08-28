'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, AlertCircle } from 'lucide-react'
import { useGoogleMaps } from '@/components/providers/google-maps-provider'

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
  const { isLoaded, loadError } = useGoogleMaps()
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)

  // Re-enable Google Maps autocomplete with a simpler approach
  useEffect(() => {
    if (isLoaded && inputRef.current && window.google?.maps?.places && !autocompleteRef.current) {
      try {
        console.log("Initializing Google Maps Autocomplete...")
        
        // Create the autocomplete instance
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode'],
          componentRestrictions: { country: 'jp' }
        })
        
        // Add place_changed event listener
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          console.log("Place selected:", place)
          if (place?.formatted_address) {
            onChange(name, place.formatted_address)
          }
        })
        
        autocompleteRef.current = autocomplete
        console.log("Google Maps Autocomplete initialized successfully")
      } catch (error) {
        console.error('Error initializing Google Maps Autocomplete:', error)
      }
    }
    
    // Cleanup function
    return () => {
      if (autocompleteRef.current && autocompleteRef.current.removeAllListeners) {
        try {
          autocompleteRef.current.removeAllListeners('place_changed')
          autocompleteRef.current = null
        } catch (error) {
          console.error('Error cleaning up autocomplete:', error)
        }
      }
    }
  }, [isLoaded, name, onChange])

  // Handle manual changes to the input (only for fallback)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(name, e.target.value)
  }
  

  


  return (
    <>
      <style jsx>{`
        gmp-place-autocomplete {
          --gmpx-color-surface: #1f2937 !important;
          --gmpx-color-on-surface: #f9fafb !important;
          --gmpx-color-on-surface-variant: #d1d5db !important;
          --gmpx-color-outline: #374151 !important;
          --gmpx-color-primary: #3b82f6 !important;
        }
        
        gmp-place-autocomplete::part(input) {
          background: #1f2937 !important;
          color: #f9fafb !important;
          border: 1px solid #374151 !important;
        }
        
        gmp-place-autocomplete::part(menu) {
          background: #1f2937 !important;
          border: 1px solid #374151 !important;
        }
        
        gmp-place-autocomplete::part(menu-item) {
          background: #1f2937 !important;
          color: #f9fafb !important;
        }
        
        gmp-place-autocomplete::part(menu-item):hover {
          background: #374151 !important;
        }
      `}</style>
      <div className={`space-y-2 ${className}`}>
        <Label htmlFor={id} className="flex items-center">
          {label} {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <div className="relative">
          <MapPin className="absolute left-2 top-2.5 h-5 w-5 text-muted-foreground" />
          {!isLoaded || loadError ? (
            // Show regular input if Google Maps is not loaded or has errors
            <Input
              ref={inputRef}
              id={id}
              name={name}
              value={value || ''}
              onChange={handleInputChange}
              placeholder={placeholder}
              className="pl-9"
              required={required}
            />
          ) : (
            // Show the Google Maps autocomplete input
            <Input
              ref={inputRef}
              id={id}
              name={name}
              value={value || ''}
              onChange={handleInputChange}
              placeholder={placeholder}
              className="pl-9"
              required={required}
            />
          )}
          {loadError && (
            <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-500 mt-1">
              <AlertCircle className="h-3 w-3" />
              <span>{loadError}. Manual address entry is available.</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
} 