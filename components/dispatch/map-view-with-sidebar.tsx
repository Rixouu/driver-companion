"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  PanelLeftOpenIcon,
  PanelLeftCloseIcon,
  ListIcon,
} from 'lucide-react';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import DispatchMap from './dispatch-map';
import { DispatchEntryWithRelations } from '@/types/dispatch';

interface MapViewWithSidebarProps {
  assignments: DispatchEntryWithRelations[];
  onAssignmentSelect: (assignment: DispatchEntryWithRelations) => void;
  onVehicleSelect: (vehicleId: string) => void;
}

interface SidebarContentProps {
  assignments: DispatchEntryWithRelations[];
  selectedAssignment: DispatchEntryWithRelations | null;
  onAssignmentSelect: (assignment: DispatchEntryWithRelations) => void;
  onToggleExpand: (assignmentId: string) => void;
}

function SidebarContent({ assignments, selectedAssignment, onAssignmentSelect, onToggleExpand }: SidebarContentProps) {
  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-lg">Bookings</h3>
      <div className="space-y-2">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedAssignment?.id === assignment.id 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => onAssignmentSelect(assignment)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{assignment.booking?.customer_name || 'Unknown Customer'}</p>
                <p className="text-sm text-muted-foreground">
                  {assignment.booking?.wp_id ? `#${assignment.booking.wp_id}` : 'No ID'}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(assignment.id);
                }}
              >
                Expand
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MapViewWithSidebar({ assignments, onAssignmentSelect, onVehicleSelect }: MapViewWithSidebarProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<DispatchEntryWithRelations | null>(null);

  const handleAssignmentSelect = (assignment: DispatchEntryWithRelations) => {
    setSelectedAssignment(assignment);
    onAssignmentSelect(assignment);
  };

  const toggleCardExpansion = (assignmentId: string) => {
    // Handle card expansion logic
    console.log('Toggle expansion for assignment:', assignmentId);
  };

  const sidebarProps = {
    assignments,
    selectedAssignment,
    onAssignmentSelect: handleAssignmentSelect,
    onToggleExpand: toggleCardExpansion,
  };

  if (isDesktop) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)]">
        {showSidebar && (
          <div className="w-80 border-r bg-background flex flex-col">
            <SidebarContent {...sidebarProps} />
          </div>
        )}
        <div className="flex-1 relative">
          <Button
            size="sm"
            variant="outline"
            className="absolute top-4 left-4 z-20 bg-background/90 backdrop-blur-sm"
            onClick={() => setShowSidebar(prev => !prev)}
          >
            {showSidebar ? <PanelLeftCloseIcon className="h-4 w-4" /> : <PanelLeftOpenIcon className="h-4 w-4" />}
          </Button>
          <DispatchMap
            assignments={assignments}
            selectedAssignment={selectedAssignment}
            onAssignmentSelect={onAssignmentSelect}
            onVehicleSelect={onVehicleSelect}
            className="min-h-[calc(100vh-12rem)]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] relative">
      <DispatchMap
        assignments={assignments}
        selectedAssignment={selectedAssignment}
        onAssignmentSelect={onAssignmentSelect}
        onVehicleSelect={onVehicleSelect}
        className="min-h-[calc(100vh-12rem)]"
      />
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 shadow-lg"
          >
            <ListIcon className="h-4 w-4 mr-2" />
            Show Bookings
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[60%] flex flex-col p-0">
           <SidebarContent {...sidebarProps} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
