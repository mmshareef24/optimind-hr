import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Mail, FileText } from "lucide-react";
import { format } from "date-fns";

export default function PayslipGenerator({ payroll, employee, company, onDownload, onEmail }) {
  const generatePayslipContent = () => {
    const currentDate = new Date().toLocaleDateString();
    
    return `
═══════════════════════════════════════════════════════════════════
                            PAYSLIP
═══════════════════════════════════════════════════════════════════

${company?.name_en || 'Company Name'}
${company?.address || ''}
CR: ${company?.cr_number || 'N/A'} | GOSI: ${company?.gosi_number || 'N/A'}

═══════════════════════════════════════════════════════════════════
EMPLOYEE DETAILS
═══════════════════════════════════════════════════════════════════

Name:           ${employee.first_name} ${employee.last_name}
Employee ID:    ${employee.employee_id}
Department:     ${employee.department || 'N/A'}
Position:       ${employee.job_title}
Month:          ${format(new Date(payroll.month + '-01'), 'MMMM yyyy')}
Payment Date:   ${payroll.payment_date || 'Pending'}

═══════════════════════════════════════════════════════════════════
EARNINGS                                                          SAR
═══════════════════════════════════════════════════════════════════

Basic Salary                                    ${payroll.basic_salary?.toLocaleString().padStart(15)}
Housing Allowance                               ${payroll.housing_allowance?.toLocaleString().padStart(15)}
Transport Allowance                             ${payroll.transport_allowance?.toLocaleString().padStart(15)}
${payroll.overtime_pay > 0 ? `Overtime Pay (${payroll.overtime_hours} hrs)                 ${payroll.overtime_pay?.toLocaleString().padStart(15)}` : ''}
${payroll.bonus > 0 ? `Bonus                                           ${payroll.bonus?.toLocaleString().padStart(15)}` : ''}
                                                ───────────────
GROSS SALARY                                    ${payroll.gross_salary?.toLocaleString().padStart(15)}

═══════════════════════════════════════════════════════════════════
DEDUCTIONS                                                        SAR
═══════════════════════════════════════════════════════════════════

GOSI (Employee Share - 10%)                     ${payroll.gosi_employee?.toLocaleString().padStart(15)}
${payroll.loan_deduction > 0 ? `Loan Deduction                                  ${payroll.loan_deduction?.toLocaleString().padStart(15)}` : ''}
${payroll.absence_deduction > 0 ? `Absence Deduction (${payroll.absent_days} days)              ${payroll.absence_deduction?.toLocaleString().padStart(15)}` : ''}
${payroll.other_deductions > 0 ? `Other Deductions                                ${payroll.other_deductions?.toLocaleString().padStart(15)}` : ''}
                                                ───────────────
TOTAL DEDUCTIONS                                ${payroll.total_deductions?.toLocaleString().padStart(15)}

═══════════════════════════════════════════════════════════════════
NET SALARY                                      ${payroll.net_salary?.toLocaleString().padStart(15)} SAR
═══════════════════════════════════════════════════════════════════

Attendance Summary:
  Working Days:     ${payroll.working_days || 30}
  Present Days:     ${payroll.present_days || 30}
  Absent Days:      ${payroll.absent_days || 0}
  Overtime Hours:   ${payroll.overtime_hours || 0}

GOSI Information:
  Calculation Base: ${payroll.gosi_calculation_base?.toLocaleString()} SAR
  Employee Share:   ${payroll.gosi_employee?.toLocaleString()} SAR (10%)
  Employer Share:   ${payroll.gosi_employer?.toLocaleString()} SAR (12%)

${payroll.notes ? `\nNotes:\n${payroll.notes}` : ''}

═══════════════════════════════════════════════════════════════════
This is a computer-generated payslip and does not require a signature.
Generated on: ${currentDate}
═══════════════════════════════════════════════════════════════════
    `.trim();
  };

  const handleDownload = () => {
    const content = generatePayslipContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payslip_${employee.employee_id}_${payroll.month}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (onDownload) onDownload();
  };

  const handleEmail = () => {
    if (onEmail) {
      onEmail(payroll, employee);
    }
  };

  return (
    <Card className="border border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">
                {employee.first_name} {employee.last_name}
              </h4>
              <p className="text-sm text-slate-500">
                {format(new Date(payroll.month + '-01'), 'MMMM yyyy')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Net Salary</p>
            <p className="text-xl font-bold text-emerald-600">
              {payroll.net_salary?.toLocaleString()} SAR
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEmail}
            className="flex-1"
          >
            <Mail className="w-4 h-4 mr-2" />
            Email to Employee
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}