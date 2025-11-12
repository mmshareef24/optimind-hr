import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Calendar, Users, AlertCircle, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function LeaveAnalytics({ leaveRequests = [], leaveBalances = [], employees = [] }) {
  const analytics = useMemo(() => {
    // Leave type distribution
    const leaveTypeCount = {};
    const leaveTypeApproved = {};
    const leaveTypePending = {};
    const leaveTypeRejected = {};

    leaveRequests.forEach(req => {
      leaveTypeCount[req.leave_type] = (leaveTypeCount[req.leave_type] || 0) + 1;
      
      if (req.status === 'approved') {
        leaveTypeApproved[req.leave_type] = (leaveTypeApproved[req.leave_type] || 0) + req.total_days;
      } else if (req.status === 'pending') {
        leaveTypePending[req.leave_type] = (leaveTypePending[req.leave_type] || 0) + req.total_days;
      } else if (req.status === 'rejected') {
        leaveTypeRejected[req.leave_type] = (leaveTypeRejected[req.leave_type] || 0) + 1;
      }
    });

    // Monthly trend
    const monthlyData = {};
    leaveRequests.forEach(req => {
      if (req.status === 'approved' && req.start_date) {
        const month = new Date(req.start_date).toLocaleDateString('en', { month: 'short', year: 'numeric' });
        monthlyData[month] = (monthlyData[month] || 0) + req.total_days;
      }
    });

    // Department analysis
    const departmentLeave = {};
    leaveRequests.forEach(req => {
      const emp = employees.find(e => e.id === req.employee_id);
      const dept = emp?.department || 'Unknown';
      if (req.status === 'approved') {
        departmentLeave[dept] = (departmentLeave[dept] || 0) + req.total_days;
      }
    });

    // Utilization rate
    const totalEntitled = leaveBalances.reduce((sum, bal) => sum + (bal.total_entitled || 0), 0);
    const totalUsed = leaveBalances.reduce((sum, bal) => sum + (bal.used || 0), 0);
    const utilizationRate = totalEntitled > 0 ? ((totalUsed / totalEntitled) * 100).toFixed(1) : 0;

    // Approval rate
    const totalRequests = leaveRequests.length;
    const approvedRequests = leaveRequests.filter(r => r.status === 'approved').length;
    const approvalRate = totalRequests > 0 ? ((approvedRequests / totalRequests) * 100).toFixed(1) : 0;

    return {
      leaveTypeCount,
      leaveTypeApproved,
      leaveTypePending,
      leaveTypeRejected,
      monthlyData,
      departmentLeave,
      utilizationRate,
      approvalRate,
      totalRequests,
      approvedRequests,
      totalEntitled,
      totalUsed
    };
  }, [leaveRequests, leaveBalances, employees]);

  const leaveTypeColors = {
    annual: { bg: 'from-blue-500 to-blue-600', text: 'text-blue-600', icon: '🏖️' },
    sick: { bg: 'from-red-500 to-red-600', text: 'text-red-600', icon: '🏥' },
    emergency: { bg: 'from-orange-500 to-orange-600', text: 'text-orange-600', icon: '🚨' },
    maternity: { bg: 'from-pink-500 to-pink-600', text: 'text-pink-600', icon: '👶' },
    paternity: { bg: 'from-purple-500 to-purple-600', text: 'text-purple-600', icon: '👨‍👧' },
    hajj: { bg: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600', icon: '🕋' },
    marriage: { bg: 'from-amber-500 to-amber-600', text: 'text-amber-600', icon: '💍' },
    bereavement: { bg: 'from-slate-500 to-slate-600', text: 'text-slate-600', icon: '🕊️' },
    unpaid: { bg: 'from-gray-500 to-gray-600', text: 'text-gray-600', icon: '💼' }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Calendar className="w-10 h-10 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-700">Total</Badge>
            </div>
            <p className="text-sm text-slate-600 mb-1">Total Requests</p>
            <p className="text-3xl font-bold text-blue-600">{analytics.totalRequests}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
              <Badge className="bg-emerald-100 text-emerald-700">{analytics.approvalRate}%</Badge>
            </div>
            <p className="text-sm text-slate-600 mb-1">Approval Rate</p>
            <p className="text-3xl font-bold text-emerald-600">{analytics.approvedRequests}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-10 h-10 text-purple-600" />
              <Badge className="bg-purple-100 text-purple-700">{analytics.utilizationRate}%</Badge>
            </div>
            <p className="text-sm text-slate-600 mb-1">Utilization Rate</p>
            <p className="text-3xl font-bold text-purple-600">{analytics.totalUsed}</p>
            <p className="text-xs text-slate-500 mt-1">of {analytics.totalEntitled} entitled</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-10 h-10 text-amber-600" />
              <Badge className="bg-amber-100 text-amber-700">Active</Badge>
            </div>
            <p className="text-sm text-slate-600 mb-1">Employees</p>
            <p className="text-3xl font-bold text-amber-600">{employees.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Leave Type Distribution */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-700" />
            Leave Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Object.entries(analytics.leaveTypeCount).map(([type, count]) => {
              const colors = leaveTypeColors[type] || leaveTypeColors.unpaid;
              const approved = analytics.leaveTypeApproved[type] || 0;
              const pending = analytics.leaveTypePending[type] || 0;
              const rejected = analytics.leaveTypeRejected[type] || 0;
              const total = approved + pending;
              const percentage = total > 0 ? (approved / total) * 100 : 0;

              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors.bg} flex items-center justify-center text-white font-bold shadow-md`}>
                        <span className="text-lg">{colors.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 capitalize">
                          {type.replace(/_/g, ' ')}
                        </h4>
                        <p className="text-sm text-slate-500">
                          {count} request{count !== 1 ? 's' : ''} • {approved} days approved
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {pending > 0 && (
                        <Badge className="bg-amber-100 text-amber-700">
                          {pending} pending
                        </Badge>
                      )}
                      {rejected > 0 && (
                        <Badge className="bg-red-100 text-red-700">
                          {rejected} rejected
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
            
            {Object.keys(analytics.leaveTypeCount).length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No leave data available for analysis</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Department Analysis */}
      {Object.keys(analytics.departmentLeave).length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-700" />
              Leave by Department
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Object.entries(analytics.departmentLeave)
                .sort(([, a], [, b]) => b - a)
                .map(([dept, days]) => {
                  const deptEmployees = employees.filter(e => e.department === dept).length;
                  const avgPerEmployee = deptEmployees > 0 ? (days / deptEmployees).toFixed(1) : 0;
                  const maxDays = Math.max(...Object.values(analytics.departmentLeave));
                  const percentage = (days / maxDays) * 100;

                  return (
                    <div key={dept} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-900">{dept}</h4>
                          <p className="text-sm text-slate-500">
                            {days} days • {deptEmployees} employees • {avgPerEmployee} avg/employee
                          </p>
                        </div>
                        <Badge className="bg-slate-100 text-slate-700">
                          {days} days
                        </Badge>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Trend */}
      {Object.keys(analytics.monthlyData).length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-700" />
              Monthly Leave Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Object.entries(analytics.monthlyData)
                .sort(([a], [b]) => new Date(a) - new Date(b))
                .slice(-6)
                .map(([month, days]) => {
                  const maxDays = Math.max(...Object.values(analytics.monthlyData));
                  const percentage = (days / maxDays) * 100;

                  return (
                    <div key={month} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">{month}</span>
                        <Badge className="bg-blue-100 text-blue-700">{days} days</Badge>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}