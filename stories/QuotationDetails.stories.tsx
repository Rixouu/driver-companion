import type { Meta, StoryObj } from '@storybook/react';
import { QuotationDetails } from '@/app/(dashboard)/quotations/[id]/quotation-details';
// Mock quotation data
const mockQuotation = {
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

const meta: Meta<typeof QuotationDetails> = {
  title: 'Quotations/QuotationDetails',
  component: QuotationDetails,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The main quotation details page component showing quotation information, workflow, and actions.',
      },
    },
  },
  argTypes: {
    isOrganizationMember: {
      control: 'boolean',
      description: 'Whether the user is an organization member with edit permissions',
    },
  },
};

export default meta;
type Story = StoryObj<typeof QuotationDetails>;

export const Default: Story = {
  args: {
    quotation: mockQuotation,
    isOrganizationMember: true,
  },
};

export const AsNonMember: Story = {
  args: {
    quotation: mockQuotation,
    isOrganizationMember: false,
  },
};

export const DraftQuotation: Story = {
  args: {
    quotation: {
      ...mockQuotation,
      status: 'draft',
    },
    isOrganizationMember: true,
  },
};

export const SentQuotation: Story = {
  args: {
    quotation: {
      ...mockQuotation,
      status: 'sent',
    },
    isOrganizationMember: true,
  },
};

export const ApprovedQuotation: Story = {
  args: {
    quotation: {
      ...mockQuotation,
      status: 'approved',
    },
    isOrganizationMember: true,
  },
};

export const PaidQuotation: Story = {
  args: {
    quotation: {
      ...mockQuotation,
      status: 'paid',
    },
    isOrganizationMember: true,
  },
};
