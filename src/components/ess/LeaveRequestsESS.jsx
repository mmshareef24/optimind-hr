import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Clock } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import LeaveRequestForm from "../leave/LeaveRequestForm";
import { toast } from "sonner";
import { format } from "date-fns";

export default function LeaveRequestsESS({ employee, leaveRequests, leaveBalances }) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const createLeaveMutation = useMutation({
    mutationFn: (data) => base44.entities.LeaveRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-leaves']);
      setShowForm(false);
      toast.success('Leave request submitted successfully');
    },
    onError: () => toast.error('Failed to submit leave request')
  });

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-slate-100 text-slate-700'
  };

  return (
    <div className="space-y-6">
      {/* Leave Balances */}
      <div className="grid md:grid-cols-3 gap-4">
        {leaveBalances.map(balance => (
          <Card key={balance.id} className="border-blue-200">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-slate-600 mb-2 capitalize">
                {balance.leave_type.replace(/_/g, ' ')}
              </h4>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-blue-600">{balance.remaining}</span>
                <span className="text-sm text-slate-500 mb-1">/ {balance.total_entitled} days</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Used: {balance.used} • Pending: {balance.pending}
              </p>
            </CardContent>
          </Card>
        ))}
        {leaveBalances.length === 0 && (
          <Card className="border-slate-200 col-span-3">
            <CardContent className="p-8 text-center">
              <p className="text-slate-500">No leave balance information available</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Request Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Request Leave
        </Button>
      </div>

      {/* Leave Requests */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            My Leave Requests ({leaveRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaveRequests.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No leave requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaveRequests.map(leave => (
                <Card key={leave.id} className="border border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-900 capitalize">
                          {leave.leave_type.replace(/_/g, ' ')}
                        </h4>
                        <p className="text-sm text-slate-600">{leave.reason}</p>
                      </div>
                      <Badge className={statusColors[leave.status]}>
                        {leave.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm mt-3">
                      <div>
                        <span className="text-slate-500">Start Date</span>
                        <p className="font-medium">{format(new Date(leave.start_date), 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">End Date</span>
                        <p className="font-medium">{format(new Date(leave.end_date), 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Duration</span>
                        <p className="font-medium">{leave.total_days} days</p>
                      </div>
                    </div>
                    {leave.rejection_reason && (
                      <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
                        <strong>Rejection:</strong> {leave.rejection_reason}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Request Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Leave</DialogTitle>
          </DialogHeader>
          <LeaveRequestForm
            employee={employee}
            leaveBalances={leaveBalances}
            onSubmit={(data) => createLeaveMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}