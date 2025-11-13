import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { useAccessControl } from '@/components/AccessControlContext';
import { Shield, Users, Mail, Plus, Edit2, CheckCircle2, XCircle } from "lucide-react";
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
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function UserManagement() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const { isAdmin, isSuperAdmin } = useAccessControl();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
    enabled: isAdmin
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-for-users'],
    queryFn: () => base44.entities.Employee.list(),
    enabled: isAdmin
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
      setShowForm(false);
      setEditingUser(null);
      toast.success('User permissions updated successfully');
    },
    onError: () => toast.error('Failed to update user')
  });

  const createUserMutation = useMutation({
    mutationFn: (data) => base44.entities.User.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
      setShowForm(false);
      toast.success('User access configured successfully');
    },
    onError: () => toast.error('Failed to create user access')
  });

  const UserForm = ({ user, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(user || {
      email: '',
      employee_id: '',
      custom_roles: [],
      company_access: [],
      department_access: [],
      permissions: {
        can_approve_leaves: false,
        can_approve_travel: false,
        can_approve_loans: false,
        can_manage_payroll: false,
        can_view_all_employees: false,
        can_manage_onboarding: false,
        can_manage_assets: false,
        can_manage_benefits: false,
        can_view_reports: false,
        can_export_data: false
      },
      is_active: true
    });

    const availableRoles = [
      { value: 'super_admin', label: 'Super Admin' },
      { value: 'employee_manager', label: 'Employee Manager' },
      { value: 'time_manager', label: 'Time Manager' },
      { value: 'onboarding_specialist', label: 'Onboarding Specialist' },
      { value: 'payroll_manager', label: 'Payroll Manager' },
      { value: 'leave_manager', label: 'Leave Manager' },
      { value: 'travel_manager', label: 'Travel & Expense Manager' },
      { value: 'asset_manager', label: 'Asset Manager' },
      { value: 'project_manager', label: 'Project Manager' },
      { value: 'performance_manager', label: 'Performance Manager' },
      { value: 'benefit_manager', label: 'Benefit Manager' },
      { value: 'document_manager', label: 'Document Manager' },
      { value: 'gosi_specialist', label: 'GOSI Specialist' },
      { value: 'report_viewer', label: 'Report Viewer' }
    ];

    const toggleRole = (role) => {
      const currentRoles = Array.isArray(formData.custom_roles) ? formData.custom_roles : [];
      const newRoles = currentRoles.includes(role)
        ? currentRoles.filter(r => r !== role)
        : [...currentRoles, role];
      setFormData({ ...formData, custom_roles: newRoles });
    };

    const toggleCompany = (companyId) => {
      const currentCompanies = Array.isArray(formData.company_access) ? formData.company_access : [];
      const newCompanies = currentCompanies.includes(companyId)
        ? currentCompanies.filter(c => c !== companyId)
        : [...currentCompanies, companyId];
      setFormData({ ...formData, company_access: newCompanies });
    };

    const togglePermission = (permission) => {
      setFormData({
        ...formData,
        permissions: {
          ...(formData.permissions || {}),
          [permission]: !(formData.permissions?.[permission])
        }
      });
    };

    return (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-6">
        {/* User Selection */}
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-900 border-b pb-2">User Account</h4>
          
          {!user && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="user@company.com"
                  required
                />
              </div>
              <div>
                <Label>Linked Employee</Label>
                <Select
                  value={formData.employee_id}
                  onValueChange={(val) => setFormData({...formData, employee_id: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} - {emp.employee_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          {user && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">Editing access for: <strong>{user.email}</strong></p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Account is Active
            </Label>
          </div>
        </div>

        {/* Functional Roles */}
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-900 border-b pb-2">Functional Roles</h4>
          <p className="text-sm text-slate-600">
            Select the modules this user can access. Each role grants access to specific functionality.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableRoles.map(role => {
              const currentRoles = Array.isArray(formData.custom_roles) ? formData.custom_roles : [];
              const isChecked = currentRoles.includes(role.value);
              
              return (
                <div
                  key={role.value}
                  onClick={() => toggleRole(role.value)}
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${isChecked
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-emerald-200 bg-white'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox checked={isChecked} readOnly />
                    <span className="font-medium text-sm text-slate-900">{role.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Company Access */}
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-900 border-b pb-2">Company Access</h4>
          <p className="text-sm text-slate-600">
            Select which companies this user can view and manage data for.
          </p>
          
          <div className="grid md:grid-cols-2 gap-3">
            {companies.map(company => {
              const currentCompanies = Array.isArray(formData.company_access) ? formData.company_access : [];
              const isChecked = currentCompanies.includes(company.id);
              
              return (
                <div
                  key={company.id}
                  onClick={() => toggleCompany(company.id)}
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${isChecked
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-200 bg-white'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox checked={isChecked} readOnly />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-slate-900">{company.name_en}</p>
                      <p className="text-xs text-slate-500">{company.cr_number}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Granular Permissions */}
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-900 border-b pb-2">Additional Permissions</h4>
          <p className="text-sm text-slate-600">
            Fine-tune specific capabilities beyond module access.
          </p>
          
          <div className="grid md:grid-cols-2 gap-3">
            {Object.keys(formData.permissions || {}).map(perm => (
              <div key={perm} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Checkbox
                  id={perm}
                  checked={formData.permissions?.[perm] || false}
                  onCheckedChange={() => togglePermission(perm)}
                />
                <Label htmlFor={perm} className="cursor-pointer text-sm">
                  {perm.replace(/_/g, ' ').replace('can ', '')}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
            {user ? 'Update Access' : 'Create User Access'}
          </Button>
        </div>
      </form>
    );
  };

  if (!isAdmin) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold text-red-900 mb-2">{t('access_denied')}</h2>
            <p className="text-red-700">{t('no_permission_user_mgmt')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('user_access_management')}</h1>
          <p className="text-slate-600">{t('user_management_desc')}</p>
        </div>
        <Button 
          onClick={() => { setEditingUser(null); setShowForm(true); }}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Configure User Access
        </Button>
      </div>

      {/* User List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>System Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-4">No user access configurations yet</p>
              <Button onClick={() => setShowForm(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Configure First User
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map(user => {
                const employee = employees.find(e => e.id === user.employee_id);
                const userCompanyAccess = Array.isArray(user.company_access) ? user.company_access : [];
                const linkedCompanies = companies.filter(c => userCompanyAccess.includes(c.id));
                const userRoles = Array.isArray(user.custom_roles) ? user.custom_roles : [];
                
                return (
                  <Card key={user.id} className="border border-slate-200">
                    <CardContent className="p-5">
                      <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <p className="font-semibold text-slate-900">{user.email}</p>
                            {!user.is_active && (
                              <Badge variant="outline" className="bg-red-50 text-red-700">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          
                          {employee && (
                            <p className="text-sm text-slate-600 mb-3">
                              {employee.first_name} {employee.last_name} - {employee.employee_id}
                            </p>
                          )}

                          {userRoles.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {userRoles.map(role => (
                                <Badge key={role} variant="outline" className="text-xs bg-emerald-50 text-emerald-700">
                                  {role.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {linkedCompanies.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {linkedCompanies.map(company => (
                                <Badge key={company.id} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                  {company.name_en}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setEditingUser(user); setShowForm(true); }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User Access' : 'Configure User Access'}
            </DialogTitle>
          </DialogHeader>
          <UserForm
            user={editingUser}
            onSubmit={(data) => {
              if (editingUser) {
                updateUserMutation.mutate({ id: editingUser.id, data });
              } else {
                createUserMutation.mutate(data);
              }
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingUser(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}