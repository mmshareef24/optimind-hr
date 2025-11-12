import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plane, CheckCircle, XCircle, Calendar, DollarSign, User } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

export default function TravelApprovalPanel({ requests, employees, onApprove, onReject }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [notes, setNotes] = useState('');

  const pendingRequests = requests.filter(r => r.status === 'pending');

  const handleAction = () => {
    if (actionType === 'approve') {
      onApprove(selectedRequest.id, notes);
    } else if (actionType === 'reject') {
      onReject(selectedRequest.id, notes);
    }
    setSelectedRequest(null);
    setActionType(null);
    setNotes('');
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-600" />
            Pending Travel Requests ({pendingRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12">
              <Plane className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No pending travel requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => {
                const employee = employees.find(e => e.id === request.employee_id);
                
                return (
                  <Card key={request.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Plane className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{request.destination}</h4>
                            <p className="text-sm text-slate-500">
                              {employee?.first_name} {employee?.last_name} • {employee?.job_title}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700">
                          {request.request_type}
                        </Badge>
                      </div>

                      <p className="text-sm text-slate-600 mb-4">{request.purpose}</p>

                      <div className="grid md:grid-cols-4 gap-3 mb-4 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">Departure</p>
                          <p className="font-medium text-slate-900">
                            {format(new Date(request.departure_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Return</p>
                          <p className="font-medium text-slate-900">
                            {format(new Date(request.return_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Duration</p>
                          <p className="font-medium text-slate-900">{request.duration_days} days</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Est. Cost</p>
                          <p className="font-semibold text-blue-600">
                            {request.estimated_cost.toLocaleString()} SAR
                          </p>
                        </div>
                      </div>

                      {request.advance_required && (
                        <div className="mb-4 p-3 bg-amber-50 rounded-lg">
                          <p className="text-sm text-amber-700">
                            <strong>Advance Payment Requested:</strong> {request.advance_amount.toLocaleString()} SAR
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3 pt-3 border-t">
                        <Button
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType('approve');
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedRequest(request);
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
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Travel Request' : 'Reject Travel Request'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {actionType === 'approve'
                ? 'Are you sure you want to approve this travel request?'
                : 'Please provide a reason for rejecting this travel request.'}
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
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
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