import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Save, X } from "lucide-react";

export default function LeaveRequestForm({ employee, leaveBalances, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    employee_id: employee.id,
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    total_days: 0,
    reason: '',
    status: 'pending'
  });

  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      setFormData(prev => ({ ...prev, total_days: days > 0 ? days : 0 }));
    }
  }, [formData.start_date, formData.end_date]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const getBalance = (leaveType) => {
    const balance = leaveBalances.find(b => b.leave_type === leaveType);
    return balance?.remaining || 0;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Leave Type *</Label>
        <Select
          value={formData.leave_type}
          onValueChange={(val) => setFormData({ ...formData, leave_type: val })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="annual">Annual Leave ({getBalance('annual')} days available)</SelectItem>
            <SelectItem value="sick">Sick Leave ({getBalance('sick')} days available)</SelectItem>
            <SelectItem value="emergency">Emergency Leave</SelectItem>
            <SelectItem value="unpaid">Unpaid Leave</SelectItem>
            <SelectItem value="maternity">Maternity Leave</SelectItem>
            <SelectItem value="paternity">Paternity Leave</SelectItem>
            <SelectItem value="hajj">Hajj Leave</SelectItem>
            <SelectItem value="marriage">Marriage Leave</SelectItem>
            <SelectItem value="bereavement">Bereavement Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Date *</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
        </div>

        <div>
          <Label>End Date *</Label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            min={formData.start_date}
            required
          />
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-blue-900">Total Days</span>
          <span className="text-xl font-bold text-blue-600">{formData.total_days}</span>
        </div>
      </div>

      <div>
        <Label>Reason *</Label>
        <Textarea
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="Explain the reason for leave"
          rows={4}
          required
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          Submit Request
        </Button>
      </div>
    </form>
  );
}