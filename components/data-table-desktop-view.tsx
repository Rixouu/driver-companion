"use client";

import { Table as TanstackTable, flexRender, ColumnDef } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Props for the DataTableDesktopView component.
 * @template TData The type of data in the table.
 */
interface DataTableDesktopViewProps<TData> {
  /** The TanStack Table instance. */
  table: TanstackTable<TData>;
  /** The column definitions for the table. Used to determine colspan for "No results" row. */
  columns: ColumnDef<TData, any>[];
}

/**
 * Renders the desktop view of the DataTable using a standard table layout.
 * This component is hidden on smaller screens (md and below).
 * @template TData The type of data in the table.
 */
export function DataTableDesktopView<TData>({
  table,
  columns,
}: DataTableDesktopViewProps<TData>) {
  return (
    <div className="hidden md:block rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="whitespace-nowrap">
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 