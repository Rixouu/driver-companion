import React from 'react'
import type { Meta, StoryObj } from '@storybook/react';
import { DataTable } from '@/components/data-table';

// Mock bookings data
const mockBookings = [
  {
    id: "1",
    customer_name: "John Doe",
    service_type: "Routine Inspection",
    status: "completed",
    created_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "2", 
    customer_name: "Jane Smith",
    service_type: "Pre-purchase Inspection",
    status: "in_progress",
    created_at: "2024-01-16T14:20:00Z"
  },
  {
    id: "3",
    customer_name: "Bob Johnson", 
    service_type: "Annual Inspection",
    status: "pending",
    created_at: "2024-01-17T09:15:00Z"
  }
];

const meta: Meta<typeof DataTable> = {
  title: 'Components/DataTable',
  component: DataTable,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The main data table component used throughout the application for displaying tabular data.',
      },
    },
  },
  argTypes: {
    data: {
      control: 'object',
      description: 'Array of data objects to display',
    },
    columns: {
      control: 'object',
      description: 'Column definitions for the table',
    },
    searchKey: {
      control: 'text',
      description: 'Key to search within the data',
    },
    onRowClick: {
      action: 'rowClicked',
      description: 'Callback when a row is clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DataTable>;

// Mock columns for bookings
const bookingColumns = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'customer_name',
    header: 'Customer',
  },
  {
    accessorKey: 'service_type',
    header: 'Service',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
  },
];

export const Default: Story = {
  args: {
    data: mockBookings.slice(0, 10),
    columns: bookingColumns,
    searchKey: 'customer_name',
  },
};

export const WithSearch: Story = {
  args: {
    data: mockBookings,
    columns: bookingColumns,
    searchKey: 'customer_name',
  },
};

export const EmptyState: Story = {
  args: {
    data: [],
    columns: bookingColumns,
    searchKey: 'customer_name',
  },
};

export const LargeDataset: Story = {
  args: {
    data: mockBookings,
    columns: bookingColumns,
    searchKey: 'customer_name',
  },
};
