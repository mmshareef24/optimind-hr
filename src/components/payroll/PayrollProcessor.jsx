import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Play, CheckCircle, AlertCircle, DollarSign, Users, TrendingUp, FileText } from "lucide-react";
import { toast } from "sonner";
import ReportExporter from "../reports/ReportExporter";

export default function PayrollProcessor() {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [processingResult, setProcessingResult] = useState(null);
  const queryClient = useQueryClient();

  const processPayrollMutation = useMutation({
    mutationFn: async (month) => {
      const response = await base44.functions.invoke('processMonthlyPayroll', {
        month
      });
      return response.data;
    },
    onSuccess: (data) => {
      setProcessingResult(data);
      queryClient.invalidateQueries(['payroll-records']);
      toast.success(`Payroll processed for ${data.processed_count} employees`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to process payroll');
    }
  });

  const handleProcessPayroll = () => {
    if (!selectedMonth) {
      toast.error('Please select a month');
      return;
    }
    
    if (window.confirm(`Process payroll for ${selectedMonth}? This will create payroll records for all active employees.`)) {
      processPayrollMutation.mutate(selectedMonth);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-white">
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5 text-emerald-600" />
          Process Monthly Payroll
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 text-sm">
            <strong>Processing payroll will:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Calculate gross salary based on basic salary and allowances</li>
              <li>Apply GOSI contributions (10% employee, 12% employer for Saudis)</li>
              <li>Deduct active loans and advances</li>
              <li>Calculate attendance-based deductions for absences</li>
              <li>Process benefit contributions</li>
              <li>Generate payroll records with net salary</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label>Select Month</Label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="mt-2"
            />
          </div>

          <Button
            onClick={handleProcessPayroll}
            disabled={processPayrollMutation.isPending}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
            size="lg"
          >
            {processPayrollMutation.isPending ? (
              <>Processing Payroll...</>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Process Payroll for {selectedMonth}
              </>
            )}
          </Button>
        </div>

        {processingResult && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Payroll Processing Complete!</span>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border border-emerald-200 bg-emerald-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-700 mb-1">Employees Processed</p>
                      <p className="text-2xl font-bold text-emerald-900">{processingResult.processed_count}</p>
                    </div>
                    <Users className="w-8 h-8 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700 mb-1">Total Gross Salary</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {processingResult.total_gross.toLocaleString()} SAR
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-700 mb-1">Total Net Salary</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {processingResult.total_net.toLocaleString()} SAR
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Total Employer GOSI</p>
                <p className="text-xl font-semibold text-slate-900">
                  {processingResult.total_gosi_employer.toLocaleString()} SAR
                </p>
              </div>
              
              {processingResult.error_count > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-900 text-sm">
                    <strong>{processingResult.error_count} errors</strong> occurred during processing
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {processingResult.errors && processingResult.errors.length > 0 && (
              <div className="mt-4">
                <Label className="text-red-700 mb-2">Errors:</Label>
                <div className="space-y-2">
                  {processingResult.errors.map((err, idx) => (
                    <Alert key={idx} className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-900 text-sm">
                        <strong>{err.employee_name}</strong>: {err.error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <ReportExporter
                reportType="payroll"
                filters={{ month: processingResult.month }}
                buttonText="Export Payroll Report"
                buttonVariant="default"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}