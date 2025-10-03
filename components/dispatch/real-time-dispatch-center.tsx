"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  MapIcon,
  Grid3X3Icon,
  SearchIcon,
  CalendarIcon,
  RefreshCwIcon,
  FilterIcon,
  SettingsIcon,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { toast } from '@/components/ui/use-toast';
import { useSharedDispatchState } from "@/lib/hooks/use-shared-dispatch-state";
import { cn } from '@/lib/utils/styles';
import { DispatchStatus } from '@/types/dispatch';
import DispatchBoardView from './dispatch-board-view';
import DispatchTimetable from './dispatch-timetable';
import { MapViewWithSidebar } from './map-view-with-sidebar';
import { ColumnSettingsModal } from './column-settings-modal';

// Import custom hooks
import { useDispatchData } from '@/lib/hooks/use-dispatch-data';
import { useDispatchColumns } from '@/lib/hooks/use-dispatch-columns';
import { useDispatchFiltering } from '@/lib/hooks/use-dispatch-filtering';
import { useDispatchStatus } from '@/lib/hooks/use-dispatch-status';

export default function RealTimeDispatchCenter() {
  const { t } = useI18n();
  const [activeView, setActiveView] = useState<'board' | 'map' | 'timetable'>('board');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { lastUpdate } = useSharedDispatchState();

  // Use custom hooks
  const { assignments, setAssignments, isLoading, loadDispatchData } = useDispatchData({ lastUpdate });
  
  const {
    columnOrder,
    setColumnOrder,
    hiddenColumns,
    visibleColumns,
    columnConfig,
    showColumnSettings,
    setShowColumnSettings,
    toggleColumnVisibility
  } = useDispatchColumns();

  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredAssignments,
    statusCounts
  } = useDispatchFiltering(assignments);

  const {
    handleUpdateStatus,
    handleUnassign,
    handleAssignmentAction
  } = useDispatchStatus({ assignments, setAssignments });

  return (
    <div className="space-y-6">
      {/* Header - Matching pricing page style */}
      <div className="border-b border-border/40 pb-3">
        <div className="flex items-center gap-3 mb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Dispatch Center</h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              Real-time booking management and assignment tracking
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookings..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as DispatchStatus | 'all')}>
          <SelectTrigger className="w-full sm:w-40">
            <FilterIcon className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                All Status
              </div>
            </SelectItem>
            <SelectItem value="pending">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                Pending
              </div>
            </SelectItem>
            <SelectItem value="assigned">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                Assigned
              </div>
            </SelectItem>
            <SelectItem value="confirmed">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Confirmed
              </div>
            </SelectItem>
            <SelectItem value="en_route">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                En Route
              </div>
            </SelectItem>
            <SelectItem value="arrived">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                Arrived
              </div>
            </SelectItem>
            <SelectItem value="in_progress">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                In Progress
              </div>
            </SelectItem>
            <SelectItem value="completed">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                Completed
              </div>
            </SelectItem>
            <SelectItem value="cancelled">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Cancelled
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Column Settings */}
        <Button
          variant="outline"
          onClick={() => setShowColumnSettings(true)}
          className="w-full sm:w-auto"
        >
          <SettingsIcon className="h-4 w-4 mr-2" />
          Columns
        </Button>

        {/* Refresh Button */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadDispatchData}
            disabled={isLoading}
            className={cn(
              "w-full sm:w-auto",
              activeView === 'board' ? "flex-1 sm:flex-none" : "w-full"
            )}
          >
            <RefreshCwIcon className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs - Modern style like pricing page */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'board' | 'map' | 'timetable')} className="w-full">
        <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <TabsList className="flex flex-wrap h-auto min-h-12 items-center justify-start rounded-none border-0 bg-transparent p-0 text-muted-foreground">
            <TabsTrigger 
              value="board" 
              className="relative h-12 px-6 rounded-none border-b-2 border-transparent bg-transparent text-sm font-medium transition-all hover:text-foreground hover:bg-muted/50 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-muted/20 data-[state=active]:shadow-sm"
            >
              <Grid3X3Icon className="w-4 h-4 mr-2" />
              Board View
            </TabsTrigger>
            <TabsTrigger 
              value="map" 
              className="relative h-12 px-6 rounded-none border-b-2 border-transparent bg-transparent text-sm font-medium transition-all hover:text-foreground hover:bg-muted/50 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-muted/20 data-[state=active]:shadow-sm"
            >
              <MapIcon className="w-4 h-4 mr-2" />
              Map View
            </TabsTrigger>
            <TabsTrigger 
              value="timetable" 
              className="relative h-12 px-6 rounded-none border-b-2 border-transparent bg-transparent text-sm font-medium transition-all hover:text-foreground hover:bg-muted/50 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-muted/20 data-[state=active]:shadow-sm"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Timetable
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <TabsContent value="board" className="mt-6">
          <DispatchBoardView
            entries={filteredAssignments}
            onStatusChange={handleUpdateStatus}
            onUnassign={handleUnassign}
            onUnassignVehicle={handleUnassign}
            columnOrder={columnOrder}
            setColumnOrder={setColumnOrder}
            hiddenColumns={hiddenColumns}
            visibleColumns={visibleColumns}
            columnConfig={columnConfig}
            statusCounts={statusCounts}
          />
        </TabsContent>

        <TabsContent value="map" className="mt-6">
          <MapViewWithSidebar
            assignments={filteredAssignments}
            onAssignmentSelect={(assignment) => {
              console.log('Assignment selected for route display:', assignment);
            }}
            onVehicleSelect={(vehicleId) => {
              toast({
                title: "Vehicle Selected",
                description: `Vehicle ${vehicleId.slice(0, 8)} selected`,
              });
            }}
          />
        </TabsContent>

        <TabsContent value="timetable" className="mt-6">
          <DispatchTimetable
            entries={filteredAssignments}
            onStatusChange={handleUpdateStatus}
          />
        </TabsContent>
      </Tabs>

      {/* Column Settings Modal */}
      <ColumnSettingsModal
        open={showColumnSettings}
        onOpenChange={setShowColumnSettings}
        columnOrder={columnOrder}
        setColumnOrder={setColumnOrder}
        hiddenColumns={hiddenColumns}
        toggleColumnVisibility={toggleColumnVisibility}
        columnConfig={columnConfig}
      />
    </div>
  );
}
