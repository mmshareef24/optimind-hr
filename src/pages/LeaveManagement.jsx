import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, Plus, TrendingUp, Clock, CheckCircle, XCircle, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import StatCard from "../components/hrms/StatCard";
import LeaveBalanceCard from "../components/leave/LeaveBalanceCard";
import LeaveRequestForm from "../components/leave/LeaveRequestForm";
import LeaveApprovalPanel from "../components/leave/LeaveApprovalPanel";
import LeaveCalendar from "../components/leave/LeaveCalendar";
import LeaveHistory from "../components/leave/LeaveHistory";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

export default function LeaveManagement() {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('user');

  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      setUserRole(userData.role || 'user');
      const employees = await base44.entities.Employee.list();
      const employee = employees.find(e => e.email === userData.email);
      setCurrentUser(employee);
      return employee;
    }
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: leaveRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: () => base44.entities.LeaveRequest.list('-created_date'),
  });

  const { data: leaveBalances = [], isLoading: loadingBalances } = useQuery({
    queryKey: ['leave-balances', currentUser?.id],
    queryFn: () => currentUser ? base44.entities.LeaveBalance.filter({ employee_id: currentUser.id }) : [],
    enabled: !!currentUser?.id
  });

  // Initialize leave balances if they don't exist
  useEffect(() => {
    if (currentUser && leaveBalances.length === 0) {
      const currentYear = new Date().getFullYear();
      const defaultBalances = [
        { employee_id: currentUser.id, leave_type: 'annual', year: currentYear, total_entitled: 21, used: 0, pending: 0, remaining: 21 },
        { employee_id: currentUser.id, leave_type: 'sick', year: currentYear, total_entitled: 30, used: 0, pending: 0, remaining: 30 },
        { employee_id: currentUser.id, leave_type: 'hajj', year: currentYear, total_entitled: 10, used: 0, pending: 0, remaining: 10 },
        { employee_id: currentUser.id, leave_type: 'unpaid', year: currentYear, total_entitled: 0, used: 0, pending: 0, remaining: 0 }
      ];
      
      defaultBalances.forEach(balance => {
        base44.entities.LeaveBalance.create(balance).catch(() => {});
      });
    }
  }, [currentUser, leaveBalances]);

  const createRequestMutation = useMutation({
    mutationFn: async (data) => {
      const request = await base44.entities.LeaveRequest.create(data);
      
      // Update pending balance
      const balance = leaveBalances.find(b => b.leave_type === data.leave_type);
      if (balance) {
        await base44.entities.LeaveBalance.update(balance.id, {
          ...balance,
          pending: balance.pending + data.total_days
        });
      }
      
      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leave-requests']);
      queryClient.invalidateQueries(['leave-balances']);
      setShowRequestForm(false);
      toast.success('Leave request submitted successfully');
    },
    onError: () => {
      toast.error('Failed to submit leave request');
    }
  });

  const approveRequestMutation = useMutation({
    mutationFn: async ({ id, notes }) => {
      const request = leaveRequests.find(r => r.id === id);
      await base44.entities.LeaveRequest.update(id, {
        ...request,
        status: 'approved',
        approval_date: new Date().toISOString().split('T')[0],
        approved_by: user?.email
      });

      // Update balances
      const balances = await base44.entities.LeaveBalance.filter({ employee_id: request.employee_id });
      const balance = balances.find(b => b.leave_type === request.leave_type);
      
      if (balance) {
        await base44.entities.LeaveBalance.update(balance.id, {
          ...balance,
          used: balance.used + request.total_days,
          pending: Math.max(0, balance.pending - request.total_days),
          remaining: balance.remaining - request.total_days
        });
      }

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leave-requests']);
      queryClient.invalidateQueries(['leave-balances']);
      toast.success('Leave request approved - Will be deducted from payroll for unpaid leaves');
    },
    onError: () => {
      toast.error('Failed to approve leave request');
    }
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async ({ id, notes }) => {
      const request = leaveRequests.find(r => r.id === id);
      await base44.entities.LeaveRequest.update(id, {
        ...request,
        status: 'rejected',
        rejection_reason: notes,
        approved_by: user?.email,
        approval_date: new Date().toISOString().split('T')[0]
      });

      // Update pending balance
      const balances = await base44.entities.LeaveBalance.filter({ employee_id: request.employee_id });
      const balance = balances.find(b => b.leave_type === request.leave_type);
      
      if (balance) {
        await base44.entities.LeaveBalance.update(balance.id, {
          ...balance,
          pending: Math.max(0, balance.pending - request.total_days)
        });
      }

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leave-requests']);
      queryClient.invalidateQueries(['leave-balances']);
      toast.success('Leave request rejected');
    },
    onError: () => {
      toast.error('Failed to reject leave request');
    }
  });

  const handleSubmitRequest = (data) => {
    createRequestMutation.mutate(data);
  };

  const handleApprove = (id, notes) => {
    approveRequestMutation.mutate({ id, notes });
  };

  const handleReject = (id, notes) => {
    rejectRequestMutation.mutate({ id, notes });
  };

  // Filter requests based on role
  const myRequests = currentUser ? leaveRequests.filter(r => r.employee_id === currentUser.id) : [];
  const teamRequests = userRole === 'admin' ? leaveRequests : [];

  // Calculate statistics
  const pendingCount = myRequests.filter(r => r.status === 'pending').length;
  const approvedCount = myRequests.filter(r => r.status === 'approved').length;
  const totalDaysUsed = leaveBalances.reduce((sum, b) => sum + b.used, 0);
  const totalDaysRemaining = leaveBalances.reduce((sum, b) => sum + b.remaining, 0);

  // Calculate unpaid leaves for current year
  const currentYear = new Date().getFullYear();
  const unpaidLeaves = myRequests.filter(r => 
    r.leave_type === 'unpaid' && 
    r.status === 'approved' &&
    new Date(r.start_date).getFullYear() === currentYear
  ).reduce((sum, r) => sum + r.total_days, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Leave Management</h1>
          <p className="text-slate-600">Manage leave requests and track balances with payroll integration</p>
        </div>
        <Button
          onClick={() => setShowRequestForm(true)}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" /> Request Leave
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Days Used"
          value={totalDaysUsed}
          icon={CheckCircle}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Days Remaining"
          value={totalDaysRemaining}
          icon={TrendingUp}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Pending Requests"
          value={pendingCount}
          icon={Clock}
          bgColor="from-amber-500 to-amber-600"
        />
        <StatCard
          title="Unpaid Leaves (YTD)"
          value={unpaidLeaves}
          icon={XCircle}
          bgColor="from-red-500 to-red-600"
        />
      </div>

      {/* Leave Balances */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">My Leave Balances</h3>
        {loadingBalances ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : leaveBalances.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No leave balances found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {leaveBalances.map((balance) => (
              <LeaveBalanceCard key={balance.id} balance={balance} />
            ))}
          </div>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue={userRole === 'admin' ? 'approvals' : 'my-requests'} className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger
            value="my-requests"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <Calendar className="w-4 h-4 mr-2" />
            My Requests
          </TabsTrigger>
          {userRole === 'admin' && (
            <TabsTrigger
              value="approvals"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approvals
            </TabsTrigger>
          )}
          <TabsTrigger
            value="calendar"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* My Requests Tab */}
        <TabsContent value="my-requests">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              {loadingRequests ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
                </div>
              ) : myRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 mb-4">No leave requests yet</p>
                  <Button onClick={() => setShowRequestForm(true)} variant="outline">
                    Submit Your First Request
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myRequests.map((request) => (
                    <Card key={request.id} className="border border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-slate-900 capitalize">
                                {request.leave_type.replace('_', ' ')} Leave
                              </h4>
                              <Badge className={
                                request.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                              }>
                                {request.status}
                              </Badge>
                              {request.leave_type === 'unpaid' && request.status === 'approved' && (
                                <Badge className="bg-red-100 text-red-700">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Payroll Deduction
                                </Badge>
                              )}
                            </div>
                            <div className="grid md:grid-cols-3 gap-2 text-sm text-slate-600">
                              <p><strong>From:</strong> {format(new Date(request.start_date), 'MMM dd, yyyy')}</p>
                              <p><strong>To:</strong> {format(new Date(request.end_date), 'MMM dd, yyyy')}</p>
                              <p><strong>Duration:</strong> {request.total_days} days</p>
                            </div>
                            {request.reason && (
                              <p className="text-sm text-slate-500 mt-2">{request.reason}</p>
                            )}
                            {request.rejection_reason && (
                              <p className="text-sm text-red-600 mt-2">
                                <strong>Rejection reason:</strong> {request.rejection_reason}
                              </p>
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
        </TabsContent>

        {/* Approvals Tab (Admin Only) */}
        {userRole === 'admin' && (
          <TabsContent value="approvals">
            <LeaveApprovalPanel
              requests={teamRequests}
              employees={employees}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </TabsContent>
        )}

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <LeaveCalendar
            leaveRequests={userRole === 'admin' ? teamRequests : myRequests}
            employees={employees}
          />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <LeaveHistory
            requests={userRole === 'admin' ? teamRequests : myRequests}
            employees={employees}
          />
        </TabsContent>
      </Tabs>

      {/* Leave Request Form Dialog */}
      <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Leave Request</DialogTitle>
          </DialogHeader>
          {currentUser && (
            <LeaveRequestForm
              employee={currentUser}
              balances={leaveBalances}
              onSubmit={handleSubmitRequest}
              onCancel={() => setShowRequestForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}