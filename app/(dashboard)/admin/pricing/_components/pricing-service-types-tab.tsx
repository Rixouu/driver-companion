'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, RefreshCw, Edit, Trash } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn, getStatusBadgeClasses } from '@/lib/utils/styles';
import { useI18n } from '@/lib/i18n/context';
import { Card, CardContent } from '@/components/ui/card';
import { PricingTabHeader, StatusBadge } from './pricing-tab-header';
import { PricingResponsiveTable, PricingTableHeader, PricingTableHead, PricingTableRow, PricingTableCell } from './pricing-responsive-table';

// Schema for service type form validation
const serviceTypeFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long.'),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

type ServiceTypeFormValues = z.infer<typeof serviceTypeFormSchema>;

// Interface for the service type data received from API / used in state
interface ServiceType {
  id: string; // UUID
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

interface PricingCategory {
  id: string;
  name: string;
  description: string | null;
  service_type_ids: string[];
}

export default function PricingServiceTypesTab() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingServiceType, setDeletingServiceType] = useState<ServiceType | null>(null);
  const { toast } = useToast();
  const { t } = useI18n();

  const form = useForm<ServiceTypeFormValues>({
    resolver: zodResolver(serviceTypeFormSchema),
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
    },
  });

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  const fetchData = async () => {
    // Determine if this is the initial load or a subsequent refresh
    if (!isRefreshing) setIsLoading(true);

    console.log("Fetching data in parallel...");
    try {
      // Fetch both service types and categories in parallel for faster loading
      const [serviceTypesResponse, categoriesResponse] = await Promise.all([
        fetch('/api/pricing/service-types', {
          method: 'GET',
          cache: 'default',
        }),
        fetch('/api/pricing/categories/display', {
          method: 'GET',
          cache: 'default',
        })
      ]);

      // Handle service types response
      if (!serviceTypesResponse.ok) {
        const errorData = await serviceTypesResponse.json().catch(() => ({ error: `HTTP error ${serviceTypesResponse.status}`}));
        throw new Error(errorData.error || `Failed to fetch service types: ${serviceTypesResponse.statusText}`);
      }
      
      const serviceTypesData: ServiceType[] = await serviceTypesResponse.json();
      
      if (Array.isArray(serviceTypesData)) {
        console.log('Service types fetched:', serviceTypesData);
        setServiceTypes(serviceTypesData);
      } else {
        console.error('Expected array but got:', serviceTypesData);
        setServiceTypes([]);
        toast({
          title: 'Error',
          description: 'Received invalid data format from server.',
          variant: 'destructive',
        });
      }

      // Handle categories response
      if (categoriesResponse.ok) {
        const categoriesData: PricingCategory[] = await categoriesResponse.json();
        if (Array.isArray(categoriesData)) {
          console.log('Categories fetched for display:', categoriesData);
          setCategories(categoriesData);
        } else {
          console.warn('Invalid categories data format:', categoriesData);
          setCategories([]);
        }
      } else {
        console.warn('Failed to fetch categories for display:', categoriesResponse.status);
        setCategories([]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setServiceTypes([]);
      setCategories([]);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchServiceTypes = async () => {
    await fetchData();
  };

  const fetchCategories = async () => {
    try {
      console.log("Fetching categories for display...");
      const url = `/api/pricing/categories/display`;
      
      const response = await fetch(url, {
        method: 'GET',
        cache: 'default',
      });

      if (!response.ok) {
        console.warn('Failed to fetch categories for display:', response.status);
        setCategories([]);
        return;
      }
      
      const data: PricingCategory[] = await response.json();
      
      if (Array.isArray(data)) {
        console.log('Categories fetched for display:', data);
        setCategories(data);
      } else {
        console.warn('Invalid categories data format:', data);
        setCategories([]);
      }
    } catch (error) {
      console.warn('Error fetching categories for display:', error);
      setCategories([]);
      // Don't show error toast for categories - it's not critical
    }
  };

  const refreshServiceTypes = () => {
    setIsRefreshing(true);
    fetchServiceTypes();
  };

  const refreshCategories = () => {
    fetchCategories();
  };

  const openAddDialog = () => {
    form.reset({
      name: '',
      description: '',
      is_active: true,
    });
    setEditingServiceType(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (serviceType: ServiceType) => {
    form.reset({
      name: serviceType.name,
      description: serviceType.description || '', // Handle null description for form
      is_active: serviceType.is_active,
    });
    setEditingServiceType(serviceType);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (serviceType: ServiceType) => {
    setDeletingServiceType(serviceType);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (values: ServiceTypeFormValues) => {
    setIsSubmitting(true);
    try {
      const url = editingServiceType
        ? `/api/pricing/service-types/${editingServiceType.id}` // ID is now a UUID
        : '/api/pricing/service-types';
      const method = editingServiceType ? 'PUT' : 'POST';

      // Ensure description is null if empty string, or keep as is if undefined for PATCH-like behavior
      const payload = {
        ...values,
        description: values.description === '' ? null : values.description,
      };

      console.log(`${method} request to ${url} with data:`, payload);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Operation failed with status: ' + response.status }));
        throw new Error(errorData.error || 'Failed to save service type');
      }

      const responseData: ServiceType = await response.json();
      console.log('Service type saved:', responseData);

      toast({
        title: 'Success',
        description: editingServiceType
          ? 'Service type updated successfully.'
          : 'Service type created successfully.',
      });

      setIsDialogOpen(false);
      fetchServiceTypes(); // Single refresh after successful operation

    } catch (error) {
      console.error('Error saving service type:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save service type',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingServiceType) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/pricing/service-types/${deletingServiceType.id}`, { // ID is UUID
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Delete failed with status: ' + response.status }));
        throw new Error(errorData.error || 'Failed to delete service type');
      }

      toast({
        title: 'Success',
        description: 'Service type deleted successfully.',
      });
      setDeleteDialogOpen(false);
      fetchServiceTypes(); // Single refresh

    } catch (error) {
      console.error('Error deleting service type:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete service type',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryDescription = (serviceTypeId: string): string => {
    if (categories.length === 0) {
      return 'Loading categories...';
    }
    const cat = categories.find(c => Array.isArray(c.service_type_ids) && c.service_type_ids.includes(serviceTypeId));
    if (cat) {
      return cat.description || cat.name;
    }
    return 'No category assigned';
  };

  const getCategoryDescriptionWithStatus = (serviceTypeId: string): { text: string; isLoading: boolean } => {
    if (categories.length === 0) {
      return { text: 'Loading categories...', isLoading: true };
    }
    const cat = categories.find(c => Array.isArray(c.service_type_ids) && c.service_type_ids.includes(serviceTypeId));
    if (cat) {
      return { 
        text: cat.description || cat.name,
        isLoading: false
      };
    }
    return { 
      text: 'No category assigned',
      isLoading: false
    };
  };

  return (
    <Card>
      <PricingTabHeader
        title="Service Types"
        description="Manage the individual service types for your pricing structure."
        icon={<Plus className="h-5 w-5" />}
        badges={
          <>
            {!isLoading && serviceTypes.length > 0 && (
              <StatusBadge type="info">⚡ {serviceTypes.length} types loaded</StatusBadge>
            )}
            {categories.length > 0 ? (
              <StatusBadge type="success">📁 {categories.length} categories</StatusBadge>
            ) : !isLoading ? (
              <StatusBadge type="warning">📁 Loading categories...</StatusBadge>
            ) : null}
          </>
        }
        actions={
          <>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                setIsRefreshing(true);
                fetchData(); // Use the optimized parallel fetch
              }}
              disabled={isLoading || isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={openAddDialog}
              variant="default"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service Type
            </Button>
          </>
        }
      />
      <CardContent>
      {isLoading && !isRefreshing ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">Loading Service Types</p>
              <p className="text-sm text-muted-foreground">Please wait while we fetch your service types...</p>
            </div>
          </div>
        </div>
      ) : serviceTypes.length === 0 ? (
        <div className="bg-gradient-to-br from-muted/30 to-muted/20 dark:from-muted/20 dark:to-muted/10 border border-muted rounded-xl p-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">No Service Types Found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Get started by creating your first service type. This will help you organize your pricing structure.
              </p>
            </div>
            <Button onClick={openAddDialog} variant="default">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Service Type
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <PricingResponsiveTable>
            <PricingTableHeader>
              <PricingTableHead>Service Type</PricingTableHead>
              <PricingTableHead>Category Assignment</PricingTableHead>
              <PricingTableHead>Status</PricingTableHead>
              <PricingTableHead className="text-right">Actions</PricingTableHead>
            </PricingTableHeader>
            <TableBody>
              {serviceTypes.map((serviceType, index) => (
                <PricingTableRow key={serviceType.id} index={index}>
                  <PricingTableCell>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground text-sm sm:text-base">{serviceType.name}</div>
                        {serviceType.description && (
                          <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{serviceType.description}</div>
                        )}
                      </div>
                    </div>
                  </PricingTableCell>
                  <PricingTableCell>
                    <div className="space-y-1">
                      {(() => {
                        if (categories.length === 0) {
                          return (
                            <div className="text-sm text-muted-foreground">
                              <div className="animate-pulse bg-muted h-4 w-24 rounded"></div>
                              <div className="animate-pulse bg-muted h-3 w-32 rounded mt-1"></div>
                            </div>
                          );
                        }
                        
                        // Find ALL categories that this service type is linked to
                        const linkedCategories = categories.filter(c => 
                          Array.isArray(c.service_type_ids) && 
                          c.service_type_ids.includes(serviceType.id)
                        );
                        
                        if (linkedCategories.length === 0) {
                          return (
                            <div className="text-sm text-muted-foreground">
                              No category assigned
                            </div>
                          );
                        }
                        
                        // Show all linked categories
                        return (
                          <div className="space-y-1">
                            {linkedCategories.map((category, idx) => (
                              <div key={category.id} className="flex items-start gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-foreground text-sm sm:text-base">{category.name}</div>
                                  {category.description && (
                                    <div className="text-xs text-muted-foreground line-clamp-2">{category.description}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </PricingTableCell>
                  <PricingTableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs px-3 py-1.5 font-medium',
                        getStatusBadgeClasses(serviceType.is_active ? 'active' : 'inactive')
                      )}
                    >
                      {serviceType.is_active ? t('common.status.active') : t('common.status.inactive')}
                    </Badge>
                  </PricingTableCell>
                  <PricingTableCell className="text-right">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-muted"
                        onClick={() => openEditDialog(serviceType)}
                        title={t('common.edit')}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => openDeleteDialog(serviceType)}
                        title={t('common.delete')}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </PricingTableCell>
                </PricingTableRow>
              ))}
            </TableBody>
          </PricingResponsiveTable>
        </div>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingServiceType ? 'Edit Service Type' : 'Add New Service Type'}
            </DialogTitle>
            <DialogDescription>
              {editingServiceType 
                ? 'Update the details for this service type.' 
                : 'Enter the details for the new service type.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Airport Transfer Haneda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Optional: A brief description of the service type"
                        className="resize-none" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <DialogDescription>
                        Inactive service types cannot be used for new pricing items.
                      </DialogDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingServiceType ? 'Save Changes' : 'Create Service Type'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the service type: <span className="font-semibold">{deletingServiceType?.name}</span>?
              This action cannot be undone. Associated pricing items will prevent deletion unless unlinked.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Service Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </CardContent>
    </Card>
  );
} 