import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { FolderKanban, Download, TrendingUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReportFilters from './ReportFilters';
import ReportTable from './ReportTable';
import AnalyticsChart from './AnalyticsChart';
import AdvancedSearchFilter from './AdvancedSearchFilter';
import DateRangeFilter from './DateRangeFilter';
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
    riskLevel: 'all'
  });

  const [searchTerms, setSearchTerms] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [savedPresets, setSavedPresets] = useState([]);

  const searchableFields = [
    { value: 'project_code', label: 'Project Code' },
    { value: 'project_name', label: 'Project Name' },
    { value: 'client_name', label: 'Client Name' },
    { value: 'department', label: 'Department' },
    { value: 'status', label: 'Status' },
    { value: 'priority', label: 'Priority' },
    { value: 'budget', label: 'Budget' },
    { value: 'actual_cost', label: 'Actual Cost' },
    { value: 'progress', label: 'Progress %' },
    { value: 'team_size', label: 'Team Size' }
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
    }
  ];

  // Apply advanced search
  const applyAdvancedSearch = (proj, terms) => {
    if (terms.length === 0) return true;

    return terms.every(term => {
      const value = String(proj[term.field] || '').toLowerCase();
      const searchValue = term.value.toLowerCase();

      switch (term.operator) {
        case 'contains':
          return value.includes(searchValue);
        case 'equals':
          return value === searchValue;
        case 'startsWith':
          return value.startsWith(searchValue);
        case 'endsWith':
          return value.endsWith(searchValue);
        case 'notContains':
          return !value.includes(searchValue);
        case 'greaterThan':
          return parseFloat(value) > parseFloat(searchValue);
        case 'lessThan':
          return parseFloat(value) < parseFloat(searchValue);
        default:
          return true;
      }
    });
  };

  const filteredData = useMemo(() => {
    return projects.filter(proj => {
      if (filters.status !== 'all' && proj.status !== filters.status) return false;
      if (filters.priority !== 'all' && proj.priority !== filters.priority) return false;
      if (filters.department !== 'all' && proj.department !== filters.department) return false;
      if (filters.riskLevel !== 'all' && proj.risk_level !== filters.riskLevel) return false;
      if (dateFrom && proj.start_date < dateFrom) return false;
      if (dateTo && proj.start_date > dateTo) return false;
      if (!applyAdvancedSearch(proj, searchTerms)) return false;
      return true;
    });
  }, [projects, filters, searchTerms, dateFrom, dateTo]);

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
          subtitle: `Generated on ${new Date().toLocaleDateString()}`,
          summary: {
            'Total Projects': filteredData.length,
            'In Progress': filteredData.filter(p => p.status === 'in_progress').length,
            'Completed': filteredData.filter(p => p.status === 'completed').length,
            'Total Budget': `${filteredData.reduce((sum, p) => sum + (p.budget || 0), 0).toLocaleString()} SAR`,
            'Average Progress': `${(filteredData.reduce((sum, p) => sum + (p.progress || 0), 0) / (filteredData.length || 1)).toFixed(1)}%`,
            'Date Range': dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'All Time',
            'Active Filters': searchTerms.length + (dateFrom || dateTo ? 1 : 0)
          }
        });
      }
      toast.success(`Report exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const handleSavePreset = (preset) => {
    setSavedPresets([...savedPresets, preset]);
  };

  const totalBudget = filteredData.reduce((sum, p) => sum + (p.budget || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Projects</p>
                <p className="text-3xl font-bold text-blue-600">{filteredData.length}</p>
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

      <AdvancedSearchFilter
        onSearch={setSearchTerms}
        searchableFields={searchableFields}
        onClearSearch={() => setSearchTerms([])}
        savedPresets={savedPresets}
        onSavePreset={handleSavePreset}
        onLoadPreset={(preset) => setSearchTerms(preset.terms)}
      />

      <DateRangeFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onClear={() => {
          setDateFrom('');
          setDateTo('');
        }}
        label="Project Start Date Range"
      />

      <ReportFilters
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={() => setFilters({
          status: 'all',
          priority: 'all',
          department: 'all',
          riskLevel: 'all'
        })}
        filterConfig={filterConfig}
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