import { createServiceClient } from "@/lib/supabase";

const supabase = createServiceClient();

export async function seedDatabase() {
  // console.log("Seeding database...");
  // // Seed Vehicles with realistic data
  // const { error: vehiclesError } = await supabase.from('vehicles').upsert([
  //   {
  //     id: '1',
  //     name: 'Toyota Camry',
  //     plate_number: '123 ABC',
  //     model: 'Camry SE',
  //     year: '2023',
  //     status: 'active',
  //     image_url: 'https://example.com/camry.jpg',
  //     // Ensure these match your vehicles table schema accurately
  //     // last_inspection: new Date('2024-02-01').toISOString(), 
  //     // next_inspection: new Date('2024-03-01').toISOString(),
  //     mileage: 15000,
  //     // brand, user_id, vin etc. might be required
  //   },
  // ]);
  // if (vehiclesError) console.error('Error seeding vehicles:', vehiclesError);

  // // Seed Drivers
  // const { error: driversError } = await supabase.from('drivers').upsert([
  //   {
  //     id: '1',
  //     // name: 'John Doe', // drivers table likely has first_name, last_name
  //     first_name: 'John',
  //     last_name: 'Doe',
  //     email: 'john@example.com',
  //     license_number: 'DL123456',
  //     status: 'active',
  //     // user_id might be required if it links to auth.users
  //   },
  //   {
  //     id: '2',
  //     // name: 'Jane Smith',
  //     first_name: 'Jane',
  //     last_name: 'Smith',
  //     email: 'jane@example.com',
  //     license_number: 'DL789012',
  //     status: 'active',
  //   }
  // ]);
  // if (driversError) console.error('Error seeding drivers:', driversError);

  // // Seed Inspections
  // const { error: inspectionsError } = await supabase.from('inspections').upsert([
  //   {
  //     // id should likely be auto-generated UUID, or provide one if manual
  //     vehicle_id: '1', // Ensure this vehicle_id exists
  //     status: 'completed',
  //     type: 'routine',
  //     notes: 'Regular maintenance check',
  //     date: new Date('2024-02-01').toISOString(), // inspections table uses 'date'
  //     // completed_at: new Date('2024-02-01').toISOString(), // if applicable
  //     // items: jsonb field, ensure structure is correct or handle separately
  //     // 'items' was causing an error, it might be a separate table `inspection_items` 
  //     // created_by (user_id) is likely required
  //   },
  // ]);
  // if (inspectionsError) console.error('Error seeding inspections:', inspectionsError);

  // // Seed Tasks (if 'tasks' table exists and is different from 'maintenance_tasks')
  // // The linter indicated 'tasks' might not be a known table.
  // // If this refers to maintenance_tasks, use that table name.
  // /*
  // const { error: tasksError } = await supabase.from('tasks').upsert([
  //   {
  //     title: 'Monthly Inspection',
  //     vehicle_id: '1',
  //     due_date: new Date('2024-03-01').toISOString(),
  //     status: 'pending',
  //     // type: 'inspection' // This might be specific to maintenance_tasks or a general task type
  //   },
  // ]);
  // if (tasksError) console.error('Error seeding tasks:', tasksError);
  // */
  // console.log("Database seeding attempt complete. Check console for errors.");
} 