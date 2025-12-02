import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { User, Shield, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export default function UserRoleAssignment() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.filter({ status: 'active' })
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.filter({ status: 'active' })
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ['all-user-roles'],
    queryFn: () => base44.entities.UserRole.list()
  });

  const assignRoleMutation = useMutation({
    mutationFn: (data) => base44.entities.UserRole.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-user-roles']);
      setSelectedUser("");
      setSelectedRole("");
      setSelectedCompany("");
      toast.success('Role assigned successfully');
    }
  });

  const removeRoleMutation = useMutation({
    mutationFn: (id) => base44.entities.UserRole.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-user-roles']);
      toast.success('Role removed');
    }
  });

  const handleAssign = () => {
    if (!selectedUser || !selectedRole || !selectedCompany) {
      toast.error('Please select a user, role, and company');
      return;
    }

    // Check if already assigned
    const exists = userRoles.some(ur => 
      ur.user_email === selectedUser && 
      ur.role_id === selectedRole && 
      ur.company_id === selectedCompany
    );
    if (exists) {
      toast.error('This role is already assigned to this user for this company');
      return;
    }

    assignRoleMutation.mutate({
      user_email: selectedUser,
      role_id: selectedRole,
      company_id: selectedCompany,
      effective_from: new Date().toISOString().split('T')[0],
      status: 'active'
    });
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserRoles = (email) => {
    return userRoles
      .filter(ur => ur.user_email === email && ur.status === 'active')
      .map(ur => ({
        ...ur,
        role: roles.find(r => r.id === ur.role_id),
        company: companies.find(c => c.id === ur.company_id)
      }));
  };

  return (
    <div className="space-y-6">
      {/* Assign Role Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assign Role to User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-slate-600 mb-1 block">User</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.email} value={user.email}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-slate-600 mb-1 block">Company</label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-slate-600 mb-1 block">Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.role_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAssign} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Assign
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User List with Roles */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">User Role Assignments</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredUsers.map(user => {
              const assignedRoles = getUserRoles(user.email);
              
              return (
                <div key={user.email} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">{user.full_name}</h4>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <Badge className={user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}>
                      {user.role}
                    </Badge>
                  </div>

                  {assignedRoles.length > 0 && (
                    <div className="mt-3 pl-13 flex flex-wrap gap-2">
                      {assignedRoles.map(ur => (
                        <div key={ur.id} className="flex items-center gap-1 bg-emerald-50 rounded-full pl-3 pr-1 py-1">
                          <Shield className="w-3 h-3 text-emerald-600" />
                          <span className="text-sm text-emerald-700">{ur.role?.role_name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-red-500 hover:text-red-700"
                            onClick={() => removeRoleMutation.mutate(ur.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {assignedRoles.length === 0 && user.role !== 'admin' && (
                    <p className="text-xs text-slate-400 mt-2 pl-13">No custom roles assigned</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}