"use client";

import { Table as TanstackTable, flexRender, Cell } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Props for the DataTableMobileView component.
 * @template TData The type of data in the table.
 */
interface DataTableMobileViewProps<TData> {
  /** The TanStack Table instance. */
  table: TanstackTable<TData>;
}

/**
 * Renders the mobile view of the DataTable using a card-based layout for each row.
 * This component is hidden on medium screens (md) and above.
 * It iterates through cells once, rendering data pairs and deferring actions to the end of the card.
 * @template TData The type of data in the table.
 */
export function DataTableMobileView<TData>({
  table,
}: DataTableMobileViewProps<TData>) {
  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {table.getRowModel().rows.length > 0 ? (
        table.getRowModel().rows.map((row) => {
          let actionsRender: JSX.Element | null = null;
          const dataCells: JSX.Element[] = [];

          row.getVisibleCells().forEach((cell) => {
            if (cell.column.id === "actions") {
              // Prepare actions render if this cell is the actions cell
              actionsRender = (
                <div key={`actions-${cell.id}`} className="mt-3 flex justify-end">
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </div>
              );
            } else {
              const headerContent = cell.column.columnDef.header;
              const header =
                typeof headerContent === "string"
                  ? headerContent
                  : cell.column.id.charAt(0).toUpperCase() +
                    cell.column.id.slice(1);
              
              dataCells.push(
                <div key={cell.id} className="grid grid-cols-2 gap-1 py-1">
                  <div className="text-sm text-muted-foreground break-words">
                    {header}
                  </div>
                  <div className="text-sm font-medium break-words">
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </div>
                </div>
              );
            }
          });

          return (
            <Card key={row.id}>
              <CardContent className="p-4">
                {dataCells}
                {actionsRender}
              </CardContent>
            </Card>
          );
        })
      ) : (
        <div className="text-center text-muted-foreground py-4">
          No results.
        </div>
      )}
    </div>
  );
} 