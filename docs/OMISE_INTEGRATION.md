# Omise Payment Integration Guide

This document outlines the implementation of Omise/OPN payment integration for the Vehicle Inspection System.

## Overview

The Omise integration allows you to:
- Generate payment links for quotations
- Automatically create payment links when sending payment emails
- Handle payment status updates via webhooks
- Track payment completion and update quotation statuses

## Configuration

### Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Omise Payment Links+ Configuration
OMISE_TEMPLATE_ID=3672          # Your Driver Japan template ID
OMISE_TEAM_ID=3388             # Your team ID
OMISE_RETURN_URL=https://your-domain.com/payment-status

# Payment Links+ API Key (get this from Payment Links+ dashboard > Settings > API Keys)
OMISE_PAYMENT_LINKS_API_KEY=your_payment_links_api_key_here

# Omise API Configuration (Production)
OMISE_PUBLIC_KEY=pkey_63znvleq75487yf61ea
OMISE_SECRET_KEY=skey_64t36zji5r1yloelbv2
OMISE_API_URL=https://api.omise.co

# Omise Test Configuration (for testing)
OMISE_TEST_PUBLIC_KEY=pkey_test_63t62di2957dt9v8g1j
OMISE_TEST_SECRET_KEY=skey_test_63t62dilg5nzf5jjtgz
OMISE_TEST_API_URL=https://api.omise.co

# Optional: Webhook secret for signature verification
OMISE_WEBHOOK_SECRET=your_webhook_secret_here

# Optional: Force test mode (automatically uses test credentials in development)
OMISE_TEST_MODE=true
```

**Note:** The system automatically uses test credentials in development mode (`NODE_ENV=development`). You can also force test mode by setting `OMISE_TEST_MODE=true`.

**Important:** For Payment Links+ to work, you need to get your API key from the Payment Links+ dashboard:
1. Go to [Payment Links+ Dashboard](https://linksplus.omise.co)
2. Navigate to **Settings > API Keys**
3. Copy your API key and add it to `OMISE_PAYMENT_LINKS_API_KEY`

### Database Schema Updates

The system expects the following fields in the `quotations` table:

```sql
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS payment_link TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS payment_link_generated_at TIMESTAMP;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS payment_link_expires_at TIMESTAMP;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP;
```

Optional: Create a `quotation_payments` table for detailed payment tracking:

```sql
CREATE TABLE IF NOT EXISTS quotation_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID REFERENCES quotations(id),
  payment_method TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL,
  charge_id TEXT,
  status TEXT NOT NULL,
  completed_at TIMESTAMP,
  reference TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Generate Payment Link

**POST** `/api/quotations/generate-omise-payment-link`

Generates a new Omise payment link for a quotation.

**Request Body:**
```json
{
  "quotation_id": "uuid",
  "regenerate": false
}
```

**Response:**
```json
{
  "success": true,
  "paymentUrl": "https://linksplus.omise.co/...",
  "chargeId": "chrg_...",
  "amount": 5000,
  "currency": "JPY",
  "expiresAt": "2024-01-01T12:00:00.000Z"
}
```

### Send Payment Link Email

**POST** `/api/quotations/send-payment-link-email`

Sends a payment link email to the customer. If no payment link is provided, it automatically generates one.

**Request Body (FormData):**
- `email`: Customer email address
- `quotation_id`: Quotation ID
- `customer_name`: Customer name
- `language`: Email language (en/ja)
- `payment_link`: Optional payment link (if not provided, one will be generated)
- `custom_payment_name`: Optional custom name for the payment link
- `invoice_pdf`: Optional PDF attachment

## Webhook Configuration

### Webhook URL

Set your webhook URL in the Omise dashboard:
```
https://yourdomain.com/api/webhooks/omise
```

### Webhook Events

The system handles the following webhook events:
- `charge.successful`: Payment completed successfully
- `charge.failed`: Payment failed
- `charge.expired`: Payment link expired
- `charge.pending`: Payment pending

### Webhook Security

For production, implement webhook signature verification:

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(payload: any, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Frontend Integration

### Payment Link Dialog

The quotation workflow includes a payment link dialog with:
- Email address input
- Language selection
- Custom payment link name input (optional)
- Payment link input (with auto-generation)
- Generate button for creating new Omise payment links

### Auto-generation

When sending a payment link email:
1. If no payment link is provided, the system automatically generates one
2. The payment link is stored in the database
3. The email is sent with the generated payment link

### Smart Button Logic

The payment link button intelligently changes based on status:
- **First time**: "Send Payment Link" - Creates and sends new payment link
- **After sending**: "Regenerate & Resend" - Creates new payment link and resends email
- **Status indicator**: Shows when payment link was last sent
- **Template integration**: Uses your existing "Driver Japan" Payment Links+ template

## Payment Flow

1. **Generate Payment Link**
   - Admin clicks "Generate" button or sends payment email
   - System creates Omise payment link using your existing "Driver Japan" template
   - Payment link is stored in database with expiry time
   - Link automatically appears in your Payment Links+ dashboard

2. **Customer Payment**
   - Customer receives email with payment link
   - Customer clicks link and completes payment via Omise
   - Payment processed securely with your branded template

3. **Webhook Processing**
   - Omise sends webhook with payment status
   - System updates quotation status automatically
   - Payment confirmation email is sent
   - Payment details are stored in `quotation_payments` table
   - Charge ID is stored for receipt download

4. **Status Updates**
   - Quotation status changes to 'paid'
   - Payment completion timestamp is recorded
   - Charge ID stored for Omise receipt access
   - System is ready for booking creation

5. **Receipt Management**
   - Receipt data available from Omise via charge ID
   - Download receipt functionality (future enhancement)
   - Receipt automatically attached to payment records

## Error Handling

### Common Issues

1. **Payment Link Generation Failed**
   - Check Omise API credentials
   - Verify quotation data is complete
   - Check API response for specific errors

2. **Webhook Not Received**
   - Verify webhook URL is correct
   - Check webhook configuration in Omise dashboard
   - Ensure server is accessible

3. **Payment Status Not Updated**
   - Check webhook processing logs
   - Verify database schema
   - Check quotation ID extraction from reference

### Logging

The system logs all Omise-related activities:
- Payment link generation
- Webhook processing
- Payment status updates
- Error conditions

Check the console logs for debugging information.

## Testing

### Test Mode

For testing payments and receipts, use these test credentials:

```bash
# Test Environment Variables
OMISE_PUBLIC_KEY=pkey_test_63t62di2957dt9v8g1j
OMISE_SECRET_KEY=skey_test_63t62dilg5nzf5jjtgz
OMISE_API_URL=https://api.omise.co
```

### Test Credit Cards

**Successful Payment:**
- **Card Number:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., `12/25`)
- **CVV:** Any 3 digits (e.g., `123`)
- **Name:** Any name

**Failed Payment:**
- **Card Number:** `4000 0000 0000 0002`
- **Expiry:** Any future date
- **CVV:** Any 3 digits
- **Name:** Any name

**3D Secure Test:**
- **Card Number:** `4000 0000 0000 3220`
- **Expiry:** Any future date
- **CVV:** Any 3 digits
- **Name:** Any name

### Testing Steps

1. **Set Test Environment Variables** in your `.env.local`
2. **Generate Test Payment Link** using Payment Links+ API
3. **Complete Test Payment** with test credit card
4. **Verify Webhook Processing** for payment completion
5. **Test Receipt Download** in "Mark as Paid" popup

## Security Considerations

1. **API Keys**: Never expose secret keys in client-side code
2. **Webhook Verification**: Always verify webhook signatures in production
3. **HTTPS**: Use HTTPS for all webhook endpoints
4. **Rate Limiting**: Implement rate limiting for payment link generation
5. **Input Validation**: Validate all input data before processing

## Monitoring

Monitor the following metrics:
- Payment link generation success rate
- Webhook processing success rate
- Payment completion rate
- Error rates and types
- Response times

## Support

For Omise-specific issues:
- [Omise Documentation](https://www.omise.co/docs)
- [Omise Support](https://www.omise.co/support)

For system integration issues, check the application logs and verify configuration.
