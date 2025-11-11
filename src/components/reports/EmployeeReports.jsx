import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Download, TrendingUp } from "lucide-react";
import ReportFilters from './ReportFilters';
import ReportTable from './ReportTable';
import AnalyticsChart from './AnalyticsChart';
import AdvancedSearchFilter from './AdvancedSearchFilter';
import DateRangeFilter from './DateRangeFilter';
import { exportToCSV, exportToFormattedText } from '@/utils/reportExporter';
import { toast } from "sonner";

export default function EmployeeReports({ employees = [], departments = [] }) {
  const [filters, setFilters] = useState({
    department: 'all',
    status: 'all',
    employmentType: 'all',
    nationality: 'all',
    gosiApplicable: 'all'
  });

  const [searchTerms, setSearchTerms] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [savedPresets, setSavedPresets] = useState([]);

  const searchableFields = [
    { value: 'employee_id', label: 'Employee ID' },
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'job_title', label: 'Job Title' },
    { value: 'department', label: 'Department' },
    { value: 'nationality', label: 'Nationality' },
    { value: 'national_id', label: 'National ID' },
    { value: 'basic_salary', label: 'Basic Salary' }
  ];

  const filterConfig = [
    {
      key: 'department',
      label: 'Department',
      type: 'select',
      options: departments.map(d => ({ value: d, label: d }))
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'on_leave', label: 'On Leave' },
        { value: 'terminated', label: 'Terminated' }
      ]
    },
    {
      key: 'employmentType',
      label: 'Employment Type',
      type: 'select',
      options: [
        { value: 'full_time', label: 'Full Time' },
        { value: 'part_time', label: 'Part Time' },
        { value: 'contract', label: 'Contract' },
        { value: 'temporary', label: 'Temporary' }
      ]
    },
    {
      key: 'gosiApplicable',
      label: 'GOSI',
      type: 'select',
      options: [
        { value: 'yes', label: 'Applicable' },
        { value: 'no', label: 'Not Applicable' }
      ]
    }
  ];

  // Apply advanced search
  const applyAdvancedSearch = (emp, terms) => {
    if (terms.length === 0) return true;

    return terms.every(term => {
      const value = String(emp[term.field] || '').toLowerCase();
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

  // Filter data
  const filteredData = useMemo(() => {
    return employees.filter(emp => {
      // Basic filters
      if (filters.department !== 'all' && emp.department !== filters.department) return false;
      if (filters.status !== 'all' && emp.status !== filters.status) return false;
      if (filters.employmentType !== 'all' && emp.employment_type !== filters.employmentType) return false;
      if (filters.gosiApplicable === 'yes' && !emp.gosi_applicable) return false;
      if (filters.gosiApplicable === 'no' && emp.gosi_applicable) return false;

      // Date range filter
      if (dateFrom && emp.hire_date < dateFrom) return false;
      if (dateTo && emp.hire_date > dateTo) return false;

      // Advanced search
      if (!applyAdvancedSearch(emp, searchTerms)) return false;

      return true;
    });
  }, [employees, filters, searchTerms, dateFrom, dateTo]);

  // Analytics data
  const departmentData = useMemo(() => {
    const counts = {};
    filteredData.forEach(emp => {
      const dept = emp.department || 'No Department';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const statusData = useMemo(() => {
    const counts = {};
    filteredData.forEach(emp => {
      counts[emp.status] = (counts[emp.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  // Table columns
  const columns = [
    { key: 'employee_id', label: 'Employee ID' },
    { key: 'full_name', label: 'Name' },
    { key: 'job_title', label: 'Job Title' },
    { key: 'department', label: 'Department' },
    { key: 'status', label: 'Status', render: (val) => val.replace('_', ' ') },
    { key: 'hire_date', label: 'Hire Date', format: 'date' },
    { key: 'basic_salary', label: 'Salary', format: 'currency' }
  ];

  // Prepare export data
  const exportData = filteredData.map(emp => ({
    employee_id: emp.employee_id,
    full_name: `${emp.first_name} ${emp.last_name}`,
    job_title: emp.job_title,
    department: emp.department,
    status: emp.status,
    employment_type: emp.employment_type,
    hire_date: emp.hire_date,
    basic_salary: emp.basic_salary,
    gosi_applicable: emp.gosi_applicable
  }));

  const handleExport = (format) => {
    try {
      if (format === 'csv') {
        exportToCSV(exportData, `employee-report-${Date.now()}`);
      } else {
        exportToFormattedText(exportData, `employee-report-${Date.now()}`, {
          title: 'Employee Report',
          subtitle: `Generated on ${new Date().toLocaleDateString()}`,
          summary: {
            'Total Employees': filteredData.length,
            'Active Employees': filteredData.filter(e => e.status === 'active').length,
            'Departments': new Set(filteredData.map(e => e.department)).size,
            'Average Salary': `${(filteredData.reduce((sum, e) => sum + (e.basic_salary || 0), 0) / (filteredData.length || 1)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} SAR`,
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

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Employees</p>
                <p className="text-3xl font-bold text-emerald-600">{filteredData.length}</p>
              </div>
              <Users className="w-10 h-10 text-emerald-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Active</p>
                <p className="text-3xl font-bold text-blue-600">
                  {filteredData.filter(e => e.status === 'active').length}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Departments</p>
                <p className="text-3xl font-bold text-purple-600">
                  {new Set(filteredData.map(e => e.department)).size}
                </p>
              </div>
              <Users className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Avg Salary</p>
                <p className="text-xl font-bold text-amber-600">
                  {(filteredData.reduce((sum, e) => sum + (e.basic_salary || 0), 0) / (filteredData.length || 1)).toFixed(0)} SAR
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-amber-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Search */}
      <AdvancedSearchFilter
        onSearch={setSearchTerms}
        searchableFields={searchableFields}
        onClearSearch={() => setSearchTerms([])}
        savedPresets={savedPresets}
        onSavePreset={handleSavePreset}
        onLoadPreset={(preset) => setSearchTerms(preset.terms)}
      />

      {/* Date Range Filter */}
      <DateRangeFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onClear={() => {
          setDateFrom('');
          setDateTo('');
        }}
        label="Hire Date Range"
      />

      {/* Standard Filters */}
      <ReportFilters
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={() => setFilters({
          department: 'all',
          status: 'all',
          employmentType: 'all',
          nationality: 'all',
          gosiApplicable: 'all'
        })}
        filterConfig={filterConfig}
      />

      {/* Export Buttons */}
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

      {/* Analytics */}
      <div className="grid md:grid-cols-2 gap-6">
        <AnalyticsChart
          data={departmentData}
          type="bar"
          title="Employees by Department"
          xKey="name"
          yKey="value"
        />
        <AnalyticsChart
          data={statusData}
          type="pie"
          title="Employee Status Distribution"
          xKey="name"
          yKey="value"
        />
      </div>

      {/* Data Table */}
      <ReportTable
        data={exportData}
        columns={columns}
        title="Employee Details"
        onExport={() => handleExport('csv')}
      />
    </div>
  );
}