import React from 'react'
import type { Meta, StoryObj } from '@storybook/react';
import { QuotationDetails } from '@/app/(dashboard)/quotations/[id]/quotation-details';
import { mockQuotationData } from '../.storybook/mocks';

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
    quotation: mockQuotationData,
    isOrganizationMember: true,
  },
};

export const AsNonMember: Story = {
  args: {
    quotation: mockQuotationData,
    isOrganizationMember: false,
  },
};

export const DraftQuotation: Story = {
  args: {
    quotation: {
      ...mockQuotationData,
      status: 'draft',
    },
    isOrganizationMember: true,
  },
};

export const SentQuotation: Story = {
  args: {
    quotation: {
      ...mockQuotationData,
      status: 'sent',
    },
    isOrganizationMember: true,
  },
};

export const ApprovedQuotation: Story = {
  args: {
    quotation: {
      ...mockQuotationData,
      status: 'approved',
    },
    isOrganizationMember: true,
  },
};

export const PaidQuotation: Story = {
  args: {
    quotation: {
      ...mockQuotationData,
      status: 'paid',
    },
    isOrganizationMember: true,
  },
};
