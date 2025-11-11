import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Users, X, UserPlus, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function BulkAssignTeamMembersModal({ 
  project,
  employees = [], 
  existingAssignments = [],
  isOpen, 
  onClose,
  onBulkAssign
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [assignmentDetails, setAssignmentDetails] = useState({});
  const [defaultSettings, setDefaultSettings] = useState({
    allocation_percentage: 100,
    assigned_date: new Date().toISOString().split('T')[0],
    end_date: project?.end_date || '',
    hourly_rate: 0
  });

  // Filter out already assigned employees
  const assignedEmployeeIds = existingAssignments.map(a => a.employee_id);
  const availableEmployees = employees.filter(e => 
    e.status === 'active' && !assignedEmployeeIds.includes(e.id)
  );

  // Filter by search
  const filteredEmployees = availableEmployees.filter(emp => {
    const searchLower = searchTerm.toLowerCase();
    return (
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchLower) ||
      emp.job_title?.toLowerCase().includes(searchLower) ||
      emp.department?.toLowerCase().includes(searchLower)
    );
  });

  // Group by department
  const groupedEmployees = filteredEmployees.reduce((acc, emp) => {
    const dept = emp.department || 'No Department';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {});

  const handleToggleEmployee = (employee) => {
    if (selectedEmployees.find(e => e.id === employee.id)) {
      setSelectedEmployees(selectedEmployees.filter(e => e.id !== employee.id));
      const newDetails = { ...assignmentDetails };
      delete newDetails[employee.id];
      setAssignmentDetails(newDetails);
    } else {
      setSelectedEmployees([...selectedEmployees, employee]);
      setAssignmentDetails({
        ...assignmentDetails,
        [employee.id]: {
          role: employee.job_title || '',
          allocation_percentage: defaultSettings.allocation_percentage,
          assigned_date: defaultSettings.assigned_date,
          end_date: defaultSettings.end_date,
          hourly_rate: defaultSettings.hourly_rate,
          responsibilities: '',
          notes: ''
        }
      });
    }
  };

  const handleUpdateAssignment = (employeeId, field, value) => {
    setAssignmentDetails({
      ...assignmentDetails,
      [employeeId]: {
        ...assignmentDetails[employeeId],
        [field]: value
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const assignments = selectedEmployees.map(emp => ({
      project_id: project?.id,
      employee_id: emp.id,
      status: 'active',
      ...assignmentDetails[emp.id]
    }));

    onBulkAssign(assignments);
  };

  const handleSelectAll = () => {
    const newSelected = [...filteredEmployees];
    setSelectedEmployees(newSelected);
    
    const newDetails = { ...assignmentDetails };
    newSelected.forEach(emp => {
      if (!newDetails[emp.id]) {
        newDetails[emp.id] = {
          role: emp.job_title || '',
          allocation_percentage: defaultSettings.allocation_percentage,
          assigned_date: defaultSettings.assigned_date,
          end_date: defaultSettings.end_date,
          hourly_rate: defaultSettings.hourly_rate,
          responsibilities: '',
          notes: ''
        };
      }
    });
    setAssignmentDetails(newDetails);
  };

  const handleDeselectAll = () => {
    setSelectedEmployees([]);
    setAssignmentDetails({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            Assign Multiple Team Members
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Default Settings */}
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Default Assignment Settings
              </h3>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Allocation (%)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={defaultSettings.allocation_percentage}
                    onChange={(e) => setDefaultSettings({
                      ...defaultSettings,
                      allocation_percentage: parseInt(e.target.value) || 0
                    })}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Start Date</Label>
                  <Input
                    type="date"
                    value={defaultSettings.assigned_date}
                    onChange={(e) => setDefaultSettings({
                      ...defaultSettings,
                      assigned_date: e.target.value
                    })}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">End Date</Label>
                  <Input
                    type="date"
                    value={defaultSettings.end_date}
                    onChange={(e) => setDefaultSettings({
                      ...defaultSettings,
                      end_date: e.target.value
                    })}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Hourly Rate (SAR)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={defaultSettings.hourly_rate}
                    onChange={(e) => setDefaultSettings({
                      ...defaultSettings,
                      hourly_rate: parseFloat(e.target.value) || 0
                    })}
                    className="h-8"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4 flex-1 overflow-hidden">
            {/* Employee Selection Panel */}
            <Card className="flex flex-col overflow-hidden">
              <CardContent className="p-4 flex flex-col gap-3 flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">
                    Available Employees ({filteredEmployees.length})
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      disabled={filteredEmployees.length === 0}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAll}
                      disabled={selectedEmployees.length === 0}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Employee List */}
                <ScrollArea className="flex-1 -mx-4 px-4">
                  {availableEmployees.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-sm text-slate-500">No available employees to assign</p>
                    </div>
                  ) : filteredEmployees.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-slate-500">No employees match your search</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(groupedEmployees).map(([dept, deptEmployees]) => (
                        <div key={dept}>
                          <h4 className="text-xs font-semibold text-slate-600 mb-2 sticky top-0 bg-white py-1">
                            {dept}
                          </h4>
                          <div className="space-y-2">
                            {deptEmployees.map((emp) => {
                              const isSelected = selectedEmployees.find(e => e.id === emp.id);
                              return (
                                <div
                                  key={emp.id}
                                  className={`flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-50 border-emerald-300'
                                      : 'hover:bg-slate-50 border-slate-200'
                                  }`}
                                  onClick={() => handleToggleEmployee(emp)}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => handleToggleEmployee(emp)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <Avatar className="w-8 h-8 border">
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs">
                                      {emp.first_name?.[0]}{emp.last_name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-slate-900 truncate">
                                      {emp.first_name} {emp.last_name}
                                    </p>
                                    <p className="text-xs text-slate-600 truncate">{emp.job_title}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Selected Employees Panel */}
            <Card className="flex flex-col overflow-hidden">
              <CardContent className="p-4 flex flex-col gap-3 flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">
                    Selected ({selectedEmployees.length})
                  </h3>
                  {selectedEmployees.length > 0 && (
                    <Badge className="bg-emerald-600">{selectedEmployees.length} members</Badge>
                  )}
                </div>

                <ScrollArea className="flex-1 -mx-4 px-4">
                  {selectedEmployees.length === 0 ? (
                    <div className="text-center py-8">
                      <UserPlus className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-sm text-slate-500">No employees selected</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Select employees from the left panel
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedEmployees.map((emp) => {
                        const details = assignmentDetails[emp.id] || {};
                        return (
                          <Card key={emp.id} className="border-slate-200">
                            <CardContent className="p-3">
                              <div className="flex items-start gap-3 mb-3">
                                <Avatar className="w-10 h-10 border-2 border-white">
                                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-sm">
                                    {emp.first_name?.[0]}{emp.last_name?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-slate-900">
                                    {emp.first_name} {emp.last_name}
                                  </p>
                                  <p className="text-xs text-slate-600">{emp.job_title}</p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleEmployee(emp)}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>

                              <div className="space-y-2">
                                <div>
                                  <Label className="text-xs">Role</Label>
                                  <Input
                                    value={details.role || ''}
                                    onChange={(e) => handleUpdateAssignment(emp.id, 'role', e.target.value)}
                                    placeholder="e.g., Developer"
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Allocation (%)</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      max="100"
                                      value={details.allocation_percentage || 0}
                                      onChange={(e) => handleUpdateAssignment(
                                        emp.id,
                                        'allocation_percentage',
                                        parseInt(e.target.value) || 0
                                      )}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Hourly Rate</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={details.hourly_rate || 0}
                                      onChange={(e) => handleUpdateAssignment(
                                        emp.id,
                                        'hourly_rate',
                                        parseFloat(e.target.value) || 0
                                      )}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-600">
                {selectedEmployees.length} {selectedEmployees.length === 1 ? 'member' : 'members'} selected
              </p>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={selectedEmployees.length === 0}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Assign {selectedEmployees.length} {selectedEmployees.length === 1 ? 'Member' : 'Members'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}