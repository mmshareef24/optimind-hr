import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { DollarSign, Plus, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function LoanRequestsESS({ employee, loanRequests }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: employee.id,
    loan_type: 'salary_advance',
    request_date: new Date().toISOString().split('T')[0],
    amount_requested: 0,
    purpose: '',
    repayment_period: 12,
    status: 'pending'
  });

  const queryClient = useQueryClient();

  const createLoanMutation = useMutation({
    mutationFn: (data) => {
      const monthlyDeduction = data.amount_requested / data.repayment_period;
      return base44.entities.LoanRequest.create({
        ...data,
        monthly_deduction: monthlyDeduction,
        remaining_balance: data.amount_requested
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-loans']);
      setShowForm(false);
      setFormData({
        employee_id: employee.id,
        loan_type: 'salary_advance',
        request_date: new Date().toISOString().split('T')[0],
        amount_requested: 0,
        purpose: '',
        repayment_period: 12,
        status: 'pending'
      });
      toast.success('Loan request submitted successfully');
    },
    onError: () => toast.error('Failed to submit loan request')
  });

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    disbursed: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-slate-100 text-slate-700'
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createLoanMutation.mutate(formData);
  };

  const monthlyDeduction = formData.amount_requested / formData.repayment_period;

  return (
    <div className="space-y-6">
      {/* Request Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Request Loan
        </Button>
      </div>

      {/* Loan Requests */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            My Loan Requests ({loanRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loanRequests.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No loan requests yet</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {loanRequests.map(loan => (
                <Card key={loan.id} className="border border-slate-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900 capitalize">
                          {loan.loan_type.replace(/_/g, ' ')}
                        </h4>
                        <p className="text-sm text-slate-600">{loan.purpose}</p>
                      </div>
                      <Badge className={statusColors[loan.status]}>
                        {loan.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Amount</span>
                        <span className="font-bold text-emerald-600">
                          {loan.amount_requested?.toLocaleString()} SAR
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Monthly Deduction</span>
                        <span className="font-semibold text-slate-900">
                          {loan.monthly_deduction?.toLocaleString()} SAR
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Repayment Period</span>
                        <span className="font-semibold text-slate-900">
                          {loan.repayment_period} months
                        </span>
                      </div>
                      {loan.remaining_balance > 0 && loan.status === 'disbursed' && (
                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span className="text-slate-500">Remaining</span>
                          <span className="font-bold text-amber-600">
                            {loan.remaining_balance?.toLocaleString()} SAR
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-slate-500">
                      Requested: {format(new Date(loan.request_date || loan.created_date), 'MMM dd, yyyy')}
                      {loan.approval_date && ` • Approved: ${format(new Date(loan.approval_date), 'MMM dd, yyyy')}`}
                    </div>

                    {loan.rejection_reason && (
                      <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
                        <strong>Rejection:</strong> {loan.rejection_reason}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loan Request Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Loan</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Loan Type *</Label>
              <Select
                value={formData.loan_type}
                onValueChange={(val) => setFormData({ ...formData, loan_type: val })}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount Requested (SAR) *</Label>
                <Input
                  type="number"
                  value={formData.amount_requested}
                  onChange={(e) => setFormData({ ...formData, amount_requested: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label>Repayment Period (months) *</Label>
                <Input
                  type="number"
                  value={formData.repayment_period}
                  onChange={(e) => setFormData({ ...formData, repayment_period: parseInt(e.target.value) || 12 })}
                  min="1"
                  max="60"
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-900">Monthly Deduction</span>
                <span className="text-xl font-bold text-blue-600">
                  {monthlyDeduction.toLocaleString(undefined, { maximumFractionDigits: 2 })} SAR
                </span>
              </div>
            </div>

            <div>
              <Label>Purpose *</Label>
              <Textarea
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Explain the purpose of this loan"
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Submit Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}