import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
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

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  // Fetch current user to understand their access level
  const { data: user } = useQuery({
    queryKey: ['current-user-employees'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      setCurrentUser(userData);
      return userData;
    }
  });

  // Fetch employees using secure backend function
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['filtered-employees', searchTerm],
    queryFn: async () => {
      const response = await base44.functions.invoke('getFilteredEmployees', {
        filters: {
          search: searchTerm
        }
      });
      return response.data;
    },
    enabled: !!user
  });

  const employees = employeesData?.employees || [];
  const accessLevel = employeesData?.access_level || 'employee';

  // Fetch shifts for the form
  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list(),
  });

  const createEmployeeMutation = useMutation({
    mutationFn: (data) => base44.entities.Employee.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['filtered-employees']);
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
      queryClient.invalidateQueries(['filtered-employees']);
      setShowForm(false);
      setEditingEmployee(null);
      toast.success('Employee updated successfully');
    },
    onError: () => {
      toast.error('Failed to update employee');
    }
  });

  const handleSubmit = (data) => {
    // Extract employee data from the form submission
    const employeeData = data.employee || data;
    
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-900">Employees</h1>
            <Badge variant="outline" className="text-xs">
              {accessLevel === 'admin' ? (
                <><Shield className="w-3 h-3 mr-1" /> Full Access</>
              ) : accessLevel === 'manager' ? (
                <><Users className="w-3 h-3 mr-1" /> My Team</>
              ) : (
                <><Users className="w-3 h-3 mr-1" /> Personal View</>
              )}
            </Badge>
          </div>
          <p className="text-slate-600">
            {accessLevel === 'admin' && 'Manage all employees in the organization'}
            {accessLevel === 'manager' && 'View and manage your direct reports'}
            {accessLevel === 'employee' && 'View your employee information'}
          </p>
        </div>
        {accessLevel === 'admin' && (
          <Button 
            onClick={() => { setEditingEmployee(null); setShowForm(true); }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Search and Stats */}
      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search employees by name, ID, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Accessible</p>
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
                {searchTerm ? 'No employees found matching your search' : 'No employees found'}
              </p>
              {accessLevel === 'admin' && (
                <Button onClick={() => setShowForm(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Employee
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
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                          {employee.first_name?.charAt(0)}{employee.last_name?.charAt(0)}
                        </div>
                        <div>
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
                      <div className="flex items-center gap-2 text-slate-600">
                        <Briefcase className="w-4 h-4" />
                        <span>{employee.job_title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building2 className="w-4 h-4" />
                        <span>{employee.department}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{employee.email}</span>
                      </div>
                      {employee.phone && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-4 h-4" />
                          <span>{employee.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {new Date(employee.hire_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {employee.manager_id === employeesData?.current_employee_id && (
                      <div className="mt-3 pt-3 border-t">
                        <Badge variant="outline" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          Reports to You
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
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
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