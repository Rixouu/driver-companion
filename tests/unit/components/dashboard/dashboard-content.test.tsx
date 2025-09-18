import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../utils/test-utils'
import { DashboardContentOptimized } from '@/components/dashboard/dashboard-content-optimized'

// Mock the lazy components
vi.mock('@/components/dashboard/lazy-components', () => ({
  LazyFinancialDashboard: ({ financialData, isLoadingFinancial }: any) => (
    <div data-testid="financial-dashboard">
      {isLoadingFinancial ? 'Loading Financial Data...' : 'Financial Dashboard Loaded'}
    </div>
  ),
  LazyActivityFeed: ({ recentInspections, upcomingBookings }: any) => (
    <div data-testid="activity-feed">
      Activity Feed - Recent: {recentInspections.length}, Upcoming: {upcomingBookings.length}
    </div>
  ),
  LazyUpcomingBookings: ({ upcomingBookings, isLoadingBookings }: any) => (
    <div data-testid="upcoming-bookings">
      {isLoadingBookings ? 'Loading Bookings...' : `Upcoming Bookings: ${upcomingBookings.length}`}
    </div>
  ),
  LazyRecentQuotations: ({ recentQuotations, isLoadingRecentQuotations }: any) => (
    <div data-testid="recent-quotations">
      {isLoadingRecentQuotations ? 'Loading Quotations...' : `Recent Quotations: ${recentQuotations.length}`}
    </div>
  ),
}))

// Mock the actions
vi.mock('@/app/actions/bookings', () => ({
  getBookings: vi.fn().mockResolvedValue({
    bookings: [],
    total: 0,
    page: 1,
    limit: 10,
  }),
}))

// Mock fetch
global.fetch = vi.fn()

const mockProps = {
  stats: {
    totalVehicles: 10,
    activeVehicles: 8,
    maintenanceTasks: 5,
    inspections: 12,
    vehiclesInMaintenance: 2,
    scheduledInspections: 3,
    inProgressInspections: 1,
    completedInspections: 8,
    pendingTasks: 2,
    inProgressTasks: 1,
    completedTasks: 2,
  },
  recentInspections: [
    {
      id: '1',
      vehicle_id: 'v1',
      type: 'routine',
      status: 'completed',
      date: '2024-01-15',
      created_at: '2024-01-15T10:00:00Z',
    },
  ],
  upcomingInspections: [
    {
      id: '2',
      vehicle_id: 'v2',
      type: 'safety',
      status: 'scheduled',
      date: '2024-01-20',
      created_at: '2024-01-15T10:00:00Z',
    },
  ],
  recentMaintenance: [
    {
      id: '1',
      vehicle_id: 'v1',
      title: 'Oil Change',
      status: 'completed',
      due_date: '2024-01-15',
      created_at: '2024-01-15T10:00:00Z',
    },
  ],
  upcomingMaintenance: [
    {
      id: '2',
      vehicle_id: 'v2',
      title: 'Brake Check',
      status: 'scheduled',
      due_date: '2024-01-25',
      created_at: '2024-01-15T10:00:00Z',
    },
  ],
  inProgressItems: {
    inspections: [],
    maintenance: [],
  },
  vehicles: [
    {
      id: 'v1',
      name: 'Test Vehicle 1',
      license_plate: 'ABC-123',
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
}

describe('DashboardContentOptimized', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful API responses
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        quotations: [],
        metrics: {
          totalQuotations: 0,
          totalRevenue: 0,
          avgQuoteValue: 0,
          approvedQuotes: 0,
          pendingQuotes: 0,
          draftQuotes: 0,
          rejectedQuotes: 0,
          convertedQuotes: 0,
          approvalRate: 0,
          conversionRate: 0,
          activeBookings: 0,
        },
        dailyRevenue: [],
        statusDistribution: [],
        monthlyRevenue: [],
      }),
    })
  })

  it('renders dashboard title and description', async () => {
    render(<DashboardContentOptimized {...mockProps} />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText(/description/i)).toBeInTheDocument()
  })

  it('renders quick actions section', async () => {
    render(<DashboardContentOptimized {...mockProps} />)
    
    expect(screen.getByText(/quick actions/i)).toBeInTheDocument()
    expect(screen.getByText(/create booking/i)).toBeInTheDocument()
    expect(screen.getByText(/schedule maintenance/i)).toBeInTheDocument()
    expect(screen.getByText(/schedule inspection/i)).toBeInTheDocument()
    expect(screen.getByText(/create quotation/i)).toBeInTheDocument()
  })

  it('renders lazy-loaded components', async () => {
    render(<DashboardContentOptimized {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('financial-dashboard')).toBeInTheDocument()
      expect(screen.getByTestId('activity-feed')).toBeInTheDocument()
      expect(screen.getByTestId('upcoming-bookings')).toBeInTheDocument()
      expect(screen.getByTestId('recent-quotations')).toBeInTheDocument()
    })
  })

  it('displays loading states for lazy components', async () => {
    render(<DashboardContentOptimized {...mockProps} />)
    
    // Initially should show loading states
    expect(screen.getByText('Loading Financial Data...')).toBeInTheDocument()
    expect(screen.getByText('Loading Bookings...')).toBeInTheDocument()
    expect(screen.getByText('Loading Quotations...')).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    // Mock API error
    ;(global.fetch as any).mockRejectedValue(new Error('API Error'))
    
    render(<DashboardContentOptimized {...mockProps} />)
    
    // Should still render the component without crashing
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders expiring quotations alert when there are expiring quotations', async () => {
    // Mock expiring quotations
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        quotations: [
          {
            id: '1',
            title: 'Test Quotation',
            customer_name: 'Test Customer',
            expiry_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            total_amount: 1000,
            currency: 'JPY',
          },
        ],
      }),
    })
    
    render(<DashboardContentOptimized {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText(/expiring quotations/i)).toBeInTheDocument()
    })
  })

  it('does not render expiring quotations alert when there are no expiring quotations', async () => {
    // Mock no expiring quotations
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        quotations: [],
      }),
    })
    
    render(<DashboardContentOptimized {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.queryByText(/expiring quotations/i)).not.toBeInTheDocument()
    })
  })

  it('renders quick action buttons with correct links', async () => {
    render(<DashboardContentOptimized {...mockProps} />)
    
    const createBookingLink = screen.getByRole('link', { name: /create booking/i })
    const scheduleMaintenanceLink = screen.getByRole('link', { name: /schedule maintenance/i })
    const scheduleInspectionLink = screen.getByRole('link', { name: /schedule inspection/i })
    const createQuotationLink = screen.getByRole('link', { name: /create quotation/i })
    
    expect(createBookingLink).toHaveAttribute('href', '/bookings/new')
    expect(scheduleMaintenanceLink).toHaveAttribute('href', '/maintenance/schedule')
    expect(scheduleInspectionLink).toHaveAttribute('href', '/inspections/create')
    expect(createQuotationLink).toHaveAttribute('href', '/quotations/create')
  })

  it('applies correct styling to quick action buttons', async () => {
    render(<DashboardContentOptimized {...mockProps} />)
    
    const buttons = screen.getAllByRole('button')
    const quickActionButtons = buttons.filter(button => 
      button.textContent?.includes('Create Booking') ||
      button.textContent?.includes('Schedule Maintenance') ||
      button.textContent?.includes('Schedule Inspection') ||
      button.textContent?.includes('Create Quotation')
    )
    
    quickActionButtons.forEach(button => {
      expect(button).toHaveClass('w-full', 'h-24', 'flex', 'flex-col', 'items-center', 'justify-center')
    })
  })
})
