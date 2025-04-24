import { supabase } from '@/lib/supabase';
import { VehicleAssignment, VehicleAssignmentInput } from '@/types/vehicle-assignments';

export async function getVehicleAssignmentsByVehicleId(vehicleId: string): Promise<VehicleAssignment[]> {
  const { data, error } = await supabase
    .from('vehicle_assignments')
    .select(`
      id,
      vehicle_id,
      driver_id,
      status,
      start_date,
      end_date,
      notes,
      created_at,
      updated_at,
      driver:driver_id (
        id, 
        first_name, 
        last_name, 
        email, 
        status,
        profile_image_url
      )
    `)
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vehicle assignments:', error);
    throw error;
  }

  return data.map(item => ({
    id: item.id,
    vehicleId: item.vehicle_id,
    driverId: item.driver_id,
    status: item.status as 'active' | 'inactive',
    startDate: item.start_date,
    endDate: item.end_date || undefined,
    notes: item.notes || undefined,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    driver: item.driver ? {
      id: item.driver.id,
      first_name: item.driver.first_name,
      last_name: item.driver.last_name,
      email: item.driver.email,
      status: item.driver.status,
      profile_image_url: item.driver.profile_image_url
    } : undefined
  }));
}

export async function getVehicleAssignmentsByDriverId(driverId: string): Promise<VehicleAssignment[]> {
  const { data, error } = await supabase
    .from('vehicle_assignments')
    .select(`
      id,
      vehicle_id,
      driver_id,
      status,
      start_date,
      end_date,
      notes,
      created_at,
      updated_at,
      vehicle:vehicle_id (
        id, 
        name, 
        plate_number, 
        brand, 
        model,
        image_url
      )
    `)
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vehicle assignments:', error);
    throw error;
  }

  return data.map(item => ({
    id: item.id,
    vehicleId: item.vehicle_id,
    driverId: item.driver_id,
    status: item.status as 'active' | 'inactive',
    startDate: item.start_date,
    endDate: item.end_date || undefined,
    notes: item.notes || undefined,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    vehicle: item.vehicle ? {
      id: item.vehicle.id,
      name: item.vehicle.name,
      plate_number: item.vehicle.plate_number,
      brand: item.vehicle.brand,
      model: item.vehicle.model,
      image_url: item.vehicle.image_url
    } : undefined
  }));
}

export async function createVehicleAssignment(assignment: VehicleAssignmentInput): Promise<VehicleAssignment> {
  // Check if there's an existing active assignment for this vehicle
  const { data: existingAssignments } = await supabase
    .from('vehicle_assignments')
    .select('id')
    .eq('vehicle_id', assignment.vehicleId)
    .eq('status', 'active');

  // If there's an existing active assignment, end it first
  if (existingAssignments && existingAssignments.length > 0) {
    await supabase
      .from('vehicle_assignments')
      .update({
        status: 'inactive',
        end_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('vehicle_id', assignment.vehicleId)
      .eq('status', 'active');
  }

  // Create the new assignment
  const { data, error } = await supabase
    .from('vehicle_assignments')
    .insert({
      vehicle_id: assignment.vehicleId,
      driver_id: assignment.driverId,
      status: assignment.status || 'active',
      start_date: assignment.startDate || new Date().toISOString(),
      notes: assignment.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating vehicle assignment:', error);
    throw error;
  }

  // Also update any inspections for this vehicle with the driver_id
  if (data) {
    await supabase
      .from('inspections')
      .update({ 
        driver_id: assignment.driverId,
        updated_at: new Date().toISOString()
      })
      .eq('vehicle_id', assignment.vehicleId)
      .is('driver_id', null);
  }

  return {
    id: data.id,
    vehicleId: data.vehicle_id,
    driverId: data.driver_id,
    status: data.status,
    startDate: data.start_date,
    endDate: data.end_date || undefined,
    notes: data.notes || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function endVehicleAssignment(assignmentId: string): Promise<VehicleAssignment> {
  const { data, error } = await supabase
    .from('vehicle_assignments')
    .update({
      status: 'inactive',
      end_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', assignmentId)
    .select()
    .single();

  if (error) {
    console.error('Error ending vehicle assignment:', error);
    throw error;
  }

  return {
    id: data.id,
    vehicleId: data.vehicle_id,
    driverId: data.driver_id,
    status: data.status,
    startDate: data.start_date,
    endDate: data.end_date,
    notes: data.notes || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function getActiveVehicleAssignmentForVehicle(vehicleId: string): Promise<VehicleAssignment | null> {
  const { data, error } = await supabase
    .from('vehicle_assignments')
    .select(`
      id,
      vehicle_id,
      driver_id,
      status,
      start_date,
      end_date,
      notes,
      created_at,
      updated_at,
      driver:driver_id (
        id, 
        first_name, 
        last_name, 
        email, 
        status,
        profile_image_url
      )
    `)
    .eq('vehicle_id', vehicleId)
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No records found - this is fine, return null
      return null;
    }
    console.error('Error fetching active vehicle assignment:', error);
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    vehicleId: data.vehicle_id,
    driverId: data.driver_id,
    status: data.status as 'active' | 'inactive',
    startDate: data.start_date,
    endDate: data.end_date || undefined,
    notes: data.notes || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    driver: data.driver ? {
      id: data.driver.id,
      first_name: data.driver.first_name,
      last_name: data.driver.last_name,
      email: data.driver.email,
      status: data.driver.status,
      profile_image_url: data.driver.profile_image_url
    } : undefined
  };
} 