import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Plus, Search, Mail, Phone, Calendar, Building2, Briefcase, Shield, Trash2, LayoutGrid, List
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import EmployeeFormTabs from "../components/employees/EmployeeFormTabs";
import EmployeeListView from "../components/employees/EmployeeListView";
import { toast } from "sonner";

export default function EmployeesPage() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [viewMode, setViewMode] = useState('card');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user-employees'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      setCurrentUser(userData);
      return userData;
    }
  });

  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['filtered-employees', searchTerm, selectedCompany, selectedDepartment, selectedStatus],
    queryFn: async () => {
      const response = await base44.functions.invoke('getFilteredEmployees', {
        filters: {
          search: searchTerm,
          company: selectedCompany !== 'all' ? selectedCompany : undefined,
          department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined
        }
      });
      return response.data;
    },
    enabled: !!user
  });

  const employees = employeesData?.employees || [];
  const accessLevel = employeesData?.access_level || 'employee';

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: positions = [], refetch: refetchPositions } = useQuery({
    queryKey: ['positions'],
    queryFn: () => base44.entities.Position.list()
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list()
  });

  const createEmployeeMutation = useMutation({
    mutationFn: (data) => base44.entities.Employee.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['filtered-employees']);
      setShowForm(false);
      setEditingEmployee(null);
      toast.success(t('employee_created_success'));
    },
    onError: () => {
      toast.error(t('failed_to_create_employee'));
    }
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['filtered-employees']);
      setShowForm(false);
      setEditingEmployee(null);
      toast.success(t('employee_updated_success'));
    },
    onError: () => {
      toast.error(t('failed_to_update_employee'));
    }
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: (id) => base44.entities.Employee.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['filtered-employees']);
      toast.success('Employee deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete employee');
    }
  });

  const handleSubmit = async (data) => {
    const employeeData = data.employee || data;
    const shiftAssignments = data.shiftAssignments || [];
    
    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, data: employeeData }, {
        onSuccess: async () => {
          setHasUnsavedChanges(false);
          // Handle shift assignments
          if (shiftAssignments.length > 0) {
            try {
              // Get existing assignments
              const existingAssignments = await base44.entities.ShiftAssignment.filter({ employee_id: editingEmployee.id });
              
              // Delete old assignments
              for (const existing of existingAssignments) {
                await base44.entities.ShiftAssignment.delete(existing.id);
              }
              
              // Create new assignments
              for (const assignment of shiftAssignments) {
                if (assignment.shift_id) {
                  await base44.entities.ShiftAssignment.create({
                    ...assignment,
                    employee_id: editingEmployee.id
                  });
                }
              }
              queryClient.invalidateQueries(['shift-assignments']);
            } catch (err) {
              console.error('Error saving shift assignments:', err);
            }
          }
        }
      });
    } else {
      createEmployeeMutation.mutate(employeeData, {
        onSuccess: async (newEmployee) => {
          setHasUnsavedChanges(false);
          // Handle shift assignments for new employee
          if (shiftAssignments.length > 0 && newEmployee?.id) {
            try {
              for (const assignment of shiftAssignments) {
                if (assignment.shift_id) {
                  await base44.entities.ShiftAssignment.create({
                    ...assignment,
                    employee_id: newEmployee.id
                  });
                }
              }
              queryClient.invalidateQueries(['shift-assignments']);
            } catch (err) {
              console.error('Error saving shift assignments:', err);
            }
          }
        }
      });
    }
  };

  const handleDelete = (employee, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${employee.first_name} ${employee.last_name}? This action cannot be undone.`)) {
      deleteEmployeeMutation.mutate(employee.id);
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
            <Badge variant="outline" className="text-xs">
              {accessLevel === 'admin' ? (
                <><Shield className="w-3 h-3 mr-1" /> {t('full_access')}</>
              ) : accessLevel === 'manager' ? (
                <><Users className="w-3 h-3 mr-1" /> {t('my_team')}</>
              ) : (
                <><Users className="w-3 h-3 mr-1" /> {t('personal_view')}</>
              )}
            </Badge>
          </div>
          <p className="text-slate-600">
            {accessLevel === 'admin' && t('manage_all_employees')}
            {accessLevel === 'manager' && t('view_manage_team')}
            {accessLevel === 'employee' && t('view_your_info')}
          </p>
        </div>
        {accessLevel === 'admin' && (
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
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400`} />
                <Input
                  placeholder={t('search_employees_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${isRTL ? 'pr-10' : 'pl-10'} h-12 text-base`}
                />
              </div>
              {accessLevel === 'admin' && companies.length > 1 && (
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="h-12 px-4 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{t('all_companies')}</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name_en}
                    </option>
                  ))}
                </select>
              )}
              {departments.length > 0 && (
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="h-12 px-4 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{t('all_departments') || 'All Departments'}</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-12 px-4 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('all_statuses') || 'All Statuses'}</option>
                <option value="active">{t('active') || 'Active'}</option>
                <option value="inactive">{t('inactive') || 'Inactive'}</option>
                <option value="on_leave">{t('on_leave') || 'On Leave'}</option>
                <option value="terminated">{t('terminated') || 'Terminated'}</option>
              </select>
              <div className="flex items-center border rounded-lg p-1 bg-slate-100">
                <Button
                  variant={viewMode === 'card' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                  className={viewMode === 'card' ? 'bg-white shadow-sm' : ''}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-white shadow-sm' : ''}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
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
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-4">
                {searchTerm ? t('no_employees_found_matching_search') : t('no_employees_found')}
              </p>
              {accessLevel === 'admin' && (
                <Button onClick={() => setShowForm(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('add_first_employee')}
                </Button>
              )}
            </div>
          ) : viewMode === 'list' ? (
            <EmployeeListView
              employees={employees}
              onEdit={(employee) => { setEditingEmployee(employee); setShowForm(true); }}
              onDelete={handleDelete}
              accessLevel={accessLevel}
            />
          ) : (
            <div className="grid lg:grid-cols-2 gap-4">
              {employees.map((employee) => (
                <Card 
                  key={employee.id} 
                  className="border border-slate-200 hover:shadow-lg transition-all cursor-pointer group"
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
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(employee.status)}>
                          {employee.status}
                        </Badge>
                        {accessLevel === 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDelete(employee, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
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

                    {employee.manager_id === employeesData?.current_employee_id && (
                      <div className="mt-3 pt-3 border-t">
                        <Badge variant="outline" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {t('reports_to_you')}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => {
          if (!open && hasUnsavedChanges) {
            if (window.confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
              setShowForm(false);
              setEditingEmployee(null);
              setHasUnsavedChanges(false);
            }
          } else {
            setShowForm(open);
            if (!open) {
              setEditingEmployee(null);
              setHasUnsavedChanges(false);
            }
          }
        }}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? t('edit_employee') : t('add_employee')}
            </DialogTitle>
          </DialogHeader>
          <EmployeeFormTabs
            employee={editingEmployee}
            shifts={shifts}
            companies={companies}
            positions={positions}
            employees={employees}
            departments={departments}
            onSubmit={handleSubmit}
            onCancel={() => {
              if (hasUnsavedChanges) {
                if (window.confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
                  setShowForm(false);
                  setEditingEmployee(null);
                  setHasUnsavedChanges(false);
                }
              } else {
                setShowForm(false);
                setEditingEmployee(null);
              }
            }}
            onFormChange={() => setHasUnsavedChanges(true)}
            refetchPositions={refetchPositions}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}