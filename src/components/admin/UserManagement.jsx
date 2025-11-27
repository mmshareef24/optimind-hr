import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { UserPlus, Shield, Edit, Mail, Building2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserManagement() {
  const [showDialog, setShowDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inviteData, setInviteData] = useState({ email: '', full_name: '', role: 'user' });
  const queryClient = useQueryClient();

  // Fetch all users
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list()
  });

  // Fetch all employees for linking
  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['all-employees-users'],
    queryFn: () => base44.entities.Employee.list()
  });

  // Fetch all companies
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  // Get unique departments
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const [formData, setFormData] = useState({
    employee_id: '',
    department_access: [],
    company_access: [],
    permissions: {
      can_approve_leaves: false,
      can_approve_travel: false,
      can_approve_loans: false,
      can_manage_payroll: false,
      can_view_all_employees: false,
      can_manage_onboarding: false
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
      setShowDialog(false);
      setSelectedUser(null);
      toast.success('User access updated successfully');
    },
    onError: () => {
      toast.error('Failed to update user access');
    }
  });

  const inviteUserMutation = useMutation({
    mutationFn: (data) => base44.auth.inviteUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
      setShowInviteDialog(false);
      setInviteData({ email: '', full_name: '', role: 'user' });
      toast.success('User invitation sent successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to invite user');
    }
  });

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      employee_id: user.employee_id || '',
      department_access: user.department_access || [],
      company_access: user.company_access || [],
      permissions: user.permissions || {
        can_approve_leaves: false,
        can_approve_travel: false,
        can_approve_loans: false,
        can_manage_payroll: false,
        can_view_all_employees: false,
        can_manage_onboarding: false
      }
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!selectedUser) return;
    updateUserMutation.mutate({
      userId: selectedUser.id,
      data: formData
    });
  };

  const handleInviteSubmit = () => {
    if (!inviteData.email || !inviteData.full_name) {
      toast.error('Please fill in all required fields');
      return;
    }
    inviteUserMutation.mutate(inviteData);
  };

  const toggleDepartment = (dept) => {
    setFormData(prev => ({
      ...prev,
      department_access: prev.department_access.includes(dept)
        ? prev.department_access.filter(d => d !== dept)
        : [...prev.department_access, dept]
    }));
  };

  const toggleCompany = (companyId) => {
    setFormData(prev => ({
      ...prev,
      company_access: prev.company_access.includes(companyId)
        ? prev.company_access.filter(c => c !== companyId)
        : [...prev.company_access, companyId]
    }));
  };

  const togglePermission = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission]
      }
    }));
  };

  if (loadingUsers || loadingEmployees) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              User Access Management
            </CardTitle>
            <Button onClick={() => setShowInviteDialog(true)} className="bg-purple-600 hover:bg-purple-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {users.map((user) => {
              const linkedEmployee = employees.find(e => e.id === user.employee_id || e.email === user.email);
              
              return (
                <Card key={user.id} className="border border-slate-200 hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                          {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900">{user.full_name}</h3>
                            <Badge className={user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}>
                              {user.role}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Mail className="w-4 h-4" />
                              <span>{user.email}</span>
                            </div>
                            
                            {linkedEmployee && (
                              <>
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Briefcase className="w-4 h-4" />
                                  <span>{linkedEmployee.job_title} • {linkedEmployee.department}</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  Linked to Employee: {linkedEmployee.employee_id}
                                </Badge>
                              </>
                            )}
                            
                            {!linkedEmployee && user.employee_id && (
                              <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">
                                Employee ID: {user.employee_id} (Not Found)
                              </Badge>
                            )}

                            {user.company_access && user.company_access.length > 0 && (
                              <div className="flex items-center gap-2 text-slate-600">
                                <Building2 className="w-4 h-4" />
                                <span>Access: {user.company_access.length} {user.company_access.length === 1 ? 'Company' : 'Companies'}</span>
                              </div>
                            )}

                            {user.department_access && user.department_access.length > 0 && (
                              <div className="flex items-center gap-2 text-slate-600">
                                <Building2 className="w-4 h-4" />
                                <span>Access: {user.department_access.join(', ')}</span>
                              </div>
                            )}

                            {user.permissions && Object.values(user.permissions).some(v => v) && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {user.permissions.can_approve_leaves && <Badge variant="outline" className="text-xs">Approve Leaves</Badge>}
                                {user.permissions.can_approve_travel && <Badge variant="outline" className="text-xs">Approve Travel</Badge>}
                                {user.permissions.can_approve_loans && <Badge variant="outline" className="text-xs">Approve Loans</Badge>}
                                {user.permissions.can_manage_payroll && <Badge variant="outline" className="text-xs">Manage Payroll</Badge>}
                                {user.permissions.can_view_all_employees && <Badge variant="outline" className="text-xs">View All Employees</Badge>}
                                {user.permissions.can_manage_onboarding && <Badge variant="outline" className="text-xs">Manage Onboarding</Badge>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit Access
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Access Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User Access - {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Link to Employee */}
            <div>
              <Label>Link to Employee Record</Label>
              <Select
                value={formData.employee_id}
                onValueChange={(val) => setFormData({ ...formData, employee_id: val })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No Employee Linked</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} - {emp.employee_id} ({emp.department})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Links this user account to an employee record for role-based access
              </p>
            </div>

            {/* Company Access */}
            {companies.length > 0 && (
              <div>
                <Label className="mb-2 block">Company Access (Leave empty for all companies)</Label>
                <div className="space-y-2 border rounded-lg p-3 max-h-32 overflow-y-auto">
                  {companies.map(company => (
                    <div key={company.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.company_access.includes(company.id)}
                        onCheckedChange={() => toggleCompany(company.id)}
                      />
                      <span className="text-sm">{company.name_en}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Department Access */}
            {departments.length > 0 && (
              <div>
                <Label className="mb-2 block">Department Access (Leave empty for all departments)</Label>
                <div className="space-y-2 border rounded-lg p-3 max-h-32 overflow-y-auto">
                  {departments.map(dept => (
                    <div key={dept} className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.department_access.includes(dept)}
                        onCheckedChange={() => toggleDepartment(dept)}
                      />
                      <span className="text-sm">{dept}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Permissions */}
            <div>
              <Label className="mb-2 block">Permissions</Label>
              <div className="space-y-3 border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Approve Leave Requests</p>
                    <p className="text-xs text-slate-500">Can approve/reject leave requests</p>
                  </div>
                  <Checkbox
                    checked={formData.permissions.can_approve_leaves}
                    onCheckedChange={() => togglePermission('can_approve_leaves')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Approve Travel Requests</p>
                    <p className="text-xs text-slate-500">Can approve/reject travel requests</p>
                  </div>
                  <Checkbox
                    checked={formData.permissions.can_approve_travel}
                    onCheckedChange={() => togglePermission('can_approve_travel')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Approve Loan Requests</p>
                    <p className="text-xs text-slate-500">Can approve/reject loan requests</p>
                  </div>
                  <Checkbox
                    checked={formData.permissions.can_approve_loans}
                    onCheckedChange={() => togglePermission('can_approve_loans')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Manage Payroll</p>
                    <p className="text-xs text-slate-500">Can process and manage payroll</p>
                  </div>
                  <Checkbox
                    checked={formData.permissions.can_manage_payroll}
                    onCheckedChange={() => togglePermission('can_manage_payroll')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">View All Employees</p>
                    <p className="text-xs text-slate-500">Can view all employee records</p>
                  </div>
                  <Checkbox
                    checked={formData.permissions.can_view_all_employees}
                    onCheckedChange={() => togglePermission('can_view_all_employees')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Manage Onboarding</p>
                    <p className="text-xs text-slate-500">Can create and assign onboarding checklists</p>
                  </div>
                  <Checkbox
                    checked={formData.permissions.can_manage_onboarding}
                    onCheckedChange={() => togglePermission('can_manage_onboarding')}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={updateUserMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-600" />
              Invite New User
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={inviteData.full_name}
                onChange={(e) => setInviteData({ ...inviteData, full_name: e.target.value })}
                placeholder="Enter full name"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Email Address *</Label>
              <Input
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                placeholder="Enter email address"
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">
                An invitation email will be sent to this address
              </p>
            </div>

            <div>
              <Label>Role</Label>
              <Select
                value={inviteData.role}
                onValueChange={(val) => setInviteData({ ...inviteData, role: val })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Admins have full access to all system features
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleInviteSubmit}
              disabled={inviteUserMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {inviteUserMutation.isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}