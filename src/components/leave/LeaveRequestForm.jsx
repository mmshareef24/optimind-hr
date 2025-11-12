import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { base44 } from "@/api/base44Client";
import { Save, X, Upload, AlertCircle, Info, Calendar, User } from "lucide-react";
import { toast } from "sonner";

export default function LeaveRequestForm({ employee, leaveBalances = [], onSubmit, onCancel, isAdmin = false, allEmployees = [] }) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employee?.id || '');
  const [selectedEmployeeBalances, setSelectedEmployeeBalances] = useState(leaveBalances);
  const [formData, setFormData] = useState({
    employee_id: employee?.id || '',
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    total_days: 0,
    reason: '',
    status: 'pending',
    attachment_url: ''
  });
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [leavePolicy, setLeavePolicy] = useState(null);
  const [loadingBalances, setLoadingBalances] = useState(false);

  // Calculate working days (excluding weekends)
  const calculateWorkingDays = (start, end) => {
    let count = 0;
    let current = new Date(start);
    const endDate = new Date(end);
    
    while (current <= endDate) {
      const day = current.getDay();
      // Exclude Friday (5) and Saturday (6) for Saudi Arabia
      if (day !== 5 && day !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      
      if (end < start) {
        setValidationError('End date must be after start date');
        setFormData(prev => ({ ...prev, total_days: 0 }));
        return;
      }
      
      const days = calculateWorkingDays(start, end);
      setFormData(prev => ({ ...prev, total_days: days }));
      setValidationError('');
    }
  }, [formData.start_date, formData.end_date]);

  // Check leave balance validation
  useEffect(() => {
    if (formData.total_days > 0 && formData.leave_type) {
      const balance = getBalance(formData.leave_type);
      if (balance < formData.total_days && ['annual', 'sick'].includes(formData.leave_type)) {
        setValidationError(`Insufficient balance. You only have ${balance} days available.`);
      } else {
        setValidationError('');
      }
    }
  }, [formData.total_days, formData.leave_type, selectedEmployeeBalances]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const getBalance = (leaveType) => {
    const balance = selectedEmployeeBalances.find(b => b.leave_type === leaveType);
    return balance?.remaining || 0;
  };

  const getSelectedEmployee = () => {
    if (isAdmin && selectedEmployeeId) {
      return allEmployees.find(e => e.id === selectedEmployeeId);
    }
    return employee;
  };

  // Handle employee selection (admin only)
  const handleEmployeeChange = async (employeeId) => {
    setSelectedEmployeeId(employeeId);
    setFormData(prev => ({ ...prev, employee_id: employeeId }));
    
    // Fetch balances for selected employee
    setLoadingBalances(true);
    try {
      const balances = await base44.entities.LeaveBalance.filter({ employee_id: employeeId });
      setSelectedEmployeeBalances(balances);
    } catch (error) {
      toast.error('Failed to load employee balances');
      setSelectedEmployeeBalances([]);
    } finally {
      setLoadingBalances(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, attachment_url: file_url }));
      toast.success('Document uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const leaveTypeInfo = {
    annual: { color: 'blue', days: 21, description: 'Standard annual vacation leave' },
    sick: { color: 'red', days: 30, description: 'Medical certificate may be required for extended periods' },
    emergency: { color: 'orange', days: 3, description: 'For urgent personal matters' },
    unpaid: { color: 'slate', days: null, description: 'Leave without salary' },
    maternity: { color: 'pink', days: 70, description: '10 weeks maternity leave as per Saudi labor law' },
    paternity: { color: 'purple', days: 3, description: '3 days paternity leave' },
    hajj: { color: 'emerald', days: 10, description: 'Hajj pilgrimage leave (once in service)' },
    marriage: { color: 'amber', days: 5, description: '5 days marriage leave' },
    bereavement: { color: 'slate', days: 5, description: 'Bereavement/mourning leave' }
  };

  const currentLeaveInfo = leaveTypeInfo[formData.leave_type];

  const selectedEmployee = getSelectedEmployee();

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Employee Selection (Admin Only) */}
      {isAdmin && (
        <div>
          <Label className="text-base font-semibold">Select Employee *</Label>
          <Select
            value={selectedEmployeeId}
            onValueChange={handleEmployeeChange}
            required
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Choose employee..." />
            </SelectTrigger>
            <SelectContent>
              {allEmployees
                .filter(emp => emp.status === 'active')
                .map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{emp.first_name} {emp.last_name}</span>
                      <span className="text-slate-500">• {emp.employee_id}</span>
                      <span className="text-slate-400 text-xs">• {emp.department}</span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          
          {selectedEmployee && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {selectedEmployee.first_name?.[0]}{selectedEmployee.last_name?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </p>
                  <p className="text-xs text-slate-600">
                    {selectedEmployee.job_title} • {selectedEmployee.department}
                  </p>
                </div>
              </div>
            </div>
          )}

          {loadingBalances && (
            <p className="text-sm text-blue-600 mt-2">Loading leave balances...</p>
          )}
        </div>
      )}

      {/* Leave Type Selection */}
      <div>
        <Label className="text-base font-semibold">Leave Type *</Label>
        <Select
          value={formData.leave_type}
          onValueChange={(val) => setFormData({ ...formData, leave_type: val })}
        >
          <SelectTrigger className="h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="annual">
              <div className="flex items-center justify-between w-full">
                <span>📅 Annual Leave</span>
                <span className="text-blue-600 font-semibold ml-4">{getBalance('annual')} days</span>
              </div>
            </SelectItem>
            <SelectItem value="sick">
              <div className="flex items-center justify-between w-full">
                <span>🏥 Sick Leave</span>
                <span className="text-red-600 font-semibold ml-4">{getBalance('sick')} days</span>
              </div>
            </SelectItem>
            <SelectItem value="emergency">
              <span>🚨 Emergency Leave</span>
            </SelectItem>
            <SelectItem value="unpaid">
              <span>💼 Unpaid Leave</span>
            </SelectItem>
            <SelectItem value="maternity">
              <span>👶 Maternity Leave (70 days)</span>
            </SelectItem>
            <SelectItem value="paternity">
              <span>👨‍👧 Paternity Leave (3 days)</span>
            </SelectItem>
            <SelectItem value="hajj">
              <span>🕋 Hajj Leave (10 days)</span>
            </SelectItem>
            <SelectItem value="marriage">
              <span>💍 Marriage Leave (5 days)</span>
            </SelectItem>
            <SelectItem value="bereavement">
              <span>🕊️ Bereavement Leave (5 days)</span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Leave Type Information */}
        {currentLeaveInfo && (
          <Alert className="mt-2 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-900">
              <strong>Policy:</strong> {currentLeaveInfo.description}
              {currentLeaveInfo.days && (
                <span className="block mt-1">Standard entitlement: {currentLeaveInfo.days} days per year</span>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Date Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-base font-semibold">Start Date *</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        <div>
          <Label className="text-base font-semibold">End Date *</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              min={formData.start_date || new Date().toISOString().split('T')[0]}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Days Summary */}
      <div className="p-5 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border-2 border-blue-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">Working Days (Excluding Weekends)</span>
          <span className="text-3xl font-bold text-emerald-600">{formData.total_days}</span>
        </div>
        {formData.start_date && formData.end_date && (
          <p className="text-xs text-slate-600">
            Friday & Saturday are excluded as per Saudi Arabia weekend policy
          </p>
        )}
      </div>

      {/* Reason */}
      <div>
        <Label className="text-base font-semibold">Reason for Leave *</Label>
        <Textarea
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="Please provide a detailed explanation for your leave request..."
          rows={4}
          className="resize-none"
          required
        />
        <p className="text-xs text-slate-500 mt-1">
          {formData.reason.length}/500 characters
        </p>
      </div>

      {/* File Upload (for sick leave and others) */}
      {['sick', 'maternity', 'bereavement'].includes(formData.leave_type) && (
        <div>
          <Label className="text-base font-semibold">
            Supporting Document {formData.leave_type === 'sick' ? '(Medical Certificate)' : ''}
            {formData.total_days > 3 && formData.leave_type === 'sick' ? ' *' : ' (Optional)'}
          </Label>
          <div className="mt-2">
            <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 border-slate-300 hover:border-emerald-400">
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-600">
                  {uploading ? 'Uploading...' : formData.attachment_url ? '✓ Document uploaded' : 'Click to upload document'}
                </p>
                <p className="text-xs text-slate-500">PDF, JPG, PNG (max 5MB)</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>
          {formData.total_days > 3 && formData.leave_type === 'sick' && (
            <p className="text-xs text-amber-600 mt-2 font-medium">
              ⚠️ Medical certificate is required for sick leave exceeding 3 days
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="min-w-[100px]">
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 min-w-[140px]"
          disabled={!!validationError || uploading || (formData.total_days > 3 && formData.leave_type === 'sick' && !formData.attachment_url)}
        >
          <Save className="w-4 h-4 mr-2" />
          Submit Request
        </Button>
      </div>
    </form>
  );
}