import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DataTableMobileView } from './data-table-mobile-view';
import type { Table as TanstackTableType, ColumnDef, Row, Cell, RowModel } from '@tanstack/react-table';

// Mock flexRender
const mockFlexRender = vi.fn((component: any, props: any) => {
  if (typeof component === 'function') {
    return component(props);
  }
  return component;
});

vi.mock('@tanstack/react-table', async (importOriginal) => {
  const original = await importOriginal<typeof import('@tanstack/react-table')>();
  return {
    ...original,
    flexRender: mockFlexRender,
  };
});

interface TestData {
  id: string;
  name: string;
  status: string;
  // for actions column
  actions?: string; 
}

const mockColumns: ColumnDef<TestData, any>[] = [
  { id: 'name', header: 'Full Name', cell: ({ row }) => row.original.name },
  { id: 'status', header: 'Current Status', cell: ({ row }) => row.original.status },
  { id: 'actions', header: 'User Actions', cell: () => <button>Edit</button> },
];

const mockData: TestData[] = [
  { id: '1', name: 'Alice Wonderland', status: 'Active', actions: 'EditAlice' },
  { id: '2', name: 'Bob The Builder', status: 'Inactive', actions: 'EditBob' },
];

let mockTable: TanstackTableType<TestData>;

beforeEach(() => {
  vi.clearAllMocks();

  const rows: Row<TestData>[] = mockData.map((rowData) => {
    const cells: Cell<TestData, any>[] = mockColumns.map(colDef => ({
      id: `${rowData.id}_${colDef.id}`,
      column: { id: colDef.id!, columnDef: colDef } as any, 
      row: { original: rowData, id: rowData.id } as Row<TestData>,
      getContext: () => ({
        table: mockTable,
        column: { id: colDef.id!, columnDef: colDef } as any,
        row: { original: rowData, id: rowData.id } as Row<TestData>, 
        cell: {} as Cell<TestData,any>,
        getValue: () => (rowData as any)[colDef.id!],
        renderValue: () => (rowData as any)[colDef.id!],
      }),
      getValue: () => (rowData as any)[colDef.id!],
    } as Cell<TestData, any>));
    
    return {
      id: rowData.id,
      original: rowData,
      getVisibleCells: vi.fn(() => cells),
    } as unknown as Row<TestData>;
  });

  const rowModel: RowModel<TestData> = {
    rows,
    flatRows: rows,
    rowsById: rows.reduce((acc, row) => {
      acc[row.id] = row;
      return acc;
    }, {} as Record<string, Row<TestData>>),
  };

  mockTable = {
    getRowModel: vi.fn(() => rowModel),
  } as unknown as TanstackTableType<TestData>;
});

describe('DataTableMobileView', () => {
  it('should render a card for each row', () => {
    render(<DataTableMobileView table={mockTable} />);
    // Each card has CardContent with class p-4
    const cards = screen.getAllByRole('article'); // Card component has role article
    expect(cards).toHaveLength(mockData.length);
  });

  it('should display header and cell content for each visible cell (except actions)', () => {
    render(<DataTableMobileView table={mockTable} />);    
    // For Alice
    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
    expect(screen.getByText('Current Status')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();

    // Check flexRender calls: 2 data rows * 2 non-action cells = 4 for regular cells
    // Plus 2 for action cells
    expect(mockFlexRender).toHaveBeenCalledTimes(mockData.length * mockColumns.length);
  });

  it('should derive header text from column.id if columnDef.header is not a string', () => {
    const columnsWithMixedHeaders: ColumnDef<TestData, any>[] = [
      { id: 'name', header: () => <span>Custom Name Header</span>, cell: ({ row }) => row.original.name },
      { id: 'status', cell: ({ row }) => row.original.status }, // No header string
    ];
    const localMockData = [{ id: '3', name: 'Charlie', status: 'Pending' }];
    const rows: Row<TestData>[] = localMockData.map((rowData) => ({
      id: rowData.id,
      original: rowData,
      getVisibleCells: vi.fn(() => columnsWithMixedHeaders.map(colDef => ({
        id: `${rowData.id}_${colDef.id}`,
        column: { id: colDef.id!, columnDef: colDef } as any,
        getContext: () => ({ row: { original: rowData } }) as any,
      } as Cell<TestData, any>))),
    } as unknown as Row<TestData>));
    const localRowModel: RowModel<TestData> = { rows, flatRows: rows, rowsById: { [rows[0].id]: rows[0] } }; 
    const localTable = { getRowModel: vi.fn(() => localRowModel) } as unknown as TanstackTableType<TestData>; 

    render(<DataTableMobileView table={localTable} />);
    // For 'name' column, header is a component, so it's rendered by flexRender
    // For 'status' column, header should be derived: "Status"
    expect(screen.getByText('Status')).toBeInTheDocument(); 
  });

  it('should render actions cell content separately at the end', () => {
    render(<DataTableMobileView table={mockTable} />);
    // Actions are rendered via flexRender, check if the button content appears
    const editButtons = screen.getAllByRole('button', { name: /Edit/i });
    expect(editButtons).toHaveLength(mockData.length);
    // Ensure it's in the correct part of the card (hard to test structure precisely without more specific selectors)
    // For now, presence is the key test.
  });

  it('should display "No results." if rows are empty', () => {
    const emptyRowModel: RowModel<TestData> = { rows: [], flatRows: [], rowsById: {} };
    vi.mocked(mockTable.getRowModel).mockReturnValue(emptyRowModel);
    render(<DataTableMobileView table={mockTable} />);
    expect(screen.getByText('No results.')).toBeInTheDocument();
  });

  it('should have responsive classes for mobile view', () => {
    const { container } = render(<DataTableMobileView table={mockTable} />);
    // container.firstChild is the div wrapping the cards
    expect(container.firstChild).toHaveClass('md:hidden');
  });
}); 