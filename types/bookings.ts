export interface Vehicle {
  id: string
  make: string
  model: string
  year: string
  registration?: string
}

export interface Customer {
  id?: string
  name?: string
  email?: string
  phone?: string
}

export interface Booking {
  id: string
  booking_id?: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | string
  service_name: string
  service_type?: string
  service_id?: string
  customer_id?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  driver_id?: string
  
  // WordPress specific fields
  title?: string  // For WordPress format: "Booking XXXX"
  meta?: Record<string, any> // Raw WordPress meta data
  
  // Additional fields from WordPress
  customer?: Customer
  email?: string
  phone?: string
  
  // Vehicle details
  vehicle?: Vehicle
  
  // Service details
  service?: {
    name: string
    price?: string | number
  }
  
  // Pricing details
  price?: {
    amount: number
    currency: string
    formatted: string
  }
  
  // Route information
  pickup_location?: string
  dropoff_location?: string
  distance?: string | number
  duration?: string | number
  
  // Payment information
  payment_status?: string
  payment_method?: string
  payment_link?: string
  ipps_payment_link?: string
  
  // Additional metadata
  notes?: string
  created_at?: string
  updated_at?: string
  booking_status?: string
} 