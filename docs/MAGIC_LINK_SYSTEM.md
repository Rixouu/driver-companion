# Magic Link System for Quotations

## Overview
The magic link system automatically generates secure, time-limited links for customers to view their quotations without needing to log in. This is integrated directly into the existing quotation workflow.

## How It Works

### 1. **Automatic Generation**
- When you click "Send Quotation" in your existing form
- The system automatically generates a magic link
- The link is valid for 7 days
- No additional UI components or manual steps needed

### 2. **Email Integration**
- Magic link is automatically added to the quotation email
- Customers get both the PDF attachment AND a secure link
- The link appears below the main CTA button in the email

### 3. **Customer Experience**
- Customer receives email with PDF + magic link
- Can click the magic link to view quote online
- No login required - just click and view
- Link expires after 7 days for security

## Technical Implementation

### Database
- `quotation_magic_links` table stores the generated links
- Links are tied to specific quotations and customer emails
- Automatic expiration and usage tracking

### API Endpoints
- `/api/quotations/create-magic-link` - Generates magic link
- `/api/quotations/validate-magic-link` - Validates customer access
- `/quote-access/[token]` - Customer-facing quote view page

### Integration Points
- **Modified**: `app/api/quotations/send-email/route.ts`
- **Added**: Magic link generation in email sending process
- **Added**: Magic link display in email templates (HTML + Text)

## Setup Required

### 1. Database Migration
Run the migration to create the required table:
```sql
-- Run the migration file:
-- database/migrations/20250111_create_quotation_magic_links.sql
```

### 2. Environment Variable
Add to your `.env.local`:
```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Usage

### For Admins (You)
1. **Create quotation** as usual
2. **Click "Send Quotation"** as usual
3. **Magic link is automatically generated** and included in the email
4. **No additional steps needed**

### For Customers
1. **Receive email** with PDF + magic link
2. **Click magic link** to view quote online
3. **View full quote details** without logging in
4. **Link expires** after 7 days

## Benefits

✅ **Seamless Integration** - Works with your existing workflow
✅ **No Extra UI** - No additional components or buttons needed
✅ **Automatic** - Magic links generated automatically when sending
✅ **Secure** - Time-limited, single-use links
✅ **Customer Friendly** - No login required to view quotes
✅ **Professional** - Enhances customer experience

## Security Features

- **Time-limited**: Links expire after 7 days
- **Single-use**: Each link can only be used once
- **Email-bound**: Links are tied to specific customer emails
- **Secure tokens**: Uses cryptographically secure UUIDs
- **No authentication bypass**: Only for viewing, not editing

## Troubleshooting

### Magic Link Not Generated
- Check browser console for errors
- Verify database migration was run
- Check environment variables

### Customer Can't Access Link
- Verify link hasn't expired (7 days)
- Check if link was already used
- Ensure customer email matches quotation

## Future Enhancements

- Configurable expiration times
- Multiple link generation
- Link usage analytics
- Custom expiration notifications
