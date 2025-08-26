import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils/styles';

interface PricingResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

export function PricingResponsiveTable({ children, className }: PricingResponsiveTableProps) {
  return (
    <div className={cn(
      "border rounded-lg overflow-hidden bg-background",
      "shadow-sm",
      className
    )}>
      <div className="overflow-x-auto">
        <Table>
          {children}
        </Table>
      </div>
    </div>
  );
}

interface PricingTableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function PricingTableHeader({ children, className }: PricingTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow className={cn(
        "bg-muted/50 hover:bg-muted/50 dark:bg-muted/20 dark:hover:bg-muted/20",
        className
      )}>
        {children}
      </TableRow>
    </TableHeader>
  );
}

interface PricingTableHeadProps {
  children: React.ReactNode;
  className?: string;
}

export function PricingTableHead({ children, className }: PricingTableHeadProps) {
  return (
    <TableHead className={cn(
      "font-semibold text-sm h-12 px-4 sm:px-6 text-foreground",
      className
    )}>
      {children}
    </TableHead>
  );
}

interface PricingTableRowProps {
  children: React.ReactNode;
  index?: number;
  className?: string;
}

export function PricingTableRow({ children, index = 0, className }: PricingTableRowProps) {
  return (
    <TableRow 
      className={cn(
        "hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors",
        index % 2 === 0 ? "bg-background" : "bg-muted/5 dark:bg-muted/10",
        className
      )}
    >
      {children}
    </TableRow>
  );
}

interface PricingTableCellProps {
  children: React.ReactNode;
  className?: string;
}

export function PricingTableCell({ children, className }: PricingTableCellProps) {
  return (
    <TableCell className={cn(
      "px-4 sm:px-6 py-4 text-foreground",
      className
    )}>
      {children}
    </TableCell>
  );
}
