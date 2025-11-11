import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Download, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReportFilters from './ReportFilters';
import ReportTable from './ReportTable';
import AnalyticsChart from './AnalyticsChart';
import AdvancedSearchFilter from './AdvancedSearchFilter';
import DateRangeFilter from './DateRangeFilter';
import { exportToCSV, exportToFormattedText } from '@/utils/reportExporter';
import { toast } from "sonner";

export default function TimeTrackingReports({ 
  timeEntries = [], 
  employees = [],
  projects = []
}) {
  const [filters, setFilters] = useState({
    employee: 'all',
    project: 'all',
    status: 'all',
    month: new Date().toISOString().substring(0, 7)
  });

  const [searchTerms, setSearchTerms] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [savedPresets, setSavedPresets] = useState([]);

  const searchableFields = [
    { value: 'employee_id', label: 'Employee ID' },
    { value: 'date', label: 'Date' },
    { value: 'hours', label: 'Hours' },
    { value: 'overtime_hours', label: 'Overtime Hours' },
    { value: 'description', label: 'Description' },
    { value: 'status', label: 'Status' }
  ];

  const filterConfig = [
    {
      key: 'month',
      label: 'Month',
      type: 'month',
      max: new Date().toISOString().substring(0, 7)
    },
    {
      key: 'employee',
      label: 'Employee',
      type: 'select',
      options: employees.map(e => ({ 
        value: e.id, 
        label: `${e.first_name} ${e.last_name}` 
      }))
    },
    {
      key: 'project',
      label: 'Project',
      type: 'select',
      options: projects.map(p => ({ 
        value: p.id, 
        label: p.project_name 
      }))
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' }
      ]
    }
  ];

  // Apply advanced search
  const applyAdvancedSearch = (entry, terms) => {
    if (terms.length === 0) return true;

    return terms.every(term => {
      const value = String(entry[term.field] || '').toLowerCase();
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
    return timeEntries.filter(entry => {
      if (filters.employee !== 'all' && entry.employee_id !== filters.employee) return false;
      if (filters.project !== 'all' && entry.project_id !== filters.project) return false;
      if (filters.status !== 'all' && entry.status !== filters.status) return false;
      if (filters.month && !entry.date.startsWith(filters.month)) return false;
      if (dateFrom && entry.date < dateFrom) return false;
      if (dateTo && entry.date > dateTo) return false;
      if (!applyAdvancedSearch(entry, searchTerms)) return false;
      return true;
    });
  }, [timeEntries, filters, searchTerms, dateFrom, dateTo]);

  const employeeHoursData = useMemo(() => {
    const hours = {};
    filteredData.forEach(entry => {
      const emp = employees.find(e => e.id === entry.employee_id);
      const name = emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown';
      hours[name] = (hours[name] || 0) + (entry.hours || 0) + (entry.overtime_hours || 0);
    });
    return Object.entries(hours)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredData, employees]);

  const columns = [
    { 
      key: 'employee_name', 
      label: 'Employee',
      render: (_, row) => {
        const emp = employees.find(e => e.id === row.employee_id);
        return emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown';
      }
    },
    { key: 'date', label: 'Date', format: 'date' },
    { key: 'hours', label: 'Hours' },
    { key: 'overtime_hours', label: 'Overtime' },
    { 
      key: 'total_hours', 
      label: 'Total Hours',
      render: (_, row) => ((row.hours || 0) + (row.overtime_hours || 0)).toFixed(2)
    },
    { 
      key: 'project_name', 
      label: 'Project',
      render: (_, row) => {
        const proj = projects.find(p => p.id === row.project_id);
        return proj ? proj.project_name : '—';
      }
    },
    { key: 'status', label: 'Status' }
  ];

  const exportData = filteredData.map(entry => {
    const emp = employees.find(e => e.id === entry.employee_id);
    const proj = projects.find(p => p.id === entry.project_id);
    return {
      employee_id: emp?.employee_id || '',
      employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
      date: entry.date,
      hours: entry.hours,
      overtime_hours: entry.overtime_hours,
      total_hours: (entry.hours || 0) + (entry.overtime_hours || 0),
      project: proj?.project_name || '',
      description: entry.description,
      status: entry.status
    };
  });

  const handleExport = (format) => {
    try {
      const totalHours = filteredData.reduce((sum, e) => sum + (e.hours || 0), 0);
      const totalOvertime = filteredData.reduce((sum, e) => sum + (e.overtime_hours || 0), 0);

      if (format === 'csv') {
        exportToCSV(exportData, `time-tracking-report-${Date.now()}`);
      } else {
        exportToFormattedText(exportData, `time-tracking-report-${Date.now()}`, {
          title: 'Time Tracking Report',
          subtitle: `Period: ${filters.month || 'All Time'}`,
          summary: {
            'Total Entries': filteredData.length,
            'Total Hours': `${totalHours.toFixed(2)}h`,
            'Total Overtime': `${totalOvertime.toFixed(2)}h`,
            'Approved Entries': filteredData.filter(e => e.status === 'approved').length,
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

  const totalHours = filteredData.reduce((sum, e) => sum + (e.hours || 0), 0);
  const totalOvertime = filteredData.reduce((sum, e) => sum + (e.overtime_hours || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Hours</p>
                <p className="text-3xl font-bold text-emerald-600">{totalHours.toFixed(1)}h</p>
              </div>
              <Clock className="w-10 h-10 text-emerald-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Overtime</p>
                <p className="text-3xl font-bold text-amber-600">{totalOvertime.toFixed(1)}h</p>
              </div>
              <TrendingUp className="w-10 h-10 text-amber-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Entries</p>
                <p className="text-3xl font-bold text-blue-600">{filteredData.length}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Approved</p>
                <p className="text-3xl font-bold text-purple-600">
                  {filteredData.filter(e => e.status === 'approved').length}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-500 opacity-20" />
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
        label="Time Entry Date Range"
      />

      <ReportFilters
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={() => setFilters({
          employee: 'all',
          project: 'all',
          status: 'all',
          month: new Date().toISOString().substring(0, 7)
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

      <AnalyticsChart
        data={employeeHoursData}
        type="bar"
        title="Top 10 Employees by Hours"
        xKey="name"
        yKey="value"
        height={300}
      />

      <ReportTable
        data={exportData}
        columns={columns}
        title="Time Entry Details"
        onExport={() => handleExport('csv')}
      />
    </div>
  );
}