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
import { Plane, CheckCircle, XCircle, Clock, AlertCircle, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TravelApprovalsPanel({ pendingTravels, userRole }) {
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  const [comments, setComments] = useState('');
  const queryClient = useQueryClient();

  const approvalMutation = useMutation({
    mutationFn: async ({ action, travelRequestId, comments }) => {
      const response = await base44.functions.invoke('travelApprovalWorkflow', {
        action,
        travelRequestId,
        comments
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['travel-requests']);
      queryClient.invalidateQueries(['pending-travels']);
      setShowApprovalDialog(false);
      setComments('');
      setSelectedTravel(null);
      toast.success('Travel request processed successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to process travel request');
    }
  });

  const handleApprovalClick = (travel, action) => {
    setSelectedTravel(travel);
    setApprovalAction(action);
    setShowApprovalDialog(true);
  };

  const handleConfirmApproval = () => {
    if (!selectedTravel || !approvalAction) return;
    
    approvalMutation.mutate({
      action: approvalAction,
      travelRequestId: selectedTravel.id,
      comments
    });
  };

  // Filter travels based on role and current approval stage
  const relevantTravels = pendingTravels.filter(travel => {
    if (userRole === 'admin') {
      return travel.current_approver_role === 'finance';
    } else {
      return travel.current_approver_role === 'manager';
    }
  });

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-white">
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-purple-600" />
            Pending Travel Approvals ({relevantTravels.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {relevantTravels.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
              <p className="text-slate-600 font-medium">All caught up!</p>
              <p className="text-sm text-slate-500 mt-1">No pending travel approvals at this time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {relevantTravels.map((travel) => (
                <Card key={travel.id} className="border border-slate-200 hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                          <Plane className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{travel.employee_name}</h4>
                          <p className="text-sm text-slate-500">{travel.employee_id}</p>
                        </div>
                      </div>
                      <Badge className={travel.request_type === 'international' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                        {travel.request_type}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Destination</span>
                        <span className="font-semibold">{travel.destination}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Duration</span>
                        <span className="font-semibold">
                          {format(new Date(travel.departure_date), 'MMM dd')} - {format(new Date(travel.return_date), 'MMM dd, yyyy')} ({travel.duration_days} days)
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Estimated Cost</span>
                        <span className="font-bold text-purple-600">{travel.estimated_cost?.toLocaleString()} SAR</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-600">Purpose: </span>
                        <span className="text-slate-900">{travel.purpose}</span>
                      </div>

                      {/* Show approval history */}
                      {travel.manager_status === 'approved' && (
                        <Alert className="border-emerald-200 bg-emerald-50 mt-3">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <AlertDescription className="text-emerald-800 text-sm">
                            <strong>Manager Approved</strong> on {travel.manager_approval_date}
                            {travel.manager_comments && <p className="mt-1">{travel.manager_comments}</p>}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprovalClick(travel, userRole === 'admin' ? 'finance_approve' : 'manager_approve')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        disabled={approvalMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleApprovalClick(travel, userRole === 'admin' ? 'finance_reject' : 'manager_reject')}
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
              {approvalAction?.includes('approve') ? 'Approve' : 'Reject'} Travel Request
            </DialogTitle>
          </DialogHeader>

          {selectedTravel && (
            <div className="space-y-4">
              <Alert className={approvalAction?.includes('approve') ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
                <AlertCircle className={`h-4 w-4 ${approvalAction?.includes('approve') ? 'text-emerald-600' : 'text-red-600'}`} />
                <AlertDescription className={approvalAction?.includes('approve') ? 'text-emerald-800' : 'text-red-800'}>
                  You are about to {approvalAction?.includes('approve') ? 'approve' : 'reject'} a travel request for{' '}
                  <strong>{selectedTravel.employee_name}</strong> to <strong>{selectedTravel.destination}</strong>{' '}
                  costing <strong>{selectedTravel.estimated_cost?.toLocaleString()} SAR</strong>.
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