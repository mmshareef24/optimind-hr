import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { DollarSign, Plus, Calculator, FileText, History, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import StatCard from "../components/hrms/StatCard";
import PayrollCalculator from "../components/payroll/PayrollCalculator";
import PayrollHistory from "../components/payroll/PayrollHistory";
import SalaryCertificate from "../components/payroll/SalaryCertificate";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function Payroll() {
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [showCertificateDialog, setShowCertificateDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [calculatedPayroll, setCalculatedPayroll] = useState(null);
  const [certificateData, setCertificateData] = useState(null);

  const queryClient = useQueryClient();

  const { data: payrolls = [], isLoading: loadingPayrolls } = useQuery({
    queryKey: ['payrolls'],
    queryFn: () => base44.entities.Payroll.list('-month'),
  });

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const createPayrollMutation = useMutation({
    mutationFn: (data) => base44.entities.Payroll.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payrolls']);
      setShowProcessDialog(false);
      setSelectedEmployee(null);
      setCalculatedPayroll(null);
      toast.success('Payroll processed successfully');
    }
  });

  const handleProcessPayroll = () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }
    setShowProcessDialog(true);
  };

  const handleCalculationComplete = (payrollData) => {
    setCalculatedPayroll(payrollData);
  };

  const handleSavePayroll = () => {
    if (calculatedPayroll) {
      createPayrollMutation.mutate(calculatedPayroll);
    }
  };

  const handleGenerateCertificate = (payroll) => {
    const employee = employees.find(e => e.id === payroll.employee_id);
    const company = companies[0];
    setCertificateData({ employee, payroll, company });
    setShowCertificateDialog(true);
  };

  // Calculate statistics
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthPayrolls = payrolls.filter(p => p.month === currentMonth);
  const totalPayroll = currentMonthPayrolls.reduce((sum, p) => sum + (p.gross_salary || 0), 0);
  const totalGOSI = currentMonthPayrolls.reduce((sum, p) => 
    sum + (p.gosi_employer || 0) + (p.gosi_employee || 0), 0
  );
  const processedCount = currentMonthPayrolls.filter(p => 
    p.status === 'processed' || p.status === 'paid'
  ).length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Payroll & GOSI Management</h1>
          <p className="text-slate-600">Process salaries and manage GOSI contributions</p>
        </div>
        <Button
          onClick={handleProcessPayroll}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" /> Process Payroll
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Payroll (Current Month)"
          value={`${totalPayroll.toLocaleString()} SAR`}
          icon={DollarSign}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Total GOSI Contribution"
          value={`${totalGOSI.toLocaleString()} SAR`}
          icon={Calculator}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Processed This Month"
          value={processedCount}
          icon={FileText}
          bgColor="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Total Employees"
          value={employees.length}
          icon={Users}
          bgColor="from-amber-500 to-amber-600"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="history" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="history" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <History className="w-4 h-4 mr-2" />
            Payroll History
          </TabsTrigger>
          <TabsTrigger value="certificates" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <FileText className="w-4 h-4 mr-2" />
            Salary Certificates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <PayrollHistory
            payrolls={payrolls}
            isLoading={loadingPayrolls}
            onViewDetails={(payroll) => {}}
          />
        </TabsContent>

        <TabsContent value="certificates">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b">
              <CardTitle>Generate Salary Certificates</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loadingPayrolls ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
                </div>
              ) : payrolls.filter(p => p.status === 'paid').length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">No paid payrolls available for certificate generation</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payrolls.filter(p => p.status === 'paid').map((payroll) => {
                    const employee = employees.find(e => e.id === payroll.employee_id);
                    return (
                      <div key={payroll.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:shadow-md transition-all">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {employee?.first_name} {employee?.last_name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {payroll.month} • {payroll.net_salary?.toLocaleString()} SAR
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleGenerateCertificate(payroll)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Generate Certificate
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Process Payroll Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Process Payroll</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Employee and Month Selection */}
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <Label>Select Employee</Label>
                <Select
                  value={selectedEmployee?.id}
                  onValueChange={(id) => {
                    const emp = employees.find(e => e.id === id);
                    setSelectedEmployee(emp);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} - {emp.employee_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payroll Month</Label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>

            {selectedEmployee && (
              <>
                <PayrollCalculator
                  employee={selectedEmployee}
                  month={selectedMonth}
                  onCalculationComplete={handleCalculationComplete}
                />

                {calculatedPayroll && (
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowProcessDialog(false);
                        setCalculatedPayroll(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSavePayroll}
                      className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                    >
                      Save & Process Payroll
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Salary Certificate Dialog */}
      <Dialog open={showCertificateDialog} onOpenChange={setShowCertificateDialog}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Salary Certificate</DialogTitle>
          </DialogHeader>
          {certificateData && (
            <SalaryCertificate
              employee={certificateData.employee}
              payroll={certificateData.payroll}
              company={certificateData.company}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}