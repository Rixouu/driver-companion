"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { useI18n } from '@/lib/i18n/context'
import { Search, UserPlus, Users, Shield, Calendar, Mail, MapPin, Clock, Settings2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/index'
import { format } from 'date-fns'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  auth_created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  team_location: string
  is_active: boolean
  groups?: UserGroup[]
}

interface UserGroup {
  id: string
  name: string
  description: string | null
  color: string
  icon: string
  is_active: boolean
  membership_id?: string
  assigned_at?: string
  expires_at?: string | null
}

interface Permission {
  id: string
  name: string
  description: string | null
  category: string
  action: string
  resource: string
}

export function UserManagement() {
  const { t } = useI18n()
  const { toast } = useToast()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [teamFilter, setTeamFilter] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Load users with their group memberships
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('full_name')

      if (usersError) throw usersError

      // Load groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('user_groups')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (groupsError) throw groupsError

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

      // Load permissions for reference
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .order('category, name')

      if (permissionsError) throw permissionsError

      // Combine users with their groups
      const usersWithGroups = usersData.map(user => ({
        ...user,
        groups: membershipsData
          .filter(m => m.user_id === user.id)
          .map(m => ({
            ...m.user_groups,
            membership_id: m.id,
            assigned_at: m.assigned_at,
            expires_at: m.expires_at
          }))
      }))

      setUsers(usersWithGroups)
      setGroups(groupsData || [])
      setPermissions(permissionsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: t('settings.users.error.loading', 'Error loading users'),
        description: t('settings.users.error.loadingDescription', 'Failed to load users'),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateUserGroupMembership = async (userId: string, groupId: string, shouldAdd: boolean) => {
    try {
      const supabase = createClient()

      if (shouldAdd) {
        const { error } = await supabase
          .from('user_group_memberships')
          .insert({
            user_id: userId,
            group_id: groupId,
            is_active: true
          })

        if (error) throw error

        toast({
          title: t('settings.users.success.updated', 'User updated'),
          description: t('settings.users.success.updatedDescription', 'User group membership updated successfully')
        })
      } else {
        const { error } = await supabase
          .from('user_group_memberships')
          .update({ is_active: false })
          .eq('user_id', userId)
          .eq('group_id', groupId)

        if (error) throw error

        toast({
          title: t('settings.users.success.updated', 'User updated'),
          description: t('settings.users.success.updatedDescription', 'User group membership updated successfully')
        })
      }

      await loadData()
    } catch (error) {
      console.error('Error updating user group membership:', error)
      toast({
        title: t('settings.users.error.updating', 'Error updating user'),
        description: t('settings.users.error.updatingDescription', 'Failed to update user'),
        variant: 'destructive'
      })
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesActive = showInactive || user.is_active
    const matchesTeam = teamFilter === 'all' || user.team_location === teamFilter

    return matchesSearch && matchesActive && matchesTeam
  })

  const getUserInitials = (user: UserProfile) => {
    if (user.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return user.email[0].toUpperCase()
  }

  const getPermissionsByCategory = () => {
    return permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = []
      }
      acc[permission.category].push(permission)
      return acc
    }, {} as Record<string, Permission[]>)
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{t('settings.users.title', 'User Management')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('settings.users.description', 'Manage users and their group memberships')}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {filteredUsers.length} {t('settings.users.user', 'users')}
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('settings.users.searchPlaceholder', 'Search users...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                <SelectItem value="Japan">Japan Team</SelectItem>
                <SelectItem value="Thailand">Thailand Team</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showInactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="showInactive" className="text-sm">
                Show inactive users
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => (
          <Card key={user.id} className={`transition-all hover:shadow-md ${!user.is_active ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="text-sm">
                    {getUserInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm truncate">
                      {user.full_name || user.email.split('@')[0]}
                    </h4>
                    {!user.is_active && <EyeOff className="h-3 w-3 text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Team and Status */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{user.team_location}</span>
                  {user.last_sign_in_at && (
                    <>
                      <Separator orientation="vertical" className="h-3" />
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(new Date(user.last_sign_in_at), 'MMM d, yyyy')}
                      </span>
                    </>
                  )}
                </div>

                {/* Groups */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium">Groups ({user.groups?.length || 0})</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {user.groups?.slice(0, 3).map((group) => (
                      <Badge
                        key={group.id}
                        variant="outline"
                        className="text-xs px-2 py-0"
                        style={{ borderColor: group.color }}
                      >
                        {group.name}
                      </Badge>
                    ))}
                    {user.groups && user.groups.length > 3 && (
                      <Badge variant="outline" className="text-xs px-2 py-0">
                        +{user.groups.length - 3}
                      </Badge>
                    )}
                    {(!user.groups || user.groups.length === 0) && (
                      <span className="text-xs text-muted-foreground">No groups assigned</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Settings2 className="h-3 w-3 mr-1" />
                      Manage Groups
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Manage Groups for {user.full_name || user.email}</DialogTitle>
                      <DialogDescription>
                        Assign or remove user groups and view effective permissions
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Tabs defaultValue="groups" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="groups">Group Membership</TabsTrigger>
                        <TabsTrigger value="permissions">Effective Permissions</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="groups" className="space-y-4">
                        <ScrollArea className="h-[400px] pr-4">
                          <div className="space-y-3">
                            {groups.map((group) => {
                              const isMember = user.groups?.some(ug => ug.id === group.id)
                              return (
                                <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: group.color }}
                                    />
                                    <div>
                                      <h4 className="font-medium text-sm">{group.name}</h4>
                                      <p className="text-xs text-muted-foreground">
                                        {group.description}
                                      </p>
                                    </div>
                                  </div>
                                  <Checkbox
                                    checked={isMember}
                                    onCheckedChange={(checked) => {
                                      updateUserGroupMembership(user.id, group.id, !!checked)
                                    }}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                      
                      <TabsContent value="permissions" className="space-y-4">
                        <ScrollArea className="h-[400px] pr-4">
                          <div className="space-y-4">
                            {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
                              <div key={category}>
                                <h4 className="font-medium text-sm mb-2 capitalize">{category}</h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {categoryPermissions.map((permission) => (
                                    <div key={permission.id} className="flex items-center gap-2 p-2 text-xs bg-muted/50 rounded">
                                      <Shield className="h-3 w-3 text-muted-foreground" />
                                      <span>{permission.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No users found</h3>
            <p className="text-sm text-muted-foreground text-center">
              {searchQuery 
                ? 'Try adjusting your search criteria'
                : 'No users match the current filters'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}