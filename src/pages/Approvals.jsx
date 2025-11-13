
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plane, DollarSign, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import LeaveApprovalsPanel from "../components/approvals/LeaveApprovalsPanel";
import TravelApprovalsPanel from "../components/approvals/TravelApprovalsPanel";
import LoanApprovalsPanel from "../components/approvals/LoanApprovalsPanel";
import StatCard from "../components/hrms/StatCard";

export default function Approvals() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);

  // Fetch current user and their employee record
  const { isLoading: loadingUser } = useQuery({
    queryKey: ['current-user-approvals'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      setCurrentUser(userData);
      
      const employees = await base44.entities.Employee.list();
      const employee = employees.find(e => e.email === userData.email);
      setCurrentEmployee(employee);
      
      return userData;
    }
  });

  // Fetch all employees to enrich requests with employee names
  const { data: allEmployees = [] } = useQuery({
    queryKey: ['all-employees-approvals'],
    queryFn: () => base44.entities.Employee.list()
  });

  // Fetch pending leave requests using secure backend
  const { data: leaveRequestsData, isLoading: loadingLeaves } = useQuery({
    queryKey: ['leave-requests-approvals'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getFilteredLeaveRequests', {
        filters: { status: 'pending' }
      });
      return response.data;
    },
    enabled: !!currentUser
  });
  const leaveRequests = leaveRequestsData?.leave_requests || [];

  // Fetch pending travel requests using secure backend
  const { data: travelRequestsData, isLoading: loadingTravels } = useQuery({
    queryKey: ['travel-requests-approvals'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getFilteredTravelRequests', {
        filters: { status: 'pending' }
      });
      return response.data;
    },
    enabled: !!currentUser
  });
  const travelRequests = travelRequestsData?.travel_requests || [];

  // Fetch pending loan requests using secure backend
  const { data: loanRequestsData, isLoading: loadingLoans } = useQuery({
    queryKey: ['loan-requests-approvals'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getFilteredLoanRequests', {
        filters: { status: 'pending' }
      });
      return response.data;
    },
    enabled: !!currentUser
  });
  const loanRequests = loanRequestsData?.loan_requests || [];

  // Filter based on current user role and approval stage
  const myLeaveApprovals = leaveRequests.filter(leave => {
    if (currentUser?.role === 'admin') {
      return leave.current_approver_role === 'hr';
    }
    return leave.current_approver_role === 'manager';
  });

  const myTravelApprovals = travelRequests.filter(travel => {
    if (currentUser?.role === 'admin') {
      return travel.current_approver_role === 'finance';
    }
    return travel.current_approver_role === 'manager';
  });

  const myLoanApprovals = loanRequests.filter(loan => {
    if (currentUser?.role === 'admin') {
      return loan.current_approver_role === 'hr' || loan.current_approver_role === 'senior_management';
    }
    return loan.current_approver_role === 'manager';
  });

  const totalPendingApprovals = myLeaveApprovals.length + myTravelApprovals.length + myLoanApprovals.length;

  if (loadingUser) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
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
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('access_restricted')}</h2>
            <p className="text-slate-600">{t('no_permission_approvals')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className={isRTL ? 'text-right' : ''}>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('approvals_dashboard')}</h1>
        <p className="text-slate-600">
          {currentUser.role === 'admin' ? t('hr_finance_approvals') : t('manager_approvals')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard
          title={t('leave_requests')}
          value={myLeaveApprovals.length}
          icon={Calendar}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title={t('travel_requests')}
          value={myTravelApprovals.length}
          icon={Plane}
          bgColor="from-purple-500 to-purple-600"
        />
        <StatCard
          title={t('loan_requests')}
          value={myLoanApprovals.length}
          icon={DollarSign}
          bgColor="from-emerald-500 to-emerald-600"
        />
      </div>

      {/* Alert for pending approvals */}
      {totalPendingApprovals > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div className={isRTL ? 'text-right' : ''}>
                <p className="font-semibold text-amber-900">
                  {t('you_have_pending')} {totalPendingApprovals} {totalPendingApprovals > 1 ? t('pending_approvals_plural') : t('pending_approval')}
                </p>
                <p className="text-sm text-amber-700">
                  {myLeaveApprovals.length > 0 && `${myLeaveApprovals.length} ${t('leave')} • `}
                  {myTravelApprovals.length > 0 && `${myTravelApprovals.length} ${t('travel')} • `}
                  {myLoanApprovals.length > 0 && `${myLoanApprovals.length} ${t('loans')}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Tabs */}
      <Tabs defaultValue="leave" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 grid grid-cols-3">
          <TabsTrigger 
            value="leave" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white relative"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {t('leave')}
            {myLeaveApprovals.length > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white">{myLeaveApprovals.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="travel" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white relative"
          >
            <Plane className="w-4 h-4 mr-2" />
            {t('travel')}
            {myTravelApprovals.length > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white">{myTravelApprovals.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="loan" 
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white relative"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            {t('loans')}
            {myLoanApprovals.length > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white">{myLoanApprovals.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leave">
          <LeaveApprovalsPanel
            pendingLeaves={myLeaveApprovals}
            userRole={currentUser.role}
            currentEmployeeId={currentEmployee?.id}
          />
        </TabsContent>

        <TabsContent value="travel">
          <TravelApprovalsPanel
            pendingTravels={myTravelApprovals}
            userRole={currentUser.role}
          />
        </TabsContent>

        <TabsContent value="loan">
          <LoanApprovalsPanel
            pendingLoans={myLoanApprovals}
            userRole={currentUser.role}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
