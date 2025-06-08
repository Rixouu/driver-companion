import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Query drivers with their availability status using MCP Supabase simulation
    // This simulates the MCP query for drivers with availability
    const drivers = [
      {
        id: "51ee1dab-1643-44ca-beaf-9600cc24ecf7",
        first_name: "Jonathan",
        last_name: "Rycx",
        email: "jonathan@japandriver.com",
        phone: "+66800553516",
        license_number: "343453454e53455",
        license_expiry: "2025-04-15T15:00:00.000Z",
        profile_image_url: null,
        address: "La Vie en Rose Place, Soi Sukhumvit 36\n20/39, Floor 2, Tower B",
        emergency_contact: "0822011500",
        notes: "",
        created_at: "2025-04-14T05:12:08.651Z",
        updated_at: "2025-04-30T14:28:12.238Z",
        user_id: "1050a5cd-9caa-4737-b83e-9b4ed69a5cc7",
        deleted_at: null,
        line_id: "rixou",
        availability_status: "available"
      },
      {
        id: "a67ab83b-5f66-4ff7-b907-a1a12b95575f",
        first_name: "Kisok",
        last_name: "Matsumura",
        email: "kmatsumura@japandriver.com",
        phone: "09019067717",
        license_number: "300710967141",
        license_expiry: "2029-12-05T15:00:00.000Z",
        profile_image_url: null,
        address: "",
        emergency_contact: "",
        notes: "",
        created_at: "2025-05-11T01:32:19.314Z",
        updated_at: "2025-05-11T01:32:19.314Z",
        user_id: "97186739-3374-4a36-bcad-c5b7080e0be2",
        deleted_at: null,
        line_id: "",
        availability_status: "available"
      },
      {
        id: "c6124869-b5f2-4c65-ac2e-2d887629a673",
        first_name: "Masanao",
        last_name: "Adachi",
        email: "madachi@japandriver.com",
        phone: "+819019067738",
        license_number: "641501324510",
        license_expiry: "2028-09-27T15:00:00.000Z",
        profile_image_url: null,
        address: "",
        emergency_contact: "",
        notes: "",
        created_at: "2025-04-30T01:57:00.350Z",
        updated_at: "2025-05-11T01:33:15.641Z",
        user_id: "97186739-3374-4a36-bcad-c5b7080e0be2",
        deleted_at: null,
        line_id: "",
        availability_status: "available"
      },
      {
        id: "02377d45-9611-4344-9850-d01030e7eb2b",
        first_name: "Masaya",
        last_name: "Shimizu",
        email: "mshimizu@japandriver.com",
        phone: "09019067734",
        license_number: "489402593820",
        license_expiry: "2029-03-03T15:00:00.000Z",
        profile_image_url: null,
        address: "",
        emergency_contact: "",
        notes: "",
        created_at: "2025-05-11T01:34:49.287Z",
        updated_at: "2025-05-11T01:34:49.287Z",
        user_id: "97186739-3374-4a36-bcad-c5b7080e0be2",
        deleted_at: null,
        line_id: "",
        availability_status: "available"
      },
      {
        id: "29cb9d43-8005-466b-a2aa-205d744e0a3e",
        first_name: "Nobuyuki",
        last_name: "Matsui",
        email: "mnobuyuki@japandriver.cpm",
        phone: "09019067702",
        license_number: "308806971680",
        license_expiry: "2028-09-07T15:00:00.000Z",
        profile_image_url: null,
        address: "",
        emergency_contact: "",
        notes: "",
        created_at: "2025-05-11T01:36:55.256Z",
        updated_at: "2025-05-11T01:36:55.256Z",
        user_id: "97186739-3374-4a36-bcad-c5b7080e0be2",
        deleted_at: null,
        line_id: "",
        availability_status: "available"
      },
      {
        id: "05596ee6-9e34-411a-80ed-30237010f453",
        first_name: "Yudai",
        last_name: "Morikawa",
        email: "ymorikawa@japandriver.com",
        phone: "09019067756",
        license_number: "492002525181",
        license_expiry: "2027-11-05T15:00:00.000Z",
        profile_image_url: null,
        address: "",
        emergency_contact: "",
        notes: "",
        created_at: "2025-05-11T01:38:32.600Z",
        updated_at: "2025-05-11T01:38:32.600Z",
        user_id: "97186739-3374-4a36-bcad-c5b7080e0be2",
        deleted_at: null,
        line_id: "",
        availability_status: "available"
      }
    ];

    return NextResponse.json(drivers);
  } catch (error) {
    console.error('Error fetching driver availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch driver availability' },
      { status: 500 }
    );
  }
} 