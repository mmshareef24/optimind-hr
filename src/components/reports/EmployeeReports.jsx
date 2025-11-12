import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Download, FileText, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, exportToPDF } from '@/utils/exportUtils';

export default function EmployeeReports({ employees = [], attendance = [], leaves = [], performanceReviews = [] }) {
  const [reportType, setReportType] = useState('all_employees');
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const filteredAndSorted = useMemo(() => {
    let filtered = employees.filter(emp => {
      const matchesDept = department === 'all' || emp.department === department;
      const matchesStatus = status === 'all' || emp.status === status;
      return matchesDept && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let compareA, compareB;
      
      switch (sortBy) {
        case 'name':
          compareA = `${a.first_name} ${a.last_name}`.toLowerCase();
          compareB = `${b.first_name} ${b.last_name}`.toLowerCase();
          break;
        case 'department':
          compareA = a.department || '';
          compareB = b.department || '';
          break;
        case 'hire_date':
          compareA = a.hire_date || '';
          compareB = b.hire_date || '';
          break;
        case 'salary':
          compareA = a.basic_salary || 0;
          compareB = b.basic_salary || 0;
          break;
        default:
          compareA = a.created_date || '';
          compareB = b.created_date || '';
      }

      if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [employees, department, status, sortBy, sortOrder]);

  const generateReportData = () => {
    switch (reportType) {
      case 'all_employees':
        return filteredAndSorted.map(emp => ({
          'Employee ID': emp.employee_id,
          'Name': `${emp.first_name} ${emp.last_name}`,
          'Email': emp.email,
          'Department': emp.department || 'N/A',
          'Job Title': emp.job_title,
          'Status': emp.status,
          'Hire Date': emp.hire_date,
          'Basic Salary': emp.basic_salary || 0
        }));
      
      case 'attendance_summary':
        return filteredAndSorted.map(emp => {
          const empAttendance = attendance.filter(a => a.employee_id === emp.id);
          const present = empAttendance.filter(a => a.status === 'present').length;
          const late = empAttendance.filter(a => a.status === 'late').length;
          const absent = empAttendance.filter(a => a.status === 'absent').length;
          
          return {
            'Employee ID': emp.employee_id,
            'Name': `${emp.first_name} ${emp.last_name}`,
            'Department': emp.department || 'N/A',
            'Present Days': present,
            'Late Days': late,
            'Absent Days': absent,
            'Total Days': empAttendance.length
          };
        });
      
      case 'leave_summary':
        return filteredAndSorted.map(emp => {
          const empLeaves = leaves.filter(l => l.employee_id === emp.id);
          const approved = empLeaves.filter(l => l.status === 'approved').length;
          const pending = empLeaves.filter(l => l.status === 'pending').length;
          const totalDays = empLeaves
            .filter(l => l.status === 'approved')
            .reduce((sum, l) => sum + (l.total_days || 0), 0);
          
          return {
            'Employee ID': emp.employee_id,
            'Name': `${emp.first_name} ${emp.last_name}`,
            'Department': emp.department || 'N/A',
            'Approved Leaves': approved,
            'Pending Leaves': pending,
            'Total Leave Days': totalDays
          };
        });
      
      case 'performance_summary':
        return filteredAndSorted.map(emp => {
          const empReviews = performanceReviews.filter(r => r.employee_id === emp.id);
          const avgRating = empReviews.length > 0
            ? empReviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / empReviews.length
            : 0;
          
          return {
            'Employee ID': emp.employee_id,
            'Name': `${emp.first_name} ${emp.last_name}`,
            'Department': emp.department || 'N/A',
            'Job Title': emp.job_title,
            'Total Reviews': empReviews.length,
            'Average Rating': avgRating.toFixed(2),
            'Last Review Date': empReviews.length > 0 ? empReviews[0].review_date : 'N/A'
          };
        });
      
      default:
        return [];
    }
  };

  const handleExport = (format) => {
    const data = generateReportData();
    const fileName = `employee_report_${reportType}_${Date.now()}`;
    
    if (format === 'csv') {
      exportToCSV(data, fileName);
      toast.success('Report exported as CSV');
    } else if (format === 'pdf') {
      const title = `Employee Report - ${reportType.replace(/_/g, ' ').toUpperCase()}`;
      exportToPDF(data, fileName, title);
      toast.success('Report exported as PDF');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Employee Reports Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_employees">All Employees</SelectItem>
                  <SelectItem value="attendance_summary">Attendance Summary</SelectItem>
                  <SelectItem value="leave_summary">Leave Summary</SelectItem>
                  <SelectItem value="performance_summary">Performance Summary</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="hire_date">Hire Date</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sort Order</Label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-slate-600">
              <strong>{filteredAndSorted.length}</strong> employees in report
            </p>
            <div className="flex gap-3">
              <Button onClick={() => handleExport('csv')} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => handleExport('pdf')} className="bg-emerald-600 hover:bg-emerald-700">
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
                        {value}
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