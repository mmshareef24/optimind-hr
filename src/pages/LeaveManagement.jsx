import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { Calendar, Plus, TrendingUp, Clock, CheckCircle, XCircle, Users, Filter, Download, History, AlertTriangle, BookOpen } from "lucide-react";
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
import TeamLeaveCalendar from "../components/leave/TeamLeaveCalendar";
import LeaveAnalytics from "../components/leave/LeaveAnalytics";
import LeavePolicy from "../components/leave/LeavePolicy";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { format, isWithinInterval, addDays } from "date-fns";

export default function LeaveManagement() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
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
      
      // Update pending balance for the employee
      const employeeBalances = await base44.entities.LeaveBalance.filter({ 
        employee_id: data.employee_id 
      });
      const balance = employeeBalances.find(b => b.leave_type === data.leave_type);
      
      if (balance) {
        await base44.entities.LeaveBalance.update(balance.id, {
          ...balance,
          pending: balance.pending + data.total_days
        });
      }
      
      return request;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['leave-requests']);
      queryClient.invalidateQueries(['leave-balances']);
      setShowRequestForm(false);
      
      const targetEmployee = employees.find(e => e.id === variables.employee_id);
      if (userRole === 'admin' && targetEmployee && targetEmployee.id !== currentUser?.id) {
        toast.success(t('leave_request_created_for', { name: `${targetEmployee.first_name} ${targetEmployee.last_name}` }));
      } else {
        toast.success(t('leave_request_submitted_success'));
      }
    },
    onError: () => {
      toast.error(t('failed_to_submit_leave_request'));
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
      toast.success(t('leave_request_approved'));
    },
    onError: () => {
      toast.error(t('failed_to_approve_leave_request'));
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
      toast.success(t('leave_request_rejected'));
    },
    onError: () => {
      toast.error(t('failed_to_reject_leave_request'));
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
    toast.success(t('leave_history_exported'));
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('leave_management')}</h1>
          <p className="text-slate-600">{t('leave_management_desc')}</p>
        </div>
        <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            variant="outline"
            onClick={handleExportHistory}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {t('export_history')}
          </Button>
          <Button
            onClick={() => setShowRequestForm(true)}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('request_leave')}
          </Button>
        </div>
      </div>

      {/* Alerts for upcoming leaves */}
      {upcomingLeaves.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Calendar className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>{t('upcoming_leave')}:</strong> {upcomingLeaves[0].leave_type} {t('leave_starting')} {format(new Date(upcomingLeaves[0].start_date), 'MMM dd, yyyy')} ({upcomingLeaves[0].total_days} {t('days')})
            {upcomingLeaves.length > 1 && ` • +${upcomingLeaves.length - 1} ${t('more')}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Pending approvals alert (for admins) */}
      {userRole === 'admin' && teamRequests.filter(r => r.status === 'pending').length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong>{teamRequests.filter(r => r.status === 'pending').length} {t('leave_requests')}</strong> {t('are_waiting_for_approval')}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('days_used')}
          value={totalDaysUsed}
          icon={CheckCircle}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title={t('days_remaining')}
          value={totalDaysRemaining}
          icon={TrendingUp}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title={t('pending_requests')}
          value={pendingCount}
          icon={Clock}
          bgColor="from-amber-500 to-amber-600"
        />
        <StatCard
          title={t('approved_this_year')}
          value={approvedCount}
          icon={CheckCircle}
          bgColor="from-purple-500 to-purple-600"
        />
      </div>

      {/* Leave Balances */}
      <div>
        <h3 className={`text-lg font-semibold text-slate-900 mb-4 ${isRTL ? 'text-right' : ''}`}>{t('my_leave_balances')}</h3>
        {loadingBalances ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : leaveBalances.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">{t('no_leave_balances')}</p>
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
        <TabsList className="bg-white border-2 border-slate-200 p-1 flex-wrap h-auto shadow-sm">
          <TabsTrigger
            value="my-requests"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-emerald-700 data-[state=active]:text-white"
          >
            <History className="w-4 h-4 mr-2" />
            {t('my_requests')}
            {pendingCount > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white text-xs">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          {userRole === 'admin' && (
            <>
              <TabsTrigger
                value="approvals"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {t('approvals')}
                {teamRequests.filter(r => r.status === 'pending').length > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white text-xs">
                    {teamRequests.filter(r => r.status === 'pending').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="team-calendar"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white"
              >
                <Users className="w-4 h-4 mr-2" />
                {t('team_calendar')}
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-indigo-700 data-[state=active]:text-white"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {t('analytics')}
              </TabsTrigger>
            </>
          )}
          <TabsTrigger
            value="calendar"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-teal-700 data-[state=active]:text-white"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {t('my_calendar')}
          </TabsTrigger>
          <TabsTrigger
            value="policy"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-600 data-[state=active]:to-slate-700 data-[state=active]:text-white"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            {t('leave_policies')}
          </TabsTrigger>
        </TabsList>

        {/* My Requests Tab */}
        <TabsContent value="my-requests">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
              <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <History className="w-5 h-5 text-emerald-600" />
                  {t('my_leave_history')} ({myRequests.length})
                </CardTitle>
                
                {/* Filters */}
                <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder={t('all_status')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('all_status')}</SelectItem>
                      <SelectItem value="pending">{t('pending')}</SelectItem>
                      <SelectItem value="approved">{t('approved')}</SelectItem>
                      <SelectItem value="rejected">{t('rejected')}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterLeaveType} onValueChange={setFilterLeaveType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder={t('all_types')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('all_types')}</SelectItem>
                      <SelectItem value="annual">{t('annual')}</SelectItem>
                      <SelectItem value="sick">{t('sick')}</SelectItem>
                      <SelectItem value="emergency">{t('emergency')}</SelectItem>
                      <SelectItem value="unpaid">{t('unpaid')}</SelectItem>
                      <SelectItem value="maternity">{t('maternity')}</SelectItem>
                      <SelectItem value="paternity">{t('paternity')}</SelectItem>
                      <SelectItem value="hajj">{t('hajj')}</SelectItem>
                      <SelectItem value="marriage">{t('marriage')}</SelectItem>
                      <SelectItem value="bereavement">{t('bereavement')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loadingRequests ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
                </div>
              ) : myRequests.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('no_leave_requests')}</h3>
                  <p className="text-slate-500 mb-6">{t('submit_first_request_desc')}</p>
                  <Button onClick={() => setShowRequestForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('submit_your_first_request')}
                  </Button>
                </div>
              ) : filteredMyRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Filter className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">{t('no_requests_match')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMyRequests.map((request) => {
                    const leaveTypeIcons = {
                      annual: '🏖️',
                      sick: '🏥',
                      emergency: '🚨',
                      unpaid: '💼',
                      maternity: '👶',
                      paternity: '👨‍👧',
                      hajj: '🕋',
                      marriage: '💍',
                      bereavement: '🕊️'
                    };

                    return (
                      <Card key={request.id} className="border-2 border-slate-200 hover:shadow-md transition-all">
                        <CardContent className="p-5">
                          <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
                            <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                              <div className={`flex items-center gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <span className="text-2xl">{leaveTypeIcons[request.leave_type] || '📅'}</span>
                                <div className={isRTL ? 'text-right' : ''}>
                                  <h4 className="font-bold text-slate-900 capitalize text-lg">
                                    {t(request.leave_type.replace('_', ' ')) + ' ' + t('leave')}
                                  </h4>
                                  <p className="text-sm text-slate-500">
                                    {t('submitted_on')} {format(new Date(request.created_date), 'MMM dd, yyyy')}
                                  </p>
                                </div>
                                <Badge className={`${isRTL ? 'mr-auto' : 'ml-auto'} ${
                                  request.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                  request.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                  'bg-amber-100 text-amber-700 border-amber-200'
                                }`}>
                                  {request.status === 'approved' && '✓ '}
                                  {request.status === 'rejected' && '✗ '}
                                  {request.status === 'pending' && '⏱ '}
                                  {t(request.status.toUpperCase())}
                                </Badge>
                              </div>

                              <div className="grid md:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg mb-3">
                                <div>
                                  <p className="text-xs text-slate-500 mb-1">{t('start_date')}</p>
                                  <p className="font-semibold text-slate-900">
                                    {format(new Date(request.start_date), 'MMM dd, yyyy')}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 mb-1">{t('end_date')}</p>
                                  <p className="font-semibold text-slate-900">
                                    {format(new Date(request.end_date), 'MMM dd, yyyy')}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 mb-1">{t('duration')}</p>
                                  <p className="font-semibold text-emerald-600 text-lg">
                                    {request.total_days} {t('days')}
                                  </p>
                                </div>
                              </div>

                              {request.reason && (
                                <div className="text-sm bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400 mb-2">
                                  <p className="text-blue-900">
                                    <strong>{t('reason')}:</strong> {request.reason}
                                  </p>
                                </div>
                              )}

                              {request.rejection_reason && (
                                <div className="text-sm bg-red-50 p-3 rounded-lg border-l-4 border-red-400">
                                  <p className="text-red-900">
                                    <strong>❌ {t('rejection_reason')}:</strong> {request.rejection_reason}
                                  </p>
                                </div>
                              )}

                              {request.approval_date && request.status === 'approved' && (
                                <p className="text-xs text-emerald-600 mt-2">
                                  ✓ {t('approved_on')} {format(new Date(request.approval_date), 'MMM dd, yyyy')}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
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

        {/* Team Calendar Tab (Admin) */}
        {userRole === 'admin' && (
          <TabsContent value="team-calendar">
            <div className="space-y-4">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                    >
                      {isRTL ? '→' : '←'} {t('previous')}
                    </Button>
                    <h3 className="text-lg font-semibold">
                      {format(selectedMonth, 'MMMM yyyy')}
                    </h3>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                    >
                      {t('next')} {isRTL ? '←' : '→'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <TeamLeaveCalendar
                leaveRequests={teamRequests}
                employees={employees}
                currentMonth={selectedMonth}
              />
            </div>
          </TabsContent>
        )}

        {/* Analytics Tab (Admin) */}
        {userRole === 'admin' && (
          <TabsContent value="analytics">
            <LeaveAnalytics
              leaveRequests={teamRequests}
              employees={employees}
            />
          </TabsContent>
        )}

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <div className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                  >
                    {isRTL ? '→' : '←'} {t('previous')}
                  </Button>
                  <h3 className="text-lg font-semibold">
                    {format(selectedMonth, 'MMMM yyyy')}
                  </h3>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                  >
                    {t('next')} {isRTL ? '←' : '→'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <LeaveCalendar
              leaveRequests={myRequests}
              currentMonth={selectedMonth}
            />
          </div>
        </TabsContent>

        {/* Leave Policy Tab */}
        <TabsContent value="policy">
          <LeavePolicy />
        </TabsContent>
      </Tabs>

      {/* Leave Request Form Dialog */}
      <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {userRole === 'admin' ? t('create_leave_request_for_employee') : t('submit_leave_request')}
            </DialogTitle>
          </DialogHeader>
          <LeaveRequestForm
            employee={currentUser}
            leaveBalances={leaveBalances}
            onSubmit={handleSubmitRequest}
            onCancel={() => setShowRequestForm(false)}
            isAdmin={userRole === 'admin'}
            allEmployees={employees}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}