'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Loader2, RefreshCw } from 'lucide-react';
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

// Schema for service type form validation
const serviceTypeFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long.'),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

// Interface for the service type data received from API / used in state
interface ServiceType {
  id: string; // UUID
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export default function PricingServiceTypesTab() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingServiceType, setDeletingServiceType] = useState<ServiceType | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof serviceTypeFormSchema>>({
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

  const fetchServiceTypes = async () => {
    // Determine if this is the initial load or a subsequent refresh
    if (!isRefreshing) setIsLoading(true);

    console.log("Fetching service types...");
    try {
      const timestamp = new Date().getTime();
      const randomValue = Math.random().toString(36).substring(2, 15);
      const url = `/api/pricing/service-types?t=${timestamp}&nocache=${randomValue}`;
      console.log(`Fetching from URL: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error ${response.status}`}));
        throw new Error(errorData.error || `Failed to fetch service types: ${response.statusText}`);
      }
      
      const data: ServiceType[] = await response.json();
      
      if (Array.isArray(data)) {
        console.log('Service types fetched:', data);
        setServiceTypes(data);
      } else {
        console.error('Expected array but got:', data);
        setServiceTypes([]); // Reset to empty array on invalid data
        toast({
          title: 'Error',
          description: 'Received invalid data format from server.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching service types:', error);
      setServiceTypes([]); // Reset to empty array on error
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load service types.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const refreshServiceTypes = () => {
    setIsRefreshing(true);
    fetchServiceTypes();
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

  const handleSubmit = async (values: z.infer<typeof serviceTypeFormSchema>) => {
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Service Types</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={refreshServiceTypes}
            disabled={isLoading || isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service Type
          </Button>
        </div>
      </div>
      
      {isLoading && !isRefreshing ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : serviceTypes.length === 0 ? (
        <div className="bg-muted/40 border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">No service types found.</p>
          <Button variant="outline" className="mt-4" onClick={openAddDialog}>
            Add your first service type
          </Button>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceTypes.map((serviceType) => (
                <TableRow key={serviceType.id}>
                  <TableCell className="font-medium">{serviceType.name}</TableCell>
                  <TableCell>{serviceType.description || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      serviceType.is_active 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300'
                    }`}>
                      {serviceType.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(serviceType)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(serviceType)}
                        title="Delete"
                        className="hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
    </div>
  );
} 