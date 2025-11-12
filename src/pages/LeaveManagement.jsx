import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, Plus, TrendingUp, Clock, CheckCircle, XCircle, Users, Filter, Download, History, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import StatCard from "../components/hrms/StatCard";
import LeaveBalanceCard from "../components/leave/LeaveBalanceCard";
import LeaveRequestForm from "../components/leave/LeaveRequestForm";
import LeaveApprovalPanel from "../components/leave/LeaveApprovalPanel";
import LeaveCalendar from "../components/leave/LeaveCalendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { format, isWithinInterval, addDays } from "date-fns";

export default function LeaveManagement() {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLeaveType, setFilterLeaveType] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

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
    queryFn: () => base44.entities.LeaveBalance.filter({ employee_id: currentUser.id }),
    enabled: !!currentUser?.id
  });

  // Initialize leave balances if they don't exist
  useEffect(() => {
    if (currentUser && leaveBalances.length === 0) {
      const currentYear = new Date().getFullYear();
      const defaultBalances = [
        { employee_id: currentUser.id, leave_type: 'annual', year: currentYear, total_entitled: 21, used: 0, pending: 0, remaining: 21 },
        { employee_id: currentUser.id, leave_type: 'sick', year: currentYear, total_entitled: 30, used: 0, pending: 0, remaining: 30 },
        { employee_id: currentUser.id, leave_type: 'hajj', year: currentYear, total_entitled: 10, used: 0, pending: 0, remaining: 10 }
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
      toast.success('Leave request approved');
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

  // Apply filters
  const filteredMyRequests = myRequests.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterLeaveType !== 'all' && r.leave_type !== filterLeaveType) return false;
    return true;
  });

  // Calculate statistics
  const pendingCount = myRequests.filter(r => r.status === 'pending').length;
  const approvedCount = myRequests.filter(r => r.status === 'approved').length;
  const rejectedCount = myRequests.filter(r => r.status === 'rejected').length;
  const totalDaysUsed = leaveBalances.reduce((sum, b) => sum + b.used, 0);
  const totalDaysRemaining = leaveBalances.reduce((sum, b) => sum + b.remaining, 0);
  const totalPending = leaveBalances.reduce((sum, b) => sum + b.pending, 0);

  // Get upcoming leaves
  const today = new Date();
  const upcomingLeaves = myRequests.filter(r => {
    if (r.status !== 'approved') return false;
    const startDate = new Date(r.start_date);
    return startDate > today && startDate <= addDays(today, 30);
  }).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  // Check for overlapping requests
  const hasOverlappingRequests = (startDate, endDate) => {
    return myRequests.some(r => {
      if (r.status === 'rejected' || r.status === 'cancelled') return false;
      const existingStart = new Date(r.start_date);
      const existingEnd = new Date(r.end_date);
      const newStart = new Date(startDate);
      const newEnd = new Date(endDate);
      
      return (
        (newStart >= existingStart && newStart <= existingEnd) ||
        (newEnd >= existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      );
    });
  };

  // Export leave history
  const handleExportHistory = () => {
    let csvContent = 'Leave Type,Start Date,End Date,Days,Status,Reason,Submitted Date\n';
    myRequests.forEach(req => {
      csvContent += `${req.leave_type},${req.start_date},${req.end_date},${req.total_days},${req.status},"${req.reason}",${req.created_date}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Leave history exported');
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Leave Management</h1>
          <p className="text-slate-600">Track and manage your leave requests seamlessly</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleExportHistory}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export History
          </Button>
          <Button
            onClick={() => setShowRequestForm(true)}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg gap-2"
          >
            <Plus className="w-4 h-4" />
            Request Leave
          </Button>
        </div>
      </div>

      {/* Alerts for upcoming leaves */}
      {upcomingLeaves.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Calendar className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Upcoming Leave:</strong> {upcomingLeaves[0].leave_type} leave starting {format(new Date(upcomingLeaves[0].start_date), 'MMM dd, yyyy')} ({upcomingLeaves[0].total_days} days)
            {upcomingLeaves.length > 1 && ` • +${upcomingLeaves.length - 1} more`}
          </AlertDescription>
        </Alert>
      )}

      {/* Pending approvals alert (for admins) */}
      {userRole === 'admin' && teamRequests.filter(r => r.status === 'pending').length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong>{teamRequests.filter(r => r.status === 'pending').length} leave requests</strong> are waiting for your approval
          </AlertDescription>
        </Alert>
      )}

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
          title="Approved This Year"
          value={approvedCount}
          icon={CheckCircle}
          bgColor="from-purple-500 to-purple-600"
        />
      </div>

      {/* Leave Balances */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">My Leave Balances</h3>
        {loadingBalances ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : leaveBalances.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No leave balances found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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