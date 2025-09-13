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
  permissions?: GroupPermission[]
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

interface GroupPermission {
  permission_id: string
  granted: boolean
  permission?: {
    id: string
    name: string
    description: string
    category: string
  }
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
      
      // Fetch users from database
      const usersResponse = await fetch('/api/admin/users')
      if (!usersResponse.ok) throw new Error('Failed to fetch users')
      const usersData = await usersResponse.json()

      // Fetch groups from database
      const groupsResponse = await fetch('/api/admin/groups')
      if (!groupsResponse.ok) throw new Error('Failed to fetch groups')
      const groupsData = await groupsResponse.json()

      // Fetch permissions from database
      const permissionsResponse = await fetch('/api/admin/permissions')
      if (!permissionsResponse.ok) throw new Error('Failed to fetch permissions')
      const permissionsData = await permissionsResponse.json()

      setUsers(usersData)
      setGroups(groupsData)
      setPermissions(permissionsData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: 'Error loading users',
        description: 'Failed to load users',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateUserGroupMembership = async (userId: string, groupId: string, shouldAdd: boolean) => {
    try {
      const response = await fetch('/api/admin/user-group-membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          group_id: groupId,
          should_add: shouldAdd
        })
      })

      if (!response.ok) throw new Error('Failed to update group membership')

      toast({
        title: 'User updated',
        description: 'User group membership updated successfully'
      })

      // Reload data to reflect changes
      await loadData()
    } catch (error) {
      console.error('Error updating user group membership:', error)
      toast({
        title: 'Error updating user',
        description: 'Failed to update user',
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

  const hasPermission = (user: UserProfile, permissionId: string): boolean => {
    if (!user.permissions) return false
    return user.permissions.some(p => p.permission_id === permissionId && p.granted)
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">User Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage users and their group memberships
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {filteredUsers.length} users
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
                  placeholder="Search users..."
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
                onCheckedChange={(checked) => setShowInactive(!!checked)}
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
                      
                      <TabsContent value="permissions" className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Effective Permissions</h4>
                            <p className="text-sm text-muted-foreground">
                              Permissions inherited from user groups
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {permissions.filter(p => hasPermission(user, p.id)).length} permissions enabled
                          </div>
                        </div>
                        
                        {/* Permission Category Navigation */}
                        <div className="flex flex-col space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => {
                              const enabledCount = categoryPermissions.filter(p => hasPermission(user, p.id)).length
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
                              {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => {
                                const enabledCount = categoryPermissions.filter(p => hasPermission(user, p.id)).length
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
                                          const isEnabled = hasPermission(user, permission.id)
                                          return (
                                            <div key={permission.id} className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                                              isEnabled 
                                                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                                                : 'bg-muted/30 border-border hover:bg-muted/50'
                                            }`}>
                                              <div className="mt-0.5">
                                                <Shield className={`h-4 w-4 ${isEnabled ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                                              </div>
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