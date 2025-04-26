import { Booking, Vehicle } from "./bookings"

declare global {
  interface Window {
    // Add any global window properties here
    _env?: Record<string, string>
  }

  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_WORDPRESS_API_URL?: string
      NEXT_PUBLIC_WORDPRESS_API_KEY?: string
      WORDPRESS_API_URL?: string
      WORDPRESS_API_KEY?: string
      NEXT_PUBLIC_WORDPRESS_API_CUSTOM_PATH?: string
      WORDPRESS_API_CUSTOM_PATH?: string
    }
  }
} 