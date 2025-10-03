import type { Meta, StoryObj } from '@storybook/react';
import { StepBasedInspectionForm } from '@/components/inspections/step-based/step-based-inspection-form';
import { mockVehicleData, mockInspectionTemplates } from '../.storybook/mocks';

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
    vehicles: mockVehicleData,
    isResuming: false,
  },
};

export const WithPreSelectedVehicle: Story = {
  args: {
    vehicles: mockVehicleData,
    vehicleId: mockVehicleData[0]?.id,
    isResuming: false,
  },
};

export const EditingExistingInspection: Story = {
  args: {
    vehicles: mockVehicleData,
    inspectionId: 'test-inspection-id',
    vehicleId: mockVehicleData[0]?.id,
    isResuming: false,
  },
};

export const ResumingInspection: Story = {
  args: {
    vehicles: mockVehicleData,
    inspectionId: 'test-inspection-id',
    vehicleId: mockVehicleData[0]?.id,
    isResuming: true,
  },
};

export const WithBooking: Story = {
  args: {
    vehicles: mockVehicleData,
    bookingId: 'test-booking-id',
    vehicleId: mockVehicleData[0]?.id,
    isResuming: false,
  },
};
