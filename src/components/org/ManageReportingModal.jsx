import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ManageReportingModal({ employee, employees, isOpen, onClose, onSave }) {
  const [selectedManagerId, setSelectedManagerId] = useState(employee?.manager_id || '');
  const [error, setError] = useState('');

  const handleSave = () => {
    // Validation: Prevent circular reporting
    if (selectedManagerId === employee.id) {
      setError("An employee cannot report to themselves");
      return;
    }

    // Check if the selected manager reports to this employee (directly or indirectly)
    if (selectedManagerId && wouldCreateCircularReporting(selectedManagerId)) {
      setError("This would create a circular reporting structure");
      return;
    }

    onSave(employee.id, selectedManagerId || null);
    setError('');
  };

  const wouldCreateCircularReporting = (managerId) => {
    let currentId = managerId;
    const visited = new Set();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      
      if (currentId === employee.id) {
        return true; // Circular reference found
      }

      const manager = employees.find(e => e.id === currentId);
      currentId = manager?.manager_id;
    }

    return false;
  };

  // Get available managers (exclude self and direct subordinates)
  const getSubordinates = (empId) => {
    const subs = employees.filter(e => e.manager_id === empId);
    let allSubs = [...subs];
    subs.forEach(sub => {
      allSubs = [...allSubs, ...getSubordinates(sub.id)];
    });
    return allSubs;
  };

  const subordinateIds = new Set(getSubordinates(employee?.id).map(s => s.id));
  const availableManagers = employees.filter(
    e => e.id !== employee?.id && !subordinateIds.has(e.id)
  );

  const currentManager = employees.find(e => e.id === employee?.manager_id);
  const selectedManager = employees.find(e => e.id === selectedManagerId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Manage Reporting Relationship
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Employee */}
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-lg border border-emerald-100">
            <p className="text-xs text-slate-500 mb-2">Employee</p>
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 border-2 border-white shadow">
                <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-bold">
                  {employee?.first_name?.[0]}{employee?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-slate-900">
                  {employee?.first_name} {employee?.last_name}
                </p>
                <p className="text-sm text-slate-600">{employee?.job_title}</p>
                <p className="text-xs text-slate-500">{employee?.department}</p>
              </div>
            </div>
          </div>

          {/* Current Manager */}
          {currentManager && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-slate-500 mb-2">Current Manager</p>
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {currentManager.first_name?.[0]}{currentManager.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-slate-900">
                    {currentManager.first_name} {currentManager.last_name}
                  </p>
                  <p className="text-xs text-slate-500">{currentManager.job_title}</p>
                </div>
              </div>
            </div>
          )}

          {/* Select New Manager */}
          <div>
            <Label>Assign New Manager</Label>
            <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a manager or leave empty for no manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No Manager (Top Level)</SelectItem>
                {availableManagers.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs bg-slate-600 text-white">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <span className="font-medium">{emp.first_name} {emp.last_name}</span>
                        <span className="text-xs text-slate-500 ml-2">- {emp.job_title}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview New Manager */}
          {selectedManagerId && selectedManager && selectedManagerId !== currentManager?.id && (
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="text-xs text-slate-500 mb-2">New Manager</p>
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-emerald-600 text-white">
                    {selectedManager.first_name?.[0]}{selectedManager.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-slate-900">
                    {selectedManager.first_name} {selectedManager.last_name}
                  </p>
                  <p className="text-xs text-slate-500">{selectedManager.job_title}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Note:</strong> Changing the reporting relationship will affect the organizational chart structure. 
              Make sure this change aligns with your organization's hierarchy.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}