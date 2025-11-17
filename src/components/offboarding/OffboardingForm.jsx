import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { addDays, format } from "date-fns";

export default function OffboardingForm({ process, employees, onSubmit, onCancel, open, onOpenChange }) {
  const [formData, setFormData] = useState({
    employee_id: '',
    resignation_date: format(new Date(), 'yyyy-MM-dd'),
    last_working_day: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    effective_termination_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    termination_type: 'resignation',
    termination_reason: '',
    notice_period_days: 30,
    status: 'initiated',
    rehire_eligible: true,
    notes: ''
  });

  useEffect(() => {
    if (process) {
      setFormData(process);
    }
  }, [process]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{process ? 'Edit Offboarding Process' : 'Initiate Offboarding Process'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Employee</Label>
            <Select 
              value={formData.employee_id} 
              onValueChange={(v) => setFormData({...formData, employee_id: v})}
              disabled={!!process}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
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

          <div>
            <Label>Termination Type</Label>
            <Select 
              value={formData.termination_type} 
              onValueChange={(v) => setFormData({...formData, termination_type: v})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resignation">Resignation</SelectItem>
                <SelectItem value="retirement">Retirement</SelectItem>
                <SelectItem value="termination">Termination</SelectItem>
                <SelectItem value="contract_end">Contract End</SelectItem>
                <SelectItem value="mutual_agreement">Mutual Agreement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Resignation Date</Label>
              <Input
                type="date"
                value={formData.resignation_date}
                onChange={(e) => setFormData({...formData, resignation_date: e.target.value})}
              />
            </div>

            <div>
              <Label>Notice Period (Days)</Label>
              <Input
                type="number"
                value={formData.notice_period_days}
                onChange={(e) => setFormData({...formData, notice_period_days: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Last Working Day</Label>
              <Input
                type="date"
                value={formData.last_working_day}
                onChange={(e) => setFormData({...formData, last_working_day: e.target.value})}
              />
            </div>

            <div>
              <Label>Effective Termination Date</Label>
              <Input
                type="date"
                value={formData.effective_termination_date}
                onChange={(e) => setFormData({...formData, effective_termination_date: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label>Termination Reason</Label>
            <Textarea
              value={formData.termination_reason}
              onChange={(e) => setFormData({...formData, termination_reason: e.target.value})}
              rows={3}
              placeholder="Provide details about the reason for leaving..."
            />
          </div>

          {process && (
            <div>
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(v) => setFormData({...formData, status: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="initiated">Initiated</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="pending_clearance">Pending Clearance</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="rehire"
              checked={formData.rehire_eligible}
              onCheckedChange={(checked) => setFormData({...formData, rehire_eligible: checked})}
            />
            <Label htmlFor="rehire" className="text-sm font-normal cursor-pointer">
              Eligible for rehire
            </Label>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              placeholder="Additional notes or comments..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700">
              {process ? 'Update' : 'Initiate'} Offboarding
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}