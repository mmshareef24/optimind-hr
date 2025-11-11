import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { FolderKanban, Download, TrendingUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdvancedSearchFilters from './AdvancedSearchFilters';
import ReportTable from './ReportTable';
import AnalyticsChart from './AnalyticsChart';
import { exportToCSV, exportToFormattedText } from '@/utils/reportExporter';
import { toast } from "sonner";

export default function ProjectReports({ 
  projects = [], 
  tasks = [],
  employees = [],
  departments = []
}) {
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    department: 'all',
    riskLevel: 'all',
    dateFrom: '',
    dateTo: '',
    budgetMin: '',
    budgetMax: '',
    progressMin: '',
    progressMax: '',
    searches: []
  });

  const searchConfig = [
    { key: 'project_name', label: 'Project Name' },
    { key: 'project_code', label: 'Project Code' },
    { key: 'client_name', label: 'Client Name' },
    { key: 'description', label: 'Description' }
  ];

  const dateRangeConfig = [
    { key: 'dateFrom', label: 'Start Date From', type: 'date' },
    { key: 'dateTo', label: 'Start Date To', type: 'date' }
  ];

  const filterConfig = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'planning', label: 'Planning' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'on_hold', label: 'On Hold' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' }
      ]
    },
    {
      key: 'department',
      label: 'Department',
      type: 'select',
      options: departments.map(d => ({ value: d, label: d }))
    },
    {
      key: 'riskLevel',
      label: 'Risk Level',
      type: 'select',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' }
      ]
    },
    {
      key: 'budgetMin',
      label: 'Min Budget (SAR)',
      type: 'number',
      placeholder: 'Minimum'
    },
    {
      key: 'budgetMax',
      label: 'Max Budget (SAR)',
      type: 'number',
      placeholder: 'Maximum'
    },
    {
      key: 'progressMin',
      label: 'Min Progress (%)',
      type: 'number',
      placeholder: '0-100'
    },
    {
      key: 'progressMax',
      label: 'Max Progress (%)',
      type: 'number',
      placeholder: '0-100'
    }
  ];

  // Apply search filters
  const applySearchFilters = (proj) => {
    if (!filters.searches || filters.searches.length === 0) return true;
    
    return filters.searches.every(search => {
      const fieldValue = String(proj[search.field] || '').toLowerCase();
      return fieldValue.includes(search.value.toLowerCase());
    });
  };

  const filteredData = useMemo(() => {
    return projects.filter(proj => {
      if (filters.status !== 'all' && proj.status !== filters.status) return false;
      if (filters.priority !== 'all' && proj.priority !== filters.priority) return false;
      if (filters.department !== 'all' && proj.department !== filters.department) return false;
      if (filters.riskLevel !== 'all' && proj.risk_level !== filters.riskLevel) return false;
      if (filters.dateFrom && proj.start_date < filters.dateFrom) return false;
      if (filters.dateTo && proj.start_date > filters.dateTo) return false;
      if (filters.budgetMin && (proj.budget || 0) < Number(filters.budgetMin)) return false;
      if (filters.budgetMax && (proj.budget || 0) > Number(filters.budgetMax)) return false;
      if (filters.progressMin && (proj.progress || 0) < Number(filters.progressMin)) return false;
      if (filters.progressMax && (proj.progress || 0) > Number(filters.progressMax)) return false;
      if (!applySearchFilters(proj)) return false;
      return true;
    });
  }, [projects, filters]);

  const statusData = useMemo(() => {
    const counts = {};
    filteredData.forEach(proj => {
      counts[proj.status] = (counts[proj.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const budgetData = useMemo(() => {
    return filteredData.slice(0, 10).map(proj => ({
      name: proj.project_code,
      budget: proj.budget,
      actual: proj.actual_cost
    }));
  }, [filteredData]);

  const columns = [
    { key: 'project_code', label: 'Code' },
    { key: 'project_name', label: 'Project Name' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'progress', label: 'Progress (%)' },
    { key: 'budget', label: 'Budget', format: 'currency' },
    { key: 'actual_cost', label: 'Actual Cost', format: 'currency' },
    { key: 'start_date', label: 'Start Date', format: 'date' }
  ];

  const exportData = filteredData;

  const handleExport = (format) => {
    try {
      if (format === 'csv') {
        exportToCSV(exportData, `project-report-${Date.now()}`);
      } else {
        exportToFormattedText(exportData, `project-report-${Date.now()}`, {
          title: 'Project Report',
          subtitle: `Generated on ${new Date().toLocaleDateString()} | ${filteredData.length} of ${projects.length} projects`,
          summary: {
            'Total Projects': filteredData.length,
            'In Progress': filteredData.filter(p => p.status === 'in_progress').length,
            'Completed': filteredData.filter(p => p.status === 'completed').length,
            'Total Budget': `${filteredData.reduce((sum, p) => sum + (p.budget || 0), 0).toLocaleString()} SAR`,
            'Total Actual Cost': `${filteredData.reduce((sum, p) => sum + (p.actual_cost || 0), 0).toLocaleString()} SAR`,
            'Average Progress': `${(filteredData.reduce((sum, p) => sum + (p.progress || 0), 0) / (filteredData.length || 1)).toFixed(1)}%`
          }
        });
      }
      toast.success(`Report exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      department: 'all',
      riskLevel: 'all',
      dateFrom: '',
      dateTo: '',
      budgetMin: '',
      budgetMax: '',
      progressMin: '',
      progressMax: '',
      searches: []
    });
  };

  const totalBudget = filteredData.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalActual = filteredData.reduce((sum, p) => sum + (p.actual_cost || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Projects</p>
                <p className="text-3xl font-bold text-blue-600">{filteredData.length}</p>
                <p className="text-xs text-slate-500 mt-1">of {projects.length}</p>
              </div>
              <FolderKanban className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {filteredData.filter(p => p.status === 'in_progress').length}
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
                <p className="text-sm text-slate-600 mb-1">Total Budget</p>
                <p className="text-xl font-bold text-purple-600">
                  {(totalBudget / 1000000).toFixed(1)}M SAR
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Avg Progress</p>
                <p className="text-3xl font-bold text-amber-600">
                  {(filteredData.reduce((sum, p) => sum + (p.progress || 0), 0) / (filteredData.length || 1)).toFixed(0)}%
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-amber-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <AdvancedSearchFilters
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={clearFilters}
        filterConfig={filterConfig}
        searchConfig={searchConfig}
        dateRangeConfig={dateRangeConfig}
      />

      <div className="flex justify-end gap-2">
        <Button onClick={() => handleExport('csv')} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
        <Button onClick={() => handleExport('txt')} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <AnalyticsChart
          data={statusData}
          type="pie"
          title="Projects by Status"
          xKey="name"
          yKey="value"
        />
        <AnalyticsChart
          data={budgetData}
          type="bar"
          title="Budget vs Actual (Top 10)"
          xKey="name"
          yKey="budget"
        />
      </div>

      <ReportTable
        data={exportData}
        columns={columns}
        title="Project Details"
        onExport={() => handleExport('csv')}
      />
    </div>
  );
}