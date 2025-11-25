import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Edit, Trash2, Users } from "lucide-react";
import RoleForm from "./RoleForm";
import { toast } from "sonner";

export default function RoleManagement() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.list('-created_date')
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ['all-user-roles'],
    queryFn: () => base44.entities.UserRole.list()
  });

  const createRoleMutation = useMutation({
    mutationFn: (data) => base44.entities.Role.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      setShowForm(false);
      toast.success('Role created successfully');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Role.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      setShowForm(false);
      setEditingRole(null);
      toast.success('Role updated successfully');
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id) => base44.entities.Role.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast.success('Role deleted');
    }
  });

  const handleSubmit = (data) => {
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const handleDelete = (role) => {
    if (role.is_system_role) {
      toast.error('Cannot delete system roles');
      return;
    }
    if (confirm('Are you sure you want to delete this role?')) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  const getRoleUserCount = (roleId) => {
    return userRoles.filter(ur => ur.role_id === roleId && ur.status === 'active').length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Role Management</h3>
        <Button onClick={() => { setEditingRole(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : roles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-4">No roles defined yet</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Role
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(role => (
            <Card key={role.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <Shield className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{role.role_name}</h4>
                      <p className="text-xs text-slate-500">{role.role_code}</p>
                    </div>
                  </div>
                  <Badge className={role.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                    {role.status}
                  </Badge>
                </div>

                <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                  {role.description || 'No description'}
                </p>

                <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{getRoleUserCount(role.id)} users</span>
                  </div>
                  <div>
                    {role.permissions?.length || 0} permissions
                  </div>
                </div>

                {role.is_system_role && (
                  <Badge variant="outline" className="mb-3">System Role</Badge>
                )}

                <div className="flex items-center gap-2 pt-3 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => { setEditingRole(role); setShowForm(true); }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  {!role.is_system_role && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(role)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <RoleForm
          role={editingRole}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingRole(null); }}
          open={showForm}
          onOpenChange={setShowForm}
        />
      )}
    </div>
  );
}