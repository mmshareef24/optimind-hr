import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { User, FileText, Settings, BookOpen, Calendar, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatCard from "../components/hrms/StatCard";
import PayslipViewer from "../components/ess/PayslipViewer";
import PersonalInfoUpdate from "../components/ess/PersonalInfoUpdate";
import CompanyPolicies from "../components/ess/CompanyPolicies";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ESS() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestType, setRequestType] = useState('payslip');
  const [requestDetails, setRequestDetails] = useState('');
  const [requestMonth, setRequestMonth] = useState(new Date().toISOString().slice(0, 7));

  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['current-user-ess'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      // Find employee record
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

  // Create ESS request
  const createRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.ESSRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-ess-requests']);
      setShowRequestDialog(false);
      setRequestDetails('');
      setRequestType('payslip');
      toast.success('Request submitted successfully');
    },
    onError: (error) => {
      toast.error('Failed to submit request');
      console.error(error);
    }
  });

  const handlePersonalInfoUpdate = (data) => {
    updateEmployeeMutation.mutate(data);
  };

  const handleRequestPayslip = () => {
    setRequestType('payslip');
    setShowRequestDialog(true);
  };

  const handleSubmitRequest = () => {
    if (!currentUser) return;

    const requestData = {
      employee_id: currentUser.id,
      request_type: requestType,
      request_details: requestDetails,
      status: 'pending'
    };

    if (requestType === 'payslip' && requestMonth) {
      requestData.month = requestMonth;
    }

    createRequestMutation.mutate(requestData);
  };

  // Calculate statistics
  const totalLeaveBalance = leaveBalances.reduce((sum, lb) => sum + (lb.remaining || 0), 0);
  const pendingRequests = essRequests.filter(r => r.status === 'pending').length;
  const lastPayroll = payrolls[0];
  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending').length;

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
          value={pendingRequests + pendingLeaves}
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
      <Tabs defaultValue="payslips" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger 
            value="payslips" 
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Payslips
          </TabsTrigger>
          <TabsTrigger 
            value="personal-info" 
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            Personal Info
          </TabsTrigger>
          <TabsTrigger 
            value="policies" 
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Company Policies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payslips">
          <PayslipViewer
            employee={currentUser}
            payrolls={payrolls}
            isLoading={loadingPayrolls}
            onRequestPayslip={handleRequestPayslip}
          />
        </TabsContent>

        <TabsContent value="personal-info">
          <PersonalInfoUpdate
            employee={currentUser}
            onUpdate={handlePersonalInfoUpdate}
            isUpdating={updateEmployeeMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="policies">
          <CompanyPolicies
            policies={policies}
            isLoading={loadingPolicies}
          />
        </TabsContent>
      </Tabs>

      {/* Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Request Type</Label>
              <Select value={requestType} onValueChange={setRequestType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payslip">Payslip</SelectItem>
                  <SelectItem value="salary_certificate">Salary Certificate</SelectItem>
                  <SelectItem value="employment_letter">Employment Letter</SelectItem>
                  <SelectItem value="info_update">Information Update</SelectItem>
                  <SelectItem value="document_access">Document Access</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {requestType === 'payslip' && (
              <div>
                <Label>Month</Label>
                <input
                  type="month"
                  value={requestMonth}
                  onChange={(e) => setRequestMonth(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            )}

            <div>
              <Label>Additional Details {requestType === 'other' ? '*' : '(Optional)'}</Label>
              <Textarea
                value={requestDetails}
                onChange={(e) => setRequestDetails(e.target.value)}
                placeholder="Provide any additional information..."
                rows={3}
                required={requestType === 'other'}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRequestDialog(false);
                setRequestDetails('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitRequest} 
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={createRequestMutation.isPending || (requestType === 'other' && !requestDetails.trim())}
            >
              {createRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}