# Payment Links Management Feature

## Overview
This feature provides a comprehensive management interface for Omise payment links, allowing you to create, view, manage, and delete payment links without accessing the Omise Dashboard.

## Features

### 🔗 Payment Link Management
- **List all payment links** with pagination and search
- **Create new payment links** with custom amounts, descriptions, and settings
- **View detailed information** for each payment link
- **Delete payment links** with confirmation
- **Copy payment URLs** to clipboard
- **Open payment links** in new tabs

### 💳 Payment Status Tracking
- **Real-time status indicators** (Paid, Pending, Deleted)
- **Payment history** with customer information
- **Receipt generation** for completed payments
- **Multiple payment support** (one-time or reusable links)

### 🎨 User Interface
- **Responsive design** for desktop and mobile
- **Search and filter** functionality
- **Status badges** with color coding
- **Action buttons** for quick operations
- **Modal dialogs** for detailed views and creation

## API Endpoints

### GET `/api/omise/paylinks`
List all payment links with pagination
- Query parameters: `limit`, `offset`, `order`
- Returns: Array of payment links with metadata

### POST `/api/omise/paylinks`
Create a new payment link
- Body: `{ amount, currency, title, description, multiple, merchant_name, merchant_uid }`
- Returns: Created payment link object

### GET `/api/omise/paylinks/[id]`
Retrieve a specific payment link
- Returns: Payment link details with charges

### DELETE `/api/omise/paylinks/[id]`
Delete a payment link
- Returns: Deleted payment link confirmation

### GET `/api/omise/paylinks/[id]/receipt`
Generate receipt for a paid payment link
- Returns: Receipt data or custom receipt HTML

## Usage

### Creating a Payment Link
1. Navigate to **Payment Links** in the sidebar
2. Click **Create Payment Link** button
3. Fill in the required information:
   - **Title**: Descriptive name for the payment
   - **Amount**: Payment amount (in main currency unit)
   - **Currency**: Select from supported currencies
   - **Description**: Optional description
   - **Multiple Use**: Allow multiple payments with the same link
4. Click **Create Payment Link**

### Managing Payment Links
- **View Details**: Click the eye icon to see full payment link information
- **Copy Link**: Click the copy icon to copy the payment URL
- **Open Link**: Click the external link icon to open the payment page
- **Generate Receipt**: Click the receipt icon for paid links
- **Delete Link**: Click the trash icon to delete the link

### Payment Status
- **Paid**: Green badge - Payment has been completed
- **Pending**: Gray badge - Payment link is active but not paid
- **Deleted**: Red badge - Payment link has been deleted

## Technical Implementation

### OmiseClient Integration
The feature extends the existing `OmiseClient` class with standard Omise Links API methods:
- `links.list()` - List payment links
- `links.create()` - Create payment link
- `links.retrieve()` - Get payment link details
- `links.destroy()` - Delete payment link

### Database Integration
- Uses existing Supabase authentication
- No additional database tables required
- All data stored in Omise's system

### Security
- All API calls use server-side Omise secret key
- Client-side only receives public payment URLs
- Payment processing handled entirely by Omise

## Configuration

### Environment Variables
Ensure these are set in your environment:
```env
OMISE_PUBLIC_KEY=pkey_test_...
OMISE_SECRET_KEY=skey_test_...
```

### Supported Currencies
- THB (Thai Baht)
- USD (US Dollar)
- JPY (Japanese Yen)
- SGD (Singapore Dollar)
- MYR (Malaysian Ringgit)

## Navigation
The Payment Links feature is accessible via:
- **Sidebar**: Operations → Payment Links
- **URL**: `/paylinks`

## Future Enhancements
- Bulk operations (delete multiple links)
- Export payment data to CSV
- Advanced filtering options
- Payment analytics dashboard
- Custom receipt templates
- Webhook integration for real-time updates
