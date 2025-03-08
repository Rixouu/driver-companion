# Vehicle Fleet Management System

A comprehensive web application for managing vehicle fleets, maintenance schedules, inspections, and reporting. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

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

## 🛠 Tech Stack

### Frontend

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI / Radix UI
- React Hook Form + Zod validation
- Recharts for data visualization
- Next-intl for internationalization (English/Japanese)

### Backend & Services

- Supabase (PostgreSQL Database)
- Supabase Auth
- Next.js Server Components and Server Actions
- Supabase Storage for image management

## 📱 Mobile Responsiveness

- Mobile-first approach with adaptive layouts
- Responsive card-based UI for mobile devices
- Touch-friendly interfaces
- Bottom navigation for mobile
- Optimized forms and data entry

## 🔐 Authentication & Authorization

- Supabase Auth integration
- Protected routes
- Role-based access control
- Secure session management

## 📊 Data Management

- Real-time data updates
- Efficient data fetching with Server Components
- Server Actions for form submissions
- Optimistic updates for better UX
- Proper error handling and validation

## 🌐 Internationalization

- Multi-language support (English and Japanese)
- Language switcher
- Localized date and currency formatting
- Translated UI elements and content

## 🎨 UI/UX Features

- Dark/Light mode support
- Consistent design language
- Interactive feedback
- Loading states
- Toast notifications
- Form validation
- Responsive tables and card views
- Mobile navigation

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

- Node.js 18+
- npm or yarn
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
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Author

- **Jonathan** - *Initial work* - [Rixouu](https://github.com/Rixouu)