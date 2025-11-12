import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Download, FileText, Filter, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

export default function CustomReportBuilder({ employees = [], projects = [], timeEntries = [], payrolls = [], attendance = [], leaves = [] }) {
  const [dataSource, setDataSource] = useState('employees');
  const [selectedFields, setSelectedFields] = useState([]);
  const [filters, setFilters] = useState([]);

  const dataSourceFields = {
    employees: [
      'employee_id', 'first_name', 'last_name', 'email', 'phone',
      'department', 'job_title', 'employment_type', 'status',
      'hire_date', 'basic_salary', 'housing_allowance', 'transport_allowance',
      'gosi_applicable', 'nationality'
    ],
    projects: [
      'project_code', 'project_name', 'client_name', 'department',
      'status', 'priority', 'progress', 'budget', 'actual_cost',
      'start_date', 'end_date', 'team_size'
    ],
    timeEntries: [
      'date', 'employee_id', 'project_id', 'hours', 'overtime_hours',
      'entry_type', 'is_billable', 'status', 'description'
    ],
    payrolls: [
      'month', 'employee_id', 'basic_salary', 'housing_allowance',
      'transport_allowance', 'overtime_pay', 'gross_salary',
      'gosi_employee', 'gosi_employer', 'total_deductions',
      'net_salary', 'status'
    ],
    attendance: [
      'date', 'employee_id', 'clock_in', 'clock_out',
      'actual_hours', 'overtime_hours', 'late_by', 'status'
    ],
    leaves: [
      'employee_id', 'leave_type', 'start_date', 'end_date',
      'total_days', 'reason', 'status'
    ]
  };

  const getData = () => {
    switch (dataSource) {
      case 'employees': return employees;
      case 'projects': return projects;
      case 'timeEntries': return timeEntries;
      case 'payrolls': return payrolls;
      case 'attendance': return attendance;
      case 'leaves': return leaves;
      default: return [];
    }
  };

  const toggleField = (field) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const addFilter = () => {
    setFilters([...filters, { field: '', operator: 'equals', value: '' }]);
  };

  const removeFilter = (index) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index, key, value) => {
    const newFilters = [...filters];
    newFilters[index][key] = value;
    setFilters(newFilters);
  };

  const applyFilters = (data) => {
    return data.filter(item => {
      return filters.every(filter => {
        if (!filter.field || !filter.value) return true;
        
        const itemValue = String(item[filter.field] || '').toLowerCase();
        const filterValue = String(filter.value).toLowerCase();

        switch (filter.operator) {
          case 'equals':
            return itemValue === filterValue;
          case 'contains':
            return itemValue.includes(filterValue);
          case 'starts_with':
            return itemValue.startsWith(filterValue);
          case 'greater_than':
            return parseFloat(itemValue) > parseFloat(filterValue);
          case 'less_than':
            return parseFloat(itemValue) < parseFloat(filterValue);
          default:
            return true;
        }
      });
    });
  };

  const generateReport = () => {
    const data = getData();
    const filtered = applyFilters(data);
    
    return filtered.map(item => {
      const row = {};
      selectedFields.forEach(field => {
        row[field] = item[field] || 'N/A';
      });
      return row;
    });
  };

  const handleExport = (format) => {
    if (selectedFields.length === 0) {
      toast.error('Please select at least one field');
      return;
    }

    const data = generateReport();
    const fileName = `custom_report_${dataSource}_${Date.now()}`;
    
    if (format === 'csv') {
      exportToCSV(data, fileName);
      toast.success('Custom report exported as CSV');
    } else if (format === 'pdf') {
      const title = `Custom Report - ${dataSource.toUpperCase()}`;
      exportToPDF(data, fileName, title);
      toast.success('Custom report exported as PDF');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-600" />
            Custom Report Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Source Selection */}
          <div>
            <Label>Data Source</Label>
            <Select value={dataSource} onValueChange={(val) => {
              setDataSource(val);
              setSelectedFields([]);
              setFilters([]);
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employees">Employees</SelectItem>
                <SelectItem value="projects">Projects</SelectItem>
                <SelectItem value="timeEntries">Time Entries</SelectItem>
                <SelectItem value="payrolls">Payrolls</SelectItem>
                <SelectItem value="attendance">Attendance</SelectItem>
                <SelectItem value="leaves">Leave Requests</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Field Selection */}
          <div>
            <Label className="mb-3 block">Select Fields</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {dataSourceFields[dataSource].map(field => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox
                    id={field}
                    checked={selectedFields.includes(field)}
                    onCheckedChange={() => toggleField(field)}
                  />
                  <label
                    htmlFor={field}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {field.replace(/_/g, ' ')}
                  </label>
                </div>
              ))}
            </div>
            {selectedFields.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedFields.map(field => (
                  <Badge key={field} variant="secondary">
                    {field}
                    <X
                      className="w-3 h-3 ml-1 cursor-pointer"
                      onClick={() => toggleField(field)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Filters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Filters</Label>
              <Button onClick={addFilter} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Filter
              </Button>
            </div>
            
            {filters.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4 border-2 border-dashed rounded-lg">
                No filters applied. Click "Add Filter" to add one.
              </p>
            ) : (
              <div className="space-y-3">
                {filters.map((filter, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center gap-3">
                      <Select
                        value={filter.field}
                        onValueChange={(val) => updateFilter(index, 'field', val)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Field" />
                        </SelectTrigger>
                        <SelectContent>
                          {dataSourceFields[dataSource].map(field => (
                            <SelectItem key={field} value={field}>
                              {field.replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={filter.operator}
                        onValueChange={(val) => updateFilter(index, 'operator', val)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Equals</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="starts_with">Starts With</SelectItem>
                          <SelectItem value="greater_than">Greater Than</SelectItem>
                          <SelectItem value="less_than">Less Than</SelectItem>
                        </SelectContent>
                      </Select>

                      <input
                        type="text"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg"
                      />

                      <Button
                        onClick={() => removeFilter(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Export Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-slate-600">
              <strong>{selectedFields.length}</strong> fields selected • 
              <strong className="ml-2">{filters.length}</strong> filters applied
            </p>
            <div className="flex gap-3">
              <Button onClick={() => handleExport('csv')} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => handleExport('pdf')} className="bg-indigo-600 hover:bg-indigo-700">
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {selectedFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr>
                    {selectedFields.map(field => (
                      <th key={field} className="text-left p-3 font-semibold text-slate-700">
                        {field.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {generateReport().slice(0, 10).map((row, idx) => (
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
              {generateReport().length > 10 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  Showing first 10 of {generateReport().length} rows
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}