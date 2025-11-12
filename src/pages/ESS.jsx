import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { User, FileText, Settings, BookOpen, Calendar, Clock, TrendingUp, AlertCircle, DollarSign, Plane, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StatCard from "../components/hrms/StatCard";
import PayslipViewer from "../components/ess/PayslipViewer";
import PersonalInfoUpdate from "../components/ess/PersonalInfoUpdate";
import CompanyPolicies from "../components/ess/CompanyPolicies";
import LeaveRequestsESS from "../components/ess/LeaveRequestsESS";
import LoanRequestsESS from "../components/ess/LoanRequestsESS";
import LetterRequestsESS from "../components/ess/LetterRequestsESS";
import TravelRequestsESS from "../components/ess/TravelRequestsESS";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ESS() {
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  // Fetch current user
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

  // Fetch employee's payrolls
  const { data: payrolls = [], isLoading: loadingPayrolls } = useQuery({
    queryKey: ['my-payrolls', currentUser?.id],
    queryFn: () => base44.entities.Payroll.filter({ employee_id: currentUser.id }, '-month'),
    enabled: !!currentUser?.id
  });

  // Fetch employee's leave balance
  const { data: leaveBalances = [] } = useQuery({
    queryKey: ['my-leave-balances', currentUser?.id],
    queryFn: () => base44.entities.LeaveBalance.filter({ 
      employee_id: currentUser.id,
      year: new Date().getFullYear()
    }),
    enabled: !!currentUser?.id
  });

  // Fetch employee's leave requests
  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['my-leaves', currentUser?.id],
    queryFn: () => base44.entities.LeaveRequest.filter({ employee_id: currentUser.id }, '-created_date'),
    enabled: !!currentUser?.id
  });

  // Fetch loan requests
  const { data: loanRequests = [] } = useQuery({
    queryKey: ['my-loans', currentUser?.id],
    queryFn: () => base44.entities.LoanRequest.filter({ employee_id: currentUser.id }, '-created_date'),
    enabled: !!currentUser?.id
  });

  // Fetch travel requests
  const { data: travelRequests = [] } = useQuery({
    queryKey: ['my-travel', currentUser?.id],
    queryFn: () => base44.entities.TravelRequest.filter({ employee_id: currentUser.id }, '-created_date'),
    enabled: !!currentUser?.id
  });

  // Fetch company policies
  const { data: policies = [], isLoading: loadingPolicies } = useQuery({
    queryKey: ['company-policies'],
    queryFn: () => base44.entities.CompanyPolicy.filter({ is_active: true }, '-created_date')
  });

  // Fetch ESS requests
  const { data: essRequests = [] } = useQuery({
    queryKey: ['my-ess-requests', currentUser?.id],
    queryFn: () => base44.entities.ESSRequest.filter({ employee_id: currentUser.id }, '-created_date'),
    enabled: !!currentUser?.id
  });

  // Update employee info
  const updateEmployeeMutation = useMutation({
    mutationFn: (data) => base44.entities.Employee.update(currentUser.id, { ...currentUser, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['current-user-ess']);
      toast.success('Personal information updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update personal information');
      console.error(error);
    }
  });

  const handlePersonalInfoUpdate = (data) => {
    updateEmployeeMutation.mutate(data);
  };

  // Calculate statistics
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
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Employee Record Found</h2>
            <p className="text-slate-600 mb-4">
              Your account is not linked to an employee record.
            </p>
            <p className="text-sm text-slate-500">
              Please contact HR department to set up your employee profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome, {currentUser.first_name}!
          </h1>
          <p className="text-slate-600">Your Employee Self-Service Portal</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-slate-500">Employee ID</p>
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
          title="Current Salary"
          value={lastPayroll ? `${lastPayroll.net_salary?.toLocaleString()} SAR` : 'N/A'}
          icon={TrendingUp}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Leave Balance"
          value={`${totalLeaveBalance} Days`}
          icon={Calendar}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Pending Requests"
          value={totalPendingRequests}
          icon={Clock}
          bgColor="from-amber-500 to-amber-600"
        />
        <StatCard
          title="Available Policies"
          value={policies.length}
          icon={BookOpen}
          bgColor="from-purple-500 to-purple-600"
        />
      </div>

      {/* Pending Requests Alert */}
      {totalPendingRequests > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-900">You have {totalPendingRequests} pending request{totalPendingRequests > 1 ? 's' : ''}</p>
                <p className="text-sm text-amber-700">
                  {pendingLeaves > 0 && `${pendingLeaves} Leave • `}
                  {pendingLoans > 0 && `${pendingLoans} Loan • `}
                  {pendingTravel > 0 && `${pendingTravel} Travel • `}
                  {pendingLetters > 0 && `${pendingLetters} Letters`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Summary */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 via-blue-50 to-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {currentUser.first_name} {currentUser.last_name}
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Position:</span>
                  <span className="ml-2 font-semibold text-slate-900">{currentUser.job_title || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Department:</span>
                  <span className="ml-2 font-semibold text-slate-900">{currentUser.department || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>
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
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 grid grid-cols-4 lg:grid-cols-8">
          <TabsTrigger 
            value="dashboard" 
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs lg:text-sm"
          >
            <TrendingUp className="w-4 h-4 lg:mr-2" />
            <span className="hidden lg:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger 
            value="leave" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs lg:text-sm"
          >
            <Calendar className="w-4 h-4 lg:mr-2" />
            <span className="hidden lg:inline">Leave</span>
            {pendingLeaves > 0 && <span className="ml-1 px-1 py-0.5 bg-amber-500 text-white text-xs rounded-full">{pendingLeaves}</span>}
          </TabsTrigger>
          <TabsTrigger 
            value="loan" 
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs lg:text-sm"
          >
            <DollarSign className="w-4 h-4 lg:mr-2" />
            <span className="hidden lg:inline">Loans</span>
            {pendingLoans > 0 && <span className="ml-1 px-1 py-0.5 bg-amber-500 text-white text-xs rounded-full">{pendingLoans}</span>}
          </TabsTrigger>
          <TabsTrigger 
            value="travel" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs lg:text-sm"
          >
            <Plane className="w-4 h-4 lg:mr-2" />
            <span className="hidden lg:inline">Travel</span>
            {pendingTravel > 0 && <span className="ml-1 px-1 py-0.5 bg-amber-500 text-white text-xs rounded-full">{pendingTravel}</span>}
          </TabsTrigger>
          <TabsTrigger 
            value="letters" 
            className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-xs lg:text-sm"
          >
            <Mail className="w-4 h-4 lg:mr-2" />
            <span className="hidden lg:inline">Letters</span>
            {pendingLetters > 0 && <span className="ml-1 px-1 py-0.5 bg-amber-500 text-white text-xs rounded-full">{pendingLetters}</span>}
          </TabsTrigger>
          <TabsTrigger 
            value="payslips" 
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs lg:text-sm"
          >
            <FileText className="w-4 h-4 lg:mr-2" />
            <span className="hidden lg:inline">Payslips</span>
          </TabsTrigger>
          <TabsTrigger 
            value="personal-info" 
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs lg:text-sm"
          >
            <Settings className="w-4 h-4 lg:mr-2" />
            <span className="hidden lg:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger 
            value="policies" 
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs lg:text-sm"
          >
            <BookOpen className="w-4 h-4 lg:mr-2" />
            <span className="hidden lg:inline">Policies</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2"
                    onClick={() => document.querySelector('[value="leave"]').click()}
                  >
                    <Calendar className="w-6 h-6 text-blue-600" />
                    <span className="text-sm">Request Leave</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2"
                    onClick={() => document.querySelector('[value="loan"]').click()}
                  >
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                    <span className="text-sm">Request Loan</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2"
                    onClick={() => document.querySelector('[value="travel"]').click()}
                  >
                    <Plane className="w-6 h-6 text-purple-600" />
                    <span className="text-sm">Travel Request</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2"
                    onClick={() => document.querySelector('[value="letters"]').click()}
                  >
                    <Mail className="w-6 h-6 text-amber-600" />
                    <span className="text-sm">Request Letter</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Requests</h3>
                <div className="space-y-3">
                  {[...leaveRequests.slice(0, 2), ...loanRequests.slice(0, 2), ...travelRequests.slice(0, 1)]
                    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                    .slice(0, 5)
                    .map((req, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {req.leave_type ? 'Leave Request' : req.loan_type ? 'Loan Request' : 'Travel Request'}
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
                    <p className="text-center py-8 text-slate-500">No recent requests</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leave Requests Tab */}
        <TabsContent value="leave">
          <LeaveRequestsESS
            employee={currentUser}
            leaveRequests={leaveRequests}
            leaveBalances={leaveBalances}
          />
        </TabsContent>

        {/* Loan Requests Tab */}
        <TabsContent value="loan">
          <LoanRequestsESS
            employee={currentUser}
            loanRequests={loanRequests}
          />
        </TabsContent>

        {/* Travel Requests Tab */}
        <TabsContent value="travel">
          <TravelRequestsESS
            employee={currentUser}
            travelRequests={travelRequests}
          />
        </TabsContent>

        {/* Letter Requests Tab */}
        <TabsContent value="letters">
          <LetterRequestsESS
            employee={currentUser}
            letterRequests={essRequests.filter(r => 
              r.request_type === 'salary_certificate' || r.request_type === 'employment_letter'
            )}
          />
        </TabsContent>

        {/* Payslips Tab */}
        <TabsContent value="payslips">
          <PayslipViewer
            employee={currentUser}
            payrolls={payrolls}
            isLoading={loadingPayrolls}
          />
        </TabsContent>

        {/* Personal Info Tab */}
        <TabsContent value="personal-info">
          <PersonalInfoUpdate
            employee={currentUser}
            onUpdate={handlePersonalInfoUpdate}
            isUpdating={updateEmployeeMutation.isPending}
          />
        </TabsContent>

        {/* Policies Tab */}
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