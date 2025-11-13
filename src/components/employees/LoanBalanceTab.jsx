import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { DollarSign, Plus, Edit2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { useTranslation } from '@/components/TranslationContext';

export default function LoanBalanceTab({ employeeId }) {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const [editingLoan, setEditingLoan] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['loan-requests', employeeId],
    queryFn: () => base44.entities.LoanRequest.filter({ employee_id: employeeId }, '-created_date'),
    enabled: !!employeeId
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

  const LoanUpdateForm = ({ loan, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(loan || {});

    // Auto-calculate remaining balance
    React.useEffect(() => {
      const remaining = (formData.amount_requested || 0) - (formData.total_paid || 0);
      setFormData(prev => ({ ...prev, remaining_balance: remaining }));
    }, [formData.amount_requested, formData.total_paid]);

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Status</Label>
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
                <SelectItem value="disbursed">Disbursed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Monthly Deduction (SAR)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.monthly_deduction}
              onChange={(e) => setFormData({...formData, monthly_deduction: parseFloat(e.target.value)})}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Total Paid (SAR)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.total_paid}
              onChange={(e) => setFormData({...formData, total_paid: parseFloat(e.target.value)})}
            />
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 mb-1">Remaining Balance</p>
            <p className="text-xl font-bold text-blue-900">{formData.remaining_balance?.toLocaleString() || 0} SAR</p>
          </div>
        </div>

        {formData.status === 'disbursed' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Disbursement Date</Label>
              <Input
                type="date"
                value={formData.disbursement_date}
                onChange={(e) => setFormData({...formData, disbursement_date: e.target.value})}
              />
            </div>
            <div>
              <Label>Disbursement Reference</Label>
              <Input
                value={formData.disbursement_reference}
                onChange={(e) => setFormData({...formData, disbursement_reference: e.target.value})}
                placeholder="e.g., TXN-12345"
              />
            </div>
          </div>
        )}

        <div>
          <Label>Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Payment notes, updates..."
            className="h-20"
          />
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
            Update Loan
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
          <h3 className="text-lg font-semibold text-slate-900">Loan Requests</h3>
          <p className="text-sm text-slate-600">Track and manage employee loan requests</p>
        </div>
      </div>

      {loans.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No loan requests found for this employee</p>
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
                        <h4 className="font-semibold text-slate-900">{loan.loan_type.replace('_', ' ')}</h4>
                        <Badge className={statusColors[loan.status]}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {loan.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{loan.purpose}</p>
                      {loan.request_date && (
                        <p className="text-xs text-slate-500 mt-1">
                          Requested: {format(new Date(loan.request_date), 'MMM dd, yyyy')}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingLoan(loan);
                        setShowForm(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700 mb-1">Amount</p>
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

      {/* Edit Form Dialog */}
      {showForm && editingLoan && (
        <Card className="border-blue-200 bg-blue-50/50 mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Update Loan Details</CardTitle>
          </CardHeader>
          <CardContent>
            <LoanUpdateForm
              loan={editingLoan}
              onSubmit={(data) => {
                updateLoanMutation.mutate({ id: editingLoan.id, data });
              }}
              onCancel={() => {
                setShowForm(false);
                setEditingLoan(null);
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}