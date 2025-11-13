import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { useAccessControl } from '@/components/AccessControlContext';
import ProtectedModule from '@/components/ProtectedModule';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Plus, Search, Mail, Phone, Calendar, Building2, Briefcase, Shield
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import EmployeeFormTabs from "../components/employees/EmployeeFormTabs";
import { toast } from "sonner";

function EmployeesPageContent() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const { selectedCompanyId, getAccessibleCompanyIds, hasRole, hasPermission } = useAccessControl();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const queryClient = useQueryClient();

  const canManageEmployees = hasRole('employee_manager') || hasRole('super_admin') || hasPermission('can_view_all_employees');

  const { data: allEmployees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['all-employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['current-user-employees'],
    queryFn: () => base44.auth.me()
  });

  // Filter employees by accessible companies and search
  const accessibleCompanyIds = getAccessibleCompanyIds();
  const employees = allEmployees.filter(emp => {
    const companyMatch = selectedCompanyId === 'all' 
      ? accessibleCompanyIds.includes(emp.company_id)
      : emp.company_id === selectedCompanyId;
    
    const searchMatch = !searchTerm || 
      emp.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return companyMatch && searchMatch;
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list(),
  });

  const createEmployeeMutation = useMutation({
    mutationFn: (data) => base44.entities.Employee.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-employees']);
      setShowForm(false);
      setEditingEmployee(null);
      toast.success('Employee created successfully');
    },
    onError: () => {
      toast.error('Failed to create employee');
    }
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-employees']);
      setShowForm(false);
      setEditingEmployee(null);
      toast.success('Employee updated successfully');
    },
    onError: () => {
      toast.error('Failed to update employee');
    }
  });

  const handleSubmit = (data) => {
    const employeeData = data.employee || data;
    
    // Ensure company_id is set
    if (selectedCompanyId !== 'all') {
      employeeData.company_id = selectedCompanyId;
    }
    
    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, data: employeeData });
    } else {
      createEmployeeMutation.mutate(employeeData);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-emerald-100 text-emerald-700',
      inactive: 'bg-slate-100 text-slate-700',
      on_leave: 'bg-amber-100 text-amber-700',
      terminated: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
            <h1 className="text-3xl font-bold text-slate-900">{t('employees')}</h1>
            {canManageEmployees && (
              <Badge variant="outline" className="text-xs">
                <Shield className="w-3 h-3 mr-1" /> {t('full_access')}
              </Badge>
            )}
          </div>
          <p className="text-slate-600">{t('manage_all_employees')}</p>
        </div>
        {canManageEmployees && (
          <Button 
            onClick={() => { setEditingEmployee(null); setShowForm(true); }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('add_employee')}
          </Button>
        )}
      </div>

      {/* Search and Stats */}
      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="relative">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400`} />
              <Input
                placeholder={t('search_employees')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${isRTL ? 'pr-10' : 'pl-10'} h-12 text-base`}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={isRTL ? 'text-right' : ''}>
                <p className="text-sm text-slate-600 mb-1">{t('total_accessible')}</p>
                <p className="text-3xl font-bold text-blue-600">{employees.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          {loadingEmployees ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-4">
                {searchTerm ? t('no_employees_found') : t('no_employees_found')}
              </p>
              {canManageEmployees && (
                <Button onClick={() => setShowForm(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('add_first_employee')}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-4">
              {employees.map((employee) => (
                <Card 
                  key={employee.id} 
                  className="border border-slate-200 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => { setEditingEmployee(employee); setShowForm(true); }}
                >
                  <CardContent className="p-5">
                    <div className={`flex items-start justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                          {employee.first_name?.charAt(0)}{employee.last_name?.charAt(0)}
                        </div>
                        <div className={isRTL ? 'text-right' : ''}>
                          <h3 className="font-semibold text-slate-900">
                            {employee.first_name} {employee.last_name}
                          </h3>
                          <p className="text-sm text-slate-500">{employee.employee_id}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(employee.status)}>
                        {employee.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className={`flex items-center gap-2 text-slate-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Briefcase className="w-4 h-4" />
                        <span>{employee.job_title}</span>
                      </div>
                      <div className={`flex items-center gap-2 text-slate-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Building2 className="w-4 h-4" />
                        <span>{employee.department}</span>
                      </div>
                      <div className={`flex items-center gap-2 text-slate-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{employee.email}</span>
                      </div>
                      {employee.phone && (
                        <div className={`flex items-center gap-2 text-slate-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Phone className="w-4 h-4" />
                          <span>{employee.phone}</span>
                        </div>
                      )}
                      <div className={`flex items-center gap-2 text-slate-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Calendar className="w-4 h-4" />
                        <span>{t('joined')} {new Date(employee.hire_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? t('edit_employee') : t('add_employee')}
            </DialogTitle>
          </DialogHeader>
          <EmployeeFormTabs
            employee={editingEmployee}
            shifts={shifts}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingEmployee(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <ProtectedModule moduleName="Employees">
      <EmployeesPageContent />
    </ProtectedModule>
  );
}