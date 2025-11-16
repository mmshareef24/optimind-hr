import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { Users, Calendar, TrendingUp, Clock, Plane, Receipt, CheckCircle, Award, BarChart3, User, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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

export default function MSS() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const queryClient = useQueryClient();

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['current-user-mss'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      setAuthUser(userData);
      const employees = await base44.entities.Employee.list();
      const employee = employees.find(e => e.email === userData.email);
      setCurrentUser(userData);
      setCurrentEmployee(employee);
      return userData;
    }
  });

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const teamMembers = currentEmployee
    ? employees.filter(e => e.manager_id === currentEmployee.id)
    : [];

  const { data: leaveRequests = [], isLoading: loadingLeaves } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: () => base44.entities.LeaveRequest.list('-created_date'),
    enabled: !!currentEmployee
  });

  const { data: profileChangeRequests = [] } = useQuery({
    queryKey: ['profile-change-requests-mss'],
    queryFn: () => base44.entities.ProfileChangeRequest.list('-created_date'),
    enabled: !!currentEmployee
  });

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

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => base44.entities.Attendance.list('-date', 100),
    enabled: !!currentEmployee
  });

  const { data: timesheets = [] } = useQuery({
    queryKey: ['timesheets'],
    queryFn: () => base44.entities.Timesheet.list('-created_date'),
    enabled: !!currentEmployee
  });

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
      toast.success('Leave request approved');
    },
    onError: () => toast.error('Failed to approve leave request')
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
      toast.success('Leave request rejected');
    },
    onError: () => toast.error('Failed to reject leave request')
  });

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
      toast.success('Travel request approved');
    },
    onError: () => toast.error('Failed to approve travel request')
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
      toast.success('Travel request rejected');
    },
    onError: () => toast.error('Failed to reject travel request')
  });

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
      toast.success('Expense claim approved');
    },
    onError: () => toast.error('Failed to approve expense claim')
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
      toast.success('Expense claim rejected');
    },
    onError: () => toast.error('Failed to reject expense claim')
  });

  const approveProfileChange = useMutation({
    mutationFn: async ({ id, notes }) => {
      const request = profileChangeRequests.find(r => r.id === id);
      await base44.entities.Employee.update(request.employee_id, request.requested_data);
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
      toast.success('Profile change approved and applied');
    },
    onError: () => toast.error('Failed to approve profile change')
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
      toast.success('Profile change rejected');
    },
    onError: () => toast.error('Failed to reject profile change')
  });

  const teamMemberIds = teamMembers.map(m => m.id);
  const teamLeaveRequests = leaveRequests.filter(l => teamMemberIds.includes(l.employee_id));
  const teamProfileChangeRequests = profileChangeRequests.filter(r => teamMemberIds.includes(r.employee_id));
  const teamAttendance = attendance.filter(a => teamMemberIds.includes(a.employee_id));
  const teamPerformanceReviews = performanceReviews.filter(r => teamMemberIds.includes(r.employee_id));
  const teamPerformanceGoals = performanceGoals.filter(g => teamMemberIds.includes(g.employee_id));
  const teamTravelRequests = travelRequests.filter(t => teamMemberIds.includes(t.employee_id));
  const teamExpenseClaims = expenseClaims.filter(e => teamMemberIds.includes(e.employee_id));

  const pendingLeaves = teamLeaveRequests.filter(l => l.status === 'pending').length;
  const pendingProfileChanges = teamProfileChangeRequests.filter(r => r.status === 'pending').length;
  const pendingTravel = teamTravelRequests.filter(t => t.status === 'pending').length;
  const pendingExpenses = teamExpenseClaims.filter(e => e.status === 'submitted' || e.status === 'under_review').length;
  const teamSize = teamMembers.length;

  const recentAttendance = teamAttendance.slice(0, teamSize * 30);
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
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">No Employee Record Found</h2>
            <p className="text-lg text-slate-700 mb-6">Your account ({authUser?.email}) is not linked to an employee record.</p>
            
            <div className="max-w-md mx-auto bg-white rounded-xl p-6 shadow-md mb-6">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center justify-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                What to do next:
              </h3>
              <ul className="text-sm text-left space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  <span>Contact your HR department to create your employee profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  <span>Ensure your email (<strong>{authUser?.email}</strong>) matches your employee record</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  <span>Once your profile is created, refresh this page to access MSS</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
              >
                Refresh Page
              </Button>
              <Button 
                variant="outline"
                onClick={() => base44.auth.logout()}
              >
                Logout
              </Button>
            </div>
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
      <div className={isRTL ? 'text-right' : ''}>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('manager_self_service')}</h1>
        <p className="text-slate-600">{t('manage_your_team')} {teamSize} {teamSize !== 1 ? t('members') : t('member')}</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('team_size')} value={teamSize} icon={Users} bgColor="from-blue-500 to-blue-600" />
        <StatCard
          title={t('pending_approvals')}
          value={pendingLeaves + pendingTravel + pendingExpenses + pendingProfileChanges}
          icon={CheckCircle}
          bgColor="from-amber-500 to-amber-600"
        />
        <StatCard title={t('attendance_rate')} value={`${attendanceRate}%`} icon={Clock} bgColor="from-emerald-500 to-emerald-600" />
        <StatCard
          title={t('active_goals')}
          value={teamPerformanceGoals.filter(g => g.status === 'in_progress').length}
          icon={Award}
          bgColor="from-purple-500 to-purple-600"
        />
      </div>

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

        <TabsContent value="overview">
          <TeamOverview
            teamMembers={teamMembers}
            leaveRequests={teamLeaveRequests}
            attendance={teamAttendance}
            performanceGoals={teamPerformanceGoals}
            performanceReviews={teamPerformanceReviews}
          />
        </TabsContent>

        <TabsContent value="team">
          <TeamMembersList
            teamMembers={teamMembers}
            attendance={teamAttendance}
            leaveRequests={teamLeaveRequests}
            performanceGoals={teamPerformanceGoals}
          />
        </TabsContent>

        <TabsContent value="leave-approvals">
          <LeaveApprovals
            leaveRequests={teamLeaveRequests}
            employees={teamMembers}
            onApprove={(id, notes) => approveLeave.mutate({ id, notes })}
            onReject={(id, notes) => rejectLeave.mutate({ id, notes })}
          />
        </TabsContent>

        <TabsContent value="profile-approvals">
          <ProfileChangeApprovals
            requests={teamProfileChangeRequests}
            employees={teamMembers}
            onApprove={(id, notes) => approveProfileChange.mutate({ id, notes })}
            onReject={(id, notes) => rejectProfileChange.mutate({ id, notes })}
          />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceManagement
            teamMembers={teamMembers}
            performanceGoals={teamPerformanceGoals}
            performanceReviews={teamPerformanceReviews}
            managerId={currentEmployee.id}
          />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceMonitor
            teamMembers={teamMembers}
            attendance={teamAttendance}
            timesheets={timesheets}
          />
        </TabsContent>

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