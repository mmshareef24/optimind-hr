import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  FileText, Download, TrendingUp, Users, DollarSign, Shield,
  Calendar, BarChart3
} from "lucide-react";
import { format } from "date-fns";

export default function PayrollReportsGenerator({
  payrolls = [],
  employees = [],
  onExport
}) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [reportType, setReportType] = useState('summary');

  // Filter payrolls
  const filteredPayrolls = payrolls.filter(p => {
    const matchesMonth = p.month === selectedMonth;
    const employee = employees.find(e => e.id === p.employee_id);
    const matchesDept = selectedDepartment === 'all' || employee?.department === selectedDepartment;
    return matchesMonth && matchesDept;
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const totalGross = filteredPayrolls.reduce((sum, p) => sum + (p.gross_salary || 0), 0);
    const totalNet = filteredPayrolls.reduce((sum, p) => sum + (p.net_salary || 0), 0);
    const totalGOSIEmployee = filteredPayrolls.reduce((sum, p) => sum + (p.gosi_employee || 0), 0);
    const totalGOSIEmployer = filteredPayrolls.reduce((sum, p) => sum + (p.gosi_employer || 0), 0);
    const totalDeductions = filteredPayrolls.reduce((sum, p) => sum + (p.total_deductions || 0), 0);
    const avgSalary = filteredPayrolls.length > 0 ? totalNet / filteredPayrolls.length : 0;

    return {
      totalGross,
      totalNet,
      totalGOSIEmployee,
      totalGOSIEmployer,
      totalDeductions,
      avgSalary,
      employeeCount: filteredPayrolls.length
    };
  }, [filteredPayrolls]);

  // Get unique departments
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const handleExportReport = () => {
    const reportData = {
      type: reportType,
      month: selectedMonth,
      department: selectedDepartment,
      stats,
      payrolls: filteredPayrolls.map(p => {
        const employee = employees.find(e => e.id === p.employee_id);
        return {
          ...p,
          employee_name: employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown',
          employee_id: employee?.employee_id,
          department: employee?.department,
          job_title: employee?.job_title
        };
      }),
      generated_date: new Date().toISOString()
    };

    // Generate text report
    let reportText = '═══════════════════════════════════════════════════════════\n';
    reportText += `           PAYROLL REPORT - ${format(new Date(selectedMonth), 'MMMM yyyy')}\n`;
    reportText += '═══════════════════════════════════════════════════════════\n\n';
    
    reportText += `Department: ${selectedDepartment === 'all' ? 'All Departments' : selectedDepartment}\n`;
    reportText += `Report Type: ${reportType.toUpperCase()}\n`;
    reportText += `Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}\n`;
    reportText += '─'.repeat(60) + '\n\n';

    reportText += 'SUMMARY STATISTICS:\n';
    reportText += '─'.repeat(60) + '\n';
    reportText += `Total Employees:          ${stats.employeeCount}\n`;
    reportText += `Total Gross Salary:       ${stats.totalGross.toLocaleString()} SAR\n`;
    reportText += `Total Deductions:         ${stats.totalDeductions.toLocaleString()} SAR\n`;
    reportText += `Total Net Salary:         ${stats.totalNet.toLocaleString()} SAR\n`;
    reportText += `Average Salary:           ${stats.avgSalary.toLocaleString()} SAR\n`;
    reportText += `\n`;
    reportText += `Total GOSI (Employee):    ${stats.totalGOSIEmployee.toLocaleString()} SAR\n`;
    reportText += `Total GOSI (Employer):    ${stats.totalGOSIEmployer.toLocaleString()} SAR\n`;
    reportText += `Total GOSI:               ${(stats.totalGOSIEmployee + stats.totalGOSIEmployer).toLocaleString()} SAR\n`;
    reportText += '\n\n';

    reportText += 'EMPLOYEE BREAKDOWN:\n';
    reportText += '─'.repeat(60) + '\n';
    reportText += `${'Name'.padEnd(30)} ${'Gross'.padStart(12)} ${'Net'.padStart(12)}\n`;
    reportText += '─'.repeat(60) + '\n';

    reportData.payrolls.forEach(p => {
      const name = p.employee_name.substring(0, 29).padEnd(30);
      const gross = p.gross_salary.toLocaleString().padStart(12);
      const net = p.net_salary.toLocaleString().padStart(12);
      reportText += `${name} ${gross} ${net}\n`;
    });

    reportText += '\n═══════════════════════════════════════════════════════════\n';
    reportText += '                     END OF REPORT\n';
    reportText += '═══════════════════════════════════════════════════════════\n';

    // Download as text file
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-report-${selectedMonth}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (onExport) {
      onExport(reportData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Payroll Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Report Month</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>

            <div>
              <Label>Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary Report</SelectItem>
                  <SelectItem value="detailed">Detailed Report</SelectItem>
                  <SelectItem value="gosi">GOSI Report</SelectItem>
                  <SelectItem value="department">Department Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleExportReport} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Gross</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalGross.toLocaleString()} SAR
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Net</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.totalNet.toLocaleString()} SAR
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-emerald-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total GOSI</p>
                <p className="text-2xl font-bold text-amber-600">
                  {(stats.totalGOSIEmployee + stats.totalGOSIEmployer).toLocaleString()} SAR
                </p>
              </div>
              <Shield className="w-10 h-10 text-amber-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Avg Salary</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.avgSalary.toLocaleString()} SAR
                </p>
              </div>
              <BarChart3 className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Preview */}
      {filteredPayrolls.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Report Preview ({filteredPayrolls.length} employees)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="text-left p-3 font-semibold text-slate-700">Employee</th>
                    <th className="text-right p-3 font-semibold text-slate-700">Department</th>
                    <th className="text-right p-3 font-semibold text-slate-700">Gross</th>
                    <th className="text-right p-3 font-semibold text-slate-700">Deductions</th>
                    <th className="text-right p-3 font-semibold text-slate-700">Net</th>
                    <th className="text-center p-3 font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayrolls.map(payroll => {
                    const employee = employees.find(e => e.id === payroll.employee_id);
                    return (
                      <tr key={payroll.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium text-slate-900">
                              {employee?.first_name} {employee?.last_name}
                            </p>
                            <p className="text-xs text-slate-600">{employee?.employee_id}</p>
                          </div>
                        </td>
                        <td className="p-3 text-right text-slate-600">
                          {employee?.department}
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-900">
                          {payroll.gross_salary?.toLocaleString()} SAR
                        </td>
                        <td className="p-3 text-right font-semibold text-red-600">
                          -{payroll.total_deductions?.toLocaleString()} SAR
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-600">
                          {payroll.net_salary?.toLocaleString()} SAR
                        </td>
                        <td className="p-3 text-center">
                          <Badge className={
                            payroll.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            payroll.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                          }>
                            {payroll.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                  <tr>
                    <td className="p-3 font-bold text-slate-900" colSpan="2">TOTAL</td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {stats.totalGross.toLocaleString()} SAR
                    </td>
                    <td className="p-3 text-right font-bold text-red-600">
                      -{stats.totalDeductions.toLocaleString()} SAR
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-600">
                      {stats.totalNet.toLocaleString()} SAR
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No payroll data available for the selected filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}