"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { useI18n } from '@/lib/i18n/context'
import { Plus, MoreVertical, Edit, Trash2, Users, Shield, Palette, UserPlus, UserMinus, Eye, Settings2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/index'
import { format } from 'date-fns'

interface UserGroup {
  id: string
  name: string
  description: string | null
  color: string
  icon: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  member_count?: number
  members?: GroupMember[]
}

interface GroupMember {
  id: string
  user_id: string
  group_id: string
  assigned_at: string
  expires_at: string | null
  is_active: boolean
  user_profile: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    team_location: string
    is_active: boolean
  }
}

interface Permission {
  id: string
  name: string
  description: string | null
  category: string
  action: string
  resource: string
  granted?: boolean
}

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  team_location: string
  is_active: boolean
}

const colorOptions = [
  '#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', 
  '#16a34a', '#059669', '#0d9488', '#0891b2', '#0284c7',
  '#2563eb', '#4f46e5', '#7c3aed', '#9333ea', '#c026d3',
  '#db2777', '#e11d48'
]

const iconOptions = [
  'shield-check', 'briefcase', 'truck', 'chart-line', 'map-pin',
  'clipboard-check', 'users', 'calculator', 'headphones', 'eye',
  'user-cog', 'user-tie', 'user-gear', 'settings', 'star'
]

export function EnhancedGroupManagement() {
  const { t } = useI18n()
  const { toast } = useToast()
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null)
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    icon: 'users',
    is_active: true
  })
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Load groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('user_groups')
        .select('*')
        .order('sort_order')

      if (groupsError) throw groupsError

      // Load available users
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('is_active', true)
        .order('full_name')

      if (usersError) throw usersError

      // Load permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .order('category, name')

      if (permissionsError) throw permissionsError

      // Process groups data with member counts
      const processedGroups = await Promise.all(
        (groupsData || []).map(async (group) => {
          // Get member count
          const { count: memberCount } = await supabase
            .from('user_group_memberships')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .eq('is_active', true)

          return {
            ...group,
            member_count: memberCount || 0
          }
        })
      )

      setGroups(processedGroups)
      setAvailableUsers(usersData || [])
      setPermissions(permissionsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: t('settings.groups.error.loading', 'Error loading groups'),
        description: t('settings.groups.error.loadingDescription', 'Failed to load user groups'),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadGroupMembers = async (groupId: string) => {
    try {
      const supabase = createClient()
      
      // First get the memberships
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('user_group_memberships')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false })

      if (membershipsError) throw membershipsError

      if (!membershipsData || membershipsData.length === 0) {
        return []
      }

      // Then get the user profiles for each membership
      const userIds = membershipsData.map(m => m.user_id)
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', userIds)

      if (profilesError) throw profilesError

      // Combine the data
      return membershipsData.map(membership => {
        const profile = profilesData?.find(p => p.id === membership.user_id)
        return {
          ...membership,
          user_profile: profile || {
            id: membership.user_id,
            email: 'Unknown',
            full_name: 'Unknown User',
            avatar_url: null,
            team_location: 'Unknown',
            is_active: false
          }
        }
      })
    } catch (error) {
      console.error('Error loading group members:', error)
      return []
    }
  }

  const loadGroupPermissions = async (groupId: string) => {
    try {
      const supabase = createClient()
      
      const { data: groupPermissions, error } = await supabase
        .from('group_permissions')
        .select(`
          permission_id,
          granted,
          permissions!inner (
            id,
            name,
            description,
            category,
            action,
            resource
          )
        `)
        .eq('group_id', groupId)

      if (error) throw error

      // Merge with all available permissions
      const permissionsWithStatus = permissions.map(permission => {
        const groupPermission = groupPermissions?.find(gp => gp.permission_id === permission.id)
        return {
          ...permission,
          granted: groupPermission?.granted || false
        }
      })

      return permissionsWithStatus
    } catch (error) {
      console.error('Error loading group permissions:', error)
      return []
    }
  }

  const createGroup = async () => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('user_groups')
        .insert([{
          name: groupForm.name,
          description: groupForm.description || null,
          color: groupForm.color,
          icon: groupForm.icon,
          is_active: groupForm.is_active,
          sort_order: groups.length + 1
        }])

      if (error) throw error

      toast({
        title: t('settings.groups.success.created', 'Group created'),
        description: t('settings.groups.success.createdDescription', 'User group created successfully')
      })

      setIsCreateDialogOpen(false)
      setGroupForm({ name: '', description: '', color: '#6366f1', icon: 'users', is_active: true })
      await loadData()
    } catch (error) {
      console.error('Error creating group:', error)
      toast({
        title: t('settings.groups.error.creating', 'Error creating group'),
        description: t('settings.groups.error.creatingDescription', 'Failed to create user group'),
        variant: 'destructive'
      })
    }
  }

  const updateGroup = async () => {
    if (!selectedGroup) return

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('user_groups')
        .update({
          name: groupForm.name,
          description: groupForm.description || null,
          color: groupForm.color,
          icon: groupForm.icon,
          is_active: groupForm.is_active
        })
        .eq('id', selectedGroup.id)

      if (error) throw error

      toast({
        title: t('settings.groups.success.updated', 'Group updated'),
        description: t('settings.groups.success.updatedDescription', 'User group updated successfully')
      })

      setIsEditDialogOpen(false)
      setSelectedGroup(null)
      await loadData()
    } catch (error) {
      console.error('Error updating group:', error)
      toast({
        title: t('settings.groups.error.updating', 'Error updating group'),
        description: t('settings.groups.error.updatingDescription', 'Failed to update user group'),
        variant: 'destructive'
      })
    }
  }

  const deleteGroup = async (groupId: string) => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('user_groups')
        .delete()
        .eq('id', groupId)

      if (error) throw error

      toast({
        title: t('settings.groups.success.deleted', 'Group deleted'),
        description: t('settings.groups.success.deletedDescription', 'User group deleted successfully')
      })

      await loadData()
    } catch (error) {
      console.error('Error deleting group:', error)
      toast({
        title: t('settings.groups.error.deleting', 'Error deleting group'),
        description: t('settings.groups.error.deletingDescription', 'Failed to delete user group'),
        variant: 'destructive'
      })
    }
  }

  const addUserToGroup = async (groupId: string, userId: string) => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('user_group_memberships')
        .insert([{
          user_id: userId,
          group_id: groupId,
          is_active: true
        }])

      if (error) throw error

      toast({
        title: 'User added to group',
        description: 'User has been added to the group successfully'
      })

      await loadData()
    } catch (error) {
      console.error('Error adding user to group:', error)
      toast({
        title: 'Error adding user',
        description: 'Failed to add user to group',
        variant: 'destructive'
      })
    }
  }

  const removeUserFromGroup = async (membershipId: string) => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('user_group_memberships')
        .update({ is_active: false })
        .eq('id', membershipId)

      if (error) throw error

      toast({
        title: 'User removed from group',
        description: 'User has been removed from the group successfully'
      })

      await loadData()
    } catch (error) {
      console.error('Error removing user from group:', error)
      toast({
        title: 'Error removing user',
        description: 'Failed to remove user from group',
        variant: 'destructive'
      })
    }
  }

  const handlePermissionToggle = async (permissionId: string, granted: boolean) => {
    if (!selectedGroup) return

    try {
      const supabase = createClient()

      if (granted) {
        // Add permission to group with granted = true
        const { error } = await supabase
          .from('group_permissions')
          .upsert({
            group_id: selectedGroup.id,
            permission_id: permissionId,
            granted: true
          }, {
            onConflict: 'group_id,permission_id'
          })

        if (error) throw error
      } else {
        // Either delete the record or set granted = false
        const { error } = await supabase
          .from('group_permissions')
          .delete()
          .eq('group_id', selectedGroup.id)
          .eq('permission_id', permissionId)

        if (error) throw error
      }

      // Reload the permissions to get the updated state
      const updatedPermissions = await loadGroupPermissions(selectedGroup.id)
      
      // Update local state
      setSelectedGroup(prev => {
        if (!prev) return prev
        
        return {
          ...prev,
          permissions: updatedPermissions
        }
      })

      toast({
        title: 'Permission updated',
        description: `Permission ${granted ? 'granted' : 'revoked'} successfully`
      })
    } catch (error) {
      console.error('Error updating permission:', error)
      toast({
        title: 'Error updating permission',
        description: 'Failed to update permission',
        variant: 'destructive'
      })
    }
  }

  const getUserInitials = (user: any) => {
    if (user.full_name) {
      return user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    }
    return user.email[0].toUpperCase()
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{t('settings.groups.title', 'Group Management')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('settings.groups.description', 'Manage user groups and permissions')}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('settings.groups.create', 'Create Group')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Create a new user group with specific permissions and access levels.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">{t('settings.groups.name', 'Group Name')}</Label>
                <Input
                  id="name"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('settings.groups.namePlaceholder', 'Enter group name')}
                />
              </div>
              <div>
                <Label htmlFor="description">{t('settings.groups.descriptionLabel', 'Description')}</Label>
                <Textarea
                  id="description"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('settings.groups.descriptionPlaceholder', 'Enter group description')}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>{t('settings.groups.color', 'Color')}</Label>
                  <div className="flex gap-2 mt-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      title={`Select color ${color}`}
                      className={`w-6 h-6 rounded-full border-2 ${
                        groupForm.color === color ? 'border-foreground' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setGroupForm(prev => ({ ...prev, color }))}
                    />
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={groupForm.is_active}
                    onCheckedChange={(checked) => setGroupForm(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="active">{t('settings.groups.active', 'Active')}</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createGroup}>Create Group</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id} className={`transition-all hover:shadow-md ${!group.is_active ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <div>
                    <h4 className="font-medium">{group.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {group.member_count} {t('settings.groups.members', 'members')}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedGroup(group)
                        setGroupForm({
                          name: group.name,
                          description: group.description || '',
                          color: group.color,
                          icon: group.icon,
                          is_active: group.is_active
                        })
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Group</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('settings.groups.confirm.delete', 'Are you sure you want to delete this group?')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteGroup(group.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {group.description && (
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                )}
                
                <div className="flex items-center gap-2">
                  <Badge variant={group.is_active ? "default" : "secondary"}>
                    {group.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Created {format(new Date(group.created_at), 'MMM d, yyyy')}
                  </span>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={async () => {
                        const members = await loadGroupMembers(group.id)
                        const permissions = await loadGroupPermissions(group.id)
                        setSelectedGroup({ ...group, members, permissions })
                      }}
                    >
                      <Settings2 className="h-4 w-4 mr-2" />
                      Manage Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                      <DialogTitle>Manage {group.name}</DialogTitle>
                      <DialogDescription>
                        Manage group members and permissions
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Tabs defaultValue="members" className="w-full h-full flex flex-col">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="members">
                          <Users className="h-4 w-4 mr-2" />
                          Members ({group.member_count})
                        </TabsTrigger>
                        <TabsTrigger value="permissions">
                          <Shield className="h-4 w-4 mr-2" />
                          Permissions
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="members" className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Group Members</h4>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Member
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Members to {group.name}</DialogTitle>
                                <DialogDescription>
                                  Select users to add to this group
                                </DialogDescription>
                              </DialogHeader>
                              <ScrollArea className="h-[300px] pr-4">
                                <div className="space-y-2">
                                  {availableUsers
                                    .filter(user => !selectedGroup?.members?.some(m => m.user_id === user.id))
                                    .map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage src={user.avatar_url || undefined} />
                                          <AvatarFallback className="text-xs">
                                            {getUserInitials(user)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium text-sm">{user.full_name || user.email}</p>
                                          <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                      </div>
                                      <Button
                                        size="sm"
                                        onClick={() => addUserToGroup(group.id, user.id)}
                                      >
                                        Add
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        </div>
                        
                        <ScrollArea className="h-[300px] pr-4">
                          <div className="space-y-2">
                            {selectedGroup?.members?.map((member) => (
                              <div key={member.id} className="flex items-center justify-between p-3 border rounded">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={member.user_profile.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {getUserInitials(member.user_profile)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {member.user_profile.full_name || member.user_profile.email}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {member.user_profile.email} • {member.user_profile.team_location}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Added {format(new Date(member.assigned_at), 'MMM d, yyyy')}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeUserFromGroup(member.id)}
                                >
                                  <UserMinus className="h-4 w-4 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                      
                      <TabsContent value="permissions" className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Group Permissions</h4>
                            <p className="text-sm text-muted-foreground">
                              Manage what this group can access and do
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {selectedGroup?.permissions?.filter(p => p.granted).length || 0} permissions enabled
                          </div>
                        </div>
                        
                        {/* Permission Category Navigation */}
                        <div className="flex flex-col space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(
                              permissions.reduce((acc, permission) => {
                                if (!acc[permission.category]) {
                                  acc[permission.category] = []
                                }
                                acc[permission.category].push(permission)
                                return acc
                              }, {} as Record<string, Permission[]>)
                            ).map(([category, categoryPermissions]) => {
                              const enabledCount = categoryPermissions.filter(p => 
                                selectedGroup?.permissions?.find(sp => sp.id === p.id)?.granted || false
                              ).length
                              const totalCount = categoryPermissions.length
                              
                              return (
                                <Button
                                  key={category}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => {
                                    const element = document.getElementById(`category-${category}`)
                                    element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                  }}
                                >
                                  {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  <Badge variant="secondary" className="ml-2">
                                    {enabledCount}/{totalCount}
                                  </Badge>
                                </Button>
                              )
                            })}
                          </div>
                          
                          <ScrollArea className="h-[500px] pr-4">
                            <div className="space-y-6">
                              {Object.entries(
                                permissions.reduce((acc, permission) => {
                                  if (!acc[permission.category]) {
                                    acc[permission.category] = []
                                  }
                                  acc[permission.category].push(permission)
                                  return acc
                                }, {} as Record<string, Permission[]>)
                              ).map(([category, categoryPermissions]) => {
                                const enabledCount = categoryPermissions.filter(p => 
                                  selectedGroup?.permissions?.find(sp => sp.id === p.id)?.granted || false
                                ).length
                                const totalCount = categoryPermissions.length
                                
                                return (
                                  <Card key={category} id={`category-${category}`} className="p-4">
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <h5 className="font-semibold text-base flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                                          {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </h5>
                                        <div className="text-sm text-muted-foreground">
                                          {enabledCount} of {totalCount} permissions enabled
                                        </div>
                                      </div>
                                      
                                      <div className="grid gap-3">
                                        {categoryPermissions.map((permission) => {
                                          const isEnabled = selectedGroup?.permissions?.find(sp => sp.id === permission.id)?.granted || false
                                          return (
                                            <div key={permission.id} className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                                              isEnabled 
                                                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                                                : 'bg-muted/30 border-border hover:bg-muted/50'
                                            }`}>
                                              <Switch
                                                checked={isEnabled}
                                                onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked)}
                                                disabled={loading}
                                                className="mt-0.5"
                                              />
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                  <p className="text-sm font-medium">{permission.name}</p>
                                                  {isEnabled && (
                                                    <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                                                      Enabled
                                                    </Badge>
                                                  )}
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                  {permission.description}
                                                </p>
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  </Card>
                                )
                              })}
                            </div>
                          </ScrollArea>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update the group information and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">{t('settings.groups.name', 'Group Name')}</Label>
              <Input
                id="edit-name"
                value={groupForm.name}
                onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('settings.groups.namePlaceholder', 'Enter group name')}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">{t('settings.groups.descriptionLabel', 'Description')}</Label>
              <Textarea
                id="edit-description"
                value={groupForm.description}
                onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('settings.groups.descriptionPlaceholder', 'Enter group description')}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>{t('settings.groups.color', 'Color')}</Label>
                <div className="flex gap-2 mt-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      title={`Select color ${color}`}
                      className={`w-6 h-6 rounded-full border-2 ${
                        groupForm.color === color ? 'border-foreground' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setGroupForm(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={groupForm.is_active}
                  onCheckedChange={(checked) => setGroupForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="edit-active">{t('settings.groups.active', 'Active')}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateGroup}>Update Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
