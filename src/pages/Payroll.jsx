import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { DollarSign, TrendingUp, Users, CheckCircle, Calculator, FileText, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import StatCard from "../components/hrms/StatCard";
import PayrollProcessor from "../components/payroll/PayrollProcessor";
import PayrollReview from "../components/payroll/PayrollReview";
import PayrollHistory from "../components/payroll/PayrollHistory";
import PayslipGenerator from "../components/payroll/PayslipGenerator";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Payroll() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [processing, setProcessing] = useState(false);

  const queryClient = useQueryClient();

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: payrolls = [], isLoading: loadingPayrolls } = useQuery({
    queryKey: ['payrolls'],
    queryFn: () => base44.entities.Payroll.list('-created_date'),
  });

  const { data: timesheets = [] } = useQuery({
    queryKey: ['timesheets'],
    queryFn: () => base44.entities.Timesheet.list(),
  });

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: () => base44.entities.LeaveRequest.list(),
  });

  const createPayrollsMutation = useMutation({
    mutationFn: async (payrollData) => {
      const results = await Promise.all(
        payrollData.map(payroll => base44.entities.Payroll.create(payroll))
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payrolls']);
      setProcessing(false);
      toast.success('Payroll processed successfully');
    },
    onError: (error) => {
      setProcessing(false);
      toast.error('Failed to process payroll: ' + error.message);
    }
  });

  const updatePayrollMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Payroll.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payrolls']);
      toast.success('Payroll updated successfully');
    },
    onError: () => {
      toast.error('Failed to update payroll');
    }
  });

  const handleCalculatePayroll = (payrollData) => {
    setProcessing(true);
    createPayrollsMutation.mutate(payrollData);
  };

  const handleApprovePayroll = (payrollId) => {
    const payroll = payrolls.find(p => p.id === payrollId);
    if (payroll) {
      updatePayrollMutation.mutate({
        id: payrollId,
        data: {
          ...payroll,
          status: 'approved',
          approved_by: 'admin',
          approval_date: new Date().toISOString().split('T')[0]
        }
      });
    }
  };

  const handleEditPayroll = (editedPayroll) => {
    // Recalculate gross and net
    const gross = 
      editedPayroll.basic_salary + 
      editedPayroll.housing_allowance + 
      editedPayroll.transport_allowance + 
      editedPayroll.overtime_pay;
    
    const deductions = editedPayroll.gosi_employee + (editedPayroll.absence_deduction || 0);
    const net = gross - deductions;

    updatePayrollMutation.mutate({
      id: editedPayroll.id,
      data: {
        ...editedPayroll,
        gross_salary: gross,
        total_deductions: deductions,
        net_salary: net
      }
    });
  };

  const handleEmailPayslip = async (payroll, employee) => {
    try {
      await base44.integrations.Core.SendEmail({
        to: employee.email,
        subject: `Payslip for ${payroll.month}`,
        body: `Dear ${employee.first_name},\n\nPlease find attached your payslip for ${payroll.month}.\n\nNet Salary: ${payroll.net_salary?.toLocaleString()} SAR\n\nBest regards,\nHR Department`
      });
      toast.success(`Payslip sent to ${employee.email}`);
    } catch (error) {
      toast.error('Failed to send payslip email');
    }
  };

  // Statistics for current month
  const currentMonthPayrolls = payrolls.filter(p => p.month === selectedMonth);
  const totalPayroll = currentMonthPayrolls.reduce((sum, p) => sum + (p.net_salary || 0), 0);
  const totalGOSI = currentMonthPayrolls.reduce((sum, p) => sum + (p.gosi_employee || 0) + (p.gosi_employer || 0), 0);
  const processedCount = currentMonthPayrolls.filter(p => p.status === 'approved' || p.status === 'processed' || p.status === 'paid').length;
  const pendingCount = currentMonthPayrolls.filter(p => p.status === 'calculated' || p.status === 'draft').length;

  const activeEmployees = employees.filter(e => e.status === 'active');
  const company = companies[0];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Payroll Management</h1>
          <p className="text-slate-600">Process and manage employee payroll</p>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <Label className="text-xs text-slate-500 mb-1">Select Month</Label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Payroll"
          value={`${totalPayroll.toLocaleString()} SAR`}
          icon={DollarSign}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Total GOSI"
          value={`${totalGOSI.toLocaleString()} SAR`}
          icon={TrendingUp}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Processed"
          value={processedCount}
          icon={CheckCircle}
          bgColor="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Pending Review"
          value={pendingCount}
          icon={Users}
          bgColor="from-amber-500 to-amber-600"
        />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="process" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger
            value="process"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Process Payroll
          </TabsTrigger>
          <TabsTrigger
            value="review"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Review & Approve
          </TabsTrigger>
          <TabsTrigger
            value="payslips"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate Payslips
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Process Payroll Tab */}
        <TabsContent value="process">
          {loadingEmployees ? (
            <Skeleton className="h-96" />
          ) : (
            <PayrollProcessor
              month={selectedMonth}
              employees={activeEmployees}
              timesheets={timesheets}
              leaves={leaveRequests}
              existingPayrolls={payrolls}
              onCalculate={handleCalculatePayroll}
              processing={processing}
            />
          )}
        </TabsContent>

        {/* Review & Approve Tab */}
        <TabsContent value="review">
          {loadingPayrolls ? (
            <Skeleton className="h-96" />
          ) : (
            <PayrollReview
              payrolls={payrolls}
              employees={employees}
              onApprove={handleApprovePayroll}
              onEdit={handleEditPayroll}
            />
          )}
        </TabsContent>

        {/* Generate Payslips Tab */}
        <TabsContent value="payslips">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Generate Payslips for {selectedMonth}
              </h3>
              
              {loadingPayrolls ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
                </div>
              ) : currentMonthPayrolls.filter(p => p.status !== 'draft').length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">No approved payrolls for {selectedMonth}</p>
                  <p className="text-sm text-slate-400 mt-2">Process and approve payroll first</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {currentMonthPayrolls
                    .filter(p => p.status !== 'draft')
                    .map(payroll => {
                      const employee = employees.find(e => e.id === payroll.employee_id);
                      return employee ? (
                        <PayslipGenerator
                          key={payroll.id}
                          payroll={payroll}
                          employee={employee}
                          company={company}
                          onDownload={() => toast.success('Payslip downloaded')}
                          onEmail={handleEmailPayslip}
                        />
                      ) : null;
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          {loadingPayrolls ? (
            <Skeleton className="h-96" />
          ) : (
            <PayrollHistory
              payrolls={payrolls}
              employees={employees}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}