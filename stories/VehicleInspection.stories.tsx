import type { Meta, StoryObj } from '@storybook/react';
import { StepBasedInspectionForm } from '@/components/inspections/step-based/step-based-inspection-form';
import { mockApi } from '@/lib/mock-data';

// Convert mock data to the expected format
const mockVehicles = [
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

const meta: Meta<typeof StepBasedInspectionForm> = {
  title: 'Inspections/StepBasedInspectionForm',
  component: StepBasedInspectionForm,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The main step-based inspection form component for vehicle inspections.',
      },
    },
  },
  argTypes: {
    inspectionId: {
      control: 'text',
      description: 'ID of existing inspection for editing',
    },
    vehicleId: {
      control: 'text',
      description: 'Pre-selected vehicle ID',
    },
    bookingId: {
      control: 'text',
      description: 'Associated booking ID',
    },
    isResuming: {
      control: 'boolean',
      description: 'Whether this is resuming an existing inspection',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StepBasedInspectionForm>;

export const Default: Story = {
  args: {
    vehicles: mockVehicles,
    isResuming: false,
  },
};

export const WithPreSelectedVehicle: Story = {
  args: {
    vehicles: mockVehicles,
    vehicleId: mockVehicles[0]?.id,
    isResuming: false,
  },
};

export const EditingExistingInspection: Story = {
  args: {
    vehicles: mockVehicles,
    inspectionId: 'test-inspection-id',
    vehicleId: mockVehicles[0]?.id,
    isResuming: false,
  },
};

export const ResumingInspection: Story = {
  args: {
    vehicles: mockVehicles,
    inspectionId: 'test-inspection-id',
    vehicleId: mockVehicles[0]?.id,
    isResuming: true,
  },
};

export const WithBooking: Story = {
  args: {
    vehicles: mockVehicles,
    bookingId: 'test-booking-id',
    vehicleId: mockVehicles[0]?.id,
    isResuming: false,
  },
};
