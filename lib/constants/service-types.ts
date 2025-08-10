// Service Type Constants
// These IDs correspond to records in the service_types table

export const SERVICE_TYPE_IDS = {
  CHARTER_SERVICES: '212ea0ed-0012-4d87-8722-b1145495a561',
  AIRPORT_TRANSFER_HANEDA: 'a2538c63-bad1-4523-a234-a708b03744b4',
  AIRPORT_TRANSFER_NARITA: '296804ed-3879-4cfc-b7dd-e57d18df57a2',
} as const;

// Use Charter Services as the service type for packages since packages don't have their own service_type_id
export const PACKAGE_SERVICE_TYPE_ID = SERVICE_TYPE_IDS.CHARTER_SERVICES;
