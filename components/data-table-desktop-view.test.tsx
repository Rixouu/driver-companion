import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DataTableDesktopView } from './data-table-desktop-view';
import type { Table as TanstackTableType, ColumnDef, HeaderGroup, Row, Cell, Header, RowModel } from '@tanstack/react-table';

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

// Mock data and table instance
interface TestData {
  id: string;
  name: string;
  age: number;
}

// Corrected mockColumns using id and cell accessing row.original
const mockColumns: ColumnDef<TestData, any>[] = [
  { id: 'name', header: 'Name', cell: ({ row }) => row.original.name },
  { id: 'age', header: 'Age', cell: ({ row }) => row.original.age.toString() }, // Ensure string for rendering
];

const mockData: TestData[] = [
  { id: '1', name: 'Alice', age: 30 },
  { id: '2', name: 'Bob', age: 24 },
];

let mockTable: TanstackTableType<TestData>;

beforeEach(() => {
  vi.clearAllMocks();

  // Build mock table structure
  const rows: Row<TestData>[] = mockData.map((rowData, index) => {
    const cells: Cell<TestData, any>[] = mockColumns.map(colDef => ({
      id: `${rowData.id}_${colDef.id}`,
      column: { id: colDef.id!, columnDef: colDef } as unknown as ColumnDef<TestData, any> & {id: string, columnDef: ColumnDef<TestData,any> }, // Mock column for cell
      row: { original: rowData, id: rowData.id } as Row<TestData>, // Mock row for cell
      getContext: () => ({
        table: mockTable, // provide the table instance
        column: { id: colDef.id!, columnDef: colDef },
        row: { original: rowData, id: rowData.id }, 
        cell: {} as Cell<TestData,any>, // self-ref okay if not used deeply
        getValue: () => (rowData as any)[colDef.id!],
        renderValue: () => (rowData as any)[colDef.id!],
      }),
      getValue: () => (rowData as any)[colDef.id!],
    } as Cell<TestData, any>));
    
    return {
      id: rowData.id,
      original: rowData,
      getIsSelected: vi.fn(() => index === 0), // Mock first row selected
      getVisibleCells: vi.fn(() => cells),
    } as unknown as Row<TestData>; // Cast to Row<TestData>
  });

  const rowModel: RowModel<TestData> = {
    rows,
    flatRows: rows,
    rowsById: rows.reduce((acc, row) => {
      acc[row.id] = row;
      return acc;
    }, {} as Record<string, Row<TestData>>),
  };

  const headerGroups: HeaderGroup<TestData>[] = [
    {
      id: 'hg1',
      depth: 0,
      headers: mockColumns.map(colDef => ({
        id: colDef.id!,
        isPlaceholder: false,
        column: { id: colDef.id!, columnDef: colDef } as unknown as ColumnDef<TestData, any> & {id: string, columnDef: ColumnDef<TestData,any> }, // Mock column for header
        colSpan: 1,
        getContext: () => ({
            table: mockTable,
            header: {} as Header<TestData, unknown>,
            column: { id: colDef.id!, columnDef: colDef }
        }),
      } as unknown as Header<TestData, unknown>)),
    } as HeaderGroup<TestData>,
  ];

  mockTable = {
    getHeaderGroups: vi.fn(() => headerGroups),
    getRowModel: vi.fn(() => rowModel),
    // Add any other table methods used by the component if necessary
  } as unknown as TanstackTableType<TestData>;
});

describe('DataTableDesktopView', () => {
  it('should render table headers based on getHeaderGroups', () => {
    render(<DataTableDesktopView table={mockTable} columns={mockColumns} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(mockFlexRender).toHaveBeenCalledTimes(mockColumns.length); // For headers
  });

  it('should render table rows based on getRowModel', () => {
    render(<DataTableDesktopView table={mockTable} columns={mockColumns} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument(); // Age is converted to string
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(mockFlexRender).toHaveBeenCalledTimes(mockColumns.length + mockData.length * mockColumns.length);
  });

  it('should render "No results." if there are no rows', () => {
    const emptyRowModel: RowModel<TestData> = {
      rows: [], flatRows: [], rowsById: {},
    };
    vi.mocked(mockTable.getRowModel).mockReturnValue(emptyRowModel);
    render(<DataTableDesktopView table={mockTable} columns={mockColumns} />);
    const noResultsCell = screen.getByText('No results.');
    expect(noResultsCell).toBeInTheDocument();
    expect(noResultsCell).toHaveAttribute('colSpan', mockColumns.length.toString());
  });

  it('should apply data-state="selected" to selected rows', () => {
    render(<DataTableDesktopView table={mockTable} columns={mockColumns} />);
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveAttribute('data-state', 'selected'); // Alice (index 0)
    expect(rows[2]).not.toHaveAttribute('data-state', 'selected'); // Bob (index 1)
  });

  it('should have responsive classes for desktop view', () => {
    const { container } = render(<DataTableDesktopView table={mockTable} columns={mockColumns} />);
    expect(container.firstChild).toHaveClass('hidden', 'md:block');
  });

  it('should handle placeholder headers correctly', () => {
    const placeholderHeaderGroups: HeaderGroup<TestData>[] = [
      {
        id: 'hg1',
        depth:0,
        headers: [
          { id: 'ph1', isPlaceholder: true, colSpan:1,column: {} as any, getContext:()=>({})} as unknown as Header<TestData, unknown>,
          {
            id: 'nameHeader',
            isPlaceholder: false,
            colSpan:1,
            column: { id: mockColumns[0].id!, columnDef: mockColumns[0] } as any,
            getContext: () => ({ table:mockTable, header:{} as any, column: {id: mockColumns[0].id!, columnDef: mockColumns[0]} }),
          } as unknown as Header<TestData, unknown>,
        ],
      } as HeaderGroup<TestData>,
    ];
    vi.mocked(mockTable.getHeaderGroups).mockReturnValue(placeholderHeaderGroups);
    render(<DataTableDesktopView table={mockTable} columns={mockColumns} />);
    expect(screen.getByText('Name')).toBeInTheDocument(); // Name header should still render
    // flexRender for 1 real header + cells for 2 rows * 2 columns = 1 + 4 = 5
    // The placeholder does not call flexRender.
    expect(mockFlexRender).toHaveBeenCalledTimes(1 + mockData.length * mockColumns.length);
  });
}); 