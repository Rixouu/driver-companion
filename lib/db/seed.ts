import { supabase } from "@/lib/supabase"

export async function seedDatabase() {
  // Seed Vehicles with realistic data
  const { error: vehiclesError } = await supabase.from('vehicles').upsert([
    {
      id: '1',
      name: 'Toyota Camry',
      plate_number: '123 ABC',
      model: 'Camry SE',
      year: '2023',
      status: 'active',
      image_url: 'https://example.com/camry.jpg',
      last_inspection: new Date('2024-02-01').toISOString(),
      next_inspection: new Date('2024-03-01').toISOString(),
      mileage: 15000
    },
    // Add more vehicles...
  ])

  if (vehiclesError) console.error('Error seeding vehicles:', vehiclesError)

  // Seed Drivers
  const { error: driversError } = await supabase.from('drivers').upsert([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      license_number: 'DL123456',
      status: 'active'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      license_number: 'DL789012',
      status: 'active'
    }
  ])

  if (driversError) console.error('Error seeding drivers:', driversError)

  // Seed Inspections with realistic data
  const { error: inspectionsError } = await supabase.from('inspections').upsert([
    {
      vehicle_id: '1',
      status: 'completed',
      type: 'routine',
      notes: 'Regular maintenance check',
      created_at: new Date('2024-02-01').toISOString(),
      completed_at: new Date('2024-02-01').toISOString(),
      items: [
        { name: 'Brakes', status: 'passed' },
        { name: 'Tires', status: 'passed' },
        { name: 'Lights', status: 'passed' }
      ]
    },
    // Add more inspections...
  ])

  if (inspectionsError) console.error('Error seeding inspections:', inspectionsError)

  // Seed Tasks
  const { error: tasksError } = await supabase.from('tasks').upsert([
    {
      title: 'Monthly Inspection',
      vehicle_id: '1',
      due_date: new Date('2024-03-01').toISOString(),
      status: 'pending',
      type: 'inspection'
    },
    // Add more tasks...
  ])

  if (tasksError) console.error('Error seeding tasks:', tasksError)
} 