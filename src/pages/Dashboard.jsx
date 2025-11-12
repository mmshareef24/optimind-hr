import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Building2, Calendar, Clock, DollarSign, TrendingUp, AlertCircle, CheckCircle, Filter, FileText, Clock3 } from "lucide-react";
import StatCard from "../components/hrms/StatCard";
import ReportExporter from "../components/reports/ReportExporter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Dashboard() {
  const [selectedCompany, setSelectedCompany] = useState('all');

  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: allEmployees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: leaveRequests = [], isLoading: loadingLeaves } = useQuery({
    queryKey: ['leaveRequests'],
    queryFn: () => base44.entities.LeaveRequest.list('-created_date', 10),
  });

  const { data: attendance = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => base44.entities.Attendance.list('-date', 5),
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list(),
  });

  const { data: shiftAssignments = [] } = useQuery({
    queryKey: ['shift-assignments'],
    queryFn: () => base44.entities.ShiftAssignment.list(),
  });

  // Filter employees by selected company
  const employees = selectedCompany === 'all' 
    ? allEmployees 
    : allEmployees.filter(e => e.company_id === selectedCompany);

  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending').length;
  const selectedCompanyData = companies.find(c => c.id === selectedCompany);

  // Calculate shift statistics
  const activeShifts = shifts.filter(s => s.is_active).length;
  const employeesWithShifts = new Set(
    shiftAssignments.filter(a => a.status === 'active').map(a => a.employee_id)
  ).size;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header with Company Filter */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">Welcome back, here's your HR overview</p>
        </div>
        <div className="flex items-center gap-3">
          <ReportExporter
            reportType="employees"
            filters={selectedCompany !== 'all' ? { company_id: selectedCompany } : {}}
            buttonText="Export Report"
          />
          <div className="px-4 py-2 rounded-xl bg-white border border-emerald-100 shadow-sm">
            <span className="text-slate-500">Today: </span>
            <span className="font-semibold text-slate-900">{format(new Date(), 'dd MMM yyyy')}</span>
          </div>
          <div className="flex items-center gap-2 min-w-[280px]">
            <Filter className="w-5 h-5 text-slate-400" />
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select Company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>All Companies</span>
                  </div>
                </SelectItem>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>{company.name_en}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Selected Company Info */}
      {selectedCompanyData && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">{selectedCompanyData.name_en}</h3>
                <p className="text-sm text-slate-600">
                  {selectedCompanyData.industry} • CR: {selectedCompanyData.cr_number}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Total Employees</p>
                <p className="text-2xl font-bold text-blue-600">{employees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={loadingEmployees ? "..." : activeEmployees}
          icon={Users}
          trend="up"
          trendValue="+12%"
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title={selectedCompany === 'all' ? 'Total Companies' : 'Active Shifts'}
          value={loadingCompanies ? "..." : selectedCompany === 'all' ? companies.length : activeShifts}
          icon={selectedCompany === 'all' ? Building2 : Clock3}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Pending Leaves"
          value={loadingLeaves ? "..." : pendingLeaves}
          icon={Calendar}
          trend="down"
          trendValue="-5%"
          bgColor="from-amber-500 to-amber-600"
        />
        <StatCard
          title="Attendance Today"
          value={loadingAttendance ? "..." : attendance.filter(a => a.status === 'present').length}
          icon={Clock}
          trend="up"
          trendValue="+8%"
          bgColor="from-purple-500 to-purple-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Leave Requests */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-emerald-50/30">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Recent Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loadingLeaves ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : leaveRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No leave requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaveRequests.slice(0, 5).map((leave) => {
                  const employee = employees.find(e => e.id === leave.employee_id);
                  return (
                    <div key={leave.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 mb-1">
                          {employee ? `${employee.first_name} ${employee.last_name}` : `Employee #${leave.employee_id?.slice(0, 8)}`}
                        </p>
                        <p className="text-sm text-slate-500">
                          {leave.leave_type} • {leave.total_days} days
                        </p>
                      </div>
                      <Badge 
                        className={
                          leave.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                          'bg-red-100 text-red-700 border-red-200'
                        }
                      >
                        {leave.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-blue-50/30">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              HR Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-transparent border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Active Status</p>
                    <p className="text-lg font-bold text-slate-900">{activeEmployees} Employees</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-50 to-transparent border border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Pending Actions</p>
                    <p className="text-lg font-bold text-slate-900">{pendingLeaves} Leave Approvals</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-transparent border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Payroll Status</p>
                    <p className="text-lg font-bold text-slate-900">All Processed</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-50 to-transparent border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Clock3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Shift Coverage</p>
                    <p className="text-lg font-bold text-slate-900">{employeesWithShifts} Assigned</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Overview */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-purple-50/30">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Users className="w-5 h-5 text-purple-600" />
            Department Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loadingEmployees ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['IT', 'HR', 'Finance', 'Operations'].map((dept, idx) => {
                const count = employees.filter(e => e.department === dept).length;
                const colors = [
                  'from-emerald-500 to-emerald-600',
                  'from-blue-500 to-blue-600',
                  'from-amber-500 to-amber-600',
                  'from-purple-500 to-purple-600'
                ];
                return (
                  <div key={dept} className="p-4 rounded-xl bg-white border border-slate-100 hover:shadow-md transition-shadow">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[idx]} flex items-center justify-center mb-3 shadow-lg`}>
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mb-1">{count}</p>
                    <p className="text-sm text-slate-500">{dept}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}