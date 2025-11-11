import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, Calendar, User, FileText, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

export default function LeaveApprovalPanel({ requests, employees, onApprove, onReject }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [action, setAction] = useState('approve');
  const [notes, setNotes] = useState('');

  const handleAction = (request, actionType) => {
    setSelectedRequest(request);
    setAction(actionType);
    setNotes('');
    setShowApprovalDialog(true);
  };

  const handleConfirm = () => {
    if (action === 'approve') {
      onApprove(selectedRequest.id, notes);
    } else {
      onReject(selectedRequest.id, notes);
    }
    setShowApprovalDialog(false);
    setSelectedRequest(null);
    setNotes('');
  };

  const getEmployee = (employeeId) => {
    return employees.find(e => e.id === employeeId);
  };

  const leaveTypeColors = {
    annual: 'bg-blue-100 text-blue-700 border-blue-200',
    sick: 'bg-red-100 text-red-700 border-red-200',
    maternity: 'bg-pink-100 text-pink-700 border-pink-200',
    paternity: 'bg-purple-100 text-purple-700 border-purple-200',
    unpaid: 'bg-slate-100 text-slate-700 border-slate-200',
    hajj: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    marriage: 'bg-amber-100 text-amber-700 border-amber-200',
    bereavement: 'bg-slate-200 text-slate-700 border-slate-300',
    emergency: 'bg-orange-100 text-orange-700 border-orange-200'
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">
        Pending Approvals ({pendingRequests.length})
      </h3>

      {pendingRequests.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="p-12 text-center">
            <Check className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No pending leave requests</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingRequests.map((request) => {
            const employee = getEmployee(request.employee_id);
            return (
              <Card key={request.id} className="border border-slate-200 hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {employee?.first_name} {employee?.last_name}
                          </h4>
                          <p className="text-sm text-slate-500">{employee?.job_title} • {employee?.department}</p>
                        </div>
                        <Badge className={leaveTypeColors[request.leave_type]}>
                          {request.leave_type.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-3 gap-3 text-sm mb-3">
                        <div>
                          <span className="text-slate-500">Start Date:</span>
                          <span className="ml-2 font-semibold">
                            {format(new Date(request.start_date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">End Date:</span>
                          <span className="ml-2 font-semibold">
                            {format(new Date(request.end_date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Duration:</span>
                          <span className="ml-2 font-semibold text-emerald-600">
                            {request.total_days} days
                          </span>
                        </div>
                      </div>

                      {request.reason && (
                        <div className="text-sm bg-slate-50 p-3 rounded-lg mb-3">
                          <p className="text-slate-600"><strong>Reason:</strong> {request.reason}</p>
                        </div>
                      )}

                      {request.attachment_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(request.attachment_url, '_blank')}
                          className="text-xs"
                        >
                          <FileText className="w-3 h-3 mr-2" />
                          View Attachment
                        </Button>
                      )}
                    </div>

                    <div className="flex lg:flex-col gap-2">
                      <Button
                        onClick={() => handleAction(request, 'approve')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        size="sm"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleAction(request, 'reject')}
                        variant="outline"
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        size="sm"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-2">
                  <strong>Employee:</strong> {getEmployee(selectedRequest.employee_id)?.first_name} {getEmployee(selectedRequest.employee_id)?.last_name}
                </p>
                <p className="text-sm text-slate-600 mb-2">
                  <strong>Leave Type:</strong> {selectedRequest.leave_type.replace('_', ' ')}
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Duration:</strong> {selectedRequest.total_days} days
                </p>
              </div>

              <div>
                <Label>Notes {action === 'reject' ? '*' : '(Optional)'}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={action === 'approve' ? 'Add any notes (optional)...' : 'Please provide a reason for rejection...'}
                  rows={3}
                  required={action === 'reject'}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={action === 'reject' && !notes}
              className={action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              Confirm {action === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}