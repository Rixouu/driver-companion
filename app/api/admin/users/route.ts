import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    // Load users with their group memberships and permissions
    const { data: usersData, error: usersError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('full_name')

    if (usersError) throw usersError

    // Load user group memberships
    const { data: membershipsData, error: membershipsError } = await supabase
      .from('user_group_memberships')
      .select(`
        id,
        user_id,
        group_id,
        assigned_at,
        expires_at,
        is_active,
        user_groups!inner (
          id,
          name,
          description,
          color,
          icon,
          is_active
        )
      `)
      .eq('is_active', true)

    if (membershipsError) throw membershipsError

    // Load group permissions
    const { data: groupPermissionsData, error: groupPermissionsError } = await supabase
      .from('group_permissions')
      .select(`
        group_id,
        permission_id,
        granted,
        permissions!inner (
          id,
          name,
          description,
          category
        )
      `)
      .eq('granted', true)

    if (groupPermissionsError) throw groupPermissionsError

    // Combine users with their groups and permissions
    const usersWithGroups = usersData.map(user => {
      const userGroups = membershipsData
        .filter(m => m.user_id === user.id)
        .map(m => ({
          ...m.user_groups,
          membership_id: m.id,
          assigned_at: m.assigned_at,
          expires_at: m.expires_at
        }))

      // Get all permissions for this user's groups
      const userPermissions = groupPermissionsData
        ?.filter(gp => userGroups.some(ug => ug.id === gp.group_id))
        .map(gp => ({
          permission_id: gp.permission_id,
          granted: gp.granted,
          permission: gp.permissions
        })) || []

      return {
        ...user,
        groups: userGroups,
        permissions: userPermissions
      }
    })

    return NextResponse.json(usersWithGroups)

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
