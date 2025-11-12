import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Edit, Users, Briefcase, TrendingUp, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import StatCard from "../components/hrms/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function Departments() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    manager_id: '',
    parent_department_id: '',
    cost_center: '',
    location: '',
    status: 'active'
  });

  const queryClient = useQueryClient();

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  // Extract unique departments from employees
  const departments = React.useMemo(() => {
    const deptMap = new Map();
    
    employees.forEach(emp => {
      if (emp.department) {
        if (!deptMap.has(emp.department)) {
          deptMap.set(emp.department, {
            name: emp.department,
            employees: [],
            manager: null
          });
        }
        deptMap.get(emp.department).employees.push(emp);
        
        // Find potential manager (first person with subordinates or highest in hierarchy)
        const currentManager = deptMap.get(emp.department).manager;
        const empSubordinates = employees.filter(e => e.manager_id === emp.id).length;
        if (!currentManager || empSubordinates > 0) {
          deptMap.get(emp.department).manager = emp;
        }
      }
    });

    return Array.from(deptMap.values());
  }, [employees]);

  const handleEdit = (dept) => {
    setEditingDepartment(dept);
    setFormData({
      name: dept.name,
      code: dept.name.substring(0, 3).toUpperCase(),
      description: `${dept.name} Department`,
      manager_id: dept.manager?.id || '',
      parent_department_id: '',
      cost_center: '',
      location: '',
      status: 'active'
    });
    setShowDialog(true);
  };

  const handleAdd = () => {
    setEditingDepartment(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      manager_id: '',
      parent_department_id: '',
      cost_center: '',
      location: '',
      status: 'active'
    });
    setShowDialog(true);
  };

  const getDepartmentStats = (dept) => {
    const totalEmployees = dept.employees.length;
    const activeEmployees = dept.employees.filter(e => e.status === 'active').length;
    const avgSalary = dept.employees.reduce((sum, e) => sum + (e.basic_salary || 0), 0) / totalEmployees || 0;
    
    return {
      totalEmployees,
      activeEmployees,
      avgSalary: avgSalary.toFixed(0),
      manager: dept.manager
    };
  };

  const getEmployeesByJobTitle = (dept) => {
    const titleCounts = {};
    dept.employees.forEach(emp => {
      const title = emp.job_title || 'Unspecified';
      titleCounts[title] = (titleCounts[title] || 0) + 1;
    });
    return Object.entries(titleCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  };

  const totalEmployees = employees.length;
  const activeDepartments = departments.length;
  const avgDeptSize = totalEmployees / activeDepartments || 0;
  const departmentsWithManagers = departments.filter(d => d.manager).length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Department Management</h1>
          <p className="text-slate-600">Manage organizational departments and their structure</p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Department
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatCard
          title="Total Departments"
          value={activeDepartments}
          icon={Building}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Total Employees"
          value={totalEmployees}
          icon={Users}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Avg Department Size"
          value={avgDeptSize.toFixed(1)}
          icon={TrendingUp}
          bgColor="from-purple-500 to-purple-600"
        />
        <StatCard
          title="With Managers"
          value={departmentsWithManagers}
          icon={Briefcase}
          bgColor="from-amber-500 to-amber-600"
        />
      </div>

      {/* Departments Grid */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
          <CardTitle>All Departments</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loadingEmployees ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-64" />)}
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-4">No departments found</p>
              <p className="text-sm text-slate-400">Departments are created automatically when employees are assigned to them</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((dept) => {
                const stats = getDepartmentStats(dept);
                const topTitles = getEmployeesByJobTitle(dept);
                
                return (
                  <Card
                    key={dept.name}
                    className="border-2 border-slate-200 hover:shadow-xl transition-all hover:border-emerald-300 group"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Building className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-slate-900">{dept.name}</h3>
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 mt-1">
                                Active
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(dept)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Manager */}
                      {stats.manager && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-transparent rounded-lg border border-blue-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Briefcase className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-700">Department Head</span>
                          </div>
                          <p className="text-sm font-semibold text-slate-900">
                            {stats.manager.first_name} {stats.manager.last_name}
                          </p>
                          <p className="text-xs text-slate-500">{stats.manager.job_title}</p>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-600">Total Staff</span>
                          </div>
                          <span className="font-bold text-slate-900">{stats.totalEmployees}</span>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm text-emerald-700">Active</span>
                          </div>
                          <span className="font-bold text-emerald-700">{stats.activeEmployees}</span>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                            <span className="text-sm text-purple-700">Avg Salary</span>
                          </div>
                          <span className="font-bold text-purple-700">{stats.avgSalary} SAR</span>
                        </div>
                      </div>

                      {/* Top Job Titles */}
                      {topTitles.length > 0 && (
                        <div className="border-t border-slate-100 pt-3">
                          <p className="text-xs font-semibold text-slate-500 mb-2">TOP ROLES</p>
                          <div className="space-y-1">
                            {topTitles.map(([title, count]) => (
                              <div key={title} className="flex items-center justify-between text-xs">
                                <span className="text-slate-600 truncate flex-1 mr-2">{title}</span>
                                <Badge variant="outline" className="text-xs">{count}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? 'Edit Department' : 'Add New Department'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Department Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Human Resources"
                />
              </div>
              <div>
                <Label>Department Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="e.g., HR"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Department description and responsibilities"
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Department Head</Label>
                <Select
                  value={formData.manager_id}
                  onValueChange={(val) => setFormData({...formData, manager_id: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} - {emp.job_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Parent Department</Label>
                <Select
                  value={formData.parent_department_id}
                  onValueChange={(val) => setFormData({...formData, parent_department_id: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (Top level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None (Top level)</SelectItem>
                    {departments.filter(d => d.name !== editingDepartment?.name).map(dept => (
                      <SelectItem key={dept.name} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Cost Center</Label>
                <Input
                  value={formData.cost_center}
                  onChange={(e) => setFormData({...formData, cost_center: e.target.value})}
                  placeholder="e.g., CC-001"
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., Building A, Floor 2"
                />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Currently, departments are automatically created from employee data. 
                To create a new department, assign an employee to it in the Employee Management page.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  toast.info('Department management coming soon!');
                  setShowDialog(false);
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {editingDepartment ? 'Update' : 'Create'} Department
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}