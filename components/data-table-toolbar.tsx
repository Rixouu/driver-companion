"use client";

import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SlidersHorizontal } from "lucide-react";

/**
 * Props for the DataTableToolbar component.
 * @template TData The type of data in the table.
 */
interface DataTableToolbarProps<TData> {
  /** The TanStack Table instance. */
  table: Table<TData>;
  /** The key of the column to use for client-side searching. */
  searchKey?: string;
  /** Placeholder text for the search input. */
  searchPlaceholder?: string;
  /** Whether to show the column toggle dropdown. */
  showColumnToggle?: boolean;
  /** Whether the table is using server-side pagination (disables client-side search). */
  isServerPaginated?: boolean;
}

/**
 * Renders the toolbar for the DataTable.
 * Includes client-side search input (if `searchKey` is provided and not server-paginated)
 * and a column visibility toggle dropdown (if `showColumnToggle` is true).
 * @template TData The type of data in the table.
 */
export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Search...",
  showColumnToggle = false,
  isServerPaginated = false,
}: DataTableToolbarProps<TData>) {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4">
      {searchKey && !isServerPaginated && (
        <div className="flex items-center">
          <Input
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder || "Search table data"}
            value={
              (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
      )}
      {isServerPaginated && searchKey && (
        <div className="flex items-center text-sm text-muted-foreground">
          Client-side search disabled with server pagination.
        </div>
      )}

      <div className="flex justify-end gap-2">
        {showColumnToggle && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto" 
                aria-label="Toggle column visibility"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
} 