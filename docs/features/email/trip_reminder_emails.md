# Trip Reminder Email System

## Overview

The Trip Reminder Email System automatically sends beautiful, professional email reminders to customers, drivers, and booking creators when trips are approaching. This system integrates seamlessly with your existing booking details email template and runs via Supabase Edge Functions with cron scheduling.

## Features

### 🎯 **Smart Timing**
- **24-hour reminders**: Sent 24 hours before trip start time
- **2-hour reminders**: Sent 2 hours before trip start time (urgent styling)
- **Duplicate prevention**: Prevents sending multiple reminders for the same booking

### 📧 **Multi-Recipient System**
- **Customer**: Primary recipient with full trip details
- **Driver**: BCC copy with `[Driver]` subject prefix
- **Creator**: BCC copy with `[Internal]` subject prefix (admin who created the booking)

### 🎨 **Beautiful Email Design**
- **Consistent branding**: Uses your existing Driver Japan design system
- **Responsive design**: Mobile-friendly layout
- **Urgency indicators**: Special styling for 2-hour reminders
- **Countdown display**: Visual countdown to trip time
- **Google Calendar integration**: One-click calendar addition

## Email Templates

### 24-Hour Reminder
- **Subject**: `Your Trip is Coming Soon - [BOOKING_ID] (24 hours reminder)`
- **Banner**: Orange gradient with clock icon ⏰
- **Tone**: Friendly and informative

### 2-Hour Reminder
- **Subject**: `URGENT: Your Trip is Coming Soon - [BOOKING_ID] (2 hours reminder)`
- **Banner**: Red gradient with alert icon 🚨
- **Tone**: Urgent with additional warnings

## Technical Implementation

### Files Created/Modified

1. **`lib/email/trip-reminder-email.ts`**
   - Core email service with HTML/text generation
   - Reusable function for sending trip reminders
   - TypeScript interfaces for type safety

2. **`supabase/functions/scheduled-notifications/index.ts`**
   - Updated Edge Function to include trip reminder processing
   - Automatic 24h and 2h reminder detection
   - Duplicate prevention logic

3. **`app/api/trip-reminders/test/route.ts`**
   - Test endpoint for manual trip reminder testing
   - Supports both 24h and 2h reminder types

### Database Integration

The system queries the following tables:
- `bookings` - Main booking data
- `customers` - Customer email and name
- `drivers` - Driver email and contact info
- `vehicles` - Vehicle details
- `profiles` - Booking creator (admin) details
- `notifications` - Tracks sent reminders

### Email Content

Each email includes:
- **Service details**: Type, date, time, locations
- **Driver & vehicle info**: Name, phone, license plate, model
- **Special notes**: Any booking-specific instructions
- **Google Calendar link**: One-click calendar addition
- **Important reminders**: Pre-trip preparation checklist
- **Contact information**: Driver Japan branding and contact

## Usage

### Automatic (Recommended)
The system runs automatically via Supabase cron jobs:
- **Schedule**: Every hour (`0 * * * *`)
- **Function**: `scheduled-notifications`
- **No manual intervention required**

### Manual Testing
Test the system with any booking:

```bash
# Test 24-hour reminder
curl -X POST http://localhost:3000/api/trip-reminders/test \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "CHARTER-123-456", "reminderType": "24h"}'

# Test 2-hour reminder
curl -X POST http://localhost:3000/api/trip-reminders/test \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "CHARTER-123-456", "reminderType": "2h"}'
```

## Configuration

### Environment Variables Required
```env
RESEND_API_KEY=your_resend_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Supabase Cron Job Setup
1. Go to Supabase Dashboard > Database > Cron Jobs
2. Create new cron job:
   - **Name**: `trip-reminder-emails`
   - **Type**: Supabase Edge Function
   - **Function**: `scheduled-notifications`
   - **Schedule**: `0 * * * *` (every hour)
   - **Method**: POST

## Email Examples

### 24-Hour Reminder
```
Subject: Your Trip is Coming Soon - CHARTER-123-456 (24 hours reminder)

⏰ Your trip is coming soon! 24 hours reminder

Hello John Doe!

This is a friendly reminder that your vehicle service is scheduled to begin in 24 hours.

SERVICE DETAILS:
- Service Type: Airport Transfer
- Date: 15/12/2024
- Time: 09:00 AM
- Pickup Location: Suvarnabhumi Airport
- Dropoff Location: Bangkok Hotel

DRIVER & VEHICLE INFORMATION:
- Driver Name: Somchai Smith
- Driver Phone: +66-123-456-789
- License Plate: กข-1234
- Vehicle Model: Toyota Camry

[Google Calendar Link]
[Important Reminders]
[Contact Information]
```

### 2-Hour Reminder
```
Subject: URGENT: Your Trip is Coming Soon - CHARTER-123-456 (2 hours reminder)

🚨 Your trip is coming soon! 2 hours reminder

[Same content as 24h but with urgent styling and additional warnings]
```

## Monitoring

### Logs
Check Supabase Edge Function logs for:
- Successful email sends
- Missing email data warnings
- Error handling

### Notifications Table
Track sent reminders in the `notifications` table:
- `type`: `trip_reminder_24h_email` or `trip_reminder_2h_email`
- `related_id`: Booking ID
- `title`: "Trip reminder email sent - [BOOKING_ID]"
- `description`: Details about recipients

## Troubleshooting

### Common Issues

1. **Missing email data**
   - Ensure customer, driver, and creator have email addresses
   - Check booking status is 'confirmed' or 'pending'

2. **Emails not sending**
   - Verify RESEND_API_KEY is correct
   - Check Supabase Edge Function logs
   - Ensure cron job is active

3. **Duplicate emails**
   - System prevents duplicates via notifications table
   - Check for existing `trip_reminder_*_email` notifications

### Debug Steps

1. **Test manually** using the test endpoint
2. **Check logs** in Supabase Edge Functions
3. **Verify data** in bookings, customers, drivers tables
4. **Confirm cron job** is running in Supabase Dashboard

## Benefits

### For Customers
- **Proactive communication**: Never miss a trip
- **Professional presentation**: Beautiful, branded emails
- **Easy calendar integration**: One-click Google Calendar addition
- **Clear instructions**: Know exactly what to expect

### For Drivers
- **Advance notice**: Know about upcoming trips
- **Customer details**: Full context for better service
- **Professional coordination**: Stay in the loop

### For Admins
- **Automated workflow**: No manual reminder sending
- **Consistent branding**: Professional email presentation
- **Audit trail**: Track all sent reminders
- **Reliable delivery**: Built on proven email infrastructure

## Future Enhancements

- **SMS integration**: Add SMS reminders for critical trips
- **Customizable timing**: Allow different reminder intervals
- **Multi-language support**: Send emails in customer's preferred language
- **Template customization**: Allow admin to modify email content
- **Analytics dashboard**: Track email open rates and engagement

---

**Status**: ✅ **Production Ready**

The Trip Reminder Email System is fully implemented and ready for production use. It integrates seamlessly with your existing booking system and provides a professional, automated way to keep customers, drivers, and admins informed about upcoming trips.
