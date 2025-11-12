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
import { Calendar, CheckCircle, XCircle, Clock, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LeaveApprovalsPanel({ pendingLeaves, userRole, currentEmployeeId }) {
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  const [comments, setComments] = useState('');
  const queryClient = useQueryClient();

  const approvalMutation = useMutation({
    mutationFn: async ({ action, leaveRequestId, comments }) => {
      const response = await base44.functions.invoke('leaveApprovalWorkflow', {
        action,
        leaveRequestId,
        comments
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leave-requests']);
      queryClient.invalidateQueries(['pending-leaves']);
      setShowApprovalDialog(false);
      setComments('');
      setSelectedLeave(null);
      toast.success('Leave request processed successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to process leave request');
    }
  });

  const handleApprovalClick = (leave, action) => {
    setSelectedLeave(leave);
    setApprovalAction(action);
    setShowApprovalDialog(true);
  };

  const handleConfirmApproval = () => {
    if (!selectedLeave || !approvalAction) return;
    
    approvalMutation.mutate({
      action: approvalAction,
      leaveRequestId: selectedLeave.id,
      comments
    });
  };

  // Filter leaves based on role and current approval stage
  const relevantLeaves = pendingLeaves.filter(leave => {
    if (userRole === 'admin') {
      // HR sees leaves that need HR approval
      return leave.current_approver_role === 'hr';
    } else {
      // Managers see leaves that need manager approval for their direct reports
      return leave.current_approver_role === 'manager';
    }
  });

  const getLeaveTypeColor = (type) => {
    const colors = {
      annual: 'bg-blue-100 text-blue-700',
      sick: 'bg-red-100 text-red-700',
      maternity: 'bg-pink-100 text-pink-700',
      paternity: 'bg-purple-100 text-purple-700',
      unpaid: 'bg-slate-100 text-slate-700',
      hajj: 'bg-emerald-100 text-emerald-700',
      marriage: 'bg-amber-100 text-amber-700',
      bereavement: 'bg-slate-100 text-slate-700',
      emergency: 'bg-orange-100 text-orange-700'
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Pending Leave Approvals ({relevantLeaves.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {relevantLeaves.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
              <p className="text-slate-600 font-medium">All caught up!</p>
              <p className="text-sm text-slate-500 mt-1">No pending leave approvals at this time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {relevantLeaves.map((leave) => (
                <Card key={leave.id} className="border border-slate-200 hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{leave.employee_name}</h4>
                          <p className="text-sm text-slate-500">{leave.employee_id}</p>
                        </div>
                      </div>
                      <Badge className={getLeaveTypeColor(leave.leave_type)}>
                        {leave.leave_type?.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Duration</span>
                        <span className="font-semibold">
                          {format(new Date(leave.start_date), 'MMM dd')} - {format(new Date(leave.end_date), 'MMM dd, yyyy')} ({leave.total_days} days)
                        </span>
                      </div>
                      {leave.reason && (
                        <div className="text-sm">
                          <span className="text-slate-600">Reason: </span>
                          <span className="text-slate-900">{leave.reason}</span>
                        </div>
                      )}
                      
                      {/* Show approval history */}
                      {leave.manager_status === 'approved' && (
                        <Alert className="border-emerald-200 bg-emerald-50 mt-3">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <AlertDescription className="text-emerald-800 text-sm">
                            <strong>Manager Approved</strong> on {leave.manager_approval_date}
                            {leave.manager_comments && <p className="mt-1">{leave.manager_comments}</p>}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprovalClick(leave, userRole === 'admin' ? 'hr_approve' : 'manager_approve')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        disabled={approvalMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleApprovalClick(leave, userRole === 'admin' ? 'hr_reject' : 'manager_reject')}
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
              {approvalAction?.includes('approve') ? 'Approve' : 'Reject'} Leave Request
            </DialogTitle>
          </DialogHeader>

          {selectedLeave && (
            <div className="space-y-4">
              <Alert className={approvalAction?.includes('approve') ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
                <AlertCircle className={`h-4 w-4 ${approvalAction?.includes('approve') ? 'text-emerald-600' : 'text-red-600'}`} />
                <AlertDescription className={approvalAction?.includes('approve') ? 'text-emerald-800' : 'text-red-800'}>
                  You are about to {approvalAction?.includes('approve') ? 'approve' : 'reject'} a leave request for{' '}
                  <strong>{selectedLeave.employee_name}</strong> from{' '}
                  {format(new Date(selectedLeave.start_date), 'MMM dd')} to{' '}
                  {format(new Date(selectedLeave.end_date), 'MMM dd, yyyy')} ({selectedLeave.total_days} days).
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