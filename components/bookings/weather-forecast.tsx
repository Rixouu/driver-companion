'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { CloudSun, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
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
        
        // Extract city from location string (assuming format like "Tokyo, Japan")
        const city = location.split(',')[0].trim()
        
        // Use WeatherAPI.com to fetch forecast
        const apiKey = '479908cdad0f407595e62612251302'
        const days = 10 // Maximum forecast days for free account
        
        // Calculate dates
        const tripDate = new Date(date)
        const currentDate = new Date()
        
        // Check if tripDate is within forecast range (API limit is 14 days)
        const daysDifference = Math.floor((tripDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDifference > days) {
          setLoading(false)
          setError(`Weather forecast is only available for ${days} days ahead`)
          return
        }
        
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(city)}&days=${days}&aqi=no&alerts=no`
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.statusText}`)
        }
        
        const data = await response.json()
        setWeather(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching weather data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch weather data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchWeatherData()
  }, [date, location])
  
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
          {t('bookings.details.weather.notAvailable')}
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
              <img 
                src={`https:${forecastDay.day.condition.icon}`} 
                alt={forecastDay.day.condition.text}
                width={32}
                height={32}
                className="w-8 h-8"
              />
            </div>
            <div>
              <p className="text-2xl font-bold">{forecastDay.day.avgtemp_c}°C</p>
              <p className="text-sm text-muted-foreground">{forecastDay.day.condition.text}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="font-medium">{new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <p className="text-sm text-muted-foreground">
              {location.split(',')[0] || 'Location'}, {location.split(',').pop()?.trim() || 'Region'}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 border rounded-md bg-muted/20">
          <p className="text-center text-muted-foreground">
            {t('bookings.details.weather.forecastUnavailable', { date: new Date(date).toLocaleDateString() })}
          </p>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground mt-2">
        {t('bookings.details.weather.disclaimer')}
      </p>
    </div>
  )
} 