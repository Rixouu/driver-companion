// Comprehensive mocks for Storybook

// Mock Supabase
export const mockSupabaseClient = {
  from: (table: string) => ({
    select: (columns = '*') => ({
      eq: (column: string, value: any) => ({
        single: () => Promise.resolve({ data: null, error: null }),
        order: (column: string, options?: any) => Promise.resolve({ data: [], error: null }),
      }),
      insert: (data: any) => Promise.resolve({ data: null, error: null }),
      update: (data: any) => ({
        eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
      }),
      delete: () => ({
        eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
      }),
    }),
  }),
  auth: {
    getUser: () => Promise.resolve({ 
      data: { 
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' }
        } 
      }, 
      error: null 
    }),
    getSession: () => Promise.resolve({ 
      data: { 
        session: {
          user: {
            id: 'mock-user-id',
            email: 'test@example.com',
            user_metadata: { full_name: 'Test User' }
          }
        }
      }, 
      error: null 
    }),
  },
};

// Mock Next.js router
export const mockRouter = {
  push: () => Promise.resolve(true),
  replace: () => Promise.resolve(true),
  prefetch: () => Promise.resolve(undefined),
  back: () => Promise.resolve(true),
  forward: () => Promise.resolve(true),
  refresh: () => Promise.resolve(true),
  pathname: '/',
  route: '/',
  asPath: '/',
  query: {},
  isReady: true,
  isPreview: false,
  isLocaleDomain: false,
  events: {
    on: () => {},
    off: () => {},
    emit: () => {},
  },
};

// Mock window APIs
export const setupWindowMocks = () => {
  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock navigator.mediaDevices
  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    value: {
      getUserMedia: () => Promise.resolve({
        getTracks: () => [{ stop: () => {} }],
      }),
    },
  });

  // Mock URL.createObjectURL
  global.URL.createObjectURL = () => 'mock-url';
  global.URL.revokeObjectURL = () => {};
};

// Mock data for stories
export const mockVehicleData = [
  {
    id: "1",
    name: "Toyota Alphard Z-Class",
    plate_number: "ABC-123",
    model: "Alphard Z-Class",
    year: "2023",
    brand: "Toyota",
    image_url: "https://staging.japandriver.com/wp-content/uploads/2024/04/preview-car-alphard-executive-300x200.jpg",
    vehicle_group_id: "group-1",
    vehicle_group: {
      id: "group-1",
      name: "Executive Vehicles",
      color: "#3b82f6"
    }
  },
  {
    id: "2", 
    name: "Toyota Hi-Ace",
    plate_number: "XYZ-789",
    model: "Hi-Ace",
    year: "2024",
    brand: "Toyota",
    image_url: null,
    vehicle_group_id: "group-2",
    vehicle_group: {
      id: "group-2",
      name: "Commercial Vehicles",
      color: "#10b981"
    }
  }
];

export const mockInspectionTemplates = [
  {
    id: "template-1",
    name: "Routine Inspection",
    description: "Standard vehicle inspection",
    sections: [
      {
        id: "section-1",
        title: "Exterior",
        items: [
          { id: "item-1", title: "Check lights", requires_photo: true, requires_notes: false },
          { id: "item-2", title: "Check tires", requires_photo: true, requires_notes: true }
        ]
      }
    ]
  }
];

export const mockQuotationData = {
  id: "1",
  quote_number: "Q-2024-001",
  customer_name: "John Doe",
  customer_email: "john@example.com",
  customer_phone: "+81-90-1234-5678",
  status: "draft",
  amount: 50000,
  total_amount: 55000,
  currency: "JPY",
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T10:30:00Z",
  expiry_date: "2024-02-15T10:30:00Z",
  quotation_items: [
    {
      id: "1",
      name: "Routine Inspection",
      description: "Standard vehicle inspection",
      quantity: 1,
      unit_price: 50000,
      total_price: 50000
    }
  ],
  customers: {
    name: "John Doe",
    email: "john@example.com",
    phone: "+81-90-1234-5678"
  },
  creator: {
    id: "user-1",
    full_name: "Admin User",
    email: "admin@example.com"
  }
};
