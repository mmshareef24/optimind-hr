import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { DollarSign, Plus, Edit2, CheckCircle2, XCircle, Clock, AlertCircle, Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { useTranslation } from '@/components/TranslationContext';

export default function LoanBalanceTab({ employeeId }) {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const [editingLoan, setEditingLoan] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['loan-requests', employeeId],
    queryFn: () => base44.entities.LoanRequest.filter({ employee_id: employeeId }, '-created_date'),
    enabled: !!employeeId
  });

  const createLoanMutation = useMutation({
    mutationFn: (data) => base44.entities.LoanRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['loan-requests', employeeId]);
      setShowForm(false);
      setIsCreating(false);
      toast.success('Loan added successfully');
    },
    onError: () => toast.error('Failed to add loan')
  });

  const updateLoanMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LoanRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['loan-requests', employeeId]);
      setShowForm(false);
      setEditingLoan(null);
      toast.success('Loan updated successfully');
    },
    onError: () => toast.error('Failed to update loan')
  });

  const LoanForm = ({ loan, onSubmit, onCancel, isNew = false }) => {
    const [formData, setFormData] = useState(loan || {
      employee_id: employeeId,
      loan_type: 'personal_loan',
      amount_requested: 0,
      total_paid: 0,
      remaining_balance: 0,
      monthly_deduction: 0,
      status: 'disbursed',
      is_opening_balance: false,
      include_in_payroll: true,
      purpose: ''
    });

    // Auto-calculate remaining balance
    React.useEffect(() => {
      const remaining = (formData.amount_requested || 0) - (formData.total_paid || 0);
      setFormData(prev => ({ ...prev, remaining_balance: remaining }));
    }, [formData.amount_requested, formData.total_paid]);

    // Auto-calculate repayment period
    React.useEffect(() => {
      if (formData.monthly_deduction > 0 && formData.remaining_balance > 0) {
        const months = Math.ceil(formData.remaining_balance / formData.monthly_deduction);
        setFormData(prev => ({ ...prev, repayment_period: months }));
      }
    }, [formData.monthly_deduction, formData.remaining_balance]);

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Opening Balance Indicator */}
        {isNew && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Checkbox
              id="is_opening_balance"
              checked={formData.is_opening_balance}
              onCheckedChange={(checked) => setFormData({...formData, is_opening_balance: checked})}
            />
            <div className="flex-1">
              <Label htmlFor="is_opening_balance" className="font-semibold text-blue-900 cursor-pointer">
                This is an opening balance / migrated loan
              </Label>
              <p className="text-xs text-blue-700 mt-1">
                Check this if you're entering an existing loan from another system. You can enter the original amount and what's already been paid.
              </p>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-900 border-b pb-2">Loan Details</h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Loan Type *</Label>
              <Select
                value={formData.loan_type}
                onValueChange={(val) => setFormData({...formData, loan_type: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary_advance">Salary Advance</SelectItem>
                  <SelectItem value="personal_loan">Personal Loan</SelectItem>
                  <SelectItem value="emergency_loan">Emergency Loan</SelectItem>
                  <SelectItem value="education_loan">Education Loan</SelectItem>
                  <SelectItem value="housing_loan">Housing Loan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({...formData, status: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="disbursed">Disbursed (Active)</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Purpose *</Label>
            <Input
              value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              placeholder="e.g., Medical expenses, Home renovation"
              required
            />
          </div>
        </div>

        {/* Financial Details */}
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-900 border-b pb-2">Financial Information</h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Original Loan Amount (SAR) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount_requested}
                onChange={(e) => setFormData({...formData, amount_requested: parseFloat(e.target.value) || 0})}
                placeholder="e.g., 50000"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Total amount of the loan</p>
            </div>

            <div>
              <Label>Total Paid So Far (SAR)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.total_paid}
                onChange={(e) => setFormData({...formData, total_paid: parseFloat(e.target.value) || 0})}
                placeholder="e.g., 15000"
              />
              <p className="text-xs text-slate-500 mt-1">
                {formData.is_opening_balance 
                  ? 'Amount already repaid in previous system' 
                  : 'Cumulative amount paid to date'}
              </p>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-700 mb-1 font-medium">💰 REMAINING BALANCE (Auto-calculated)</p>
            <p className="text-2xl font-bold text-purple-900">
              {formData.remaining_balance?.toLocaleString() || 0} SAR
            </p>
            <p className="text-xs text-purple-600 mt-1">
              This is what the employee still needs to pay
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Monthly Deduction (SAR) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.monthly_deduction}
                onChange={(e) => setFormData({...formData, monthly_deduction: parseFloat(e.target.value) || 0})}
                placeholder="e.g., 2000"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Amount to deduct from salary each month</p>
            </div>

            <div>
              <Label>Estimated Repayment Period</Label>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-lg font-bold text-slate-900">
                  {formData.repayment_period || 0} months
                </p>
                <p className="text-xs text-slate-500 mt-1">Based on remaining balance ÷ monthly deduction</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dates Section */}
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-900 border-b pb-2">Important Dates</h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            {formData.is_opening_balance && (
              <div>
                <Label>Original Loan Date</Label>
                <Input
                  type="date"
                  value={formData.original_loan_date}
                  onChange={(e) => setFormData({...formData, original_loan_date: e.target.value})}
                />
                <p className="text-xs text-slate-500 mt-1">When was the loan originally taken?</p>
              </div>
            )}

            {!formData.is_opening_balance && (
              <div>
                <Label>Request Date</Label>
                <Input
                  type="date"
                  value={formData.request_date}
                  onChange={(e) => setFormData({...formData, request_date: e.target.value})}
                />
              </div>
            )}

            {formData.status === 'disbursed' && (
              <div>
                <Label>Disbursement Date</Label>
                <Input
                  type="date"
                  value={formData.disbursement_date}
                  onChange={(e) => setFormData({...formData, disbursement_date: e.target.value})}
                />
              </div>
            )}

            <div>
              <Label>Start Deducting From Month</Label>
              <Input
                type="month"
                value={formData.deduction_start_month}
                onChange={(e) => setFormData({...formData, deduction_start_month: e.target.value})}
                placeholder="YYYY-MM"
              />
              <p className="text-xs text-slate-500 mt-1">Which payroll month should deductions begin?</p>
            </div>
          </div>

          {formData.status === 'disbursed' && (
            <div>
              <Label>Disbursement Reference</Label>
              <Input
                value={formData.disbursement_reference}
                onChange={(e) => setFormData({...formData, disbursement_reference: e.target.value})}
                placeholder="e.g., TXN-12345, Check #678"
              />
            </div>
          )}
        </div>

        {/* Payroll Integration */}
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <Checkbox
            id="include_in_payroll"
            checked={formData.include_in_payroll}
            onCheckedChange={(checked) => setFormData({...formData, include_in_payroll: checked})}
          />
          <div className="flex-1">
            <Label htmlFor="include_in_payroll" className="font-semibold text-emerald-900 cursor-pointer">
              Include in payroll processing
            </Label>
            <p className="text-xs text-emerald-700 mt-1">
              Automatically deduct monthly payment from employee's salary during payroll
            </p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label>Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Additional notes about the loan, payment history, special arrangements..."
            className="h-24"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
            {isNew ? 'Add Loan' : 'Update Loan'}
          </Button>
        </div>
      </form>
    );
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    disbursed: 'bg-purple-100 text-purple-700',
    completed: 'bg-emerald-100 text-emerald-700'
  };

  const statusIcons = {
    pending: Clock,
    approved: CheckCircle2,
    rejected: XCircle,
    disbursed: DollarSign,
    completed: CheckCircle2
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => <Skeleton key={i} className="h-48" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h3 className="text-lg font-semibold text-slate-900">Loan Balances</h3>
          <p className="text-sm text-slate-600">Manage employee loans and track repayments</p>
        </div>
        <Button
          onClick={() => {
            setIsCreating(true);
            setEditingLoan(null);
            setShowForm(true);
          }}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Loan
        </Button>
      </div>

      {/* Help Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Upload className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">💡 Entering Opening Balances</p>
              <p className="text-xs text-blue-700">
                When adding existing loans from another system: (1) Enter the <strong>original loan amount</strong> in "Original Loan Amount", 
                (2) Enter what's <strong>already been paid</strong> in "Total Paid So Far", and (3) The system will automatically calculate 
                the remaining balance. Mark it as an "opening balance" to distinguish it from new loans.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {loans.length === 0 && !showForm ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 mb-4">No loans found for this employee</p>
            <Button
              onClick={() => {
                setIsCreating(true);
                setEditingLoan(null);
                setShowForm(true);
              }}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Loan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => {
            const StatusIcon = statusIcons[loan.status];
            const progressPercentage = loan.amount_requested > 0 
              ? ((loan.total_paid || 0) / loan.amount_requested) * 100 
              : 0;

            return (
              <Card key={loan.id} className="border-slate-200 hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className={`flex items-start justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={isRTL ? 'text-right' : ''}>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-slate-900">{loan.loan_type.replace(/_/g, ' ')}</h4>
                        <Badge className={statusColors[loan.status]}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {loan.status}
                        </Badge>
                        {loan.is_opening_balance && (
                          <Badge variant="outline" className="text-xs">
                            <Upload className="w-3 h-3 mr-1" />
                            Opening Balance
                          </Badge>
                        )}
                        {!loan.include_in_payroll && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Not in payroll
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{loan.purpose}</p>
                      {loan.is_opening_balance && loan.original_loan_date ? (
                        <p className="text-xs text-slate-500 mt-1">
                          Original Date: {format(new Date(loan.original_loan_date), 'MMM dd, yyyy')}
                        </p>
                      ) : loan.request_date && (
                        <p className="text-xs text-slate-500 mt-1">
                          Requested: {format(new Date(loan.request_date), 'MMM dd, yyyy')}
                        </p>
                      )}
                      {loan.deduction_start_month && (
                        <p className="text-xs text-emerald-600 mt-1">
                          Deductions start: {loan.deduction_start_month}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingLoan(loan);
                        setIsCreating(false);
                        setShowForm(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700 mb-1">Original Amount</p>
                      <p className="text-lg font-bold text-blue-900">
                        {loan.amount_requested?.toLocaleString()} SAR
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <p className="text-xs text-emerald-700 mb-1">Paid</p>
                      <p className="text-lg font-bold text-emerald-900">
                        {(loan.total_paid || 0).toLocaleString()} SAR
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-purple-700 mb-1">Remaining</p>
                      <p className="text-lg font-bold text-purple-900">
                        {(loan.remaining_balance || 0).toLocaleString()} SAR
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-xs text-amber-700 mb-1">Monthly</p>
                      <p className="text-lg font-bold text-amber-900">
                        {(loan.monthly_deduction || 0).toLocaleString()} SAR
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-600">Repayment Progress</span>
                      <span className="text-xs font-bold text-emerald-600">{progressPercentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all"
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {loan.repayment_period && (
                    <p className="text-xs text-slate-500 mt-3">
                      Repayment Period: {loan.repayment_period} months
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="border-blue-200 bg-blue-50/50 mt-4">
          <CardHeader>
            <CardTitle className="text-lg">
              {isCreating ? 'Add New Loan' : 'Update Loan Details'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoanForm
              loan={editingLoan}
              isNew={isCreating}
              onSubmit={(data) => {
                if (isCreating) {
                  createLoanMutation.mutate(data);
                } else {
                  updateLoanMutation.mutate({ id: editingLoan.id, data });
                }
              }}
              onCancel={() => {
                setShowForm(false);
                setEditingLoan(null);
                setIsCreating(false);
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}