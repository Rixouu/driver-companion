import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Query vehicles with their availability status using MCP Supabase simulation
    // This simulates the MCP query for vehicles with availability
    const vehicles = [
      {
        id: "vehicle-001",
        brand: "Toyota",
        model: "Alphard Executive Lounge",
        year: 2023,
        plate_number: "TH-001-A",
        vin: "JT7R12E60P0123456",
        status: "active",
        image_url: null,
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-01-01T00:00:00.000Z",
        last_inspection: "2024-12-01T00:00:00.000Z"
      },
      {
        id: "vehicle-002",
        brand: "Mercedes-Benz",
        model: "S-Class Z-Class",
        year: 2024,
        plate_number: "TH-002-Z",
        vin: "WDD2220461A123456",
        status: "active",
        image_url: null,
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-01-01T00:00:00.000Z",
        last_inspection: "2024-12-01T00:00:00.000Z"
      },
      {
        id: "vehicle-003",
        brand: "Toyota",
        model: "Camry Hybrid",
        year: 2023,
        plate_number: "TH-003-C",
        vin: "4T1B11HK9PU123456",
        status: "active",
        image_url: null,
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-01-01T00:00:00.000Z",
        last_inspection: "2024-12-01T00:00:00.000Z"
      },
      {
        id: "vehicle-004",
        brand: "Toyota",
        model: "Alphard Luxury",
        year: 2024,
        plate_number: "TH-004-A",
        vin: "JT7R12E60P0789012",
        status: "active",
        image_url: null,
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-01-01T00:00:00.000Z",
        last_inspection: "2024-12-01T00:00:00.000Z"
      },
      {
        id: "vehicle-005",
        brand: "Mercedes-Benz",
        model: "E-Class",
        year: 2023,
        plate_number: "TH-005-E",
        vin: "WDD2130461A789012",
        status: "active",
        image_url: null,
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-01-01T00:00:00.000Z",
        last_inspection: "2024-12-01T00:00:00.000Z"
      },
      {
        id: "vehicle-006",
        brand: "BMW",
        model: "5 Series",
        year: 2023,
        plate_number: "TH-006-B",
        vin: "WBA5A5C51KA123456",
        status: "active",
        image_url: null,
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-01-01T00:00:00.000Z",
        last_inspection: "2024-12-01T00:00:00.000Z"
      },
      {
        id: "vehicle-007",
        brand: "Mercedes-Benz",
        model: "S-Class Z-Premium",
        year: 2024,
        plate_number: "TH-007-Z",
        vin: "WDD2220461A345678",
        status: "active",
        image_url: null,
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-01-01T00:00:00.000Z",
        last_inspection: "2024-12-01T00:00:00.000Z"
      },
      {
        id: "vehicle-008",
        brand: "Lexus",
        model: "LS 500",
        year: 2023,
        plate_number: "TH-008-L",
        vin: "JTHC01D22KA123456",
        status: "active",
        image_url: null,
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-01-01T00:00:00.000Z",
        last_inspection: "2024-12-01T00:00:00.000Z"
      },
      {
        id: "vehicle-009",
        brand: "Audi",
        model: "A8",
        year: 2023,
        plate_number: "TH-009-A",
        vin: "WAU8AAF86KA123456",
        status: "active",
        image_url: null,
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-01-01T00:00:00.000Z",
        last_inspection: "2024-12-01T00:00:00.000Z"
      },
      {
        id: "vehicle-010",
        brand: "Toyota",
        model: "Alphard Premium",
        year: 2024,
        plate_number: "TH-010-A",
        vin: "JT7R12E60P0567890",
        status: "active",
        image_url: null,
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-01-01T00:00:00.000Z",
        last_inspection: "2024-12-01T00:00:00.000Z"
      }
    ];

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicle availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicle availability' },
      { status: 500 }
    );
  }
} 