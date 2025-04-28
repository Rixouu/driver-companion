# Vehicle Fleet Management System

A comprehensive web application for managing vehicle fleets, maintenance schedules, inspections, and reporting. Built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Core Features

### Dashboard

- Real-time overview of fleet statistics and KPIs
- Quick access to vehicles, maintenance tasks, and inspections
- Recent maintenance and inspection activities
- Scheduled maintenance and inspection tracking
- Mobile-responsive layout with card-based UI

### Vehicle Management

- Complete vehicle registration and tracking
- Status monitoring (active, maintenance, inactive)
- Vehicle details and history
- Image upload and management
- VIN and license plate tracking
- Mileage tracking and fuel consumption logs

### Maintenance System

- Schedule and track maintenance tasks
- Priority-based task management (high, medium, low)
- Cost and duration tracking
- Status updates (scheduled, in progress, completed)
- Maintenance history with detailed records
- Mobile-friendly card view for maintenance tasks

### Inspection Module

- Digital inspection checklists
- Schedule inspections (routine, maintenance, safety)
- Real-time status updates
- Photo documentation for inspection items
- Inspection history tracking
- Mobile-friendly inspection forms
- Multi-step inspection workflows
- Pass/fail criteria with automated notifications
- Digital signature capture

### Reporting System

- Comprehensive reporting dashboard
- Fleet overview metrics
- Maintenance metrics and cost analysis
- Inspection metrics and status tracking
- Vehicle utilization and performance charts
- Fuel consumption trends
- Monthly mileage tracking
- Custom report generation
- Export options (CSV, PDF)
- Scheduled report delivery

## 🛠 Tech Stack

### Frontend

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI / Radix UI
- React Hook Form + Zod validation
- Recharts for data visualization
- Next-intl for internationalization (English/Japanese)
- React Query for client-side data fetching

### Backend & Services

- Supabase (PostgreSQL Database)
- Supabase Auth
- Next.js Server Components and Server Actions
- Supabase Storage for image management
- Edge functions for optimized API routes

## 📱 Mobile Responsiveness

- Mobile-first approach with adaptive layouts
- Responsive card-based UI for mobile devices
- Touch-friendly interfaces
- Bottom navigation for mobile
- Optimized forms and data entry
- Progressive Web App (PWA) capabilities

## 🔐 Authentication & Authorization

- Supabase Auth integration
- Protected routes
- Role-based access control
- Secure session management
- Two-factor authentication
- SSO integration options

## 📊 Data Management

- Real-time data updates
- Efficient data fetching with Server Components
- Server Actions for form submissions
- Optimistic updates for better UX
- Proper error handling and validation
- Offline data capability with synchronization

## 🌐 Internationalization

- Multi-language support (English and Japanese)
- Language switcher
- Localized date and currency formatting
- Translated UI elements and content
- Right-to-left (RTL) support

## 🎨 UI/UX Features

- Dark/Light mode support
- Consistent design language
- Interactive feedback
- Loading states
- Toast notifications
- Form validation
- Responsive tables and card views
- Mobile navigation
- Accessibility compliance (WCAG 2.1)

## 📁 Project Structure

```
├── app/
│   ├── (auth)/           # Authentication routes
│   ├── (dashboard)/      # Main application routes
│   │   ├── dashboard/    # Dashboard page
│   │   ├── vehicles/     # Vehicle management
│   │   ├── maintenance/  # Maintenance management
│   │   ├── inspections/  # Inspection management
│   │   └── settings/     # User settings
│   ├── api/              # API routes
│   └── reporting/        # Reporting dashboard
├── components/
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── fuel/             # Fuel tracking components
│   ├── inspections/      # Inspection components
│   ├── layout/           # Layout components
│   ├── maintenance/      # Maintenance components
│   ├── mileage/          # Mileage tracking components
│   ├── reporting/        # Reporting components
│   ├── shared/           # Shared components
│   ├── ui/               # UI components (Shadcn)
│   └── vehicles/         # Vehicle components
├── lib/
│   ├── auth/             # Authentication utilities
│   ├── db/               # Database utilities
│   ├── i18n/             # Internationalization
│   ├── services/         # Service functions
│   ├── supabase/         # Supabase client
│   ├── utils/            # Utility functions
│   └── validations/      # Form validations
├── hooks/                # Custom React hooks
├── public/               # Static assets
├── styles/               # Global styles
└── types/                # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17+ or 20.0+
- npm or yarn or pnpm
- Supabase account

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/vehicle-inspection.git
   cd vehicle-inspection
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Set up environment variables
   Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Author

- **Jonathan** - *Initial work* - [Rixouu](https://github.com/Rixouu)

## Vehicle Inspection Features

The system now includes an enhanced vehicle inspection module with the following features:

1. Multi-step inspection workflows with conditional logic
2. Photo evidence capture and annotation
3. Digital signature collection for completed inspections
4. PDF report generation for inspection records
5. Automated notifications for failed inspection items
6. Historical inspection data tracking and analysis

### Setting Up Digital Inspections

1. Configure inspection templates in the admin panel
2. Assign inspections to vehicles or maintenance schedules
3. Complete inspections via mobile devices with offline capability
4. Review inspection results and take corrective actions
5. Generate and share inspection reports with stakeholders

## Bookings Integration

The system now supports syncing bookings from the WordPress API to a local Supabase database. This provides the following benefits:

1. Faster loading and reduced dependency on the WordPress API
2. Improved reliability when the WordPress site is slow or down
3. Local analytics and reporting capabilities
4. Backup of booking data

### Setting Up Booking Sync

1. Run the migration script to create the required tables:

```bash
# Make sure Supabase credentials are set
export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Run migrations
node scripts/run-migrations.js
```

2. Use the "Sync Bookings" button on the Bookings page to pull data from WordPress to Supabase.

### How It Works

- The app will first attempt to fetch bookings from Supabase
- If no bookings are found in Supabase, it falls back to the WordPress API
- The "Sync Bookings" button manually triggers a full sync from WordPress to Supabase

### Troubleshooting

If you encounter issues with the booking sync:

1. Make sure your WordPress API credentials are still valid
2. Check Supabase connection and permissions
3. Try a manual sync to see detailed error messages

## WordPress Bookings Integration

To properly fetch and display WordPress bookings instead of mock data, you need to set up the WordPress API connection correctly.

### Configuration Steps

1. Run the setup script to create a template `.env.local` file:

```bash
npm run setup-env
```

2. Edit the `.env.local` file with your WordPress API details:

```
NEXT_PUBLIC_WORDPRESS_API_URL=https://your-wordpress-site.com
NEXT_PUBLIC_WORDPRESS_API_KEY=your-actual-api-key
NEXT_PUBLIC_WORDPRESS_API_CUSTOM_PATH=wp-json/driver/v1/bookings
```

3. Run the WordPress API test tool to auto-detect the correct API path:

```bash
npm run test-wp-api
```

4. Restart your development server:

```bash
npm run dev
```

5. Go to the Bookings page and click the "Sync" button to sync WordPress bookings with your local database.

### Troubleshooting 404 Errors

If you're seeing "Failed to fetch bookings: 404" errors, follow these steps:

1. Verify the correct URL with the testing tool:

```bash
npm run test-wp-api
```

2. Ensure you're using the correct path format in `.env.local`. The most common format is:

```
NEXT_PUBLIC_WORDPRESS_API_CUSTOM_PATH=wp-json/driver/v1/bookings
```

3. Check that your WordPress site has the Driver Companion plugin properly installed and activated.

4. Verify that your WordPress API is publicly accessible and doesn't have any security measures blocking external requests.

5. If you've identified the correct endpoint, manually edit your `.env.local` file with the working path.

If you still see mock data, try the following additional troubleshooting steps:

- Check your WordPress site is accessible and the API endpoint is correct
- Ensure your API key has proper permissions
- Check browser console for API errors
- Try manually syncing via the "Sync" button on the Bookings page