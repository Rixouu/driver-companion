import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DataTableToolbar } from './data-table-toolbar';
import type { Table, Column } from '@tanstack/react-table';

// Minimal mock for the Table and Column type from @tanstack/react-table
const mockColumn = {
  getFilterValue: vi.fn(),
  setFilterValue: vi.fn(),
  getCanHide: vi.fn(() => true),
  getIsVisible: vi.fn(() => true),
  toggleVisibility: vi.fn(),
  id: 'mockColumnId',
};

const mockTable = {
  getColumn: vi.fn(() => mockColumn as unknown as Column<any, unknown>),
  getAllColumns: vi.fn(() => [mockColumn as unknown as Column<any, unknown>]),
} as unknown as Table<any>; // Use 'any' for TData for simplicity in mock

describe('DataTableToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset specific column/table mocks if their state changes between tests
    vi.mocked(mockTable.getColumn).mockClear().mockReturnValue(mockColumn as unknown as Column<any, unknown>);
    vi.mocked(mockTable.getAllColumns).mockClear().mockReturnValue([mockColumn as unknown as Column<any, unknown>]);
    vi.mocked(mockColumn.getFilterValue).mockClear();
    vi.mocked(mockColumn.setFilterValue).mockClear();
    vi.mocked(mockColumn.getCanHide).mockClear().mockReturnValue(true);
    vi.mocked(mockColumn.getIsVisible).mockClear().mockReturnValue(true);
    vi.mocked(mockColumn.toggleVisibility).mockClear();
  });

  it('should not render search input if searchKey is not provided', () => {
    render(<DataTableToolbar table={mockTable} />);
    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
  });

  it('should render search input if searchKey is provided and not server-paginated', () => {
    render(<DataTableToolbar table={mockTable} searchKey="name" searchPlaceholder="Search by name..." />);
    const input = screen.getByPlaceholderText('Search by name...');
    expect(input).toBeInTheDocument();
  });

  it('should display current filter value in search input', () => {
    vi.mocked(mockColumn.getFilterValue).mockReturnValue('current search');
    render(<DataTableToolbar table={mockTable} searchKey="name" />);
    expect(screen.getByRole('textbox')).toHaveValue('current search');
  });

  it('should call setFilterValue on search input change', () => {
    render(<DataTableToolbar table={mockTable} searchKey="name" />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new search' } });
    expect(mockColumn.setFilterValue).toHaveBeenCalledWith('new search');
  });

  it('should display disabled search message if server-paginated and searchKey is provided', () => {
    render(<DataTableToolbar table={mockTable} searchKey="name" isServerPaginated={true} />);
    expect(screen.getByText('Client-side search disabled with server pagination.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('should not render column toggle if showColumnToggle is false', () => {
    render(<DataTableToolbar table={mockTable} showColumnToggle={false} />);
    expect(screen.queryByText('Columns')).not.toBeInTheDocument();
  });

  it('should render column toggle button if showColumnToggle is true', () => {
    render(<DataTableToolbar table={mockTable} showColumnToggle={true} />);
    expect(screen.getByText('Columns').closest('button')).toBeInTheDocument();
  });

  it('should render column toggle dropdown with hideable columns', () => {
    const mockColumn1 = { id: 'col1', getCanHide: () => true, getIsVisible: () => true, toggleVisibility: vi.fn() };
    const mockColumn2 = { id: 'col2', getCanHide: () => false, getIsVisible: () => true, toggleVisibility: vi.fn() }; // Cannot hide
    const mockColumn3 = { id: 'col3', getCanHide: () => true, getIsVisible: () => false, toggleVisibility: vi.fn() };
    vi.mocked(mockTable.getAllColumns).mockReturnValue([
      mockColumn1 as any,
      mockColumn2 as any,
      mockColumn3 as any,
    ]);

    render(<DataTableToolbar table={mockTable} showColumnToggle={true} />);
    fireEvent.click(screen.getByText('Columns').closest('button')!); // Open dropdown

    expect(screen.getByText('col1')).toBeInTheDocument();
    expect(screen.queryByText('col2')).not.toBeInTheDocument(); // col2 cannot be hidden
    expect(screen.getByText('col3')).toBeInTheDocument();

    // Check checked state (example for col1)
    // Note: DropdownMenuCheckboxItem might not directly map to role 'checkbox' in simple tests
    // We might need to query by text and check parent or a data-testid if available
    const col1Checkbox = screen.getByText('col1').closest('[role="menuitemcheckbox"]');
    expect(col1Checkbox).toHaveAttribute('aria-checked', 'true');
    
    const col3Checkbox = screen.getByText('col3').closest('[role="menuitemcheckbox"]');
    expect(col3Checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('should call toggleVisibility when a column checkbox is changed', () => {
    const specificMockColumn = {
      id: 'specificCol',
      getCanHide: () => true,
      getIsVisible: () => true,
      toggleVisibility: vi.fn(),
    };
    vi.mocked(mockTable.getAllColumns).mockReturnValue([specificMockColumn as any]);

    render(<DataTableToolbar table={mockTable} showColumnToggle={true} />);
    fireEvent.click(screen.getByText('Columns').closest('button')!); // Open dropdown
    
    // Find the checkbox item. Radix might render this in a specific way.
    // Clicking the element containing the text should trigger onCheckedChange.
    const checkboxItem = screen.getByText('specificCol');
    fireEvent.click(checkboxItem);

    expect(specificMockColumn.toggleVisibility).toHaveBeenCalledTimes(1);
    expect(specificMockColumn.toggleVisibility).toHaveBeenCalledWith(false); // Assuming it was true, toggles to false
  });
}); 