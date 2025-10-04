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
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  UserIcon,
  CarIcon,
  EyeIcon,
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
  expandedCards: Set<string>;
}

function SidebarContent({ assignments, selectedAssignment, onAssignmentSelect, onToggleExpand, expandedCards }: SidebarContentProps) {
  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-lg">Bookings</h3>
      <div className="space-y-2">
        {assignments.map((assignment) => {
          const isExpanded = expandedCards.has(assignment.id);
          const isSelected = selectedAssignment?.id === assignment.id;
          
          return (
            <div
              key={assignment.id}
              className={`border rounded-lg transition-all duration-200 ${
                isSelected 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div
                className="p-3 cursor-pointer"
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
                    className="text-xs"
                  >
                    {isExpanded ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="px-3 pb-3 pt-0 space-y-3 border-t bg-muted/20">
                  {/* Booking Details */}
                  <div className="space-y-2">
                    {assignment.booking?.pickup_location && (
                      <div className="flex items-center gap-2 text-xs">
                        <MapPinIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">{assignment.booking.pickup_location}</span>
                      </div>
                    )}
                    
                    {assignment.booking?.customer_phone && (
                      <div className="flex items-center gap-2 text-xs">
                        <PhoneIcon className="h-3 w-3 text-muted-foreground" />
                        <span>{assignment.booking.customer_phone}</span>
                      </div>
                    )}

                    {assignment.booking?.date && (
                      <div className="flex items-center gap-2 text-xs">
                        <ClockIcon className="h-3 w-3 text-muted-foreground" />
                        <span>{new Date(assignment.booking.date).toLocaleDateString()}</span>
                      </div>
                    )}

                    {assignment.booking?.time && (
                      <div className="flex items-center gap-2 text-xs">
                        <ClockIcon className="h-3 w-3 text-muted-foreground" />
                        <span>{assignment.booking.time}</span>
                      </div>
                    )}
                  </div>

                  {/* Driver and Vehicle Status */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {assignment.driver ? (
                          <UserIcon className="h-3 w-3 text-green-500" />
                        ) : (
                          <UserIcon className="h-3 w-3 text-red-500" />
                        )}
                        <span className="text-xs">Driver</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {assignment.vehicle ? (
                          <CarIcon className="h-3 w-3 text-green-500" />
                        ) : (
                          <CarIcon className="h-3 w-3 text-red-500" />
                        )}
                        <span className="text-xs">Vehicle</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {assignment.booking?.notes && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Notes:</span> {assignment.booking.notes}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add view details functionality
                        console.log('View details for assignment:', assignment.id);
                      }}
                    >
                      <EyeIcon className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    {assignment.booking?.customer_phone && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add call functionality
                          window.open(`tel:${assignment.booking.customer_phone}`);
                        }}
                      >
                        <PhoneIcon className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MapViewWithSidebar({ assignments, onAssignmentSelect, onVehicleSelect }: MapViewWithSidebarProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<DispatchEntryWithRelations | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const handleAssignmentSelect = (assignment: DispatchEntryWithRelations) => {
    setSelectedAssignment(assignment);
    onAssignmentSelect(assignment);
  };

  const toggleCardExpansion = (assignmentId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assignmentId)) {
        newSet.delete(assignmentId);
      } else {
        newSet.add(assignmentId);
      }
      return newSet;
    });
  };

  const sidebarProps = {
    assignments,
    selectedAssignment,
    onAssignmentSelect: handleAssignmentSelect,
    onToggleExpand: toggleCardExpansion,
    expandedCards,
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
