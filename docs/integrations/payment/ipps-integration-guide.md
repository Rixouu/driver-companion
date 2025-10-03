# IPPS Payment Integration Guide for Next.js 15

This document outlines how to implement IPPS (Internet Payment Processing Service) integration in a Next.js 15 application based on the existing implementation in the Chauffeur Booking System.

## Table of Contents

- [Overview](#overview)
- [API Configuration](#api-configuration)
- [Implementation Steps](#implementation-steps)
- [API Client Implementation](#api-client-implementation)
- [Webhook Handler](#webhook-handler)
- [Frontend Integration](#frontend-integration)
- [Testing and Troubleshooting](#testing-and-troubleshooting)

## Overview

IPPS is a payment gateway service that allows you to generate payment links that can be sent to customers via email or SMS. The payment flow consists of:

1. Creating a payment request with customer and transaction details
2. Receiving a payment URL that can be shared with the customer
3. Processing webhook notifications when payment status changes

## API Configuration

### Required Credentials

To use IPPS, you need the following credentials:

- **Base URL**: The base URL for the IPPS API
- **Access Token**: Authentication token for API requests
- **Client ID & Secret**: Optional for token-based authentication renewal

### Environment Configuration

Add these environment variables to your Next.js application:

```bash
# .env
IPPS_API_BASE_URL=https://api.example.com
IPPS_ACCESS_TOKEN=your_access_token
IPPS_CLIENT_ID=your_client_id
IPPS_CLIENT_SECRET=your_client_secret
```

## Implementation Steps

### 1. Install Required Dependencies

```bash
npm install axios
```

### 2. Create API Client

Create a reusable IPPS client for making API requests.

### 3. Implement Payment Creation

Build an API route to create payment links.

### 4. Set Up Webhook Handler

Create an API endpoint to receive payment status updates.

### 5. Integrate with Frontend

Add UI components for payment selection and processing.

## API Client Implementation

Create a class to handle IPPS API interactions:

```typescript
// lib/ipps-client.ts
import axios from 'axios';

interface IPPSConfig {
  baseUrl: string;
  accessToken: string;
  clientId?: string;
  clientSecret?: string;
}

interface PaymentData {
  clientTransactionId: string;
  amount: number;
  ref1: string;
  ref2?: string;
  ref3?: string;
  expiredIn?: number;
  customerPaymentNo: string;
  customerPaymentDescription: string;
  sentPaylinkToCustomerEmail: string;
  sentPaylinkToCustomerMobile: string;
}

interface IPPSResponse {
  error: boolean;
  message?: string;
  paymentUrl?: string;
}

export class IPPSClient {
  private config: IPPSConfig;
  
  constructor(config: IPPSConfig) {
    this.config = config;
  }
  
  async createPaylink(data: PaymentData): Promise<IPPSResponse> {
    try {
      // Format amount to ensure it meets minimum requirement (1.0)
      const amount = Math.max(1.0, parseFloat(data.amount.toFixed(2)));
      
      const payload = {
        client_transaction_id: data.clientTransactionId,
        amount: amount.toFixed(2),
        ref1: data.ref1,
        ref2: data.ref2 || 'N/A',
        ref3: data.ref3 || 'N/A',
        expired_in: data.expiredIn || 3600, // Default: 1 hour
        customer_payment_no: data.customerPaymentNo,
        customer_payment_description: data.customerPaymentDescription,
        sent_paylink_to_customer_email: data.sentPaylinkToCustomerEmail,
        sent_paylink_to_customer_mobile: data.sentPaylinkToCustomerMobile
      };
      
      console.log('[IPPS] Creating payment with data:', payload);
      
      const response = await axios.post(
        `${this.config.baseUrl}/merchant-api/v1.0/request-paylink`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000
        }
      );
      
      console.log('[IPPS] API response:', response.data);
      
      // Handle different response structures for payment URL
      let paymentUrl = null;
      if (response.data?.payment_url) {
        paymentUrl = response.data.payment_url;
      } else if (response.data?.data?.payment_url) {
        paymentUrl = response.data.data.payment_url;
      } else if (response.data?.paylink) {
        paymentUrl = response.data.paylink;
      }
      
      if (!paymentUrl) {
        throw new Error('Payment URL not found in response');
      }
      
      return {
        error: false,
        paymentUrl
      };
    } catch (error) {
      console.error('[IPPS] Error creating payment:', error);
      
      // Extract error message from response if available
      let errorMessage = 'Payment gateway error';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        error: true,
        message: errorMessage
      };
    }
  }
  
  // Optional: Implement token refresh functionality if needed
  async refreshToken() {
    // Implementation depends on your token refresh mechanism
  }
}
```

## Payment Creation API Route

Create an API route to handle payment creation:

```typescript
// app/api/payments/ipps/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { IPPSClient } from '@/lib/ipps-client';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate required fields
    const requiredFields = ['amount', 'bookingId', 'customerEmail', 'customerPhone', 'description'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }
    
    // Format phone number if needed
    const phoneNumber = data.customerPhone.replace(/^\+\d{2}/, '0');
    
    const client = new IPPSClient({
      baseUrl: process.env.IPPS_API_BASE_URL || '',
      accessToken: process.env.IPPS_ACCESS_TOKEN || ''
    });
    
    const result = await client.createPaylink({
      clientTransactionId: `BOOKING-${data.bookingId}-${Date.now()}`,
      amount: parseFloat(data.amount),
      ref1: `Booking ID: ${data.bookingId}`,
      ref2: data.serviceType || 'N/A',
      ref3: data.vehicleName || 'N/A',
      customerPaymentNo: data.bookingId.toString(),
      customerPaymentDescription: data.description,
      sentPaylinkToCustomerEmail: data.customerEmail,
      sentPaylinkToCustomerMobile: phoneNumber
    });
    
    if (result.error) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    
    // Store payment URL in your database
    await updateBookingWithPaymentUrl(data.bookingId, result.paymentUrl);
    
    return NextResponse.json({
      success: true,
      paymentUrl: result.paymentUrl
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 });
  }
}

// Helper function to update booking record with payment URL
async function updateBookingWithPaymentUrl(bookingId: string | number, paymentUrl: string) {
  // Implement based on your database structure
  // Example with Prisma:
  // await prisma.booking.update({
  //   where: { id: Number(bookingId) },
  //   data: { ippsPaymentUrl: paymentUrl }
  // });
}
```

## Webhook Handler

Create a webhook handler to process payment status updates:

```typescript
// app/api/webhooks/ipps/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Define status codes
const STATUS_SUCCESS = 51;
const STATUS_FAILED = 52;
const STATUS_EXPIRED = 53;
const STATUS_CANCELLED = 54;

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('[IPPS Webhook] Received payload:', payload);
    
    // Validate webhook payload
    if (!payload || !payload.status?.code || !payload.data?.client_transaction_id) {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
    }
    
    // Extract booking ID from transaction ID
    const parts = payload.data.client_transaction_id.split('-');
    if (parts.length < 2 || parts[0] !== 'BOOKING') {
      return NextResponse.json({ error: 'Invalid transaction ID format' }, { status: 400 });
    }
    
    const bookingId = parts[1];
    
    // Verify booking exists
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: `Booking ${bookingId} not found` }, { status: 404 });
    }
    
    // Optional: Verify payment amount
    // Implement amount verification if needed
    
    // Process payment status
    const status = payload.status.code;
    let newStatus;
    
    switch (status) {
      case STATUS_SUCCESS:
        newStatus = 'paid';
        console.log('[IPPS Webhook] Payment successful');
        break;
      case STATUS_FAILED:
        newStatus = 'payment_failed';
        console.log('[IPPS Webhook] Payment failed');
        break;
      case STATUS_EXPIRED:
        newStatus = 'payment_failed';
        console.log('[IPPS Webhook] Payment expired');
        break;
      case STATUS_CANCELLED:
        newStatus = 'payment_failed';
        console.log('[IPPS Webhook] Payment cancelled');
        break;
      default:
        console.log(`[IPPS Webhook] Unhandled status code: ${status}`);
        newStatus = null;
    }
    
    if (newStatus) {
      // Don't update if already in success state
      if (status !== STATUS_SUCCESS || booking.status !== 'paid') {
        await updateBookingStatus(bookingId, newStatus);
      }
      
      // Store payment data
      await storePaymentData(bookingId, {
        ...payload,
        received_at: new Date().toISOString()
      });
      
      // Send notifications for successful payments
      if (status === STATUS_SUCCESS) {
        await sendPaymentNotifications(bookingId);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[IPPS Webhook] Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Helper functions - implement based on your database structure
async function getBookingById(id: string | number) {
  // Example with Prisma:
  // return await prisma.booking.findUnique({ where: { id: Number(id) } });
}

async function updateBookingStatus(id: string | number, status: string) {
  // Example with Prisma:
  // await prisma.booking.update({
  //   where: { id: Number(id) },
  //   data: { status }
  // });
}

async function storePaymentData(bookingId: string | number, paymentData: any) {
  // Example with Prisma:
  // await prisma.payment.create({
  //   data: {
  //     bookingId: Number(bookingId),
  //     provider: 'ipps',
  //     data: paymentData,
  //     status: paymentData.status.code
  //   }
  // });
}

async function sendPaymentNotifications(bookingId: string | number) {
  // Implement email notifications
  // Example: 
  // 1. Send confirmation to customer
  // 2. Send notification to admin
}
```

## Frontend Integration

### Payment Selection Component

```tsx
// components/PaymentOptions.tsx
import { useState } from 'react';
import Image from 'next/image';

interface PaymentOption {
  id: number;
  name: string;
  logo?: string;
  info?: string;
}

interface PaymentOptionsProps {
  options: PaymentOption[];
  defaultOption?: number;
  onSelect: (optionId: number) => void;
}

export function PaymentOptions({ options, defaultOption, onSelect }: PaymentOptionsProps) {
  const [selectedOption, setSelectedOption] = useState<number>(defaultOption || -1);
  
  const handleSelection = (id: number) => {
    setSelectedOption(id);
    onSelect(id);
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Payment Method</h3>
      <ul className="space-y-2">
        {options.map((option) => (
          <li key={option.id} className="border rounded-md overflow-hidden">
            <button
              className={`w-full p-4 flex items-center justify-between ${
                selectedOption === option.id ? 'bg-blue-50 border-blue-500' : ''
              }`}
              onClick={() => handleSelection(option.id)}
            >
              <div className="flex items-center space-x-3">
                {option.logo && (
                  <div className="w-10 h-10 relative">
                    <Image
                      src={option.logo}
                      alt={option.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                <span>{option.name}</span>
              </div>
              
              {selectedOption === option.id && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            
            {selectedOption === option.id && option.info && (
              <div className="p-4 bg-gray-50 border-t">
                <p className="text-sm text-gray-700">{option.info}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Payment Processing Component

```tsx
// components/PaymentProcessor.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PaymentProcessorProps {
  bookingId: string | number;
  amount: number;
  customerEmail: string;
  customerPhone: string;
  serviceType?: string;
  vehicleName?: string;
  description: string;
}

export function PaymentProcessor({
  bookingId,
  amount,
  customerEmail,
  customerPhone,
  serviceType,
  vehicleName,
  description
}: PaymentProcessorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const processPayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/payments/ipps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId,
          amount,
          customerEmail,
          customerPhone,
          serviceType,
          vehicleName,
          description
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Payment processing failed');
      }
      
      // Handle success - show confirmation or redirect
      router.push(`/booking/confirmation/${bookingId}?paymentUrl=${encodeURIComponent(data.paymentUrl)}`);
    } catch (error) {
      console.error('Payment processing error:', error);
      setError(typeof error === 'string' ? error : (error instanceof Error ? error.message : 'Payment processing failed'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}
      
      <button
        onClick={processPayment}
        disabled={loading}
        className={`w-full py-3 px-4 rounded-md ${
          loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-medium transition-colors`}
      >
        {loading ? 'Processing...' : 'Continue to Payment'}
      </button>
    </div>
  );
}
```

### Payment Confirmation Page

```tsx
// app/booking/confirmation/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function BookingConfirmationPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const paymentUrl = searchParams.get('paymentUrl');
  const [copySuccess, setCopySuccess] = useState(false);
  
  const copyPaymentLink = async () => {
    if (paymentUrl) {
      try {
        await navigator.clipboard.writeText(paymentUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      } catch (err) {
        console.error('Failed to copy payment link:', err);
      }
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-2xl font-bold mt-4">Booking Confirmed!</h1>
          <p className="text-gray-600 mt-2">Your booking (#{params.id}) has been received and is under review.</p>
        </div>
        
        {paymentUrl && (
          <div className="mt-8 border rounded-md p-4 bg-gray-50">
            <h2 className="font-medium text-lg mb-2">Payment Link</h2>
            <p className="text-sm text-gray-600 mb-4">
              Use the link below to complete your payment. The link has also been sent to your email.
            </p>
            
            <div className="flex space-x-4">
              <a 
                href={paymentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-center hover:bg-blue-700 transition-colors"
              >
                Pay Now
              </a>
              
              <button
                onClick={copyPaymentLink}
                className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                {copySuccess ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-8 text-center">
          <Link 
            href="/"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
```

## Testing and Troubleshooting

### Testing Your Integration

1. **Create a Test Payment**
   - Use the API route with test data
   - Verify payment URL generation

2. **Test Webhook Handling**
   - Use tools like Postman to simulate webhook notifications
   - Check status updates in your database

3. **End-to-End Testing**
   - Complete a full booking and payment flow
   - Verify all status changes and notifications

### Logging

Implement comprehensive logging to troubleshoot issues:

```typescript
// lib/logger.ts
export function logIPPSActivity(type: string, message: string, data?: any) {
  console.log(`[IPPS ${type}] ${message}`, data ? data : '');
  
  // Consider using a more robust logging solution like:
  // - Winston
  // - Pino
  // - Server-side logging service
}
```

### Common Issues

1. **Token Authentication Problems**
   - Check token validity and expiration
   - Implement token refresh mechanism

2. **Webhook Reception Issues**
   - Ensure your webhook URL is publicly accessible
   - Check for firewall or routing issues

3. **Payment Status Updates**
   - Verify webhook payload processing
   - Check database operations

4. **Minimum Amount Requirements**
   - Ensure payment amount is at least 1.0
   - Format amounts correctly

## Conclusion

This implementation guide provides a foundation for integrating IPPS payments into your Next.js 15 application. Adapt the code examples to fit your specific database structure and business logic.

Remember to:
- Keep sensitive credentials in environment variables
- Implement proper error handling and logging
- Test thoroughly with real payment flows
- Handle edge cases like token expiration and webhooks failures 