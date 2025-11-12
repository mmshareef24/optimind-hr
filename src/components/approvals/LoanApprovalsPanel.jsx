import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { DollarSign, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoanApprovalsPanel({ pendingLoans, userRole }) {
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  const [comments, setComments] = useState('');
  const queryClient = useQueryClient();

  const approvalMutation = useMutation({
    mutationFn: async ({ action, loanRequestId, comments }) => {
      const response = await base44.functions.invoke('loanApprovalWorkflow', {
        action,
        loanRequestId,
        comments
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['loan-requests']);
      queryClient.invalidateQueries(['pending-loans']);
      setShowApprovalDialog(false);
      setComments('');
      setSelectedLoan(null);
      toast.success('Loan request processed successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to process loan request');
    }
  });

  const handleApprovalClick = (loan, action) => {
    setSelectedLoan(loan);
    setApprovalAction(action);
    setShowApprovalDialog(true);
  };

  const handleConfirmApproval = () => {
    if (!selectedLoan || !approvalAction) return;
    
    approvalMutation.mutate({
      action: approvalAction,
      loanRequestId: selectedLoan.id,
      comments
    });
  };

  // Filter loans based on role and current approval stage
  const relevantLoans = pendingLoans.filter(loan => {
    if (userRole === 'admin') {
      return loan.current_approver_role === 'hr' || loan.current_approver_role === 'senior_management';
    } else {
      return loan.current_approver_role === 'manager';
    }
  });

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-white">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Pending Loan Approvals ({relevantLoans.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {relevantLoans.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
              <p className="text-slate-600 font-medium">All caught up!</p>
              <p className="text-sm text-slate-500 mt-1">No pending loan approvals at this time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {relevantLoans.map((loan) => (
                <Card key={loan.id} className="border border-slate-200 hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{loan.employee_name}</h4>
                          <p className="text-sm text-slate-500">{loan.employee_id}</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 capitalize">
                        {loan.loan_type?.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Amount Requested</span>
                        <span className="font-bold text-emerald-600">{loan.amount_requested?.toLocaleString()} SAR</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Repayment Period</span>
                        <span className="font-semibold">{loan.repayment_period} months</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Monthly Deduction</span>
                        <span className="font-semibold">{loan.monthly_deduction?.toLocaleString()} SAR</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-600">Purpose: </span>
                        <span className="text-slate-900">{loan.purpose}</span>
                      </div>

                      {/* Show approval history */}
                      <div className="mt-3 space-y-2">
                        {loan.manager_status === 'approved' && (
                          <Alert className="border-emerald-200 bg-emerald-50">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                            <AlertDescription className="text-emerald-800 text-sm">
                              <strong>Manager Approved</strong> on {loan.manager_approval_date}
                              {loan.manager_comments && <p className="mt-1">{loan.manager_comments}</p>}
                            </AlertDescription>
                          </Alert>
                        )}
                        {loan.hr_status === 'approved' && (
                          <Alert className="border-emerald-200 bg-emerald-50">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                            <AlertDescription className="text-emerald-800 text-sm">
                              <strong>HR Approved</strong> on {loan.hr_approval_date}
                              {loan.hr_comments && <p className="mt-1">{loan.hr_comments}</p>}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      {loan.current_approver_role === 'senior_management' && (
                        <Alert className="border-amber-200 bg-amber-50 mt-3">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <AlertDescription className="text-amber-800 text-sm">
                            <strong>High-Value Loan:</strong> Requires senior management approval due to amount exceeding threshold.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprovalClick(loan, 
                          loan.current_approver_role === 'manager' ? 'manager_approve' :
                          loan.current_approver_role === 'hr' ? 'hr_approve' : 
                          'senior_management_approve'
                        )}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        disabled={approvalMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleApprovalClick(loan, 
                          loan.current_approver_role === 'manager' ? 'manager_reject' :
                          loan.current_approver_role === 'hr' ? 'hr_reject' : 
                          'senior_management_reject'
                        )}
                        variant="outline"
                        className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                        disabled={approvalMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Confirmation Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {approvalAction?.includes('approve') ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              {approvalAction?.includes('approve') ? 'Approve' : 'Reject'} Loan Request
            </DialogTitle>
          </DialogHeader>

          {selectedLoan && (
            <div className="space-y-4">
              <Alert className={approvalAction?.includes('approve') ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
                <AlertCircle className={`h-4 w-4 ${approvalAction?.includes('approve') ? 'text-emerald-600' : 'text-red-600'}`} />
                <AlertDescription className={approvalAction?.includes('approve') ? 'text-emerald-800' : 'text-red-800'}>
                  You are about to {approvalAction?.includes('approve') ? 'approve' : 'reject'} a loan request for{' '}
                  <strong>{selectedLoan.employee_name}</strong> for an amount of{' '}
                  <strong>{selectedLoan.amount_requested?.toLocaleString()} SAR</strong> to be repaid over{' '}
                  <strong>{selectedLoan.repayment_period} months</strong>.
                </AlertDescription>
              </Alert>

              <div>
                <Label>{approvalAction?.includes('approve') ? 'Comments (Optional)' : 'Rejection Reason *'}</Label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={approvalAction?.includes('approve') ? 'Add any comments...' : 'Please provide a reason for rejection'}
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApprovalDialog(false);
                setComments('');
              }}
              disabled={approvalMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmApproval}
              disabled={approvalMutation.isPending || (approvalAction?.includes('reject') && !comments)}
              className={approvalAction?.includes('approve') ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {approvalMutation.isPending ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}