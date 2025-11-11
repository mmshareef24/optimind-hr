import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, XCircle, Shield } from "lucide-react";

export default function GOSIComplianceCheck({ employees, reports }) {
  const checkCompliance = () => {
    const issues = [];
    const warnings = [];
    const success = [];

    // Check for employees without GOSI
    const employeesWithoutGOSI = employees.filter(e => !e.gosi_applicable && e.status === 'active');
    if (employeesWithoutGOSI.length > 0) {
      warnings.push({
        title: 'Employees without GOSI',
        message: `${employeesWithoutGOSI.length} active employees are not marked for GOSI contributions`,
        severity: 'warning'
      });
    }

    // Check for missing National IDs
    const missingNationalIds = employees.filter(e => !e.national_id && e.status === 'active');
    if (missingNationalIds.length > 0) {
      issues.push({
        title: 'Missing National IDs',
        message: `${missingNationalIds.length} employees are missing National ID/Iqama numbers`,
        severity: 'error'
      });
    }

    // Check current month submission
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthReport = reports.find(r => r.report_month === currentMonth);
    
    if (!currentMonthReport) {
      warnings.push({
        title: 'Current Month Report Pending',
        message: 'GOSI report for current month has not been generated yet',
        severity: 'warning'
      });
    } else if (currentMonthReport.status === 'generated') {
      warnings.push({
        title: 'Report Not Submitted',
        message: 'Current month GOSI report has been generated but not submitted to portal',
        severity: 'warning'
      });
    } else if (currentMonthReport.status === 'submitted') {
      success.push({
        title: 'Current Month Submitted',
        message: 'GOSI report for current month has been submitted successfully',
        severity: 'success'
      });
    }

    // Check overdue reports
    const overdueReports = reports.filter(r => 
      r.due_date && 
      new Date(r.due_date) < new Date() && 
      r.status !== 'submitted' && 
      r.status !== 'approved'
    );

    if (overdueReports.length > 0) {
      issues.push({
        title: 'Overdue Reports',
        message: `${overdueReports.length} GOSI reports are overdue for submission`,
        severity: 'error'
      });
    }

    // Check salary cap compliance
    const highSalaries = employees.filter(e => 
      e.basic_salary && e.basic_salary > 45000 && e.status === 'active'
    );
    if (highSalaries.length > 0) {
      success.push({
        title: 'GOSI Salary Cap',
        message: `${highSalaries.length} employees have salaries above GOSI cap (45,000 SAR) - correctly capped in calculations`,
        severity: 'info'
      });
    }

    return { issues, warnings, success };
  };

  const compliance = checkCompliance();
  const totalIssues = compliance.issues.length + compliance.warnings.length;

  return (
    <Card className="border-2 border-emerald-200">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b">
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          Compliance Status
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {totalIssues === 0 && compliance.success.length === 0 ? (
          <Alert className="border-emerald-200 bg-emerald-50">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-700">
              <strong>System Check Complete:</strong> No compliance issues detected. Ready to generate reports.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {/* Critical Issues */}
            {compliance.issues.map((issue, idx) => (
              <Alert key={`issue-${idx}`} variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{issue.title}:</strong> {issue.message}
                </AlertDescription>
              </Alert>
            ))}

            {/* Warnings */}
            {compliance.warnings.map((warning, idx) => (
              <Alert key={`warning-${idx}`} className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  <strong>{warning.title}:</strong> {warning.message}
                </AlertDescription>
              </Alert>
            ))}

            {/* Success Messages */}
            {compliance.success.map((msg, idx) => (
              <Alert key={`success-${idx}`} className="border-emerald-200 bg-emerald-50">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-700">
                  <strong>{msg.title}:</strong> {msg.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Compliance Score</span>
            <div className="flex items-center gap-2">
              <div className={`text-2xl font-bold ${
                totalIssues === 0 ? 'text-emerald-600' :
                compliance.issues.length > 0 ? 'text-red-600' :
                'text-amber-600'
              }`}>
                {totalIssues === 0 ? '100%' : 
                 compliance.issues.length > 0 ? 'Issues Found' : 
                 'Review Needed'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}