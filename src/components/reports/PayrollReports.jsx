import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Download, FileText, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

export default function PayrollReports({ payrolls = [], employees = [] }) {
  const [reportType, setReportType] = useState('monthly_payroll');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const filteredPayrolls = useMemo(() => {
    return payrolls.filter(payroll => {
      const matchesMonth = payroll.month === selectedMonth;
      const emp = employees.find(e => e.id === payroll.employee_id);
      const matchesDept = department === 'all' || emp?.department === department;
      const matchesStatus = status === 'all' || payroll.status === status;
      return matchesMonth && matchesDept && matchesStatus;
    });
  }, [payrolls, selectedMonth, department, status, employees]);

  const generateReportData = () => {
    switch (reportType) {
      case 'monthly_payroll':
        return filteredPayrolls.map(payroll => {
          const emp = employees.find(e => e.id === payroll.employee_id);
          return {
            'Employee ID': emp?.employee_id || 'N/A',
            'Name': emp ? `${emp.first_name} ${emp.last_name}` : 'N/A',
            'Department': emp?.department || 'N/A',
            'Basic Salary': payroll.basic_salary || 0,
            'Housing Allowance': payroll.housing_allowance || 0,
            'Transport Allowance': payroll.transport_allowance || 0,
            'Overtime': payroll.overtime_pay || 0,
            'Gross Salary': payroll.gross_salary || 0,
            'GOSI Employee': payroll.gosi_employee || 0,
            'Other Deductions': payroll.other_deductions || 0,
            'Total Deductions': payroll.total_deductions || 0,
            'Net Salary': payroll.net_salary || 0,
            'Status': payroll.status
          };
        });
      
      case 'gosi_contributions':
        return filteredPayrolls.map(payroll => {
          const emp = employees.find(e => e.id === payroll.employee_id);
          return {
            'Employee ID': emp?.employee_id || 'N/A',
            'Name': emp ? `${emp.first_name} ${emp.last_name}` : 'N/A',
            'Department': emp?.department || 'N/A',
            'Nationality': emp?.nationality || 'N/A',
            'GOSI Base': payroll.gosi_calculation_base || 0,
            'Employee Share': payroll.gosi_employee || 0,
            'Employer Share': payroll.gosi_employer || 0,
            'Total GOSI': (payroll.gosi_employee || 0) + (payroll.gosi_employer || 0)
          };
        });
      
      case 'department_summary':
        const deptSummary = {};
        filteredPayrolls.forEach(payroll => {
          const emp = employees.find(e => e.id === payroll.employee_id);
          const dept = emp?.department || 'Unassigned';
          
          if (!deptSummary[dept]) {
            deptSummary[dept] = {
              count: 0,
              totalGross: 0,
              totalNet: 0,
              totalDeductions: 0,
              totalGOSI: 0
            };
          }
          
          deptSummary[dept].count++;
          deptSummary[dept].totalGross += payroll.gross_salary || 0;
          deptSummary[dept].totalNet += payroll.net_salary || 0;
          deptSummary[dept].totalDeductions += payroll.total_deductions || 0;
          deptSummary[dept].totalGOSI += (payroll.gosi_employee || 0) + (payroll.gosi_employer || 0);
        });

        return Object.entries(deptSummary).map(([dept, data]) => ({
          'Department': dept,
          'Employee Count': data.count,
          'Total Gross': data.totalGross.toFixed(2),
          'Total Deductions': data.totalDeductions.toFixed(2),
          'Total Net': data.totalNet.toFixed(2),
          'Total GOSI': data.totalGOSI.toFixed(2),
          'Avg Salary': (data.totalNet / data.count).toFixed(2)
        }));
      
      case 'overtime_report':
        return filteredPayrolls
          .filter(p => (p.overtime_hours || 0) > 0)
          .map(payroll => {
            const emp = employees.find(e => e.id === payroll.employee_id);
            return {
              'Employee ID': emp?.employee_id || 'N/A',
              'Name': emp ? `${emp.first_name} ${emp.last_name}` : 'N/A',
              'Department': emp?.department || 'N/A',
              'Overtime Hours': payroll.overtime_hours || 0,
              'Overtime Pay': payroll.overtime_pay || 0,
              'Status': payroll.status
            };
          });
      
      case 'deductions_analysis':
        return filteredPayrolls.map(payroll => {
          const emp = employees.find(e => e.id === payroll.employee_id);
          return {
            'Employee': emp ? `${emp.first_name} ${emp.last_name}` : 'N/A',
            'GOSI Employee': payroll.gosi_employee || 0,
            'Absence Deduction': payroll.absence_deduction || 0,
            'Loan Deduction': payroll.loan_deduction || 0,
            'Advance Deduction': payroll.advance_deduction || 0,
            'Other Deductions': payroll.other_deductions || 0,
            'Total Deductions': payroll.total_deductions || 0
          };
        });
      
      default:
        return [];
    }
  };

  const handleExport = (format) => {
    const data = generateReportData();
    const fileName = `payroll_report_${reportType}_${selectedMonth}_${Date.now()}`;
    
    if (format === 'csv') {
      exportToCSV(data, fileName);
      toast.success('Report exported as CSV');
    } else if (format === 'pdf') {
      const title = `Payroll Report - ${reportType.replace(/_/g, ' ').toUpperCase()} - ${selectedMonth}`;
      exportToPDF(data, fileName, title);
      toast.success('Report exported as PDF');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-600" />
            Payroll Reports Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly_payroll">Monthly Payroll</SelectItem>
                  <SelectItem value="gosi_contributions">GOSI Contributions</SelectItem>
                  <SelectItem value="department_summary">Department Summary</SelectItem>
                  <SelectItem value="overtime_report">Overtime Report</SelectItem>
                  <SelectItem value="deductions_analysis">Deductions Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Month</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>

            <div>
              <Label>Department</Label>
              <Select value={department} onValueChange={setDepartment}>
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
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="calculated">Calculated</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="space-y-1">
              <p className="text-sm text-slate-600">
                <strong>{filteredPayrolls.length}</strong> payroll records
              </p>
              <p className="text-xs text-slate-500">
                Total Net: <strong>{filteredPayrolls.reduce((sum, p) => sum + (p.net_salary || 0), 0).toLocaleString()}</strong> SAR
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => handleExport('csv')} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => handleExport('pdf')} className="bg-amber-600 hover:bg-amber-700">
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Report Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  {Object.keys(generateReportData()[0] || {}).map(header => (
                    <th key={header} className="text-left p-3 font-semibold text-slate-700">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {generateReportData().slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    {Object.values(row).map((value, i) => (
                      <td key={i} className="p-3 text-slate-900">
                        {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {generateReportData().length > 10 && (
              <p className="text-sm text-slate-500 text-center py-4">
                Showing first 10 of {generateReportData().length} rows
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}