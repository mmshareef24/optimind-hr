import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Download, FileText, Clock } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, exportToPDF } from '@/components/utils/exportUtils';

export default function TimeTrackingReports({ timeEntries = [], employees = [], projects = [] }) {
  const [reportType, setReportType] = useState('all_entries');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [employee, setEmployee] = useState('all');
  const [project, setProject] = useState('all');
  const [status, setStatus] = useState('all');

  const filteredEntries = useMemo(() => {
    return timeEntries.filter(entry => {
      const matchesMonth = entry.date?.startsWith(selectedMonth);
      const matchesEmployee = employee === 'all' || entry.employee_id === employee;
      const matchesProject = project === 'all' || entry.project_id === project;
      const matchesStatus = status === 'all' || entry.status === status;
      return matchesMonth && matchesEmployee && matchesProject && matchesStatus;
    });
  }, [timeEntries, selectedMonth, employee, project, status]);

  const generateReportData = () => {
    switch (reportType) {
      case 'all_entries':
        return filteredEntries.map(entry => {
          const emp = employees.find(e => e.id === entry.employee_id);
          const proj = projects.find(p => p.id === entry.project_id);
          return {
            'Date': entry.date,
            'Employee': emp ? `${emp.first_name} ${emp.last_name}` : 'N/A',
            'Project': proj ? proj.project_name : 'N/A',
            'Regular Hours': entry.hours || 0,
            'Overtime Hours': entry.overtime_hours || 0,
            'Total Hours': (entry.hours || 0) + (entry.overtime_hours || 0),
            'Type': entry.entry_type,
            'Billable': entry.is_billable ? 'Yes' : 'No',
            'Status': entry.status,
            'Description': entry.description || ''
          };
        });
      
      case 'employee_summary':
        const empSummary = {};
        filteredEntries.forEach(entry => {
          if (!empSummary[entry.employee_id]) {
            empSummary[entry.employee_id] = {
              total: 0,
              overtime: 0,
              entries: 0,
              billable: 0
            };
          }
          empSummary[entry.employee_id].total += (entry.hours || 0);
          empSummary[entry.employee_id].overtime += (entry.overtime_hours || 0);
          empSummary[entry.employee_id].entries++;
          if (entry.is_billable) {
            empSummary[entry.employee_id].billable += (entry.hours || 0);
          }
        });

        return Object.entries(empSummary).map(([empId, data]) => {
          const emp = employees.find(e => e.id === empId);
          return {
            'Employee': emp ? `${emp.first_name} ${emp.last_name}` : 'N/A',
            'Department': emp?.department || 'N/A',
            'Total Hours': data.total.toFixed(1),
            'Overtime Hours': data.overtime.toFixed(1),
            'Billable Hours': data.billable.toFixed(1),
            'Total Entries': data.entries
          };
        });
      
      case 'project_summary':
        const projSummary = {};
        filteredEntries.forEach(entry => {
          if (entry.project_id) {
            if (!projSummary[entry.project_id]) {
              projSummary[entry.project_id] = {
                total: 0,
                overtime: 0,
                entries: 0,
                employees: new Set()
              };
            }
            projSummary[entry.project_id].total += (entry.hours || 0);
            projSummary[entry.project_id].overtime += (entry.overtime_hours || 0);
            projSummary[entry.project_id].entries++;
            projSummary[entry.project_id].employees.add(entry.employee_id);
          }
        });

        return Object.entries(projSummary).map(([projId, data]) => {
          const proj = projects.find(p => p.id === projId);
          return {
            'Project': proj ? proj.project_name : 'N/A',
            'Project Code': proj?.project_code || 'N/A',
            'Total Hours': data.total.toFixed(1),
            'Overtime Hours': data.overtime.toFixed(1),
            'Team Members': data.employees.size,
            'Total Entries': data.entries
          };
        });
      
      case 'overtime_analysis':
        return filteredEntries
          .filter(entry => entry.overtime_hours > 0)
          .map(entry => {
            const emp = employees.find(e => e.id === entry.employee_id);
            return {
              'Date': entry.date,
              'Employee': emp ? `${emp.first_name} ${emp.last_name}` : 'N/A',
              'Department': emp?.department || 'N/A',
              'Regular Hours': entry.hours || 0,
              'Overtime Hours': entry.overtime_hours || 0,
              'Status': entry.status
            };
          });
      
      default:
        return [];
    }
  };

  const handleExport = (format) => {
    const data = generateReportData();
    const fileName = `time_tracking_report_${reportType}_${Date.now()}`;
    
    if (format === 'csv') {
      exportToCSV(data, fileName);
      toast.success('Report exported as CSV');
    } else if (format === 'pdf') {
      const title = `Time Tracking Report - ${reportType.replace(/_/g, ' ').toUpperCase()}`;
      exportToPDF(data, fileName, title);
      toast.success('Report exported as PDF');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Time Tracking Reports Configuration
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
                  <SelectItem value="all_entries">All Time Entries</SelectItem>
                  <SelectItem value="employee_summary">Employee Summary</SelectItem>
                  <SelectItem value="project_summary">Project Summary</SelectItem>
                  <SelectItem value="overtime_analysis">Overtime Analysis</SelectItem>
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
              <Label>Employee</Label>
              <Select value={employee} onValueChange={setEmployee}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Project</Label>
              <Select value={project} onValueChange={setProject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(proj => (
                    <SelectItem key={proj.id} value={proj.id}>
                      {proj.project_name}
                    </SelectItem>
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
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-slate-600">
              <strong>{filteredEntries.length}</strong> time entries • <strong>
                {filteredEntries.reduce((sum, e) => sum + (e.hours || 0) + (e.overtime_hours || 0), 0).toFixed(1)}
              </strong> total hours
            </p>
            <div className="flex gap-3">
              <Button onClick={() => handleExport('csv')} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => handleExport('pdf')} className="bg-purple-600 hover:bg-purple-700">
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