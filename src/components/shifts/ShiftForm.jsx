import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Save } from "lucide-react";

const DAYS = [
  { value: 'sunday', label: 'Sunday' },
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' }
];

const SHIFT_COLORS = [
  { value: '#10b981', label: 'Green' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' }
];

export default function ShiftForm({ shift, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(shift || {
    shift_name: '',
    shift_code: '',
    shift_type: 'morning',
    start_time: '09:00',
    end_time: '17:00',
    break_duration: 60,
    working_hours: 8,
    grace_period_in: 15,
    grace_period_out: 15,
    overtime_applicable: true,
    working_days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
    department: '',
    is_active: true,
    color_code: '#10b981',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const toggleWorkingDay = (day) => {
    const days = formData.working_days || [];
    if (days.includes(day)) {
      setFormData({ ...formData, working_days: days.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, working_days: [...days, day] });
    }
  };

  const calculateWorkingHours = () => {
    if (formData.start_time && formData.end_time) {
      const [startH, startM] = formData.start_time.split(':').map(Number);
      const [endH, endM] = formData.end_time.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      let totalMinutes = endMinutes - startMinutes;
      if (totalMinutes < 0) totalMinutes += 24 * 60;
      const hours = (totalMinutes - (formData.break_duration || 0)) / 60;
      setFormData({ ...formData, working_hours: parseFloat(hours.toFixed(2)) });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-emerald-200">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Shift Name *</Label>
              <Input
                value={formData.shift_name}
                onChange={(e) => setFormData({ ...formData, shift_name: e.target.value })}
                placeholder="e.g., Morning Shift"
                required
              />
            </div>
            <div>
              <Label>Shift Code *</Label>
              <Input
                value={formData.shift_code}
                onChange={(e) => setFormData({ ...formData, shift_code: e.target.value })}
                placeholder="e.g., MS-01"
                required
              />
            </div>
            <div>
              <Label>Shift Type</Label>
              <Select
                value={formData.shift_type}
                onValueChange={(val) => setFormData({ ...formData, shift_type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning Shift</SelectItem>
                  <SelectItem value="evening">Evening Shift</SelectItem>
                  <SelectItem value="night">Night Shift</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                  <SelectItem value="rotating">Rotating</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Department</Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
          <CardTitle>Timing Configuration</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Start Time *</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                onBlur={calculateWorkingHours}
                required
              />
            </div>
            <div>
              <Label>End Time *</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                onBlur={calculateWorkingHours}
                required
              />
            </div>
            <div>
              <Label>Break Duration (minutes)</Label>
              <Input
                type="number"
                value={formData.break_duration}
                onChange={(e) => setFormData({ ...formData, break_duration: parseInt(e.target.value) })}
                onBlur={calculateWorkingHours}
              />
            </div>
            <div>
              <Label>Working Hours</Label>
              <Input
                type="number"
                step="0.5"
                value={formData.working_hours}
                onChange={(e) => setFormData({ ...formData, working_hours: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label>Grace Period In (minutes)</Label>
              <Input
                type="number"
                value={formData.grace_period_in}
                onChange={(e) => setFormData({ ...formData, grace_period_in: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Grace Period Out (minutes)</Label>
              <Input
                type="number"
                value={formData.grace_period_out}
                onChange={(e) => setFormData({ ...formData, grace_period_out: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
          <CardTitle>Working Days</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DAYS.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={day.value}
                  checked={formData.working_days?.includes(day.value)}
                  onCheckedChange={() => toggleWorkingDay(day.value)}
                />
                <label
                  htmlFor={day.value}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {day.label}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
          <CardTitle>Additional Settings</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Color Code</Label>
              <Select
                value={formData.color_code}
                onValueChange={(val) => setFormData({ ...formData, color_code: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIFT_COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="overtime"
                checked={formData.overtime_applicable}
                onCheckedChange={(checked) => setFormData({ ...formData, overtime_applicable: checked })}
              />
              <label htmlFor="overtime" className="text-sm font-medium">
                Overtime Applicable
              </label>
            </div>
          </div>
          <div className="mt-4">
            <Label>Notes</Label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="Additional notes..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
          <Save className="w-4 h-4 mr-2" />
          {shift ? 'Update' : 'Create'} Shift
        </Button>
      </div>
    </form>
  );
}