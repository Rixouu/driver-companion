import { Driver } from './index';
import { Vehicle } from './vehicles';

export interface VehicleAssignment {
  id: string;
  vehicleId: string;
  driverId: string;
  status: 'active' | 'inactive';
  startDate: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Expanded relationships (when queried with joins)
  driver?: Driver;
  vehicle?: Vehicle;
}

export interface VehicleAssignmentInput {
  vehicleId: string;
  driverId: string;
  status?: 'active' | 'inactive';
  startDate?: string;
  notes?: string;
} 