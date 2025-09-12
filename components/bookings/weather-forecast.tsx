'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { CloudSun, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { formatDate, formatDateDDMMYYYY } from '@/lib/utils/formatting'
import { useI18n } from '@/lib/i18n/context'

interface WeatherForecastProps {
  date: string;
  location: string;
  className?: string;
}

interface WeatherData {
  current?: {
    temp_c: number;
    condition: {
      text: string;
      icon: string;
    };
  };
  forecast?: {
    forecastday: Array<{
      date: string;
      day: {
        avgtemp_c: number;
        condition: {
          text: string;
          icon: string;
        };
      };
    }>;
  };
  error?: string;
}

export function WeatherForecast({ date, location, className = '' }: WeatherForecastProps) {
  const { t } = useI18n()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchWeatherData() {
      if (!location || !date) {
        setLoading(false)
        setError('Location or date not provided')
        return
      }
      
      try {
        setLoading(true)
        
        // Improved location parsing - extract city and check if it's valid
        let locationQuery = ''
        
        // First check if it contains coordinates
        const coordsRegex = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/
        const coordsMatch = location.match(coordsRegex)
        
        if (coordsMatch) {
          // If we have coordinates, use them directly
          locationQuery = `${coordsMatch[1]},${coordsMatch[2]}`
        } else {
          // Otherwise try to extract a valid city name
          // Remove any numeric or special characters that might cause API issues
          const cleanLocation = location.replace(/[^a-zA-Z\s,]/g, '').trim()
          const parts = cleanLocation.split(',')
          
          if (parts.length > 0 && parts[0].trim()) {
            // Use the first part as the city
            locationQuery = parts[0].trim()
            
            // Add country/region as a second parameter if available
            if (parts.length > 1 && parts[1].trim()) {
              locationQuery += `,${parts[1].trim()}`
            }
          } else {
            setLoading(false)
            setError('Invalid location format')
            return
          }
        }
        
        if (!locationQuery) {
          setLoading(false)
          setError('Invalid location format')
          return
        }
        
        // Use WeatherAPI.com to fetch forecast
        // Use environment variable with fallback for development
        const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY || '479908cdad0f407595e62612251302'
        const FORECAST_RANGE_DAYS = 3 // Free WeatherAPI accounts provide up to 3-day forecasts
        
        const tripDate = new Date(date)
        const currentDate = new Date()
        
        const daysDifference = Math.floor((tripDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
        
        // Skip fetching if the date is in the past or beyond the free forecast range
        if (daysDifference < 0 || daysDifference > FORECAST_RANGE_DAYS) {
          setLoading(false)
          setError(t('bookings.details.weather.notAvailable', { date: formatDateDDMMYYYY(tripDate) }))
          return
        }
        
        const days = FORECAST_RANGE_DAYS // how many days of forecast to request
        
        // Check if tripDate is a valid date
        if (isNaN(tripDate.getTime())) {
          setLoading(false)
          setError('Invalid date format')
          return
        }
        
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(locationQuery)}&days=${days}&aqi=no&alerts=no`
        
        try {
          console.log('Fetching weather data for:', locationQuery)
          const response = await fetch(url, { 
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            cache: 'no-cache' // Disable Next.js cache to ensure fresh data
          })
          
          if (!response.ok) {
            if (response.status === 400) {
              console.error('Weather API 400 error - failed to parse location: ', locationQuery)
              setError(t('bookings.details.weather.notAvailable', { date: formatDateDDMMYYYY(tripDate) }))
            } else if (response.status === 403) {
              console.error('Weather API authentication error')
              setError(t('bookings.details.weather.errorMessage'))
            } else {
              throw new Error(`Weather API error: ${response.status}`)
            }
            setWeather(null)
            setLoading(false)
            return
          }
          
          const data = await response.json()
          console.log('Weather data received:', data)
          setWeather(data)
          setError(null)
        } catch (fetchError) {
          // Handle network errors separately
          console.error('Network error fetching weather data:', fetchError)
          setError(t('bookings.details.weather.errorMessage'))
          setWeather(null)
        }
      } catch (err) {
        console.error('Error in weather data processing:', err)
        setError(t('bookings.details.weather.errorMessage'))
        setWeather(null)
      } finally {
        setLoading(false)
      }
    }
    
    fetchWeatherData()
  }, [date, location, t])
  
  // Get forecast for the specific date
  const getForecastForDate = () => {
    if (!weather?.forecast?.forecastday || !date) return null
    
    const formattedTripDate = date.split('T')[0] // Get YYYY-MM-DD format
    return weather.forecast.forecastday.find(day => day.date === formattedTripDate)
  }
  
  const forecastDay = getForecastForDate()
  
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 min-h-[100px] ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }
  
  if (error || !weather) {
    return (
      <div className={`p-4 text-sm text-muted-foreground ${className}`}>
        <p className="flex items-center">
          <CloudSun className="h-4 w-4 mr-2 text-muted-foreground" />
          {t('bookings.details.weather.notAvailable', { date: date ? formatDateDDMMYYYY(date) : 'selected date' })}
        </p>
        {error && <p className="mt-1 text-xs">{t('bookings.details.weather.errorMessage')}</p>}
      </div>
    )
  }
  
  return (
    <div className={`${className}`}>
      <h3 className="text-lg font-medium flex items-center mb-4">
        <CloudSun className="mr-2 h-5 w-5" />
        {t('bookings.details.weather.title')}
      </h3>
      
      {forecastDay ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center mr-3">
              {forecastDay.day.condition.icon && (
                <Image 
                  src={`https:${forecastDay.day.condition.icon}`} 
                  alt={forecastDay.day.condition.text}
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold">{forecastDay.day.avgtemp_c}°C</p>
              <p className="text-sm text-muted-foreground">{forecastDay.day.condition.text}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="font-medium">{formatDateDDMMYYYY(date)}</p>
            <p className="text-sm text-muted-foreground">
              {location.split(',')[0] || 'Location'}, {location.split(',').pop()?.trim() || 'Region'}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 border rounded-md bg-muted/20">
          <p className="text-center text-muted-foreground">
            {t('bookings.details.weather.forecastUnavailable', { date: formatDateDDMMYYYY(date) })}
          </p>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground mt-2">
        {t('bookings.details.weather.disclaimer')}
      </p>
    </div>
  )
} 