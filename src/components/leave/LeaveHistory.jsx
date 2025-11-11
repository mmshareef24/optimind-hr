import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Download } from "lucide-react";
import { format } from "date-fns";
import AdvancedSearchFilters from '../reports/AdvancedSearchFilters';
import { exportToCSV, exportToFormattedText } from '@/utils/reportExporter';
import { toast } from "sonner";

export default function LeaveHistory({ requests = [], employees = [] }) {
  const [filters, setFilters] = useState({
    status: 'all',
    leaveType: 'all',
    year: new Date().getFullYear().toString(),
    employee: 'all',
    dateFrom: '',
    dateTo: '',
    daysMin: '',
    daysMax: '',
    searches: []
  });

  const searchConfig = [
    { key: 'reason', label: 'Reason' },
    { key: 'rejection_reason', label: 'Rejection Reason' }
  ];

  const dateRangeConfig = [
    { key: 'dateFrom', label: 'Leave Start From', type: 'date' },
    { key: 'dateTo', label: 'Leave Start To', type: 'date' }
  ];

  const years = [...new Set(requests.map(r => new Date(r.start_date).getFullYear()))].sort((a, b) => b - a);

  const filterConfig = [
    {
      key: 'year',
      label: 'Year',
      type: 'select',
      options: years.map(y => ({ value: y.toString(), label: y.toString() }))
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    },
    {
      key: 'leaveType',
      label: 'Leave Type',
      type: 'select',
      options: [
        { value: 'annual', label: 'Annual' },
        { value: 'sick', label: 'Sick' },
        { value: 'unpaid', label: 'Unpaid' },
        { value: 'hajj', label: 'Hajj' },
        { value: 'maternity', label: 'Maternity' },
        { value: 'paternity', label: 'Paternity' },
        { value: 'marriage', label: 'Marriage' },
        { value: 'bereavement', label: 'Bereavement' },
        { value: 'emergency', label: 'Emergency' }
      ]
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
      key: 'daysMin',
      label: 'Min Days',
      type: 'number',
      placeholder: 'Minimum'
    },
    {
      key: 'daysMax',
      label: 'Max Days',
      type: 'number',
      placeholder: 'Maximum'
    }
  ];

  // Apply search filters
  const applySearchFilters = (req) => {
    if (!filters.searches || filters.searches.length === 0) return true;
    
    return filters.searches.every(search => {
      const fieldValue = String(req[search.field] || '').toLowerCase();
      return fieldValue.includes(search.value.toLowerCase());
    });
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      if (filters.status !== 'all' && req.status !== filters.status) return false;
      if (filters.leaveType !== 'all' && req.leave_type !== filters.leaveType) return false;
      if (filters.employee !== 'all' && req.employee_id !== filters.employee) return false;
      if (filters.year !== 'all' && new Date(req.start_date).getFullYear().toString() !== filters.year) return false;
      if (filters.dateFrom && req.start_date < filters.dateFrom) return false;
      if (filters.dateTo && req.start_date > filters.dateTo) return false;
      if (filters.daysMin && req.total_days < Number(filters.daysMin)) return false;
      if (filters.daysMax && req.total_days > Number(filters.daysMax)) return false;
      if (!applySearchFilters(req)) return false;
      return true;
    });
  }, [requests, filters]);

  const handleExport = (format) => {
    try {
      const exportData = filteredRequests.map(req => {
        const employee = employees.find(e => e.id === req.employee_id);
        return {
          employee: employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown',
          employee_id: employee?.employee_id || '',
          leave_type: req.leave_type,
          start_date: req.start_date,
          end_date: req.end_date,
          total_days: req.total_days,
          status: req.status,
          reason: req.reason,
          submission_date: req.created_date,
          approval_date: req.approval_date || '',
          rejection_reason: req.rejection_reason || ''
        };
      });
      
      if (format === 'csv') {
        exportToCSV(exportData, `leave-history-${Date.now()}`);
      } else {
        exportToFormattedText(exportData, `leave-history-${Date.now()}`, {
          title: 'Leave History Report',
          subtitle: `Generated on ${new Date().toLocaleDateString()} | ${filteredRequests.length} of ${requests.length} requests`,
          summary: {
            'Total Requests': filteredRequests.length,
            'Approved': filteredRequests.filter(r => r.status === 'approved').length,
            'Pending': filteredRequests.filter(r => r.status === 'pending').length,
            'Rejected': filteredRequests.filter(r => r.status === 'rejected').length,
            'Total Days': filteredRequests.reduce((sum, r) => sum + r.total_days, 0)
          }
        });
      }
      
      toast.success(`Leave history exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export leave history');
    }
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      leaveType: 'all',
      year: new Date().getFullYear().toString(),
      employee: 'all',
      dateFrom: '',
      dateTo: '',
      daysMin: '',
      daysMax: '',
      searches: []
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Leave History
              <Badge className="bg-emerald-100 text-emerald-700">
                {filteredRequests.length} of {requests.length}
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => handleExport('csv')} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button onClick={() => handleExport('txt')} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Report
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <AdvancedSearchFilters
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={clearFilters}
            filterConfig={filterConfig}
            searchConfig={searchConfig}
            dateRangeConfig={dateRangeConfig}
          />

          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-2">No leave requests found</p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => {
                const employee = employees.find(e => e.id === request.employee_id);
                return (
                  <Card key={request.id} className="border border-slate-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-slate-900 capitalize">
                              {request.leave_type.replace('_', ' ')} Leave
                            </h4>
                            <Badge className={
                              request.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              request.status === 'cancelled' ? 'bg-slate-100 text-slate-700' :
                              'bg-amber-100 text-amber-700'
                            }>
                              {request.status}
                            </Badge>
                          </div>
                          
                          {employee && (
                            <p className="text-sm text-slate-600 mb-2">
                              {employee.first_name} {employee.last_name}
                            </p>
                          )}

                          <div className="grid md:grid-cols-3 gap-2 text-sm text-slate-600">
                            <p>
                              <strong>From:</strong> {format(new Date(request.start_date), 'MMM dd, yyyy')}
                            </p>
                            <p>
                              <strong>To:</strong> {format(new Date(request.end_date), 'MMM dd, yyyy')}
                            </p>
                            <p>
                              <strong>Duration:</strong> {request.total_days} days
                            </p>
                          </div>

                          {request.reason && (
                            <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                              <strong>Reason:</strong> {request.reason}
                            </p>
                          )}

                          {request.rejection_reason && (
                            <p className="text-sm text-red-600 mt-2">
                              <strong>Rejection reason:</strong> {request.rejection_reason}
                            </p>
                          )}

                          {request.approval_date && (
                            <p className="text-xs text-slate-400 mt-2">
                              {request.status === 'approved' ? 'Approved' : 'Rejected'} on {format(new Date(request.approval_date), 'MMM dd, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}