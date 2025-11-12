import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, CheckCircle, XCircle, User } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

export default function LeaveApprovals({ leaveRequests, employees, onApprove, onReject }) {
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [notes, setNotes] = useState('');

  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending');

  const handleAction = () => {
    if (actionType === 'approve') {
      onApprove(selectedLeave.id, notes);
    } else if (actionType === 'reject') {
      onReject(selectedLeave.id, notes);
    }
    setSelectedLeave(null);
    setActionType(null);
    setNotes('');
  };

  const leaveTypeLabels = {
    annual: 'Annual Leave',
    sick: 'Sick Leave',
    maternity: 'Maternity Leave',
    paternity: 'Paternity Leave',
    unpaid: 'Unpaid Leave',
    hajj: 'Hajj Leave',
    marriage: 'Marriage Leave',
    bereavement: 'Bereavement Leave',
    emergency: 'Emergency Leave'
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Pending Leave Requests ({pendingLeaves.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingLeaves.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No pending leave requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingLeaves.map((leave) => {
                const employee = employees.find(e => e.id === leave.employee_id);
                
                return (
                  <Card key={leave.id} className="border-l-4 border-l-emerald-500">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-emerald-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">
                              {employee?.first_name} {employee?.last_name}
                            </h4>
                            <p className="text-sm text-slate-500">
                              {employee?.job_title} • {employee?.department}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700">
                          {leaveTypeLabels[leave.leave_type]}
                        </Badge>
                      </div>

                      {leave.reason && (
                        <p className="text-sm text-slate-600 mb-4">{leave.reason}</p>
                      )}

                      <div className="grid md:grid-cols-3 gap-3 mb-4 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">Start Date</p>
                          <p className="font-medium text-slate-900">
                            {format(new Date(leave.start_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">End Date</p>
                          <p className="font-medium text-slate-900">
                            {format(new Date(leave.end_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Duration</p>
                          <p className="font-medium text-slate-900">{leave.total_days} days</p>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-3 border-t">
                        <Button
                          onClick={() => {
                            setSelectedLeave(leave);
                            setActionType('approve');
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedLeave(leave);
                            setActionType('reject');
                          }}
                          variant="outline"
                          className="flex-1 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedLeave} onOpenChange={() => setSelectedLeave(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {actionType === 'approve'
                ? 'Are you sure you want to approve this leave request?'
                : 'Please provide a reason for rejecting this leave request.'}
            </p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={actionType === 'approve' ? 'Optional notes...' : 'Rejection reason...'}
              rows={3}
              required={actionType === 'reject'}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLeave(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              className={actionType === 'approve' ? 'bg-emerald-600' : 'bg-red-600'}
            >
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}