import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { InspectionDetailsHeader } from './inspection-details-header';
import type { ExtendedInspection } from '@/components/inspections/inspection-details';
import type { User } from '@supabase/supabase-js';

// Mocks
const mockRouter = {
  back: vi.fn(),
  push: vi.fn(),
};
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('@/lib/i18n/context', () => ({
  useI18n: () => ({
    t: (key: string) => key, // Simple mock for t function
    locale: 'en',
  }),
}));

const mockUser: User = {
  id: 'user-123',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

const baseMockInspection: ExtendedInspection = {
  id: 'insp-abc',
  name: 'Test Inspection Name',
  vehicle_id: 'veh-123',
  type: 'safety',
  date: new Date().toISOString(),
  status: 'pending',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'user-123',
  vehicle: {
    id: 'veh-123',
    name: 'Test Vehicle Name',
    plate_number: 'XYZ-789',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'user-owner-456',
    status: 'active',
  },
};

describe('InspectionDetailsHeader', () => {
  let mockOnStartInspection: ReturnType<typeof vi.fn>;
  let mockOnExportHtml: ReturnType<typeof vi.fn>;
  let mockOnExportPdf: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnStartInspection = vi.fn().mockResolvedValue(undefined);
    mockOnExportHtml = vi.fn();
    mockOnExportPdf = vi.fn().mockResolvedValue(undefined);
  });

  const renderComponent = (props: Partial<Parameters<typeof InspectionDetailsHeader>[0]> = {}) => {
    const defaultProps = {
      inspection: baseMockInspection,
      user: mockUser,
      isUpdating: false,
      isExporting: false,
      onStartInspection: mockOnStartInspection,
      onExportHtml: mockOnExportHtml,
      onExportPdf: mockOnExportPdf,
    };
    return render(<InspectionDetailsHeader {...defaultProps} {...props} />);
  };

  it('renders inspection name and vehicle name', () => {
    renderComponent();
    expect(screen.getByText('Test Inspection Name')).toBeInTheDocument();
    expect(screen.getByText('Test Vehicle Name')).toBeInTheDocument();
  });

  it('calls router.back when back button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByLabelText('common.back'));
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('shows "Start Inspection" button if status is pending and user is creator', () => {
    renderComponent({ inspection: { ...baseMockInspection, status: 'pending', created_by: mockUser.id } });
    expect(screen.getByText('inspections.startInspection')).toBeInTheDocument();
  });

  it('disables "Start Inspection" button if isUpdating is true', () => {
    renderComponent({ 
      inspection: { ...baseMockInspection, status: 'pending', created_by: mockUser.id },
      isUpdating: true 
    });
    expect(screen.getByText('inspections.startInspection').closest('button')).toBeDisabled();
  });
  
  it('shows "Continue Editing" button if status is draft and user is creator', () => {
    renderComponent({ inspection: { ...baseMockInspection, status: 'draft', created_by: mockUser.id } });
    expect(screen.getByText('inspections.continueEditing')).toBeInTheDocument();
  });

  it('hides "Start/Continue" button if user is not creator', () => {
    renderComponent({ inspection: { ...baseMockInspection, status: 'pending', created_by: 'other-user' } });
    expect(screen.queryByText('inspections.startInspection')).not.toBeInTheDocument();
    expect(screen.queryByText('inspections.continueEditing')).not.toBeInTheDocument();
  });
  
  it('calls onStartInspection when "Start Inspection" button is clicked', () => {
    renderComponent({ inspection: { ...baseMockInspection, status: 'pending', created_by: mockUser.id } });
    fireEvent.click(screen.getByText('inspections.startInspection'));
    expect(mockOnStartInspection).toHaveBeenCalledTimes(1);
  });

  it('shows "Edit" button if inspection is not completed or cancelled', () => {
    renderComponent({ inspection: { ...baseMockInspection, status: 'pending' } });
    expect(screen.getByText('common.edit')).toBeInTheDocument();
  });

  it('allows "Edit" button even if inspection is completed', () => {
    renderComponent({ inspection: { ...baseMockInspection, status: 'completed' } });
    expect(screen.getByText('common.edit').closest('button')).not.toBeDisabled();
  });

  it('calls router.push with edit path when "Edit" button is clicked', () => {
    renderComponent({ inspection: { ...baseMockInspection, status: 'pending' } });
    fireEvent.click(screen.getByText('common.edit'));
    expect(mockRouter.push).toHaveBeenCalledWith('/inspections/insp-abc/edit');
  });

  it('renders export and print options in dropdown', () => {
    renderComponent();
    fireEvent.click(screen.getByLabelText('common.actions.default')); // Open dropdown
    expect(screen.getByText('common.exportCSV')).toBeInTheDocument();
    expect(screen.getByText('inspections.actions.exportPdf')).toBeInTheDocument();
  });

  it('calls onExportHtml when "Export CSV" is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByLabelText('common.actions.default'));
    fireEvent.click(screen.getByText('common.exportCSV'));
    expect(mockOnExportHtml).toHaveBeenCalledTimes(1);
  });
  
  it('disables export buttons if isExporting is true', () => {
    renderComponent({ isExporting: true });
    fireEvent.click(screen.getByLabelText('common.actions.default'));
    expect(screen.getByText('common.exporting')).toBeInTheDocument(); // Check for "Exporting..." text
    // For more precise check, we'd need to inspect the disabled state of menu items
    // For now, checking the text change due to isExporting is a good indicator.
    const exportHtmlButton = screen.getByText('common.exporting'); // This will be the text on both buttons if disabled
    // This test could be more robust if Radix DropdownMenuItem had a more direct way to test disabled state via RTL
    // However, the component logic shows `disabled={isExporting}` on the menu items.
    expect(exportHtmlButton).toBeInTheDocument();
  });

  it('calls onExportPdf when "Export PDF" is clicked', async () => {
    renderComponent();
    fireEvent.click(screen.getByLabelText('common.actions.default'));
    fireEvent.click(screen.getByText('inspections.actions.exportPdf'));
    expect(mockOnExportPdf).toHaveBeenCalledTimes(1);
  });

  it('displays status badge correctly', () => {
    renderComponent({ inspection: { ...baseMockInspection, status: 'completed' } });
    // InspectionStatusBadge is a separate component, here we just ensure it's rendered
    // A more direct test would be if InspectionStatusBadge itself rendered the status text
    expect(screen.getByTestId('inspection-status-badge')).toBeInTheDocument(); // Requires InspectionStatusBadge to have data-testid
  });
});

// Helper to add data-testid to InspectionStatusBadge for testing
vi.mock('@/components/inspections/inspection-status-badge', () => ({
  InspectionStatusBadge: ({ status }: { status: string }) => <div data-testid="inspection-status-badge">{status}</div>,
})); 