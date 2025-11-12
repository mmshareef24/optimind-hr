import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { User, CheckCircle, XCircle, Mail, Phone, CreditCard, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const requestTypeLabels = {
  contact_info: 'Contact Information',
  emergency_contact: 'Emergency Contact',
  bank_details: 'Bank Details',
  address: 'Address',
  personal_info: 'Personal Information'
};

const requestTypeIcons = {
  contact_info: Mail,
  emergency_contact: Phone,
  bank_details: CreditCard,
  address: MapPin,
  personal_info: User
};

export default function ProfileChangeApprovals({ requests = [], employees = [], onApprove, onReject }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [action, setAction] = useState(null); // 'approve' or 'reject'
  const [notes, setNotes] = useState('');

  const pendingRequests = requests.filter(r => r.status === 'pending');

  const handleAction = (request, actionType) => {
    setSelectedRequest(request);
    setAction(actionType);
    setNotes('');
  };

  const handleConfirm = () => {
    if (action === 'approve') {
      onApprove(selectedRequest.id, notes);
    } else {
      onReject(selectedRequest.id, notes);
    }
    setSelectedRequest(null);
    setAction(null);
    setNotes('');
  };

  if (pendingRequests.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Pending Profile Changes</h3>
          <p className="text-slate-600">All profile change requests have been reviewed</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Profile Change Requests ({pendingRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {pendingRequests.map((request) => {
              const employee = employees.find(e => e.id === request.employee_id);
              const Icon = requestTypeIcons[request.request_type] || User;
              
              return (
                <Card key={request.id} className="border border-slate-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee'}
                          </h3>
                          <p className="text-sm text-slate-600">{employee?.department} • {employee?.job_title}</p>
                          <Badge className="mt-2 bg-blue-100 text-blue-700">
                            {requestTypeLabels[request.request_type]}
                          </Badge>
                        </div>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700">Pending Review</Badge>
                    </div>

                    {request.reason && (
                      <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-1">Reason:</p>
                        <p className="text-sm text-slate-600">{request.reason}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                          <p className="text-xs font-semibold text-red-700 mb-2">Current Values</p>
                          <div className="space-y-1">
                            {Object.entries(request.current_data || {}).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <span className="text-slate-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                                <span className="text-slate-900 ml-2 font-medium">{value || 'N/A'}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                          <p className="text-xs font-semibold text-emerald-700 mb-2">Requested Changes</p>
                          <div className="space-y-1">
                            {Object.entries(request.requested_data || {}).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <span className="text-slate-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                                <span className="text-emerald-900 ml-2 font-medium">{value || 'N/A'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={() => handleAction(request, 'reject')}
                          variant="outline"
                          className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleAction(request, 'approve')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve' : 'Reject'} Profile Change
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <p className="text-slate-700">
                Are you sure you want to <strong>{action}</strong> this profile change request?
              </p>

              <div>
                <Label>Comments (Optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={action === 'approve' ? 'Add approval notes...' : 'Explain reason for rejection...'}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className={action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              Confirm {action === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}