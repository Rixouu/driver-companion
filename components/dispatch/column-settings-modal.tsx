"use client";

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  SettingsIcon,
  Eye,
  EyeOff,
  GripVertical,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { DispatchStatus } from '@/types/dispatch';

interface ColumnSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnOrder: DispatchStatus[];
  setColumnOrder: (order: DispatchStatus[]) => void;
  hiddenColumns: Set<DispatchStatus>;
  toggleColumnVisibility: (status: DispatchStatus) => void;
  columnConfig: Record<DispatchStatus, { title: string; emptyMessage: string }>;
}

export function ColumnSettingsModal({
  open,
  onOpenChange,
  columnOrder,
  setColumnOrder,
  hiddenColumns,
  toggleColumnVisibility,
  columnConfig
}: ColumnSettingsModalProps) {
  const [expandedSection, setExpandedSection] = useState<'visibility' | 'order' | null>(null);

  const handleDragStart = (e: React.DragEvent, status: DispatchStatus) => {
    e.dataTransfer.setData('text/plain', status);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: DispatchStatus) => {
    e.preventDefault();
    const draggedStatus = e.dataTransfer.getData('text/plain') as DispatchStatus;
    
    if (draggedStatus === targetStatus) return;

    const newOrder = [...columnOrder];
    const draggedIndex = newOrder.indexOf(draggedStatus);
    const targetIndex = newOrder.indexOf(targetStatus);
    
    // Remove dragged item and insert at target position
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedStatus);
    
    setColumnOrder(newOrder);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('dispatch-column-order', JSON.stringify(newOrder));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:w-[480px]">
        <SheetHeader className="pb-4 border-b border-border/50">
          <SheetTitle className="text-lg font-semibold flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Column Settings
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Customize which columns are visible and their order
          </p>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Show/Hide Columns */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Show/Hide Columns
              </h4>
              <Badge variant="outline" className="text-xs">
                {columnOrder.filter(status => !hiddenColumns.has(status)).length} of {columnOrder.length} visible
              </Badge>
            </div>
            
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto"
              onClick={() => setExpandedSection(expandedSection === 'visibility' ? null : 'visibility')}
            >
              <span className="text-sm">Toggle column visibility</span>
              {expandedSection === 'visibility' ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </Button>
            
            {expandedSection === 'visibility' && (
              <div className="space-y-3 pl-4">
                {columnOrder.map((status) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-current" />
                      <span className="text-sm">{columnConfig[status].title}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleColumnVisibility(status)}
                      className="h-8 w-8 p-0"
                    >
                      {hiddenColumns.has(status) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column Order */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-base flex items-center gap-2">
                <GripVertical className="h-4 w-4" />
                Column Order
              </h4>
            </div>
            
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto"
              onClick={() => setExpandedSection(expandedSection === 'order' ? null : 'order')}
            >
              <span className="text-sm">Reorder columns by dragging</span>
              {expandedSection === 'order' ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </Button>
            
            {expandedSection === 'order' && (
              <div className="space-y-2 pl-4">
                {columnOrder.map((status, index) => (
                  <div
                    key={status}
                    draggable
                    onDragStart={(e) => handleDragStart(e, status)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status)}
                    className="flex items-center gap-3 p-2 border rounded-lg cursor-move hover:bg-muted/50 transition-colors"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className="w-3 h-3 rounded-full bg-current" />
                    <span className="text-sm flex-1">{columnConfig[status].title}</span>
                    <Badge variant="outline" className="text-xs">
                      {index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reset to Default */}
          <div className="pt-4 border-t border-border/50">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const defaultOrder: DispatchStatus[] = [
                  'pending', 'assigned', 'confirmed', 'en_route', 
                  'arrived', 'in_progress', 'completed', 'cancelled'
                ];
                setColumnOrder(defaultOrder);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('dispatch-column-order', JSON.stringify(defaultOrder));
                  localStorage.setItem('dispatch-hidden-columns', JSON.stringify([]));
                }
              }}
            >
              Reset to Default
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
