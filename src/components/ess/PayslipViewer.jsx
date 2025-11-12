
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Eye, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

export default function PayslipViewer({ employee, payrolls, isLoading }) {
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleViewDetails = (payroll) => {
    setSelectedPayroll(payroll);
    setShowDetails(true);
  };

  const handleDownloadPayslip = (payroll) => {
    // Generate PDF payslip
    const content = `
PAYSLIP - ${payroll.month}
Employee: ${employee.first_name} ${employee.last_name}
Employee ID: ${employee.employee_id}

EARNINGS:
Basic Salary: ${payroll.basic_salary?.toLocaleString()} SAR
Housing Allowance: ${payroll.housing_allowance?.toLocaleString()} SAR
Transport Allowance: ${payroll.transport_allowance?.toLocaleString()} SAR
Other Allowances: ${payroll.other_fixed_allowances?.toLocaleString()} SAR
Overtime: ${payroll.overtime_pay?.toLocaleString()} SAR
Bonus: ${payroll.bonus?.toLocaleString()} SAR
Gross Salary: ${payroll.gross_salary?.toLocaleString()} SAR

DEDUCTIONS:
GOSI (Employee): ${payroll.gosi_employee?.toLocaleString()} SAR
Loan Deduction: ${payroll.loan_deduction?.toLocaleString()} SAR
Other Deductions: ${payroll.other_deductions?.toLocaleString()} SAR
Total Deductions: ${payroll.total_deductions?.toLocaleString()} SAR

NET SALARY: ${payroll.net_salary?.toLocaleString()} SAR

Payment Date: ${payroll.payment_date || 'Pending'}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payslip_${payroll.month}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">My Payslips</h3>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : payrolls.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-4">No payslips available yet</p>
            <p className="text-sm text-slate-400">Your payslips will appear here once processed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {payrolls.map((payroll) => (
            <Card key={payroll.id} className="border border-slate-200 hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {format(new Date(payroll.month + '-01'), 'MMMM yyyy')}
                      </h4>
                      <p className="text-sm text-slate-500">
                        {payroll.payment_date ? format(new Date(payroll.payment_date), 'MMM dd, yyyy') : 'Processing'}
                      </p>
                    </div>
                  </div>
                  <Badge className={
                    payroll.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                    payroll.status === 'processed' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }>
                    {payroll.status}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Gross Salary</span>
                    <span className="font-semibold">{payroll.gross_salary?.toLocaleString()} SAR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Deductions</span>
                    <span className="font-semibold text-red-600">-{payroll.total_deductions?.toLocaleString()} SAR</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold text-slate-900">Net Salary</span>
                    <span className="font-bold text-emerald-600 text-lg">{payroll.net_salary?.toLocaleString()} SAR</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(payroll)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadPayslip(payroll)}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Payslip Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Payslip Details - {selectedPayroll && format(new Date(selectedPayroll.month + '-01'), 'MMMM yyyy')}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPayroll && (
            <div className="space-y-6">
              {/* Earnings */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  Earnings
                </h3>
                <div className="space-y-2 bg-emerald-50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Basic Salary</span>
                    <span className="font-semibold">{selectedPayroll.basic_salary?.toLocaleString()} SAR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Housing Allowance</span>
                    <span className="font-semibold">{selectedPayroll.housing_allowance?.toLocaleString()} SAR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Transport Allowance</span>
                    <span className="font-semibold">{selectedPayroll.transport_allowance?.toLocaleString()} SAR</span>
                  </div>
                  {selectedPayroll.other_fixed_allowances > 0 && (
                     <div className="flex justify-between text-sm">
                       <span className="text-slate-600">Other Allowances</span>
                       <span className="font-semibold">{selectedPayroll.other_fixed_allowances?.toLocaleString()} SAR</span>
                     </div>
                  )}
                  {selectedPayroll.overtime_pay > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Overtime Pay</span>
                      <span className="font-semibold">{selectedPayroll.overtime_pay?.toLocaleString()} SAR</span>
                    </div>
                  )}
                  {selectedPayroll.bonus > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Bonus</span>
                      <span className="font-semibold">{selectedPayroll.bonus?.toLocaleString()} SAR</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-emerald-200">
                    <span className="font-semibold text-slate-900">Total Earnings</span>
                    <span className="font-bold text-emerald-600">{selectedPayroll.gross_salary?.toLocaleString()} SAR</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  Deductions
                </h3>
                <div className="space-y-2 bg-red-50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">GOSI (Employee Share)</span>
                    <span className="font-semibold">{selectedPayroll.gosi_employee?.toLocaleString()} SAR</span>
                  </div>
                  {selectedPayroll.loan_deduction > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Loan Deduction</span>
                      <span className="font-semibold">{selectedPayroll.loan_deduction?.toLocaleString()} SAR</span>
                    </div>
                  )}
                  {selectedPayroll.other_deductions > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Other Deductions</span>
                      <span className="font-semibold">{selectedPayroll.other_deductions?.toLocaleString()} SAR</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-red-200">
                    <span className="font-semibold text-slate-900">Total Deductions</span>
                    <span className="font-bold text-red-600">{selectedPayroll.total_deductions?.toLocaleString()} SAR</span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="p-6 bg-gradient-to-br from-slate-50 to-white rounded-lg border-2 border-emerald-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-slate-900">Net Salary</span>
                  <span className="text-3xl font-bold text-emerald-600">{selectedPayroll.net_salary?.toLocaleString()} SAR</span>
                </div>
                {selectedPayroll.payment_date && (
                  <p className="text-sm text-slate-500 mt-2">
                    Paid on {format(new Date(selectedPayroll.payment_date), 'MMMM dd, yyyy')}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
