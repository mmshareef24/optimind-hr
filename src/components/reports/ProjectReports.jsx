import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Download, FileText, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

export default function ProjectReports({ projects = [], employees = [], timeEntries = [] }) {
  const [reportType, setReportType] = useState('all_projects');
  const [status, setStatus] = useState('all');
  const [department, setDepartment] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const departments = [...new Set(projects.map(p => p.department).filter(Boolean))];

  const filteredProjects = useMemo(() => {
    return projects.filter(proj => {
      const matchesStatus = status === 'all' || proj.status === status;
      const matchesDept = department === 'all' || proj.department === department;
      return matchesStatus && matchesDept;
    });
  }, [projects, status, department]);

  const generateReportData = () => {
    switch (reportType) {
      case 'all_projects':
        return filteredProjects.map(proj => {
          const manager = employees.find(e => e.id === proj.project_manager_id);
          return {
            'Project Code': proj.project_code,
            'Project Name': proj.project_name,
            'Client': proj.client_name || 'N/A',
            'Manager': manager ? `${manager.first_name} ${manager.last_name}` : 'N/A',
            'Department': proj.department || 'N/A',
            'Status': proj.status,
            'Priority': proj.priority,
            'Progress': `${proj.progress || 0}%`,
            'Budget': proj.budget || 0,
            'Team Size': proj.team_size || 0,
            'Start Date': proj.start_date,
            'End Date': proj.end_date
          };
        });
      
      case 'time_analysis':
        return filteredProjects.map(proj => {
          const projEntries = timeEntries.filter(t => t.project_id === proj.id);
          const totalHours = projEntries.reduce((sum, t) => sum + (t.hours || 0) + (t.overtime_hours || 0), 0);
          const billableHours = projEntries.filter(t => t.is_billable).reduce((sum, t) => sum + (t.hours || 0), 0);
          
          return {
            'Project Code': proj.project_code,
            'Project Name': proj.project_name,
            'Total Hours': totalHours.toFixed(1),
            'Billable Hours': billableHours.toFixed(1),
            'Time Entries': projEntries.length,
            'Status': proj.status,
            'Progress': `${proj.progress || 0}%`
          };
        });
      
      case 'budget_analysis':
        return filteredProjects.map(proj => {
          return {
            'Project Code': proj.project_code,
            'Project Name': proj.project_name,
            'Budget': proj.budget || 0,
            'Actual Cost': proj.actual_cost || 0,
            'Remaining': (proj.budget || 0) - (proj.actual_cost || 0),
            'Budget Usage': proj.budget > 0 ? `${((proj.actual_cost || 0) / proj.budget * 100).toFixed(1)}%` : '0%',
            'Status': proj.status
          };
        });
      
      case 'status_summary':
        const statusCount = {};
        filteredProjects.forEach(proj => {
          const status = proj.status || 'unknown';
          if (!statusCount[status]) {
            statusCount[status] = { count: 0, budget: 0, progress: [] };
          }
          statusCount[status].count++;
          statusCount[status].budget += proj.budget || 0;
          statusCount[status].progress.push(proj.progress || 0);
        });

        return Object.entries(statusCount).map(([status, data]) => ({
          'Status': status,
          'Project Count': data.count,
          'Total Budget': data.budget,
          'Average Progress': `${(data.progress.reduce((a, b) => a + b, 0) / data.count).toFixed(1)}%`
        }));
      
      default:
        return [];
    }
  };

  const handleExport = (format) => {
    const data = generateReportData();
    const fileName = `project_report_${reportType}_${Date.now()}`;
    
    if (format === 'csv') {
      exportToCSV(data, fileName);
      toast.success('Report exported as CSV');
    } else if (format === 'pdf') {
      const title = `Project Report - ${reportType.replace(/_/g, ' ').toUpperCase()}`;
      exportToPDF(data, fileName, title);
      toast.success('Report exported as PDF');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-600" />
            Project Reports Configuration
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
                  <SelectItem value="all_projects">All Projects</SelectItem>
                  <SelectItem value="time_analysis">Time Analysis</SelectItem>
                  <SelectItem value="budget_analysis">Budget Analysis</SelectItem>
                  <SelectItem value="status_summary">Status Summary</SelectItem>
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
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-slate-600">
              <strong>{filteredProjects.length}</strong> projects in report
            </p>
            <div className="flex gap-3">
              <Button onClick={() => handleExport('csv')} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => handleExport('pdf')} className="bg-blue-600 hover:bg-blue-700">
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