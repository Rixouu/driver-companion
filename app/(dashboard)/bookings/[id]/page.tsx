              
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { getBookingById, updateBookingAction } from '@/app/actions/bookings';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingModal from '@/components/ui/loading-modal';
import { useProgressSteps } from '@/lib/hooks/useProgressSteps';
import { progressConfigs } from '@/lib/config/progressConfigs';
import { Calendar, Clock, CreditCard, Edit, FileText, Link as LinkIcon, MapPin, User, X, Mail, Phone, Navigation, CloudSun, CalendarPlus, FileX, Loader2, ArrowLeft, Truck, Car, Tag, Package, Timer, Building, CheckIcon, CheckCircle, UserX, RefreshCw, StickyNote } from 'lucide-react';
import Image from 'next/image';
import { toast } from '@/components/ui/use-toast';
import { Booking } from '@/types/bookings';
import { formatDateDDMMYYYY } from '@/lib/utils/formatting';
import { BookingShareButtons } from '@/components/bookings/booking-share-buttons';
import { WeatherForecast } from '@/components/bookings/weather-forecast';
import { GoogleMapsProvider } from '@/components/providers/google-maps-provider';
import BookingActions from '@/components/bookings/booking-actions';
import { BookingWorkflow } from '@/components/bookings/booking-workflow';
import { DriverActionsDropdown } from '@/components/bookings/driver-actions-dropdown';
import SmartAssignmentModal from '@/components/shared/smart-assignment-modal';

// Helper function to get status badge
function getStatusBadge(status: string) {
  const statusConfig = {
    pending: { label: 'Pending', className: 'text-yellow-600 border-yellow-300 bg-yellow-100 dark:text-yellow-400 dark:border-yellow-600 dark:bg-yellow-900/20' },
    confirmed: { label: 'Confirmed', className: 'text-green-600 border-green-300 bg-green-100 dark:text-green-400 dark:border-green-600 dark:bg-green-900/20' },
    assigned: { label: 'Assigned', className: 'text-blue-600 border-blue-300 bg-blue-100 dark:text-blue-400 dark:border-blue-600 dark:bg-blue-900/20' },
    completed: { label: 'Completed', className: 'text-green-600 border-green-300 bg-green-100 dark:text-green-400 dark:border-green-600 dark:bg-green-900/20' },
    cancelled: { label: 'Cancelled', className: 'text-red-600 border-red-300 bg-red-100 dark:text-red-400 dark:border-red-600 dark:bg-red-900/20' }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

// Helper function to get payment status badge
function getPaymentStatusBadgeClasses(status: string) {
  const statusConfig = {
    pending: 'text-yellow-600 border-yellow-300 bg-yellow-100 dark:text-yellow-400 dark:border-yellow-600 dark:bg-yellow-900/20',
    paid: 'text-green-600 border-green-300 bg-green-100 dark:text-green-400 dark:border-green-600 dark:bg-green-900/20',
    failed: 'text-red-600 border-red-300 bg-red-100 dark:text-red-400 dark:border-red-600 dark:bg-red-900/20',
    refunded: 'text-gray-600 border-gray-300 bg-gray-100 dark:text-gray-400 dark:border-gray-600 dark:bg-gray-900/20'
  };
  
  return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const id = params?.id as string;
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSmartModalOpen, setIsSmartModalOpen] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [assignedDriver, setAssignedDriver] = useState<any>(null);
  const [assignedVehicle, setAssignedVehicle] = useState<any>(null);
  const [vehicleCategory, setVehicleCategory] = useState<string>('');
  
  // Email dialog state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [bccEmails, setBccEmails] = useState<string>("booking@japandriver.com");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // Invoice dialog state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceBccEmails, setInvoiceBccEmails] = useState<string>("booking@japandriver.com");
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  
  
  // Reschedule state
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  
  // Progress modal state
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressTitle, setProgressTitle] = useState('Processing');
  const [progressVariant, setProgressVariant] = useState<'default' | 'email' | 'approval' | 'rejection' | 'reminder' | 'invoice'>('default');
  const { progressValue, progressLabel, progressSteps, startProgress, resetProgress } = useProgressSteps();

  // Load booking data
  const loadBooking = async () => {
    try {
      setLoading(true);
      const bookingData = await getBookingById(id);
      setBooking(bookingData.booking);
      
      // Load assigned driver and vehicle if they exist
      if (bookingData.booking?.driver_id || bookingData.booking?.vehicle_id) {
        await loadAssignedResources(bookingData.booking);
      }
    } catch (err) {
      console.error('Error loading booking:', err);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadBooking();
    }
  }, [id, router]);

  // Removed automatic refresh on visibility change and focus

  // Removed automatic refresh on URL parameter

  // Load assigned driver and vehicle data
  const loadAssignedResources = async (bookingData: Booking) => {
    try {
      const supabase = createClient();
      
      // Load assigned driver
      if (bookingData.driver_id) {
        const { data: driverData, error: driverError } = await supabase
          .from('drivers')
          .select('*')
          .eq('id', bookingData.driver_id)
          .single();
        
        if (!driverError && driverData) {
          setAssignedDriver(driverData);
        }
      }
      
      // Load assigned vehicle with category
      if (bookingData.vehicle_id) {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select(`
            *,
            pricing_category_vehicles!inner(
              pricing_categories!inner(
                name
              )
            )
          `)
          .eq('id', bookingData.vehicle_id)
          .single();
        
        if (!vehicleError && vehicleData) {
          setAssignedVehicle(vehicleData);
          // Extract category name
          if (vehicleData.pricing_category_vehicles && Array.isArray(vehicleData.pricing_category_vehicles) && vehicleData.pricing_category_vehicles.length > 0) {
            setVehicleCategory(vehicleData.pricing_category_vehicles[0].pricing_categories.name);
          } else if (bookingData.meta?.vehicle_category_name) {
            setVehicleCategory(bookingData.meta.vehicle_category_name);
          } else if (bookingData.meta?.vehicle_category) {
            setVehicleCategory(bookingData.meta.vehicle_category);
          }
        }
      }
    } catch (error) {
      console.error('Error loading assigned resources:', error);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    try {
      setLoading(true);
      
      // If changing to pending, clear assignment data
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      if (newStatus === 'pending') {
        // Clear assignment data when changing to pending
        updateData.driver_id = null;
        updateData.vehicle_id = null;
        
        // Clear assignment data from meta
        updateData.meta = {
          ...booking?.meta,
          assigned_at: null,
          completed_at: null,
          assignment_cleared_at: new Date().toISOString()
        };
      }
      
      const result = await updateBookingAction(id, updateData);
      
      if (result.success) {
        // Update local state
        setBooking(prev => prev ? { ...prev, ...updateData } : null);
        
        toast({
          title: "Status Updated",
          description: `Booking status changed to ${newStatus}`,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update booking status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load available drivers and vehicles
  const loadAvailableResources = async () => {
    try {
      const supabase = createClient();
      
      // Load drivers
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .is('deleted_at', null);

      if (driversError) throw driversError;

      // Load vehicles with category information
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select(`
          *,
          pricing_category_vehicles(
            pricing_categories(
              id,
              name,
              sort_order
            )
          )
        `)
        .eq('status', 'active');

      if (vehiclesError) throw vehiclesError;

      setDrivers(driversData || []);
      setVehicles(vehiclesData || []);
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  };

  // Handle smart assignment
  const handleSmartAssignment = () => {
    loadAvailableResources();
    setIsSmartModalOpen(true);
  };

  // Handle assignment
  const handleAssign = async (driverId: string, vehicleId: string) => {
    try {
      const supabase = createClient();
      
      // Prepare update data
      const updateData: any = {};
      
      if (driverId) {
        updateData.driver_id = driverId;
      } else if (driverId === '') {
        // Unassign driver
        updateData.driver_id = null;
      }
      
      if (vehicleId) {
        updateData.vehicle_id = vehicleId;
      } else if (vehicleId === '') {
        // Unassign vehicle
        updateData.vehicle_id = null;
      }
      
      // Determine status based on assignments
      const hasDriver = driverId && driverId !== '';
      const hasVehicle = vehicleId && vehicleId !== '';
      
      if (hasDriver && hasVehicle) {
        // Both assigned - set to assigned
        updateData.status = 'assigned';
      } else if (booking?.status === 'assigned' && (!hasDriver || !hasVehicle)) {
        // Was assigned but now missing driver or vehicle - revert to confirmed
        updateData.status = 'confirmed';
      }
      
      // Update the booking
      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking?.id || '');
      
      if (error) {
        console.error('Error updating booking:', error);
        toast({
          title: "Error",
          description: "Failed to update assignment",
          variant: "destructive",
        });
        return;
      }
      
      // Show success message
      if (driverId === '' && vehicleId === '') {
        toast({
          title: "Success",
          description: "All assignments have been removed",
        });
      } else if (hasDriver && hasVehicle) {
        toast({
          title: "Success",
          description: "Driver and vehicle assigned successfully. Status updated to assigned.",
        });
      } else {
        toast({
          title: "Success",
          description: "Assignment updated successfully",
        });
      }
      
      setIsSmartModalOpen(false);
      // Refresh the page to update the booking data
      window.location.reload();
    } catch (error) {
      console.error('Error in handleAssign:', error);
      toast({
        title: "Error",
        description: "An error occurred while updating the assignment",
        variant: "destructive",
      });
    }
  };

  // Individual unassign functions
  const handleUnassignDriver = async () => {
    await handleAssign('', booking?.vehicle_id || '');
  };

  const handleUnassignVehicle = async () => {
    // Check if this is the original vehicle chosen for the booking
    // If so, we should not allow unassigning, only updating/upgrading/downgrading
    if (booking?.meta?.original_vehicle_id === booking?.vehicle_id) {
      alert('Cannot unassign the original vehicle chosen for this booking. Use Smart Assignment to change to a different vehicle.');
      return;
    }
    
    await handleAssign(booking?.driver_id || '', '');
  };

  const handleUnassignAll = async () => {
    await handleAssign('', '');
  };

  // Send booking details email
  const handleSendBookingDetails = async () => {
    if (!bccEmails.trim()) {
      toast({
        title: "Error",
        description: "Please enter at least one BCC email address",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);
    setProgressOpen(true);
    setProgressVariant('email');
    setProgressTitle('Sending Booking Details');
    
    try {
      const bccEmailList = bccEmails.split(',').map(email => email.trim()).filter(email => email);
      
      // Start progress simulation and API call in parallel
      const progressPromise = startProgress(progressConfigs.sendEmail);
      
      const response = await fetch('/api/bookings/send-booking-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking?.id || id,
          bccEmails: bccEmailList
        }),
      });

      // Wait for both to complete
      await Promise.all([progressPromise, response]);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      toast({
        title: "Success",
        description: "Booking details email sent successfully!",
      });

      setTimeout(() => {
        setProgressOpen(false);
        setIsEmailModalOpen(false);
        setBccEmails("booking@japandriver.com");
      }, 500);
      
    } catch (error) {
      console.error('Error sending booking details email:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send email",
        variant: "destructive",
      });
      setTimeout(() => setProgressOpen(false), 1000);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Send booking invoice
  const handleSendBookingInvoice = async () => {
    if (!invoiceBccEmails.trim()) {
      toast({
        title: "Error",
        description: "Please enter at least one BCC email address",
        variant: "destructive",
      });
      return;
    }

    setIsSendingInvoice(true);
    setProgressOpen(true);
    setProgressVariant('invoice');
    setProgressTitle('Sending Booking Invoice');
    
    try {
      const bccEmailList = invoiceBccEmails.split(',').map(email => email.trim()).filter(email => email);
      
      // Start progress simulation and API call in parallel
      const progressPromise = startProgress(progressConfigs.sendEmail);
      
      const response = await fetch('/api/bookings/send-booking-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking?.id || id,
          bccEmails: bccEmailList,
          customer_email: booking?.customer_email
        }),
      });

      // Wait for both to complete
      await Promise.all([progressPromise, response]);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invoice');
      }

      toast({
        title: "Success",
        description: "Booking invoice sent successfully!",
      });

      setTimeout(() => {
        setProgressOpen(false);
        setIsInvoiceModalOpen(false);
        setInvoiceBccEmails("booking@japandriver.com");
      }, 500);
      
    } catch (error) {
      console.error('Error sending booking invoice:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invoice",
        variant: "destructive",
      });
      setTimeout(() => setProgressOpen(false), 1000);
    } finally {
      setIsSendingInvoice(false);
    }
  };



  // Reschedule booking
  const handleRescheduleBooking = async () => {
    if (!newDate || !newTime) {
      toast({
        title: "Error",
        description: "Please select both new date and time",
        variant: "destructive",
      });
      return;
    }

    setIsRescheduling(true);
    
    try {
      const response = await fetch('/api/bookings/reschedule-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking?.id || id,
          newDate: newDate,
          newTime: newTime
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reschedule booking');
      }

      const result = await response.json();
      
      toast({
        title: "Success",
        description: result.message || "Booking rescheduled successfully!",
      });

      // Close modal and reset form
      setIsRescheduleModalOpen(false);
      setNewDate('');
      setNewTime('');
      
      // Reload the page to show updated booking
      window.location.reload();
      
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reschedule booking",
        variant: "destructive",
      });
    } finally {
      setIsRescheduling(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading booking details...</span>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Booking Not Found</h3>
          <p className="text-muted-foreground mb-4">{error || 'The booking you are looking for does not exist.'}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <GoogleMapsProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
      <div className="space-y-6">
        {/* Enhanced Header with New Layout - Following Quotation Details Pattern */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Top Row - Title and Status */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold mb-2 break-words">
                      {t('bookings.details.fields.bookingNumber', { id: booking.wp_id || booking.booking_id || 'N/A' })}
                    </h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <p className="text-muted-foreground">
                        {t('bookings.details.createdOn', { date: booking.created_at ? formatDateDDMMYYYY(booking.created_at) : 'N/A' })}
                        {booking.creator && (
                          <span className="ml-2">
                            • {t('bookings.details.fields.createdBy')}: {booking.creator.full_name || t('bookings.details.fields.unknownUser')}
                          </span>
                        )}
                      </p>
                      {getStatusBadge(booking.status || 'pending')}
                    </div>
                  </div>
                </div>
                
                {/* Share, Edit, and Refresh buttons moved to top right */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 flex-shrink-0">
                  <div className="w-full sm:w-auto">
                    <BookingShareButtons booking={booking} />
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto gap-2 h-9"
                    onClick={() => router.push(`/bookings/${id}/edit`)}
                  >
                    <Edit className="h-4 w-4" />
                    {t('common.edit')}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto gap-2 h-9"
                    onClick={() => loadBooking()}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    {t('common.refresh')}
                  </Button>
                </div>
              </div>
              
              {/* Action Buttons Row - Show for all statuses */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2 border-t">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto gap-2"
                  onClick={() => setIsEmailModalOpen(true)}
                >
                  <Mail className="h-4 w-4" />
                  {t('bookings.actions.sendDetails')}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto gap-2"
                  onClick={() => setIsRescheduleModalOpen(true)}
                >
                  <CalendarPlus className="h-4 w-4" />
                  {t('bookings.actions.reschedule')}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto gap-2"
                  onClick={() => setIsInvoiceModalOpen(true)}
                >
                  <FileText className="h-4 w-4" />
                  {t('bookings.actions.sendInvoice')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-6">
          {/* Main Content - 2 columns on XL screens, full width on smaller */}
          <div className="xl:col-span-2 space-y-4 xl:space-y-6">
            {/* Customer Information */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{t('bookings.details.fields.customerInformation')}</h2>
                      <p className="text-sm text-muted-foreground">{t('bookings.details.fields.contactDetails')} and customer information</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contact Details - 3 elements */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium text-base">{t('bookings.details.fields.contactDetails')}</h3>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">{t('bookings.details.fields.customerName')}</div>
                          <div className="font-medium">{booking.customer_name || 'Aroon Muangkaew'}</div>
                        </div>
                        
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">{t('bookings.details.fields.email')}</div>
                          <div className="font-medium">{booking.customer_email || 'aroon.m@example.com'}</div>
                        </div>
                        
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">{t('bookings.details.fields.phone')}</div>
                          <div className="font-medium">{booking.customer_phone || '+66 98 765 4321'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Service Details - 3 elements */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium text-base">{t('bookings.details.fields.serviceDetails')}</h3>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">{t('bookings.details.fields.serviceType')}</div>
                          <div className="font-medium text-foreground">
                            {booking.service_name || booking.meta?.quotation_items?.[0]?.service_type_name || 'Airport Transfer'}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">{t('bookings.details.fields.pickupDate')} & {t('bookings.details.fields.pickupTime')}</div>
                          <div className="font-medium text-foreground">
                            {booking.date && booking.time ? `${formatDateDDMMYYYY(booking.date)} at ${booking.time}` : t('bookings.details.fields.notProvided')}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">
                            {(booking.service_name || booking.meta?.quotation_items?.[0]?.service_type_name || 'Airport Transfer') === 'Charter Services' 
                              ? t('bookings.details.fields.servicesDurations')
                              : t('bookings.details.fields.serviceType')
                            }
                          </div>
                          <div className="font-medium text-foreground">
                            {(booking.service_name || booking.meta?.quotation_items?.[0]?.service_type_name || 'Airport Transfer') === 'Charter Services' 
                              ? (booking.service_days && booking.hours_per_day 
                                  ? `${booking.service_days} ${t('bookings.details.fields.day')}${booking.service_days > 1 ? t('bookings.details.fields.days') : ''} × ${booking.hours_per_day} ${t('bookings.details.fields.hour')}${booking.hours_per_day > 1 ? t('bookings.details.fields.hours') : ''} = ${booking.duration_hours || (booking.service_days * booking.hours_per_day)} ${t('bookings.details.fields.total')} ${t('bookings.details.fields.hour')}${(booking.duration_hours || (booking.service_days * booking.hours_per_day)) > 1 ? t('bookings.details.fields.hours') : ''}`
                                  : booking.duration_hours 
                                    ? `${booking.duration_hours} ${t('bookings.details.fields.hour')}${booking.duration_hours > 1 ? t('bookings.details.fields.hours') : ''}`
                                    : t('bookings.details.fields.notSpecified')
                                )
                              : t('bookings.details.fields.fixedRateService')
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{t('bookings.details.fields.additionalInformation')}</h2>
                      <p className="text-sm text-muted-foreground">{t('bookings.details.fields.flightDetails')}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Flight Information Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">{t('bookings.details.fields.flightNumber')}</div>
                        <div className="font-medium text-foreground">
                          {booking.flight_number || t('bookings.details.fields.notProvided')}
                        </div>
                      </div>
                      
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">{t('bookings.details.fields.terminal')}</div>
                        <div className="font-medium text-foreground">
                          {booking.terminal || t('bookings.details.fields.notProvided')}
                        </div>
                      </div>
                    </div>
                    
                    {/* Passenger & Bags Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">{t('bookings.details.fields.passengers')}</div>
                        <div className="font-medium text-foreground">
                          {booking.number_of_passengers || t('bookings.details.fields.notSpecified')}
                        </div>
                      </div>
                      
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">{t('bookings.details.fields.bags')}</div>
                        <div className="font-medium text-foreground">
                          {booking.number_of_bags || t('bookings.details.fields.notSpecified')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle & Driver Assignment */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{t('bookings.details.fields.vehicleDriverAssignment')}</h2>
                      <p className="text-sm text-muted-foreground">{t('bookings.details.fields.vehicleDetails')}</p>
                    </div>
                  </div>
                  
                  {/* Current Assignment Status */}
                  <div className="p-4 bg-muted/50 border rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckIcon className={`h-4 w-4 ${assignedDriver && assignedVehicle ? 'text-green-600' : 'text-muted-foreground'}`} />
                      <h4 className="font-medium">{t('bookings.details.fields.currentAssignment')}</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Current Driver */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.currentDriver')}</span>
                        </div>
                        {assignedDriver ? (
                          <div className="p-3 bg-background rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="font-semibold">
                                  {`${assignedDriver.first_name} ${assignedDriver.last_name}`}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {assignedDriver.email || t('bookings.details.fields.noContactInfo')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {assignedDriver.phone || t('bookings.details.fields.noPhone')}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-4 bg-background rounded-lg border-2 border-dashed border-muted-foreground/20">
                            <User className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">{t('bookings.details.fields.noDriverAssigned')}</p>
                          </div>
                        )}
                      </div>

                      {/* Current Vehicle */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.currentVehicle')}</span>
                        </div>
                        {assignedVehicle ? (
                          <div className="p-3 bg-background rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                <Car className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold truncate">
                                  {`${assignedVehicle.brand} ${assignedVehicle.model}${assignedVehicle.year ? ` (${assignedVehicle.year})` : ''}`}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {assignedVehicle.plate_number || t('bookings.details.fields.plateNotAvailable')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {vehicleCategory || t('bookings.details.fields.notSpecified')}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-4 bg-background rounded-lg border-2 border-dashed border-muted-foreground/20">
                            <Car className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">{t('bookings.details.fields.noVehicleAssigned')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Assignment Actions */}
                  <div className="flex justify-center">
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto"
                      onClick={handleSmartAssignment}
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      {assignedDriver && assignedVehicle ? t('bookings.details.fields.reassign') : t('bookings.details.fields.assignDriverVehicle')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator className="my-6" />

            {/* Route Information */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{t('bookings.details.sections.route')}</h2>
                      <p className="text-sm text-muted-foreground">{t('bookings.details.fields.pickupDropoffLocations')}</p>
                    </div>
                  </div>
                  
                  {booking.pickup_location || booking.dropoff_location ? (
                    <div className="space-y-6">
                      {/* Pickup and Dropoff in 2-column layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Pickup Location */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">A</span>
                            </div>
                            <h3 className="font-semibold text-lg">{t('bookings.details.fields.pickupLocation')}</h3>
                          </div>
                          <div className="p-4 bg-muted/30 rounded-lg border min-h-[140px] flex flex-col justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium leading-relaxed text-foreground">{booking.pickup_location || t('bookings.details.fields.notSpecified')}</p>
                            </div>
                            <Button size="sm" variant="outline" className="mt-3 w-full">
                              <Navigation className="h-4 w-4 mr-2" />
                              {t('bookings.details.fields.navigateToPickup')}
                            </Button>
                          </div>
                        </div>

                        {/* Dropoff Location */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">B</span>
                            </div>
                            <h3 className="font-semibold text-lg">{t('bookings.details.fields.dropoffLocation')}</h3>
                          </div>
                          <div className="p-4 bg-muted/30 rounded-lg border min-h-[140px] flex flex-col justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium leading-relaxed text-foreground">{booking.dropoff_location || t('bookings.details.fields.notSpecified')}</p>
                            </div>
                            <Button size="sm" variant="outline" className="mt-3 w-full">
                              <Navigation className="h-4 w-4 mr-2" />
                              {t('bookings.details.fields.navigateToDropoff')}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Route Map */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg">{t('bookings.details.fields.routeMap')}</h3>
                        <div className="w-full h-64 rounded-lg overflow-hidden border">
                          {booking.pickup_location && booking.dropoff_location ? (
                            <iframe 
                              width="100%" 
                              height="100%" 
                              className="border-0"
                              loading="lazy"
                              allowFullScreen
                              title="Route Map"
                              src={`https://www.google.com/maps/embed/v1/directions?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&origin=${encodeURIComponent(booking.pickup_location)}&destination=${encodeURIComponent(booking.dropoff_location)}&mode=driving&language=ja&region=JP`}
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <div className="text-center">
                                <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Map will be displayed when locations are available</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Distance and Duration */}
                      {(booking.distance || booking.duration) && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-sm text-muted-foreground">Distance</div>
                            <div className="font-semibold">{booking.distance || 'N/A'}</div>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-sm text-muted-foreground">Duration</div>
                            <div className="font-semibold">{booking.duration || 'N/A'}</div>
                          </div>
                        </div>
                      )}

                      {/* Weather Forecast */}
                      <WeatherForecast 
                        location={booking.pickup_location || ''}
                        date={booking.date || ''}
                      />
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">{t('bookings.details.fields.noRouteInformation')}</h3>
                      <p className="text-muted-foreground">{t('bookings.details.fields.noRouteInformationDescription')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        
          {/* Right Column: Booking Status, Workflow and Actions */}
          <div className="space-y-4 xl:space-y-6">
            {/* Booking Status Block */}
            <Card className="border rounded-lg shadow-sm dark:border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">{t('bookings.details.fields.bookingStatus')}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {/* Status Section */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const status = booking.status || 'pending';
                          switch (status) {
                            case 'pending':
                              return <CheckCircle className="h-5 w-5 text-amber-500" />;
                            case 'confirmed':
                              return <CheckCircle className="h-5 w-5 text-green-500" />;
                            case 'assigned':
                              return <CheckCircle className="h-5 w-5 text-blue-500" />;
                            case 'completed':
                              return <CheckCircle className="h-5 w-5 text-green-500" />;
                            case 'cancelled':
                              return <CheckCircle className="h-5 w-5 text-red-500" />;
                            default:
                              return <CheckCircle className="h-5 w-5 text-amber-500" />;
                          }
                        })()}
                        <span className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.status')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={booking.status || 'pending'} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-36 h-8 bg-background border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                              Pending
                            </div>
                          </SelectItem>
                          <SelectItem value="confirmed">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              Confirmed
                            </div>
                          </SelectItem>
                          <SelectItem value="assigned">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              Assigned
                            </div>
                          </SelectItem>
                          <SelectItem value="completed">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
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
                    </div>
                  </div>
                  
                  {/* Creation Date Section */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.created')}</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {booking.created_at ? new Date(booking.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      }) : 'N/A'}
                    </div>
                  </div>
                  
                  {/* Last Updated Section */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.lastUpdated')}</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {booking.updated_at ? new Date(booking.updated_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      }) : 'N/A'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Workflow */}
            <BookingWorkflow 
              booking={{
                id: booking.id || id,
                status: booking.status || 'pending',
                created_at: booking.created_at || new Date().toISOString(),
                payment_status: booking.payment_status,
                payment_completed_at: booking.meta?.payment_completed_at,
                driver_id: booking.driver_id,
                vehicle_id: booking.vehicle_id,
                assigned_at: booking.meta?.assigned_at,
                completed_at: booking.meta?.completed_at,
                date: booking.date || '',
                time: booking.time || '',
                customer_email: booking.customer_email,
                customer_name: booking.customer_name,
                price: booking.price,
                payment_link: booking.payment_link,
                payment_link_generated_at: booking.meta?.payment_link_generated_at,
                payment_link_expires_at: booking.meta?.payment_link_expires_at,
                receipt_url: booking.meta?.receipt_url
              }}
              onMarkAsPaid={() => {
                // Refresh the page to update the booking data
                window.location.reload();
              }}
              onAssignDriver={() => {
                // Open the smart assignment modal
                handleSmartAssignment();
              }}
              onMarkAsComplete={() => {
                // Refresh the page to update the booking data
                window.location.reload();
              }}
              onRefresh={() => {
                // Refresh the page to update the booking data
                window.location.reload();
              }}
              isOrganizationMember={true} // You might want to check user permissions here
            />


          {/* Notes & Comments Section - Following Quotation Details Pattern */}
          {(booking.notes || booking.meta?.chbs_comment) && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{t('bookings.details.fields.notesComments')}</h2>
                      <p className="text-sm text-muted-foreground">{t('bookings.details.fields.internalNotesDescription')}</p>
                    </div>
                  </div>
                  
                  {/* Internal Notes Section */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <StickyNote className="h-3 w-3 text-muted-foreground" />
{t('bookings.details.fields.internalNotes')}
                    </h4>
                    <div 
                      className="text-sm leading-relaxed bg-muted/30 rounded-md p-3 border-l-4 border-l-orange-500 whitespace-pre-wrap break-words"
                    >
                      {booking.notes || booking.meta?.chbs_comment || t('bookings.details.fields.noInternalNotes')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
{t('bookings.details.fields.internalNotesNote')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Smart Assignment Modal */}
      <SmartAssignmentModal
        booking={booking ? {
          id: booking.id || id,
          wp_id: booking.wp_id,
          service_name: booking.service_name || booking.meta?.quotation_items?.[0]?.service_type_name,
          date: booking.date || '',
          time: booking.time || '',
          customer_name: booking.customer_name,
          driver_id: booking.driver_id,
          vehicle_id: booking.vehicle_id,
          driver: booking.driver_id ? {
            id: booking.driver_id,
            first_name: booking.meta?.driver_name?.split(' ')[0] || '',
            last_name: booking.meta?.driver_name?.split(' ').slice(1).join(' ') || '',
            email: booking.meta?.driver_email || '',
            phone: booking.meta?.driver_phone || '',
            profile_image_url: undefined,
            status: 'available',
            is_available: true
          } : undefined,
          vehicle: booking.vehicle_id ? {
            id: booking.vehicle_id,
            name: booking.vehicle?.name || booking.meta?.vehicle_name || '',
            plate_number: booking.vehicle?.plate_number || booking.meta?.vehicle_plate_number || '',
            brand: booking.vehicle?.brand || '',
            model: booking.vehicle?.model || '',
            year: typeof booking.vehicle?.year === 'string' ? parseInt(booking.vehicle.year) : booking.vehicle?.year,
            image_url: booking.vehicle?.image_url,
            status: 'active',
            is_available: true,
            category_name: assignedVehicle?.pricing_category_vehicles?.[0]?.pricing_categories?.name || vehicleCategory,
            pricing_category_vehicles: assignedVehicle?.pricing_category_vehicles
          } : undefined
        } : null}
        isOpen={isSmartModalOpen}
        onClose={() => setIsSmartModalOpen(false)}
        onAssign={handleAssign}
        onUnassignDriver={handleUnassignDriver}
        onUnassignVehicle={handleUnassignVehicle}
        onUnassignAll={handleUnassignAll}
        drivers={drivers}
        vehicles={vehicles}
        title={`Smart Assignment for #${booking?.wp_id || id}`}
        subtitle="Select a driver and vehicle for this booking. The system will suggest the best matches based on the service type."
        />

        {/* Send Booking Details Modal */}
        <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Booking Details Email
              </DialogTitle>
              <DialogDescription>
                Send an email with booking details and Google Calendar integration to the customer.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="customer-email">Customer Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={booking?.customer_email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email will be sent to the customer's registered email address
                </p>
              </div>
              
              <div>
                <Label htmlFor="bcc-emails">BCC Emails</Label>
                <Input
                  id="bcc-emails"
                  value={bccEmails}
                  onChange={(e) => setBccEmails(e.target.value)}
                  placeholder="Enter email addresses separated by commas"
                  className="font-mono text-sm bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Default: booking@japandriver.com. Add more emails separated by commas.
                </p>
              </div>
              
              <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
                <h4 className="font-medium text-sm text-green-900 dark:text-green-100 mb-2">
                  📧 What's included in the email:
                </h4>
                <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
                  <li>• Complete booking details and service information</li>
                  <li>• Pickup and dropoff locations with times</li>
                  <li>• Driver and vehicle information</li>
                  <li>• Pricing breakdown and total amount</li>
                  <li>• Google Calendar integration button</li>
                  <li>• Contact information for changes</li>
                </ul>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEmailModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendBookingDetails} 
                disabled={isSendingEmail}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>



        {/* Send Booking Invoice PDF Modal */}
        <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {(() => {
                  const bookingStatus = booking?.status || 'pending';
                  const isPending = bookingStatus === 'pending';
                  return isPending ? 'Send Invoice with Payment Link' : 'Send Paid Invoice';
                })()}
              </DialogTitle>
              <DialogDescription>
                {(() => {
                  const bookingStatus = booking?.status || 'pending';
                  const isPending = bookingStatus === 'pending';
                  return isPending 
                    ? 'Send an invoice PDF with payment link for pending payment.'
                    : 'Send a paid invoice PDF for completed payment.';
                })()}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="invoice-customer-email">Customer Email</Label>
                <Input
                  id="invoice-customer-email"
                  type="email"
                  value={booking?.customer_email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Invoice will be sent to the customer's registered email address
                </p>
              </div>
              
              <div>
                <Label htmlFor="invoice-bcc-emails">BCC Emails</Label>
                <Input
                  id="invoice-bcc-emails"
                  value={invoiceBccEmails}
                  onChange={(e) => setInvoiceBccEmails(e.target.value)}
                  placeholder="Enter email addresses separated by commas"
                  className="font-mono text-sm bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Default: booking@japandriver.com. Add more emails separated by commas.
                </p>
              </div>
              
              {/* Conditional content based on booking status */}
              {(() => {
                const bookingStatus = booking?.status || 'pending';
                const isPending = bookingStatus === 'pending';
                
                if (isPending) {
                  return (
                    <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-md">
                      <h4 className="font-medium text-sm text-orange-900 dark:text-orange-100 mb-2">
                        💳 Invoice with Payment Link (Pending Payment):
                      </h4>
                      <ul className="text-xs text-orange-800 dark:text-orange-200 space-y-1">
                        <li>• Complete service details and pricing breakdown</li>
                        <li>• Payment status: PENDING PAYMENT</li>
                        <li>• Secure payment link for online payment</li>
                        <li>• Multiple payment methods (credit card, etc.)</li>
                        <li>• Professional invoice PDF attachment</li>
                      </ul>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-md">
                      <h4 className="font-medium text-sm text-purple-900 dark:text-purple-100 mb-2">
                        ✅ Paid Invoice (No Payment Required):
                      </h4>
                      <ul className="text-xs text-purple-800 dark:text-purple-200 space-y-1">
                        <li>• Complete service details and pricing breakdown</li>
                        <li>• Payment status: PAID</li>
                        <li>• Coupon discounts and tax calculations</li>
                        <li>• Professional invoice PDF attachment</li>
                        <li>• Clean invoice format for records</li>
                      </ul>
                    </div>
                  );
                }
              })()}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInvoiceModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendBookingInvoice} 
                disabled={isSendingInvoice}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isSendingInvoice ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    {(() => {
                      const bookingStatus = booking?.status || 'pending';
                      const isPending = bookingStatus === 'pending';
                      return isPending ? 'Send Invoice with Payment Link' : 'Send Paid Invoice';
                    })()}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reschedule Booking Modal */}
        <Dialog open={isRescheduleModalOpen} onOpenChange={setIsRescheduleModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Reschedule Booking</DialogTitle>
              <DialogDescription>
                Change the date and time for booking #{booking?.wp_id || id}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Date and Time Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-date">New Date</Label>
                  <Input
                    id="new-date"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-time">New Time</Label>
                  <Input
                    id="new-time"
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Current Booking Information */}
              <div className="bg-muted/50 p-4 rounded-md">
                <h3 className="text-sm font-medium mb-2">Booking Information</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  {booking?.service_name || 'Unnamed Service'}
                </p>
                <p className="text-sm text-muted-foreground mb-1">
                  Current Date: {booking?.date || 'Not set'} at {booking?.time || 'Not set'}
                </p>
                {booking?.customer_name && (
                  <p className="text-sm text-muted-foreground">
                    Customer: {booking.customer_name}
                  </p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRescheduleModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleRescheduleBooking} 
                disabled={isRescheduling || !newDate || !newTime}
              >
                {isRescheduling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rescheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Reschedule
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Enhanced Progress Modal */}
        <LoadingModal
          open={progressOpen}
          title={progressTitle}
          label={progressLabel}
          value={progressValue}
          variant={progressVariant}
          showSteps={progressSteps.length > 0}
          steps={progressSteps}
          onOpenChange={setProgressOpen}
        />
      </div>
        </GoogleMapsProvider>
  );
}