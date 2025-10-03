# 🚀 Installation Guide

## Prerequisites

Before installing the Vehicle Inspection System, ensure you have the following:

- **Node.js**: Version 18.17+ or 20.0+
- **Package Manager**: npm, yarn, or pnpm
- **Git**: For version control
- **Supabase Account**: For database and authentication
- **Vercel Account**: For deployment (optional)

## Quick Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/vehicle-inspection.git
cd vehicle-inspection
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Using yarn
yarn install

# Using pnpm
pnpm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Fill in your environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email Configuration (Optional)
RESEND_API_KEY=your-resend-api-key

# Redis Configuration (Optional)
REDIS_URL=your-redis-url
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# Other Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup

1. **Create a new Supabase project**
2. **Run the database migrations**:
   ```bash
   npm run migrate
   ```
3. **Seed the database** (optional):
   ```bash
   npm run seed
   ```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Detailed Setup

### Supabase Configuration

1. **Create a new project** in your Supabase dashboard
2. **Get your project URL and anon key** from Settings > API
3. **Enable Row Level Security** for all tables
4. **Set up authentication** providers in Authentication > Providers
5. **Configure email templates** in Authentication > Email Templates

### Database Schema

The system uses the following main tables:

- `users` - User accounts and authentication
- `vehicles` - Vehicle information and management
- `bookings` - Booking records and scheduling
- `quotations` - Quotation management
- `inspections` - Inspection records and templates
- `drivers` - Driver information and assignments
- `customers` - Customer data and relationships

### Email Configuration

For email functionality, configure one of these providers:

#### Resend (Recommended)
1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to `.env.local`:
   ```env
   RESEND_API_KEY=your-resend-api-key
   ```

#### Other Providers
- SendGrid
- Mailgun
- AWS SES

### Redis Configuration (Optional)

For caching and performance optimization:

#### Upstash (Recommended)
1. Sign up at [upstash.com](https://upstash.com)
2. Create a Redis database
3. Add to `.env.local`:
   ```env
   UPSTASH_REDIS_REST_URL=your-upstash-url
   UPSTASH_REDIS_REST_TOKEN=your-upstash-token
   ```

#### Local Redis
```bash
# Install Redis
brew install redis  # macOS
sudo apt install redis-server  # Ubuntu

# Start Redis
redis-server

# Add to .env.local
REDIS_URL=redis://localhost:6379
```

## Verification

After installation, verify everything is working:

1. **Check the dashboard** loads without errors
2. **Test user registration** and login
3. **Create a test vehicle** in the vehicles section
4. **Test quotation creation** in the quotations section
5. **Verify email sending** (if configured)

## Troubleshooting

### Common Issues

#### Database Connection Errors
- Verify your Supabase URL and keys
- Check if RLS policies are properly configured
- Ensure the database is accessible

#### Email Not Sending
- Verify your email provider API key
- Check email provider quotas and limits
- Review email templates in Supabase

#### Build Errors
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version compatibility

#### Redis Connection Issues
- Verify Redis URL format
- Check Redis server status
- Review Redis configuration

### Getting Help

- Check the [Troubleshooting Guide](../development/troubleshooting-guide.md)
- Review the [API Documentation](../api/api.md)
- Check the [Architecture Documentation](../architecture/system-architecture.md)

## Next Steps

After successful installation:

1. **Read the [Quick Start Guide](quick-start.md)**
2. **Explore the [Features Documentation](../features/)**
3. **Set up [Integrations](../integrations/)**
4. **Configure [Deployment](../deployment/)**

---

*Installation Guide - Last Updated: January 30, 2025*
