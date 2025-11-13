
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Calendar, TrendingUp, Clock, Plane, Receipt, CheckCircle, Award, BarChart3, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import StatCard from "../components/hrms/StatCard";
import TeamOverview from "../components/mss/TeamOverview";
import TeamMembersList from "../components/mss/TeamMembersList";
import LeaveApprovals from "../components/mss/LeaveApprovals";
import PerformanceManagement from "../components/mss/PerformanceManagement";
import AttendanceMonitor from "../components/mss/AttendanceMonitor";
import TravelExpenseApprovals from "../components/mss/TravelExpenseApprovals";
import ProfileChangeApprovals from "../components/mss/ProfileChangeApprovals";
import TeamAnalytics from "../components/mss/TeamAnalytics";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function MSS() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const queryClient = useQueryClient();

  // Fetch current user and employee
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['current-user-mss'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      const employees = await base44.entities.Employee.list();
      const employee = employees.find(e => e.email === userData.email);
      setCurrentUser(userData);
      setCurrentEmployee(employee);
      return userData;
    }
  });

  // Fetch all employees
  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  // Fetch team members (direct reports)
  const teamMembers = currentEmployee
    ? employees.filter(e => e.manager_id === currentEmployee.id)
    : [];

  // Fetch leave requests
  const { data: leaveRequests = [], isLoading: loadingLeaves } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: () => base44.entities.LeaveRequest.list('-created_date'),
    enabled: !!currentEmployee
  });

  // Fetch profile change requests
  const { data: profileChangeRequests = [] } = useQuery({
    queryKey: ['profile-change-requests-mss'],
    queryFn: () => base44.entities.ProfileChangeRequest.list('-created_date'),
    enabled: !!currentEmployee
  });

  // Fetch performance data
  const { data: performanceReviews = [] } = useQuery({
    queryKey: ['performance-reviews'],
    queryFn: () => base44.entities.PerformanceReview.list('-created_date'),
    enabled: !!currentEmployee
  });

  const { data: performanceGoals = [] } = useQuery({
    queryKey: ['performance-goals'],
    queryFn: () => base44.entities.PerformanceGoal.list('-created_date'),
    enabled: !!currentEmployee
  });

  // Fetch attendance
  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => base44.entities.Attendance.list('-date', 100),
    enabled: !!currentEmployee
  });

  // Fetch timesheets
  const { data: timesheets = [] } = useQuery({
    queryKey: ['timesheets'],
    queryFn: () => base44.entities.Timesheet.list('-created_date'),
    enabled: !!currentEmployee
  });

  // Fetch travel & expense
  const { data: travelRequests = [] } = useQuery({
    queryKey: ['travel-requests-mss'],
    queryFn: () => base44.entities.TravelRequest.list('-created_date'),
    enabled: !!currentEmployee
  });

  const { data: expenseClaims = [] } = useQuery({
    queryKey: ['expense-claims-mss'],
    queryFn: () => base44.entities.ExpenseClaim.list('-created_date'),
    enabled: !!currentEmployee
  });

  // Mutations for Leave Approvals
  const approveLeave = useMutation({
    mutationFn: async ({ id, notes }) => {
      const leave = leaveRequests.find(l => l.id === id);
      return base44.entities.LeaveRequest.update(id, {
        ...leave,
        status: 'approved',
        approved_by: currentEmployee.id,
        approval_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leave-requests']);
      toast.success(t('leave_request_approved'));
    },
    onError: () => toast.error(t('failed_to_approve_leave_request'))
  });

  const rejectLeave = useMutation({
    mutationFn: async ({ id, notes }) => {
      const leave = leaveRequests.find(l => l.id === id);
      return base44.entities.LeaveRequest.update(id, {
        ...leave,
        status: 'rejected',
        approved_by: currentEmployee.id,
        approval_date: new Date().toISOString().split('T')[0],
        rejection_reason: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leave-requests']);
      toast.success(t('leave_request_rejected'));
    },
    onError: () => toast.error(t('failed_to_reject_leave_request'))
  });

  // Mutations for Travel Approvals
  const approveTravel = useMutation({
    mutationFn: async ({ id }) => {
      const travel = travelRequests.find(t => t.id === id);
      return base44.entities.TravelRequest.update(id, {
        ...travel,
        status: 'approved',
        approved_by: currentEmployee.id,
        approval_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['travel-requests-mss']);
      toast.success(t('travel_request_approved'));
    },
    onError: () => toast.error(t('failed_to_approve_travel_request'))
  });

  const rejectTravel = useMutation({
    mutationFn: async ({ id, notes }) => {
      const travel = travelRequests.find(t => t.id === id);
      return base44.entities.TravelRequest.update(id, {
        ...travel,
        status: 'rejected',
        approved_by: currentEmployee.id,
        approval_date: new Date().toISOString().split('T')[0],
        rejection_reason: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['travel-requests-mss']);
      toast.success(t('travel_request_rejected'));
    },
    onError: () => toast.error(t('failed_to_reject_travel_request'))
  });

  // Mutations for Expense Approvals
  const approveExpense = useMutation({
    mutationFn: async ({ id }) => {
      const expense = expenseClaims.find(e => e.id === id);
      return base44.entities.ExpenseClaim.update(id, {
        ...expense,
        status: 'approved',
        approved_by: currentEmployee.id,
        approval_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['expense-claims-mss']);
      toast.success(t('expense_claim_approved'));
    },
    onError: () => toast.error(t('failed_to_approve_expense_claim'))
  });

  const rejectExpense = useMutation({
    mutationFn: async ({ id, notes }) => {
      const expense = expenseClaims.find(e => e.id === id);
      return base44.entities.ExpenseClaim.update(id, {
        ...expense,
        status: 'rejected',
        approved_by: currentEmployee.id,
        approval_date: new Date().toISOString().split('T')[0],
        rejection_reason: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['expense-claims-mss']);
      toast.success(t('expense_claim_rejected'));
    },
    onError: () => toast.error(t('failed_to_reject_expense_claim'))
  });

  // Mutations for Profile Change Approvals
  const approveProfileChange = useMutation({
    mutationFn: async ({ id, notes }) => {
      const request = profileChangeRequests.find(r => r.id === id);
      // Update the employee record with the new data
      await base44.entities.Employee.update(request.employee_id, request.requested_data);
      // Mark the request as approved
      return base44.entities.ProfileChangeRequest.update(id, {
        ...request,
        status: 'approved',
        reviewed_by: currentEmployee.id,
        review_date: new Date().toISOString().split('T')[0],
        review_notes: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile-change-requests-mss']);
      queryClient.invalidateQueries(['employees']);
      toast.success(t('profile_change_approved_and_applied'));
    },
    onError: () => toast.error(t('failed_to_approve_profile_change'))
  });

  const rejectProfileChange = useMutation({
    mutationFn: async ({ id, notes }) => {
      const request = profileChangeRequests.find(r => r.id === id);
      return base44.entities.ProfileChangeRequest.update(id, {
        ...request,
        status: 'rejected',
        reviewed_by: currentEmployee.id,
        review_date: new Date().toISOString().split('T')[0],
        review_notes: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile-change-requests-mss']);
      toast.success(t('profile_change_rejected'));
    },
    onError: () => toast.error(t('failed_to_reject_profile_change'))
  });

  // Filter data for team
  const teamMemberIds = teamMembers.map(m => m.id);
  const teamLeaveRequests = leaveRequests.filter(l => teamMemberIds.includes(l.employee_id));
  const teamProfileChangeRequests = profileChangeRequests.filter(r => teamMemberIds.includes(r.employee_id));
  const teamAttendance = attendance.filter(a => teamMemberIds.includes(a.employee_id));
  const teamPerformanceReviews = performanceReviews.filter(r => teamMemberIds.includes(r.employee_id));
  const teamPerformanceGoals = performanceGoals.filter(g => teamMemberIds.includes(g.employee_id));
  const teamTravelRequests = travelRequests.filter(t => teamMemberIds.includes(t.employee_id));
  const teamExpenseClaims = expenseClaims.filter(e => teamMemberIds.includes(e.employee_id));

  // Calculate statistics
  const pendingLeaves = teamLeaveRequests.filter(l => l.status === 'pending').length;
  const pendingProfileChanges = teamProfileChangeRequests.filter(r => r.status === 'pending').length;
  const pendingTravel = teamTravelRequests.filter(t => t.status === 'pending').length;
  const pendingExpenses = teamExpenseClaims.filter(e => e.status === 'submitted' || e.status === 'under_review').length;
  const teamSize = teamMembers.length;

  // Calculate team attendance rate
  const recentAttendance = teamAttendance.slice(0, teamSize * 30); // Last 30 days
  const presentCount = recentAttendance.filter(a => a.status === 'present').length;
  const attendanceRate = recentAttendance.length > 0
    ? Math.round((presentCount / recentAttendance.length) * 100)
    : 0;

  if (loadingUser || loadingEmployees) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!currentEmployee) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-amber-600" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('no_employee_record')}</h2>
            <p className="text-slate-600">{t('contact_hr')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('no_team_members')}</h2>
            <p className="text-slate-600 mb-4">{t('no_direct_reports')}</p>
            <p className="text-sm text-slate-500">{t('once_assigned')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className={isRTL ? 'text-right' : ''}>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('manager_self_service')}</h1>
        <p className="text-slate-600">{t('manage_your_team')} {teamSize} {teamSize !== 1 ? t('members') : t('member')}</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('team_size')}
          value={teamSize}
          icon={Users}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title={t('pending_approvals')}
          value={pendingLeaves + pendingTravel + pendingExpenses + pendingProfileChanges}
          icon={CheckCircle}
          bgColor="from-amber-500 to-amber-600"
        />
        <StatCard
          title={t('attendance_rate')}
          value={`${attendanceRate}%`}
          icon={Clock}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title={t('active_goals')}
          value={teamPerformanceGoals.filter(g => g.status === 'in_progress').length}
          icon={Award}
          bgColor="from-purple-500 to-purple-600"
        />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 flex-wrap h-auto">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            {t('overview')}
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            {t('team_members_tab')}
          </TabsTrigger>
          <TabsTrigger value="leave-approvals" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Calendar className="w-4 h-4 mr-2" />
            {t('leave')}
            {pendingLeaves > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                {pendingLeaves}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="profile-approvals" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <User className="w-4 h-4 mr-2" />
            {t('profile_changes')}
            {pendingProfileChanges > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                {pendingProfileChanges}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <TrendingUp className="w-4 h-4 mr-2" />
            {t('performance')}
          </TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Clock className="w-4 h-4 mr-2" />
            {t('attendance')}
          </TabsTrigger>
          <TabsTrigger value="travel-expense" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Plane className="w-4 h-4 mr-2" />
            {t('travel_expense')}
            {(pendingTravel + pendingExpenses) > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                {pendingTravel + pendingExpenses}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <TeamOverview
            teamMembers={teamMembers}
            leaveRequests={teamLeaveRequests}
            attendance={teamAttendance}
            performanceGoals={teamPerformanceGoals}
            performanceReviews={teamPerformanceReviews}
          />
        </TabsContent>

        {/* Team Members Tab */}
        <TabsContent value="team">
          <TeamMembersList
            teamMembers={teamMembers}
            attendance={teamAttendance}
            leaveRequests={teamLeaveRequests}
            performanceGoals={teamPerformanceGoals}
          />
        </TabsContent>

        {/* Leave Approvals Tab */}
        <TabsContent value="leave-approvals">
          <LeaveApprovals
            leaveRequests={teamLeaveRequests}
            employees={teamMembers}
            onApprove={(id, notes) => approveLeave.mutate({ id, notes })}
            onReject={(id, notes) => rejectLeave.mutate({ id, notes })}
          />
        </TabsContent>

        {/* Profile Change Approvals Tab */}
        <TabsContent value="profile-approvals">
          <ProfileChangeApprovals
            requests={teamProfileChangeRequests}
            employees={teamMembers}
            onApprove={(id, notes) => approveProfileChange.mutate({ id, notes })}
            onReject={(id, notes) => rejectProfileChange.mutate({ id, notes })}
          />
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <PerformanceManagement
            teamMembers={teamMembers}
            performanceGoals={teamPerformanceGoals}
            performanceReviews={teamPerformanceReviews}
            managerId={currentEmployee.id}
          />
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <AttendanceMonitor
            teamMembers={teamMembers}
            attendance={teamAttendance}
            timesheets={timesheets}
          />
        </TabsContent>

        {/* Travel & Expense Tab */}
        <TabsContent value="travel-expense">
          <TravelExpenseApprovals
            teamMembers={teamMembers}
            travelRequests={teamTravelRequests}
            expenseClaims={teamExpenseClaims}
            onApproveTravel={(id) => approveTravel.mutate({ id })}
            onRejectTravel={(id, notes) => rejectTravel.mutate({ id, notes })}
            onApproveExpense={(id) => approveExpense.mutate({ id })}
            onRejectExpense={(id, notes) => rejectExpense.mutate({ id, notes })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
