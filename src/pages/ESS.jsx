
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { User, FileText, Settings, BookOpen, Calendar, Clock, TrendingUp, AlertCircle, DollarSign, Plane, Mail, Gift, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StatCard from "../components/hrms/StatCard";
import PayslipViewer from "../components/ess/PayslipViewer";
import CompanyPolicies from "../components/ess/CompanyPolicies";
import LeaveRequestsESS from "../components/ess/LeaveRequestsESS";
import LoanRequestsESS from "../components/ess/LoanRequestsESS";
import LetterRequestsESS from "../components/ess/LetterRequestsESS";
import TravelRequestsESS from "../components/ess/TravelRequestsESS";
import MyProfile from "../components/ess/MyProfile";
import MyBenefits from "../components/ess/MyBenefits";
import NewHirePortal from "../components/onboarding/NewHirePortal";
import ClockInOut from "../components/time/ClockInOut";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ESS() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['current-user-ess'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      const employees = await base44.entities.Employee.list();
      const employee = employees.find(e => e.email === userData.email);
      setCurrentUser(employee);
      return employee;
    }
  });

  const { data: payrolls = [], isLoading: loadingPayrolls } = useQuery({
    queryKey: ['my-payrolls', currentUser?.id],
    queryFn: () => base44.entities.Payroll.filter({ employee_id: currentUser.id }, '-month'),
    enabled: !!currentUser?.id
  });

  const { data: leaveBalances = [] } = useQuery({
    queryKey: ['my-leave-balances', currentUser?.id],
    queryFn: () => base44.entities.LeaveBalance.filter({ 
      employee_id: currentUser.id,
      year: new Date().getFullYear()
    }),
    enabled: !!currentUser?.id
  });

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['my-leaves', currentUser?.id],
    queryFn: () => base44.entities.LeaveRequest.filter({ employee_id: currentUser.id }, '-created_date'),
    enabled: !!currentUser?.id
  });

  const { data: loanRequests = [] } = useQuery({
    queryKey: ['my-loans', currentUser?.id],
    queryFn: () => base44.entities.LoanRequest.filter({ employee_id: currentUser.id }, '-created_date'),
    enabled: !!currentUser?.id
  });

  const { data: travelRequests = [] } = useQuery({
    queryKey: ['my-travel', currentUser?.id],
    queryFn: () => base44.entities.TravelRequest.filter({ employee_id: currentUser.id }, '-created_date'),
    enabled: !!currentUser?.id
  });

  const { data: policies = [], isLoading: loadingPolicies } = useQuery({
    queryKey: ['company-policies'],
    queryFn: () => base44.entities.CompanyPolicy.filter({ is_active: true }, '-created_date')
  });

  const { data: essRequests = [] } = useQuery({
    queryKey: ['my-ess-requests', currentUser?.id],
    queryFn: () => base44.entities.ESSRequest.filter({ employee_id: currentUser.id }, '-created_date'),
    enabled: !!currentUser?.id
  });

  const { data: profileChangeRequests = [] } = useQuery({
    queryKey: ['profile-change-requests', currentUser?.id],
    queryFn: () => base44.entities.ProfileChangeRequest.filter({ employee_id: currentUser.id }, '-created_date'),
    enabled: !!currentUser?.id
  });

  const { data: onboardingTasks = [] } = useQuery({
    queryKey: ['my-onboarding-tasks', currentUser?.id],
    queryFn: () => base44.entities.OnboardingTask.filter({ 
      employee_id: currentUser.id,
      assigned_to: 'new_hire'
    }, '-day_number'),
    enabled: !!currentUser?.id
  });

  const { data: todayAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: ['my-attendance-today', currentUser?.id],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const attendance = await base44.entities.Attendance.filter({ 
        employee_id: currentUser.id,
        date: today
      });
      return attendance[0] || null;
    },
    enabled: !!currentUser?.id
  });

  const { data: myShift } = useQuery({
    queryKey: ['my-shift', currentUser?.id],
    queryFn: async () => {
      const assignments = await base44.entities.ShiftAssignment.filter({
        employee_id: currentUser.id,
        status: 'active'
      });
      if (assignments.length === 0) return null;
      
      const shifts = await base44.entities.Shift.list();
      return shifts.find(s => s.id === assignments[0].shift_id);
    },
    enabled: !!currentUser?.id
  });

  const clockInMutation = useMutation({
    mutationFn: (data) => base44.entities.Attendance.create(data),
    onSuccess: () => {
      refetchAttendance();
      toast.success('Clocked in successfully!');
    },
    onError: () => toast.error('Failed to clock in')
  });

  const clockOutMutation = useMutation({
    mutationFn: (data) => base44.entities.Attendance.update(data.id, data),
    onSuccess: () => {
      refetchAttendance();
      toast.success('Clocked out successfully!');
    },
    onError: () => toast.error('Failed to clock out')
  });

  const breakStartMutation = useMutation({
    mutationFn: (data) => base44.entities.Attendance.update(data.id, data),
    onSuccess: () => {
      refetchAttendance();
      toast.success('Break started');
    },
    onError: () => toast.error('Failed to start break')
  });

  const breakEndMutation = useMutation({
    mutationFn: (data) => base44.entities.Attendance.update(data.id, data),
    onSuccess: () => {
      refetchAttendance();
      toast.success('Break ended');
    },
    onError: () => toast.error('Failed to end break')
  });

  const totalLeaveBalance = leaveBalances.reduce((sum, lb) => sum + (lb.remaining || 0), 0);
  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending').length;
  const pendingLoans = loanRequests.filter(l => l.status === 'pending').length;
  const pendingTravel = travelRequests.filter(t => t.status === 'pending').length;
  const pendingLetters = essRequests.filter(r => 
    (r.request_type === 'salary_certificate' || r.request_type === 'employment_letter') && 
    r.status === 'pending'
  ).length;
  const totalPendingRequests = pendingLeaves + pendingLoans + pendingTravel + pendingLetters;
  const lastPayroll = payrolls[0];
  
  const isNewHire = currentUser && (() => {
    const hireDate = new Date(currentUser.hire_date);
    const now = new Date();
    const daysSinceHire = Math.floor((now - hireDate) / (1000 * 60 * 60 * 24));
    return daysSinceHire <= 90;
  })();
  
  const pendingOnboardingTasks = onboardingTasks.filter(t => t.status !== 'completed').length;

  if (loadingUser) {
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

  if (!currentUser) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-amber-600" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('no_employee_record')}</h2>
            <p className="text-slate-600 mb-4">{t('contact_hr')}</p>
            <p className="text-sm text-slate-500">Please contact HR department to set up your employee profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {t('ess_welcome')}, {currentUser.first_name}!
          </h1>
          <p className="text-slate-600">{t('your_ess_portal')}</p>
        </div>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-left' : 'text-right'}>
            <p className="text-sm text-slate-500">{t('employee_id')}</p>
            <p className="font-semibold text-slate-900">{currentUser.employee_id}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg">
            <User className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('current_salary')}
          value={lastPayroll ? `${lastPayroll.net_salary?.toLocaleString()} SAR` : 'N/A'}
          icon={TrendingUp}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title={t('leave_balance')}
          value={`${totalLeaveBalance} ${t('days')}`}
          icon={Calendar}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title={t('pending_requests_count')}
          value={totalPendingRequests}
          icon={Clock}
          bgColor="from-amber-500 to-amber-600"
        />
        <StatCard
          title={t('available_policies')}
          value={policies.length}
          icon={BookOpen}
          bgColor="from-purple-500 to-purple-600"
        />
      </div>

      {/* Pending Requests Alert */}
      {totalPendingRequests > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Clock className="w-5 h-5 text-amber-600" />
              <div className={isRTL ? 'text-right' : ''}>
                <p className="font-semibold text-amber-900">
                  {t('you_have_pending')} {totalPendingRequests} {totalPendingRequests > 1 ? t('pending_requests_plural') : t('pending_request')}
                </p>
                <p className="text-sm text-amber-700">
                  {pendingLeaves > 0 && `${pendingLeaves} ${t('leave')} • `}
                  {pendingLoans > 0 && `${pendingLoans} ${t('loans')} • `}
                  {pendingTravel > 0 && `${pendingTravel} ${t('travel')} • `}
                  {pendingLetters > 0 && `${pendingLetters} ${t('letters')}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Summary */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 via-blue-50 to-white">
        <CardContent className="p-6">
          <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {currentUser.first_name} {currentUser.last_name}
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">{t('position')}:</span>
                  <span className="ml-2 font-semibold text-slate-900">{currentUser.job_title || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500">{t('department')}:</span>
                  <span className="ml-2 font-semibold text-slate-900">{currentUser.department || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500">{t('status')}:</span>
                  <Badge className={
                    currentUser.status === 'active' ? 'ml-2 bg-emerald-100 text-emerald-700 border-emerald-200' :
                    'ml-2 bg-slate-100 text-slate-700 border-slate-200'
                  }>
                    {currentUser.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue={isNewHire && onboardingTasks.length > 0 ? "onboarding" : "dashboard"} className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 flex-wrap h-auto">
          {isNewHire && onboardingTasks.length > 0 && (
            <TabsTrigger value="onboarding" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              {t('my_onboarding')}
              {pendingOnboardingTasks > 0 && (
                <Badge className="ml-2 bg-amber-500 text-white text-xs">{pendingOnboardingTasks}</Badge>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <TrendingUp className="w-4 h-4 mr-2" />
            {t('dashboard')}
          </TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Clock className="w-4 h-4 mr-2" />
            {t('clock_in_out')}
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <User className="w-4 h-4 mr-2" />
            {t('my_profile')}
          </TabsTrigger>
          <TabsTrigger value="benefits" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Gift className="w-4 h-4 mr-2" />
            {t('benefits')}
          </TabsTrigger>
          <TabsTrigger value="leave" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Calendar className="w-4 h-4 mr-2" />
            {t('leave')}
            {pendingLeaves > 0 && <Badge className="ml-1 bg-amber-500 text-white text-xs">{pendingLeaves}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="loan" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <DollarSign className="w-4 h-4 mr-2" />
            {t('loans')}
            {pendingLoans > 0 && <Badge className="ml-1 bg-amber-500 text-white text-xs">{pendingLoans}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="travel" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Plane className="w-4 h-4 mr-2" />
            {t('travel')}
            {pendingTravel > 0 && <Badge className="ml-1 bg-amber-500 text-white text-xs">{pendingTravel}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="letters" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <Mail className="w-4 h-4 mr-2" />
            {t('letters')}
            {pendingLetters > 0 && <Badge className="ml-1 bg-amber-500 text-white text-xs">{pendingLetters}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="payslips" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <FileText className="w-4 h-4 mr-2" />
            {t('payslips')}
          </TabsTrigger>
          <TabsTrigger value="policies" className="data-[state=active]:bg-slate-600 data-[state=active]:text-white">
            <BookOpen className="w-4 h-4 mr-2" />
            {t('policies')}
          </TabsTrigger>
        </TabsList>

        {isNewHire && onboardingTasks.length > 0 && (
          <TabsContent value="onboarding">
            <NewHirePortal
              employee={currentUser}
              tasks={onboardingTasks}
            />
          </TabsContent>
        )}

        <TabsContent value="attendance">
          <ClockInOut
            employee={currentUser}
            todayAttendance={todayAttendance}
            shift={myShift}
            onClockIn={(data) => clockInMutation.mutate(data)}
            onClockOut={(data) => clockOutMutation.mutate(data)}
            onBreakStart={(data) => breakStartMutation.mutate(data)}
            onBreakEnd={(data) => breakEndMutation.mutate(data)}
          />
        </TabsContent>

        <TabsContent value="dashboard">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className={`text-lg font-semibold text-slate-900 mb-4 ${isRTL ? 'text-right' : ''}`}>{t('quick_actions')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2"
                    onClick={() => document.querySelector('[value="leave"]').click()}
                  >
                    <Calendar className="w-6 h-6 text-blue-600" />
                    <span className="text-sm">{t('request_leave_action')}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2"
                    onClick={() => document.querySelector('[value="loan"]').click()}
                  >
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                    <span className="text-sm">{t('request_loan')}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2"
                    onClick={() => document.querySelector('[value="travel"]').click()}
                  >
                    <Plane className="w-6 h-6 text-purple-600" />
                    <span className="text-sm">{t('travel_request')}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2"
                    onClick={() => document.querySelector('[value="letters"]').click()}
                  >
                    <Mail className="w-6 h-6 text-amber-600" />
                    <span className="text-sm">{t('request_letter')}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className={`text-lg font-semibold text-slate-900 mb-4 ${isRTL ? 'text-right' : ''}`}>{t('recent_requests')}</h3>
                <div className="space-y-3">
                  {[...leaveRequests.slice(0, 2), ...loanRequests.slice(0, 2), ...travelRequests.slice(0, 1)]
                    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                    .slice(0, 5)
                    .map((req, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-3 border rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={isRTL ? 'text-right' : ''}>
                          <p className="text-sm font-medium text-slate-900">
                            {req.leave_type ? t('leave_request') : req.loan_type ? t('loan_request') : t('travel_request')}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(req.created_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={
                          req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-700'
                        }>
                          {req.status}
                        </Badge>
                      </div>
                    ))}
                  {[...leaveRequests, ...loanRequests, ...travelRequests].length === 0 && (
                    <p className="text-center py-8 text-slate-500">{t('no_recent_requests')}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <MyProfile employee={currentUser} changeRequests={profileChangeRequests} />
        </TabsContent>

        <TabsContent value="benefits">
          <MyBenefits employee={currentUser} />
        </TabsContent>

        <TabsContent value="leave">
          <LeaveRequestsESS
            employee={currentUser}
            leaveRequests={leaveRequests}
            leaveBalances={leaveBalances}
          />
        </TabsContent>

        <TabsContent value="loan">
          <LoanRequestsESS
            employee={currentUser}
            loanRequests={loanRequests}
          />
        </TabsContent>

        <TabsContent value="travel">
          <TravelRequestsESS
            employee={currentUser}
            travelRequests={travelRequests}
          />
        </TabsContent>

        <TabsContent value="letters">
          <LetterRequestsESS
            employee={currentUser}
            letterRequests={essRequests.filter(r => 
              r.request_type === 'salary_certificate' || r.request_type === 'employment_letter'
            )}
          />
        </TabsContent>

        <TabsContent value="payslips">
          <PayslipViewer
            employee={currentUser}
            payrolls={payrolls}
            isLoading={loadingPayrolls}
          />
        </TabsContent>

        <TabsContent value="policies">
          <CompanyPolicies
            policies={policies}
            isLoading={loadingPolicies}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
