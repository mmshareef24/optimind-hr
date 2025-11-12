import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { CheckSquare } from "lucide-react";

export default function AssignChecklistModal({ open, onOpenChange, employee, checklists, onAssign }) {
  const [selectedChecklist, setSelectedChecklist] = useState('');
  const [startDate, setStartDate] = useState(employee?.hire_date || new Date().toISOString().split('T')[0]);

  const checklist = checklists.find(c => c.id === selectedChecklist);

  const handleAssign = () => {
    if (!selectedChecklist) return;
    
    // Get tasks from the checklist (would be stored with checklist or fetched)
    // For now, we'll use sample tasks
    const tasks = checklist?.tasks || [];
    
    onAssign(selectedChecklist, tasks, startDate);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Assign Checklist to {employee?.first_name} {employee?.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Select Checklist *</Label>
            <Select value={selectedChecklist} onValueChange={setSelectedChecklist}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a checklist" />
              </SelectTrigger>
              <SelectContent>
                {checklists.map(checklist => (
                  <SelectItem key={checklist.id} value={checklist.id}>
                    {checklist.checklist_name}
                    {checklist.department && ` (${checklist.department})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Start Date *</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {checklist && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-2">{checklist.checklist_name}</h4>
              {checklist.description && (
                <p className="text-sm text-slate-600 mb-2">{checklist.description}</p>
              )}
              <div className="text-sm text-slate-600">
                <p>Duration: {checklist.duration_days} days</p>
                {checklist.department && <p>Department: {checklist.department}</p>}
                {checklist.job_role && <p>Role: {checklist.job_role}</p>}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedChecklist}>
            <CheckSquare className="w-4 h-4 mr-2" />
            Assign Checklist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}