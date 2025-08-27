import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils/styles';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GripVertical, Edit, Car, MoreHorizontal } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PricingResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  isMobile?: boolean;
}

export function PricingResponsiveTable({ children, className, isMobile }: PricingResponsiveTableProps) {
  const [isMobileView, setIsMobileView] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // If explicitly set to mobile or detected as mobile, render mobile view
  if (isMobile || isMobileView) {
    return (
      <div className={cn("space-y-4", className)}>
        {children}
      </div>
    );
  }

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

// New mobile-friendly card components
interface PricingMobileCardProps {
  category: any;
  onEdit?: (category: any) => void;
  onManageVehicles?: (category: any) => void;
  onDelete?: (categoryId: string) => void;
  onStatusToggle?: (categoryId: string, isActive: boolean) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

export function PricingMobileCard({ 
  category, 
  onEdit, 
  onManageVehicles, 
  onDelete, 
  onStatusToggle,
  isDragging,
  dragHandleProps 
}: PricingMobileCardProps) {
  const { t } = useI18n();
  
  return (
    <Card className={cn(
      "transition-all duration-200",
      isDragging && "opacity-50 scale-95",
      "hover:shadow-md hover:border-primary/30"
    )}>
      <CardContent className="p-4">
        {/* Drag Handle */}
        <div className="flex items-start justify-between mb-3">
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted/50 rounded transition-colors"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          
          {/* Order Badge */}
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 text-sm font-medium">
            {category.sort_order}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-3">
          {/* Title and Description */}
          <div>
            <h3 className="font-semibold text-foreground text-base mb-1">
              {category.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {category.description}
            </p>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Services Count */}
              <div className="text-center">
                <div className="text-lg font-semibold text-primary">
                  {category.service_type_ids?.length || 0}
                </div>
                <div className="text-xs text-muted-foreground">services</div>
              </div>
              
              {/* Status */}
              <div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium px-2 py-1",
                    category.is_active 
                      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
                  )}
                >
                  {category.is_active ? t('common.status.active') : t('common.status.inactive')}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-9 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-400"
              onClick={() => onManageVehicles?.(category)}
            >
              <Car className="h-4 w-4 mr-2" />
              {t('pricing.categories.actions.manageVehicles')}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-9 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/50 dark:hover:text-green-400"
              onClick={() => onEdit?.(category)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete?.(category.id)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Sortable wrapper for mobile cards
export function SortableMobileCard({ 
  category, 
  onEdit, 
  onManageVehicles, 
  onDelete, 
  onStatusToggle 
}: Omit<PricingMobileCardProps, 'isDragging' | 'dragHandleProps'>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <PricingMobileCard
        category={category}
        onEdit={onEdit}
        onManageVehicles={onManageVehicles}
        onDelete={onDelete}
        onStatusToggle={onStatusToggle}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
