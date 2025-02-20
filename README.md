# Vehicle Fleet Management System

A comprehensive web application for managing vehicle fleets, maintenance schedules, and inspections. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Core Features

### Dashboard

- Real-time overview of fleet statistics
- Quick access to vehicles, maintenance, and inspections
- Recent maintenance and inspection activities
- Scheduled maintenance and inspection tracking
- Mobile-responsive layout

### Vehicle Management

- Complete vehicle registration and tracking
- Status monitoring (active, maintenance, inactive)
- Vehicle details and history
- Image upload and management
- VIN and license plate tracking

### Maintenance System

- Schedule and track maintenance tasks
- Priority-based task management (high, medium, low)
- Cost and duration tracking
- Status updates (pending, in_progress, completed, overdue)
- Maintenance history

### Inspection Module

- Digital inspection checklists
- Schedule inspections (routine, maintenance, safety)
- Real-time status updates
- Inspection history tracking
- Mobile-friendly inspection forms

## 🛠 Tech Stack

### Frontend

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI / Radix UI
- React Hook Form + Zod validation

### Backend & Services

- Supabase (Database & Auth)
- Next.js Server Components
- Supabase Auth (Google OAuth)
- Supabase Storage for images

## 📱 Mobile Responsiveness

- Mobile-first approach
- Responsive navigation with slide-out menu
- Touch-friendly interfaces
- Adaptive layouts for all screen sizes
- Optimized forms and tables

## 🔐 Authentication & Authorization

- Google OAuth integration
- Protected routes
- Role-based access control
- Secure session management

## 📊 Data Management

- Real-time data updates
- Efficient data fetching with Server Components
- Optimistic updates for better UX
- Proper error handling and validation

## 🎨 UI/UX Features

- Dark/Light mode support
- Consistent design language
- Interactive feedback
- Loading states
- Toast notifications
- Form validation
- Responsive tables
- Mobile navigation

## �� Project Structure

├── app/
│ ├── (auth)/
│ ├── (dashboard)/
│ ├── maintenance/
│ ├── vehicles/
│ ├── inspections/
│ └── settings/
├── components/
│ ├── layout/
│ ├── shared/
│ ├── vehicles/
│ ├── maintenance/
│ ├── inspections/
│ └── ui/
├── lib/
│ ├── services/
│ ├── utils/
│ ├── validations/
│ └── db/
└── types/

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies
3. Set up environment variables
4. Start the development server

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- NextAuth.js configuration
- Shadcn UI components

## Installation

1. Clone the repository
2. Install dependencies
3. Create a `.env` file with your configuration
4. Run the development server

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Shadcn UI for the component library
- Next.js team for the amazing framework
- Supabase team for the backend infrastructure
- Vercel for hosting and deployment

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👥 Authors

- **Jonathan** - *Initial work* - [Rixouu](https://github.com/Rixouu)