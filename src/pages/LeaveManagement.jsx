import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, Plus, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function LeaveManagement() {
  const queryClient = useQueryClient();

  const { data: leaveRequests = [], isLoading } = useQuery({
    queryKey: ['leaveRequests'],
    queryFn: () => base44.entities.LeaveRequest.list('-created_date'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeaveRequest.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['leaveRequests'])
  });

  const handleApprove = (leave) => {
    updateMutation.mutate({
      id: leave.id,
      data: { ...leave, status: 'approved', approval_date: new Date().toISOString().split('T')[0] }
    });
  };

  const handleReject = (leave) => {
    updateMutation.mutate({
      id: leave.id,
      data: { ...leave, status: 'rejected' }
    });
  };

  const leaveTypes = {
    annual: { label: 'Annual Leave', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    sick: { label: 'Sick Leave', color: 'bg-red-100 text-red-700 border-red-200' },
    maternity: { label: 'Maternity Leave', color: 'bg-pink-100 text-pink-700 border-pink-200' },
    paternity: { label: 'Paternity Leave', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    unpaid: { label: 'Unpaid Leave', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    hajj: { label: 'Hajj Leave', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    marriage: { label: 'Marriage Leave', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    bereavement: { label: 'Bereavement', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    emergency: { label: 'Emergency Leave', color: 'bg-orange-100 text-orange-700 border-orange-200' }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Leave Management</h1>
          <p className="text-slate-600">Manage employee leave requests per Saudi labor law</p>
        </div>
        <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg">
          <Plus className="w-4 h-4 mr-2" /> New Request
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {['pending', 'approved', 'rejected'].map((status) => {
          const count = leaveRequests.filter(l => l.status === status).length;
          const colors = {
            pending: 'from-amber-500 to-amber-600',
            approved: 'from-emerald-500 to-emerald-600',
            rejected: 'from-red-500 to-red-600'
          };
          return (
            <Card key={status} className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1 capitalize">{status} Requests</p>
                    <p className="text-3xl font-bold text-slate-900">{count}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[status]} shadow-lg`}>
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-emerald-50/30">
          <CardTitle>All Leave Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No leave requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaveRequests.map((leave) => (
                <Card key={leave.id} className="border border-slate-200 hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-slate-900">Employee #{leave.employee_id?.slice(0, 8)}</h3>
                          <Badge className={leaveTypes[leave.leave_type]?.color || 'bg-slate-100 text-slate-700'}>
                            {leaveTypes[leave.leave_type]?.label || leave.leave_type}
                          </Badge>
                        </div>
                        <div className="grid md:grid-cols-3 gap-2 text-sm text-slate-600">
                          <p><span className="font-medium">From:</span> {format(new Date(leave.start_date), 'dd MMM yyyy')}</p>
                          <p><span className="font-medium">To:</span> {format(new Date(leave.end_date), 'dd MMM yyyy')}</p>
                          <p><span className="font-medium">Duration:</span> {leave.total_days} days</p>
                        </div>
                        {leave.reason && (
                          <p className="text-sm text-slate-500 mt-2">{leave.reason}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          leave.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                          'bg-red-100 text-red-700 border-red-200'
                        }>
                          {leave.status}
                        </Badge>
                        {leave.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              onClick={() => handleApprove(leave)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleReject(leave)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}