import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Search, Filter, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import EmployeeFormTabs from "../components/employees/EmployeeFormTabs";
import { toast } from "sonner";

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('all');
  
  // Filter states
  const [filters, setFilters] = useState({
    department: 'all',
    jobTitle: 'all',
    status: 'all',
    gosiApplicable: 'all',
    reportingManager: 'all'
  });

  const queryClient = useQueryClient();

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: allEmployees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list('-created_date'),
  });
  
  const employees = selectedCompany === 'all' 
    ? allEmployees 
    : allEmployees.filter(e => e.company_id === selectedCompany);

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list(),
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data) => {
      // Create employee
      const employee = await base44.entities.Employee.create(data.employee);
      
      // Create dependents
      if (data.dependents && data.dependents.length > 0) {
        const dependentsWithEmployeeId = data.dependents.map(dep => ({
          ...dep,
          employee_id: employee.id
        }));
        await Promise.all(
          dependentsWithEmployeeId.map(dep => base44.entities.Dependent.create(dep))
        );
      }
      
      // Create insurance
      if (data.insurance && data.insurance.length > 0) {
        const insuranceWithEmployeeId = data.insurance.map(ins => ({
          ...ins,
          employee_id: employee.id
        }));
        await Promise.all(
          insuranceWithEmployeeId.map(ins => base44.entities.Insurance.create(ins))
        );
      }

      // Create shift assignments
      if (data.shiftAssignments && data.shiftAssignments.length > 0) {
        const assignmentsWithEmployeeId = data.shiftAssignments.map(shift => ({
          ...shift,
          employee_id: employee.id
        }));
        await Promise.all(
          assignmentsWithEmployeeId.map(shift => base44.entities.ShiftAssignment.create(shift))
        );
      }
      
      return employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      queryClient.invalidateQueries(['shift-assignments']);
      setShowDialog(false);
      setEditingEmployee(null);
      toast.success('Employee created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create employee: ' + error.message);
    }
  });

  const handleSubmit = (data) => {
    createEmployeeMutation.mutate(data);
  };

  // Get unique values for filters
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
  const jobTitles = [...new Set(employees.map(e => e.job_title).filter(Boolean))];
  const managers = employees.filter(e => 
    employees.some(emp => emp.manager_id === e.id)
  );

  // Apply filters
  const filteredEmployees = employees.filter(e => {
    const matchesSearch = 
      e.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employee_id?.includes(searchTerm) ||
      e.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.job_title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = filters.department === 'all' || e.department === filters.department;
    const matchesJobTitle = filters.jobTitle === 'all' || e.job_title === filters.jobTitle;
    const matchesStatus = filters.status === 'all' || e.status === filters.status;
    const matchesGOSI = 
      filters.gosiApplicable === 'all' || 
      (filters.gosiApplicable === 'yes' && e.gosi_applicable === true) ||
      (filters.gosiApplicable === 'no' && e.gosi_applicable === false);
    const matchesManager = 
      filters.reportingManager === 'all' || e.manager_id === filters.reportingManager;

    return matchesSearch && matchesDepartment && matchesJobTitle && matchesStatus && matchesGOSI && matchesManager;
  });

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      department: 'all',
      jobTitle: 'all',
      status: 'all',
      gosiApplicable: 'all',
      reportingManager: 'all'
    });
  };

  // Check if any filter is active
  const hasActiveFilters = Object.values(filters).some(f => f !== 'all');

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Employee Management</h1>
          <p className="text-slate-600">Manage your workforce efficiently</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-[200px] bg-white">
              <SelectValue placeholder="All Companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map(company => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={() => { setEditingEmployee(null); setShowDialog(true); }}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Employee
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col gap-4">
            {/* Search and Filter Button */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name, ID, email, department, or job title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="relative">
                    <Filter className="w-4 h-4 mr-2" /> 
                    Advanced Filters
                    {hasActiveFilters && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-600 rounded-full" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">Filter Employees</h3>
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          <X className="w-4 h-4 mr-1" />
                          Clear All
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* Department Filter */}
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Department</label>
                        <Select
                          value={filters.department}
                          onValueChange={(val) => setFilters({ ...filters, department: val })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments.map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Job Title Filter */}
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Job Title</label>
                        <Select
                          value={filters.jobTitle}
                          onValueChange={(val) => setFilters({ ...filters, jobTitle: val })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Job Titles</SelectItem>
                            {jobTitles.map(title => (
                              <SelectItem key={title} value={title}>{title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Status</label>
                        <Select
                          value={filters.status}
                          onValueChange={(val) => setFilters({ ...filters, status: val })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="on_leave">On Leave</SelectItem>
                            <SelectItem value="terminated">Terminated</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* GOSI Applicable Filter */}
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">GOSI Applicable</label>
                        <Select
                          value={filters.gosiApplicable}
                          onValueChange={(val) => setFilters({ ...filters, gosiApplicable: val })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Reporting Manager Filter */}
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Reporting Manager</label>
                        <Select
                          value={filters.reportingManager}
                          onValueChange={(val) => setFilters({ ...filters, reportingManager: val })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Managers</SelectItem>
                            {managers.map(mgr => (
                              <SelectItem key={mgr.id} value={mgr.id}>
                                {mgr.first_name} {mgr.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {filters.department !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Department: {filters.department}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, department: 'all' })}
                    />
                  </Badge>
                )}
                {filters.jobTitle !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Job Title: {filters.jobTitle}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, jobTitle: 'all' })}
                    />
                  </Badge>
                )}
                {filters.status !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {filters.status}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, status: 'all' })}
                    />
                  </Badge>
                )}
                {filters.gosiApplicable !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    GOSI: {filters.gosiApplicable === 'yes' ? 'Applicable' : 'Not Applicable'}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, gosiApplicable: 'all' })}
                    />
                  </Badge>
                )}
                {filters.reportingManager !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Manager: {managers.find(m => m.id === filters.reportingManager)?.first_name} {managers.find(m => m.id === filters.reportingManager)?.last_name}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, reportingManager: 'all' })}
                    />
                  </Badge>
                )}
              </div>
            )}

            {/* Results Count */}
            <div className="flex items-center justify-between text-sm text-slate-600">
              <p>Showing <strong>{filteredEmployees.length}</strong> of <strong>{employees.length}</strong> employees</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-2">
                {hasActiveFilters ? 'No employees match the selected filters' : 'No employees found'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredEmployees.map((employee) => (
                <Card key={employee.id} className="border border-slate-200 hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-14 h-14 border-2 border-emerald-100">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold">
                          {employee.first_name?.[0]}{employee.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{employee.first_name} {employee.last_name}</h3>
                        <p className="text-sm text-slate-500">{employee.job_title} • {employee.department}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-slate-400">ID: {employee.employee_id}</p>
                          {employee.gosi_applicable && (
                            <Badge className="text-xs bg-amber-100 text-amber-700">GOSI</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                          <p className="text-sm text-slate-500">Status</p>
                          <Badge className={
                            employee.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            employee.status === 'on_leave' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }>
                            {employee.status}
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm">View Details</Button>
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
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
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
              setShowDialog(false);
              setEditingEmployee(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}