
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { exportToCSV } from '../utils/reportExporter'; // Updated path
import { toast } from "sonner";

export default function LeaveHistory({ requests = [], employees = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const filteredRequests = requests.filter(req => {
    const matchesSearch = searchTerm === '' || 
      req.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchesType = filterType === 'all' || req.leave_type === filterType;
    const matchesYear = filterYear === 'all' || 
      new Date(req.start_date).getFullYear().toString() === filterYear;
    
    return matchesSearch && matchesStatus && matchesType && matchesYear;
  });

  const handleExport = () => {
    try {
      const exportData = filteredRequests.map(req => {
        const employee = employees.find(e => e.id === req.employee_id);
        return {
          employee: employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown',
          leave_type: req.leave_type,
          start_date: req.start_date,
          end_date: req.end_date,
          total_days: req.total_days,
          status: req.status,
          reason: req.reason,
          submission_date: req.created_date
        };
      });
      
      exportToCSV(exportData, `leave-history-${Date.now()}`);
      toast.success('Leave history exported successfully');
    } catch (error) {
      toast.error('Failed to export leave history');
    }
  };

  const years = [...new Set(requests.map(r => new Date(r.start_date).getFullYear()))].sort((a, b) => b - a);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Leave History ({filteredRequests.length})
          </CardTitle>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Filters */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Leave Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
              <SelectItem value="sick">Sick</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="hajj">Hajj</SelectItem>
              <SelectItem value="maternity">Maternity</SelectItem>
              <SelectItem value="paternity">Paternity</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* History List */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No leave requests found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => {
              const employee = employees.find(e => e.id === request.employee_id);
              return (
                <Card key={request.id} className="border border-slate-200">
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
                            {request.reason}
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
  );
}
