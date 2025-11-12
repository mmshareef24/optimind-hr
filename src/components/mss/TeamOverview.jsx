import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function TeamOverview({ teamMembers, leaveRequests, attendance, performanceGoals, performanceReviews }) {
  // Calculate metrics
  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending').length;
  const onLeaveToday = leaveRequests.filter(l => {
    const today = new Date().toISOString().split('T')[0];
    return l.status === 'approved' && l.start_date <= today && l.end_date >= today;
  }).length;

  // Recent attendance (last 30 days)
  const last30Days = attendance.slice(0, Math.min(attendance.length, teamMembers.length * 30));
  const presentCount = last30Days.filter(a => a.status === 'present').length;
  const lateCount = last30Days.filter(a => a.status === 'late').length;
  const absentCount = last30Days.filter(a => a.status === 'absent').length;
  const attendanceRate = last30Days.length > 0 ? Math.round((presentCount / last30Days.length) * 100) : 0;

  // Performance metrics
  const activeGoals = performanceGoals.filter(g => g.status === 'in_progress').length;
  const completedGoals = performanceGoals.filter(g => g.status === 'completed').length;
  const avgProgress = performanceGoals.length > 0
    ? Math.round(performanceGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / performanceGoals.length)
    : 0;

  // Pending reviews
  const pendingReviews = performanceReviews.filter(r => 
    r.status === 'draft' || r.status === 'manager_review_pending'
  ).length;

  // Team by department
  const deptCounts = {};
  teamMembers.forEach(m => {
    const dept = m.department || 'Unassigned';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });

  // Recent activity
  const recentLeaves = leaveRequests
    .filter(l => l.status === 'pending')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Leave Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Pending Requests</span>
                <Badge className="bg-amber-100 text-amber-700">{pendingLeaves}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">On Leave Today</span>
                <Badge className="bg-blue-100 text-blue-700">{onLeaveToday}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Attendance (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl font-bold text-slate-900">{attendanceRate}%</span>
                <span className="text-sm text-slate-500">Attendance Rate</span>
              </div>
              <Progress value={attendanceRate} className="h-2" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Present</span>
                <p className="font-semibold text-emerald-600">{presentCount}</p>
              </div>
              <div>
                <span className="text-slate-500">Late</span>
                <p className="font-semibold text-amber-600">{lateCount}</p>
              </div>
              <div>
                <span className="text-slate-500">Absent</span>
                <p className="font-semibold text-red-600">{absentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Active Goals</span>
                <Badge className="bg-purple-100 text-purple-700">{activeGoals}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Avg. Progress</span>
                <Badge className="bg-emerald-100 text-emerald-700">{avgProgress}%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Pending Reviews</span>
                <Badge className="bg-amber-100 text-amber-700">{pendingReviews}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Team Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(deptCounts).map(([dept, count]) => (
              <div key={dept} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <p className="text-sm text-slate-600 mb-1">{dept}</p>
                <p className="text-2xl font-bold text-slate-900">{count}</p>
                <p className="text-xs text-slate-500">
                  {Math.round((count / teamMembers.length) * 100)}% of team
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Pending Actions ({pendingLeaves})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentLeaves.length === 0 ? (
            <p className="text-center py-8 text-slate-500">No pending leave requests</p>
          ) : (
            <div className="space-y-3">
              {recentLeaves.map(leave => {
                const employee = teamMembers.find(m => m.id === leave.employee_id);
                return (
                  <div key={leave.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">
                        {employee?.first_name} {employee?.last_name}
                      </p>
                      <p className="text-sm text-slate-600">
                        {leave.leave_type} • {leave.start_date} to {leave.end_date}
                      </p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
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