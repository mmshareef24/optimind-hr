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
import { format } from "date-fns";
import { useTranslation } from '@/components/TranslationContext';

export default function LeaveRequestForm({ employee, leaveBalances = [], onSubmit, onCancel, isAdmin = false, allEmployees = [] }) {
  const { t } = useTranslation();
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
  const [leaveDaysCalculation, setLeaveDaysCalculation] = useState(null);
  const [calculatingDays, setCalculatingDays] = useState(false);

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
    const calculateDays = async () => {
      if (formData.start_date && formData.end_date) {
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        
        if (end < start) {
          setValidationError(t('end_date_after_start'));
          setFormData(prev => ({ ...prev, total_days: 0 }));
          setLeaveDaysCalculation(null);
          return;
        }
        
        // Call backend to calculate days excluding weekends and holidays
        setCalculatingDays(true);
        try {
          const response = await base44.functions.invoke('calculateLeaveDays', {
            start_date: formData.start_date,
            end_date: formData.end_date
          });
          
          const calculation = response.data;
          setLeaveDaysCalculation(calculation);
          setFormData(prev => ({ ...prev, total_days: calculation.leave_days_to_deduct }));
          setValidationError('');
        } catch (error) {
          // Fallback to simple calculation
          const days = calculateWorkingDays(start, end);
          setFormData(prev => ({ ...prev, total_days: days }));
          setLeaveDaysCalculation(null);
        } finally {
          setCalculatingDays(false);
        }
      }
    };

    calculateDays();
  }, [formData.start_date, formData.end_date]);

  // Check leave balance validation
  useEffect(() => {
    if (formData.total_days > 0 && formData.leave_type) {
      const balance = getBalance(formData.leave_type);
      if (balance < formData.total_days && ['annual', 'sick'].includes(formData.leave_type)) {
        setValidationError(t('insufficient_balance', { balance }));
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
      toast.error(t('failed_load_balances'));
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
      toast.error(t('file_size_limit'));
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, attachment_url: file_url }));
      toast.success(t('document_uploaded'));
    } catch (error) {
      toast.error(t('failed_upload_document'));
    } finally {
      setUploading(false);
    }
  };

  const leaveTypeInfo = {
    annual: { color: 'blue', days: 21, descriptionKey: 'annual_leave_desc' },
    sick: { color: 'red', days: 30, descriptionKey: 'sick_leave_desc' },
    emergency: { color: 'orange', days: 3, descriptionKey: 'emergency_leave_desc' },
    unpaid: { color: 'slate', days: null, descriptionKey: 'unpaid_leave_desc' },
    maternity: { color: 'pink', days: 70, descriptionKey: 'maternity_leave_desc' },
    paternity: { color: 'purple', days: 3, descriptionKey: 'paternity_leave_desc' },
    hajj: { color: 'emerald', days: 10, descriptionKey: 'hajj_leave_desc' },
    marriage: { color: 'amber', days: 5, descriptionKey: 'marriage_leave_desc' },
    bereavement: { color: 'slate', days: 5, descriptionKey: 'bereavement_leave_desc' }
  };

  const currentLeaveInfo = leaveTypeInfo[formData.leave_type];

  const selectedEmployee = getSelectedEmployee();

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Employee Selection (Admin Only) */}
      {isAdmin && (
        <div>
          <Label className="text-base font-semibold">{t('select_employee')} *</Label>
          <Select
            value={selectedEmployeeId}
            onValueChange={handleEmployeeChange}
            required
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder={t('choose_employee')} />
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
            <p className="text-sm text-blue-600 mt-2">{t('loading_balances')}</p>
          )}
        </div>
      )}

      {/* Leave Type Selection */}
      <div>
        <Label className="text-base font-semibold">{t('leave_type')} *</Label>
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
                <span>📅 {t('annual_leave')}</span>
                <span className="text-blue-600 font-semibold ml-4">{getBalance('annual')} {t('days')}</span>
              </div>
            </SelectItem>
            <SelectItem value="sick">
              <div className="flex items-center justify-between w-full">
                <span>🏥 {t('sick_leave')}</span>
                <span className="text-red-600 font-semibold ml-4">{getBalance('sick')} {t('days')}</span>
              </div>
            </SelectItem>
            <SelectItem value="emergency">
              <span>🚨 {t('emergency_leave')}</span>
            </SelectItem>
            <SelectItem value="unpaid">
              <span>💼 {t('unpaid_leave')}</span>
            </SelectItem>
            <SelectItem value="maternity">
              <span>👶 {t('maternity_leave')} (70 {t('days')})</span>
            </SelectItem>
            <SelectItem value="paternity">
              <span>👨‍👧 {t('paternity_leave')} (3 {t('days')})</span>
            </SelectItem>
            <SelectItem value="hajj">
              <span>🕋 {t('hajj_leave')} (10 {t('days')})</span>
            </SelectItem>
            <SelectItem value="marriage">
              <span>💍 {t('marriage_leave')} (5 {t('days')})</span>
            </SelectItem>
            <SelectItem value="bereavement">
              <span>🕊️ {t('bereavement_leave')} (5 {t('days')})</span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Leave Type Information */}
        {currentLeaveInfo && (
          <Alert className="mt-2 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-900">
              <strong>{t('policy')}:</strong> {t(currentLeaveInfo.descriptionKey)}
              {currentLeaveInfo.days && (
                <span className="block mt-1">{t('standard_entitlement')}: {currentLeaveInfo.days} {t('days_per_year')}</span>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Date Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-base font-semibold">{t('start_date')} *</Label>
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
          <Label className="text-base font-semibold">{t('end_date')} *</Label>
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
        {calculatingDays ? (
          <div className="text-center py-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
            <p className="text-sm text-slate-600">{t('calculating_leave_days')}</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">{t('leave_days_to_deduct')}</span>
              <span className="text-3xl font-bold text-emerald-600">{formData.total_days}</span>
            </div>
            {leaveDaysCalculation && (
              <div className="space-y-2 mt-3">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-white rounded text-center">
                    <p className="text-slate-500">{t('total_days')}</p>
                    <p className="font-bold text-slate-900">{leaveDaysCalculation.total_days}</p>
                  </div>
                  <div className="p-2 bg-slate-100 rounded text-center">
                    <p className="text-slate-500">{t('weekends')}</p>
                    <p className="font-bold text-slate-700">{leaveDaysCalculation.weekend_days}</p>
                  </div>
                  <div className="p-2 bg-amber-100 rounded text-center">
                    <p className="text-amber-700">{t('holidays')}</p>
                    <p className="font-bold text-amber-800">{leaveDaysCalculation.holiday_days}</p>
                  </div>
                </div>
                {leaveDaysCalculation.overlapping_holidays?.length > 0 && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-900 text-xs">
                      <strong>{t('public_holidays_detected')}:</strong>
                      <ul className="mt-1 space-y-1">
                        {leaveDaysCalculation.overlapping_holidays.map((h, idx) => (
                          <li key={idx}>• {h.name} ({format(new Date(h.date), 'MMM dd')})</li>
                        ))}
                      </ul>
                      <p className="mt-1">{t('holidays_excluded_note')}</p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            {!leaveDaysCalculation && formData.start_date && formData.end_date && (
              <p className="text-xs text-slate-600 mt-2">
                {t('weekends_excluded_note')}
              </p>
            )}
          </>
        )}
      </div>

      {/* Reason */}
      <div>
        <Label className="text-base font-semibold">{t('reason_for_leave')} *</Label>
        <Textarea
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder={t('reason_placeholder')}
          rows={4}
          className="resize-none"
          required
        />
        <p className="text-xs text-slate-500 mt-1">
          {formData.reason.length}/500 {t('characters')}
        </p>
      </div>

      {/* File Upload (for sick leave and others) */}
      {['sick', 'maternity', 'bereavement'].includes(formData.leave_type) && (
        <div>
          <Label className="text-base font-semibold">
            {t('supporting_document')} {formData.leave_type === 'sick' ? `(${t('medical_certificate')})` : ''}
            {formData.total_days > 3 && formData.leave_type === 'sick' ? ' *' : ` (${t('optional')})`}
          </Label>
          <div className="mt-2">
            <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 border-slate-300 hover:border-emerald-400">
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-600">
                  {uploading ? t('uploading') : formData.attachment_url ? `✓ ${t('document_uploaded')}` : t('click_to_upload')}
                </p>
                <p className="text-xs text-slate-500">{t('file_formats')}</p>
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
              ⚠️ {t('medical_cert_required')}
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="min-w-[100px]">
          <X className="w-4 h-4 mr-2" />
          {t('cancel')}
        </Button>
        <Button 
          type="submit" 
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 min-w-[140px]"
          disabled={!!validationError || uploading || (formData.total_days > 3 && formData.leave_type === 'sick' && !formData.attachment_url)}
        >
          <Save className="w-4 h-4 mr-2" />
          {t('submit_request')}
        </Button>
      </div>
    </form>
  );
}