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

export default function AssignTeamMemberModal({ 
  project,
  employees = [], 
  existingAssignments = [],
  isOpen, 
  onClose,
  onAssign
}) {
  const [formData, setFormData] = useState({
    employee_id: '',
    role: '',
    allocation_percentage: 100,
    assigned_date: new Date().toISOString().split('T')[0],
    end_date: '',
    hourly_rate: 0,
    responsibilities: '',
    notes: ''
  });

  // Filter out already assigned employees
  const assignedEmployeeIds = existingAssignments.map(a => a.employee_id);
  const availableEmployees = employees.filter(e => 
    e.status === 'active' && !assignedEmployeeIds.includes(e.id)
  );

  const selectedEmployee = employees.find(e => e.id === formData.employee_id);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAssign({
      ...formData,
      project_id: project?.id,
      status: 'active'
    });
    setFormData({
      employee_id: '',
      role: '',
      allocation_percentage: 100,
      assigned_date: new Date().toISOString().split('T')[0],
      end_date: '',
      hourly_rate: 0,
      responsibilities: '',
      notes: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Team Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employee Selection */}
          <div>
            <Label>Select Employee *</Label>
            <Select
              value={formData.employee_id}
              onValueChange={(val) => setFormData({ ...formData, employee_id: val })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {availableEmployees.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    No available employees to assign
                  </div>
                ) : (
                  availableEmployees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} - {emp.job_title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Employee Card */}
          {selectedEmployee && (
            <Card className="bg-slate-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-white">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                      {selectedEmployee.first_name?.[0]}{selectedEmployee.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </p>
                    <p className="text-sm text-slate-600">{selectedEmployee.job_title}</p>
                    <p className="text-xs text-slate-500">{selectedEmployee.department}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {/* Role */}
            <div>
              <Label>Role in Project *</Label>
              <Input
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g., Developer, Designer"
                required
              />
            </div>

            {/* Allocation Percentage */}
            <div>
              <Label>Allocation (%) *</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={formData.allocation_percentage}
                onChange={(e) => setFormData({ ...formData, allocation_percentage: parseInt(e.target.value) || 0 })}
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Percentage of employee's time allocated to this project
              </p>
            </div>

            {/* Start Date */}
            <div>
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.assigned_date}
                onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
                required
              />
            </div>

            {/* Expected End Date */}
            <div>
              <Label>Expected End Date</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>

            {/* Hourly Rate */}
            <div>
              <Label>Hourly Rate (SAR)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Responsibilities */}
          <div>
            <Label>Key Responsibilities</Label>
            <Textarea
              value={formData.responsibilities}
              onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
              placeholder="Describe key responsibilities for this role..."
              rows={3}
            />
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              Assign to Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}