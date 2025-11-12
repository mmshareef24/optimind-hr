import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, Calendar, User, FileText, ExternalLink, AlertTriangle, Clock, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, differenceInDays } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

export default function LeaveApprovalPanel({ requests, employees, onApprove, onReject }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [action, setAction] = useState('approve');
  const [notes, setNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');

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

  const filteredRequests = requests.filter(r => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const pendingRequests = filteredRequests.filter(r => r.status === 'pending');
  const approvedRequests = filteredRequests.filter(r => r.status === 'approved');
  const rejectedRequests = filteredRequests.filter(r => r.status === 'rejected');

  // Calculate urgency (requests starting soon)
  const getUrgency = (request) => {
    const daysUntilStart = differenceInDays(new Date(request.start_date), new Date());
    if (daysUntilStart < 0) return 'overdue';
    if (daysUntilStart <= 3) return 'urgent';
    if (daysUntilStart <= 7) return 'soon';
    return 'normal';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-amber-600 flex items-center justify-center shadow-lg">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-amber-700 font-medium">Pending</p>
                <p className="text-3xl font-bold text-amber-900">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-emerald-700 font-medium">Approved</p>
                <p className="text-3xl font-bold text-emerald-900">{approvedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-red-600 flex items-center justify-center shadow-lg">
                <X className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-red-700 font-medium">Rejected</p>
                <p className="text-3xl font-bold text-red-900">{rejectedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Tabs */}
      <Tabs value={filterStatus} onValueChange={setFilterStatus}>
        <TabsList className="bg-white border-2 border-slate-200 p-1">
          <TabsTrigger value="pending" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            Approved ({approvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            Rejected ({rejectedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            All ({requests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filterStatus}>
          {filteredRequests.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200">
              <CardContent className="p-16 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No {filterStatus} requests</h3>
                <p className="text-slate-500">All caught up! 🎉</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const employee = getEmployee(request.employee_id);
                const urgency = getUrgency(request);
                const daysUntilStart = differenceInDays(new Date(request.start_date), new Date());

                return (
                  <Card 
                    key={request.id} 
                    className={`border-2 hover:shadow-lg transition-all ${
                      urgency === 'urgent' ? 'border-red-300 bg-red-50/30' :
                      urgency === 'soon' ? 'border-amber-300 bg-amber-50/30' :
                      'border-slate-200'
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Employee Info */}
                          <div className="flex items-center gap-4 mb-4">
                            <Avatar className="w-14 h-14 border-2 border-white shadow-lg">
                              <AvatarImage src={employee?.profile_picture} />
                              <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-bold">
                                {employee?.first_name?.[0]}{employee?.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-slate-900 text-lg">
                                  {employee?.first_name} {employee?.last_name}
                                </h4>
                                {urgency === 'urgent' && (
                                  <Badge className="bg-red-500 text-white gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Urgent
                                  </Badge>
                                )}
                                {urgency === 'soon' && (
                                  <Badge className="bg-amber-500 text-white gap-1">
                                    <Clock className="w-3 h-3" />
                                    Soon
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-600">{employee?.job_title} • {employee?.department}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                <Mail className="w-3 h-3 inline mr-1" />
                                {employee?.email}
                              </p>
                            </div>
                            <Badge className={`${leaveTypeColors[request.leave_type]} text-base px-3 py-1`}>
                              {request.leave_type.replace('_', ' ')}
                            </Badge>
                          </div>

                          {/* Leave Details */}
                          <div className="grid md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl mb-4">
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Start Date</p>
                              <p className="font-bold text-slate-900">
                                {format(new Date(request.start_date), 'MMM dd, yyyy')}
                              </p>
                              {daysUntilStart >= 0 && (
                                <p className="text-xs text-blue-600 mt-1">
                                  In {daysUntilStart} day{daysUntilStart !== 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">End Date</p>
                              <p className="font-bold text-slate-900">
                                {format(new Date(request.end_date), 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Duration</p>
                              <p className="font-bold text-emerald-600 text-xl">
                                {request.total_days} days
                              </p>
                            </div>
                          </div>

                          {/* Reason */}
                          {request.reason && (
                            <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-400 mb-3">
                              <p className="text-xs text-blue-700 font-semibold mb-1">REASON</p>
                              <p className="text-sm text-blue-900">{request.reason}</p>
                            </div>
                          )}

                          {/* Attachment */}
                          {request.attachment_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(request.attachment_url, '_blank')}
                              className="gap-2"
                            >
                              <FileText className="w-4 h-4" />
                              View Supporting Document
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}

                          {/* Submitted info */}
                          <p className="text-xs text-slate-500 mt-3">
                            Submitted on {format(new Date(request.created_date), 'MMM dd, yyyy')}
                          </p>
                        </div>

                        {/* Action buttons */}
                        {request.status === 'pending' && (
                          <div className="flex lg:flex-col gap-3">
                            <Button
                              onClick={() => handleAction(request, 'approve')}
                              className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg h-12"
                            >
                              <Check className="w-5 h-5 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleAction(request, 'reject')}
                              variant="outline"
                              className="flex-1 text-red-600 border-2 border-red-300 hover:bg-red-50 h-12"
                            >
                              <X className="w-5 h-5 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {action === 'approve' ? (
                <>
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  Approve Leave Request
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
                    <X className="w-5 h-5 text-white" />
                  </div>
                  Reject Leave Request
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (() => {
            const employee = getEmployee(selectedRequest.employee_id);
            return (
              <div className="space-y-5">
                {/* Employee Summary */}
                <div className="p-5 bg-gradient-to-r from-slate-50 to-white rounded-xl border-2 border-slate-200">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="w-16 h-16 border-2 border-white shadow-lg">
                      <AvatarImage src={employee?.profile_picture} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold text-lg">
                        {employee?.first_name?.[0]}{employee?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-slate-900 text-lg">
                        {employee?.first_name} {employee?.last_name}
                      </p>
                      <p className="text-sm text-slate-600">{employee?.job_title} • {employee?.department}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Leave Type</p>
                      <Badge className={`${leaveTypeColors[selectedRequest.leave_type]} capitalize`}>
                        {selectedRequest.leave_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Duration</p>
                      <p className="font-bold text-emerald-600 text-lg">{selectedRequest.total_days} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Start Date</p>
                      <p className="font-semibold text-slate-900">{format(new Date(selectedRequest.start_date), 'MMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">End Date</p>
                      <p className="font-semibold text-slate-900">{format(new Date(selectedRequest.end_date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                {selectedRequest.reason && (
                  <div className="p-4 bg-blue-50 rounded-xl border-l-4 border-blue-400">
                    <p className="text-xs text-blue-700 font-semibold mb-1">EMPLOYEE'S REASON</p>
                    <p className="text-sm text-blue-900">{selectedRequest.reason}</p>
                  </div>
                )}

                {/* Manager Notes */}
                <div>
                  <Label className="text-base font-semibold">
                    {action === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason *'}
                  </Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      action === 'approve' 
                        ? 'Add any notes or conditions for approval...' 
                        : 'Please provide a clear reason for rejection...'
                    }
                    rows={4}
                    className="mt-2"
                    required={action === 'reject'}
                  />
                  {action === 'reject' && (
                    <p className="text-xs text-red-600 mt-2">
                      ⚠️ A rejection reason is required and will be sent to the employee
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={action === 'reject' && !notes}
              className={`min-w-[140px] ${
                action === 'approve' 
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800' 
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
              }`}
            >
              {action === 'approve' ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Approval
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Confirm Rejection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}