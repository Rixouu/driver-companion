"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Shield, 
  Eye, 
  EyeOff,
  Save,
  X
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { toast } from '@/components/ui/use-toast';

interface UserGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

interface Permission {
  id: string;
  name: string;
  description?: string;
  category: string;
  action: string;
  resource: string;
  granted?: boolean;
}

interface GroupPermission {
  id: string;
  group_id: string;
  permission_id: string;
  granted: boolean;
  permission?: Permission;
}

export function GroupManagement() {
  const { t } = useI18n();
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupPermissions, setGroupPermissions] = useState<GroupPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);

  // Form states
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    icon: 'users',
    is_active: true,
    sort_order: 0
  });

  // Load data
  useEffect(() => {
    loadGroups();
    loadPermissions();
    loadGroupPermissions();
  }, []);

  const loadGroups = async () => {
    try {
      // TODO: Replace with actual API call
      const mockGroups: UserGroup[] = [
        {
          id: '1',
          name: 'Super Admin',
          description: 'Full system access with all permissions',
          color: '#dc2626',
          icon: 'shield-check',
          is_active: true,
          sort_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          member_count: 1
        },
        {
          id: '2',
          name: 'Admin',
          description: 'Administrative access to most system features',
          color: '#7c3aed',
          icon: 'user-cog',
          is_active: true,
          sort_order: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          member_count: 3
        },
        {
          id: '3',
          name: 'Manager',
          description: 'Management access to assigned areas',
          color: '#059669',
          icon: 'user-tie',
          is_active: true,
          sort_order: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          member_count: 5
        }
      ];
      setGroups(mockGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast({
        title: t('settings.groups.error.loading', 'Error loading groups'),
        description: t('settings.groups.error.loadingDescription', 'Failed to load user groups'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      // TODO: Replace with actual API call
      const mockPermissions: Permission[] = [
        { id: '1', name: 'bookings.create', description: 'Create new bookings', category: 'bookings', action: 'create', resource: 'booking' },
        { id: '2', name: 'bookings.read', description: 'View bookings', category: 'bookings', action: 'read', resource: 'booking' },
        { id: '3', name: 'bookings.update', description: 'Update bookings', category: 'bookings', action: 'update', resource: 'booking' },
        { id: '4', name: 'vehicles.create', description: 'Create new vehicles', category: 'vehicles', action: 'create', resource: 'vehicle' },
        { id: '5', name: 'vehicles.read', description: 'View vehicles', category: 'vehicles', action: 'read', resource: 'vehicle' },
        { id: '6', name: 'drivers.create', description: 'Create new drivers', category: 'drivers', action: 'create', resource: 'driver' },
        { id: '7', name: 'drivers.read', description: 'View drivers', category: 'drivers', action: 'read', resource: 'driver' },
        { id: '8', name: 'reports.read', description: 'View reports', category: 'reports', action: 'read', resource: 'report' },
        { id: '9', name: 'settings.read', description: 'View settings', category: 'settings', action: 'read', resource: 'setting' }
      ];
      setPermissions(mockPermissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  };

  const loadGroupPermissions = async () => {
    try {
      // TODO: Replace with actual API call
      const mockGroupPermissions: GroupPermission[] = [
        { id: '1', group_id: '1', permission_id: '1', granted: true },
        { id: '2', group_id: '1', permission_id: '2', granted: true },
        { id: '3', group_id: '1', permission_id: '3', granted: true },
        { id: '4', group_id: '2', permission_id: '1', granted: true },
        { id: '5', group_id: '2', permission_id: '2', granted: true },
        { id: '6', group_id: '3', permission_id: '2', granted: true }
      ];
      setGroupPermissions(mockGroupPermissions);
    } catch (error) {
      console.error('Error loading group permissions:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) {
      toast({
        title: t('settings.groups.error.nameRequired', 'Name required'),
        description: t('settings.groups.error.nameRequiredDescription', 'Please enter a group name'),
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Replace with actual API call
      const newGroup: UserGroup = {
        id: Date.now().toString(),
        ...groupForm,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        member_count: 0
      };
      
      setGroups(prev => [...prev, newGroup]);
      setGroupForm({
        name: '',
        description: '',
        color: '#6366f1',
        icon: 'users',
        is_active: true,
        sort_order: 0
      });
      setIsGroupDialogOpen(false);
      
      toast({
        title: t('settings.groups.success.created', 'Group created'),
        description: t('settings.groups.success.createdDescription', 'User group created successfully')
      });
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: t('settings.groups.error.creating', 'Error creating group'),
        description: t('settings.groups.error.creatingDescription', 'Failed to create user group'),
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditGroup = (group: UserGroup) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description || '',
      color: group.color,
      icon: group.icon,
      is_active: group.is_active,
      sort_order: group.sort_order
    });
    setIsGroupDialogOpen(true);
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !groupForm.name.trim()) return;

    setIsSaving(true);
    try {
      // TODO: Replace with actual API call
      const updatedGroup = { ...editingGroup, ...groupForm, updated_at: new Date().toISOString() };
      setGroups(prev => prev.map(g => g.id === editingGroup.id ? updatedGroup : g));
      setEditingGroup(null);
      setIsGroupDialogOpen(false);
      
      toast({
        title: t('settings.groups.success.updated', 'Group updated'),
        description: t('settings.groups.success.updatedDescription', 'User group updated successfully')
      });
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        title: t('settings.groups.error.updating', 'Error updating group'),
        description: t('settings.groups.error.updatingDescription', 'Failed to update user group'),
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm(t('settings.groups.confirm.delete', 'Are you sure you want to delete this group?'))) {
      return;
    }

    try {
      // TODO: Replace with actual API call
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setGroupPermissions(prev => prev.filter(gp => gp.group_id !== groupId));
      
      toast({
        title: t('settings.groups.success.deleted', 'Group deleted'),
        description: t('settings.groups.success.deletedDescription', 'User group deleted successfully')
      });
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: t('settings.groups.error.deleting', 'Error deleting group'),
        description: t('settings.groups.error.deletingDescription', 'Failed to delete user group'),
        variant: 'destructive'
      });
    }
  };

  const handlePermissionToggle = async (groupId: string, permissionId: string, granted: boolean) => {
    try {
      // TODO: Replace with actual API call
      const existingIndex = groupPermissions.findIndex(
        gp => gp.group_id === groupId && gp.permission_id === permissionId
      );

      if (existingIndex >= 0) {
        const updated = [...groupPermissions];
        updated[existingIndex] = { ...updated[existingIndex], granted };
        setGroupPermissions(updated);
      } else {
        const newPermission: GroupPermission = {
          id: Date.now().toString(),
          group_id: groupId,
          permission_id: permissionId,
          granted
        };
        setGroupPermissions(prev => [...prev, newPermission]);
      }
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

  const getPermissionForGroup = (groupId: string, permissionId: string) => {
    const groupPermission = groupPermissions.find(
      gp => gp.group_id === groupId && gp.permission_id === permissionId
    );
    return groupPermission?.granted || false;
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t('settings.groups.title', 'Group Management')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('settings.groups.description', 'Manage user groups and permissions')}
            </p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('settings.groups.title', 'Group Management')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('settings.groups.description', 'Manage user groups and permissions')}
          </p>
        </div>
        <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingGroup(null);
              setGroupForm({
                name: '',
                description: '',
                color: '#6366f1',
                icon: 'users',
                is_active: true,
                sort_order: 0
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              {t('settings.groups.create', 'Create Group')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingGroup 
                  ? t('settings.groups.edit', 'Edit Group')
                  : t('settings.groups.create', 'Create Group')
                }
              </DialogTitle>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="color">{t('settings.groups.color', 'Color')}</Label>
                  <Input
                    id="color"
                    type="color"
                    value={groupForm.color}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="icon">{t('settings.groups.icon', 'Icon')}</Label>
                  <Select value={groupForm.icon} onValueChange={(value) => setGroupForm(prev => ({ ...prev, icon: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="users">Users</SelectItem>
                      <SelectItem value="shield-check">Shield Check</SelectItem>
                      <SelectItem value="user-cog">User Cog</SelectItem>
                      <SelectItem value="user-tie">User Tie</SelectItem>
                      <SelectItem value="eye">Eye</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={groupForm.is_active}
                  onCheckedChange={(checked) => setGroupForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">{t('settings.groups.active', 'Active')}</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button onClick={editingGroup ? handleUpdateGroup : handleCreateGroup} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving 
                    ? t('common.saving', 'Saving...')
                    : editingGroup 
                      ? t('common.update', 'Update')
                      : t('common.create', 'Create')
                  }
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups List */}
      <div className="grid gap-4">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: group.color }}
                  >
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={group.is_active ? 'default' : 'secondary'}>
                    {group.member_count || 0} {t('settings.groups.members', 'members')}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditGroup(group)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteGroup(group.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{t('settings.groups.permissions', 'Permissions')}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedGroup(selectedGroup?.id === group.id ? null : group)}
                  >
                    {selectedGroup?.id === group.id ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        {t('settings.groups.hidePermissions', 'Hide Permissions')}
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        {t('settings.groups.showPermissions', 'Show Permissions')}
                      </>
                    )}
                  </Button>
                </div>
                
                {selectedGroup?.id === group.id && (
                  <div className="space-y-4">
                    {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                      <div key={category}>
                        <h5 className="font-medium text-sm mb-2 capitalize">{category}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {categoryPermissions.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Switch
                                checked={getPermissionForGroup(group.id, permission.id)}
                                onCheckedChange={(checked) => 
                                  handlePermissionToggle(group.id, permission.id, checked)
                                }
                              />
                              <Label className="text-sm">{permission.name}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
