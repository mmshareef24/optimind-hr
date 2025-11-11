import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, AlertCircle, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { differenceInDays, addDays, isWeekend } from "date-fns";
import { base44 } from "@/api/base44Client";

export default function LeaveRequestForm({ employee, balances, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
    attachment_url: ''
  });
  const [totalDays, setTotalDays] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const leaveTypes = [
    { value: 'annual', label: 'Annual Leave', requiresDoc: false },
    { value: 'sick', label: 'Sick Leave', requiresDoc: true },
    { value: 'maternity', label: 'Maternity Leave', requiresDoc: true },
    { value: 'paternity', label: 'Paternity Leave', requiresDoc: false },
    { value: 'unpaid', label: 'Unpaid Leave', requiresDoc: false },
    { value: 'hajj', label: 'Hajj Leave', requiresDoc: false },
    { value: 'marriage', label: 'Marriage Leave', requiresDoc: true },
    { value: 'bereavement', label: 'Bereavement Leave', requiresDoc: true },
    { value: 'emergency', label: 'Emergency Leave', requiresDoc: false }
  ];

  const calculateWorkingDays = (start, end) => {
    if (!start || !end) return 0;
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (endDate < startDate) return 0;
    
    let days = 0;
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Count only weekdays (exclude Friday and Saturday in Saudi Arabia)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 5 && dayOfWeek !== 6) { // 5 = Friday, 6 = Saturday
        days++;
      }
      currentDate = addDays(currentDate, 1);
    }
    
    return days;
  };

  const handleDateChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    if (newFormData.start_date && newFormData.end_date) {
      const days = calculateWorkingDays(newFormData.start_date, newFormData.end_date);
      setTotalDays(days);
      
      // Check balance
      const balance = balances.find(b => b.leave_type === newFormData.leave_type);
      if (balance && days > balance.remaining) {
        setError(`Insufficient leave balance. You have ${balance.remaining} days remaining.`);
      } else {
        setError('');
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, attachment_url: file_url });
    } catch (err) {
      setError('Failed to upload file: ' + err.message);
    }
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.start_date || !formData.end_date) {
      setError('Please select start and end dates');
      return;
    }

    if (totalDays === 0) {
      setError('Leave request must be for at least one working day');
      return;
    }

    const selectedLeaveType = leaveTypes.find(t => t.value === formData.leave_type);
    if (selectedLeaveType?.requiresDoc && !formData.attachment_url) {
      setError(`${selectedLeaveType.label} requires supporting documentation`);
      return;
    }

    const balance = balances.find(b => b.leave_type === formData.leave_type);
    if (balance && totalDays > balance.remaining) {
      setError('Insufficient leave balance');
      return;
    }

    onSubmit({
      ...formData,
      employee_id: employee.id,
      total_days: totalDays
    });
  };

  const currentBalance = balances.find(b => b.leave_type === formData.leave_type);

  return (
    <Card className="border-emerald-200">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          New Leave Request
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Leave Type *</Label>
            <Select 
              value={formData.leave_type} 
              onValueChange={(val) => {
                setFormData({ ...formData, leave_type: val });
                setError('');
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentBalance && (
              <p className="text-xs text-slate-600 mt-1">
                Available: <span className="font-semibold text-emerald-600">{currentBalance.remaining} days</span>
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleDateChange('start_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <Label>End Date *</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => handleDateChange('end_date', e.target.value)}
                min={formData.start_date || new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          {totalDays > 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                <strong>Total working days:</strong> {totalDays} days (excluding weekends)
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label>Reason *</Label>
            <Textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Please provide a reason for your leave request..."
              rows={3}
              required
            />
          </div>

          {leaveTypes.find(t => t.value === formData.leave_type)?.requiresDoc && (
            <div>
              <Label>
                Supporting Document {leaveTypes.find(t => t.value === formData.leave_type)?.requiresDoc ? '*' : '(Optional)'}
              </Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  id="leave-document"
                  disabled={uploading}
                />
                <label htmlFor="leave-document" className="cursor-pointer">
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
                      <p className="text-sm text-slate-600">Uploading...</p>
                    </div>
                  ) : formData.attachment_url ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-600">
                      <Calendar className="w-5 h-5" />
                      <span className="text-sm font-medium">Document uploaded ✓</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm text-slate-600">Click to upload supporting document</p>
                      <p className="text-xs text-slate-400">Medical certificate, invitation, etc.</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.start_date || !formData.end_date || !!error}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Submit Request
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}