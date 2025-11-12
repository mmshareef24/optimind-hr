import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Briefcase, Clock, DollarSign, Calendar } from "lucide-react";

export default function AnalyticsDashboard({
  employees = [],
  projects = [],
  timeEntries = [],
  payrolls = [],
  attendance = [],
  leaves = [],
  performanceReviews = []
}) {
  // Department distribution
  const departmentData = useMemo(() => {
    const deptCount = {};
    employees.forEach(emp => {
      const dept = emp.department || 'Unassigned';
      deptCount[dept] = (deptCount[dept] || 0) + 1;
    });
    return Object.entries(deptCount).map(([name, value]) => ({ name, value }));
  }, [employees]);

  // Project status distribution
  const projectStatusData = useMemo(() => {
    const statusCount = {};
    projects.forEach(proj => {
      const status = proj.status || 'unknown';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  }, [projects]);

  // Monthly hours trend (last 6 months)
  const hoursData = useMemo(() => {
    const monthlyHours = {};
    timeEntries.forEach(entry => {
      const month = entry.date?.substring(0, 7); // YYYY-MM
      if (month) {
        monthlyHours[month] = (monthlyHours[month] || 0) + (entry.hours || 0) + (entry.overtime_hours || 0);
      }
    });
    
    const sorted = Object.entries(monthlyHours)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, hours]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        hours: Math.round(hours)
      }));
    
    return sorted;
  }, [timeEntries]);

  // Attendance statistics
  const attendanceStats = useMemo(() => {
    const stats = {
      present: 0,
      late: 0,
      absent: 0,
      on_leave: 0
    };
    
    attendance.forEach(att => {
      if (stats[att.status] !== undefined) {
        stats[att.status]++;
      }
    });
    
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }, [attendance]);

  // Payroll trend (last 6 months)
  const payrollData = useMemo(() => {
    const monthlyPayroll = {};
    payrolls.forEach(payroll => {
      const month = payroll.month;
      if (month) {
        if (!monthlyPayroll[month]) {
          monthlyPayroll[month] = { gross: 0, net: 0, deductions: 0 };
        }
        monthlyPayroll[month].gross += payroll.gross_salary || 0;
        monthlyPayroll[month].net += payroll.net_salary || 0;
        monthlyPayroll[month].deductions += payroll.total_deductions || 0;
      }
    });
    
    return Object.entries(monthlyPayroll)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        gross: Math.round(data.gross),
        net: Math.round(data.net),
        deductions: Math.round(data.deductions)
      }));
  }, [payrolls]);

  // Leave type distribution
  const leaveData = useMemo(() => {
    const leaveCount = {};
    leaves.forEach(leave => {
      if (leave.status === 'approved') {
        const type = leave.leave_type || 'unknown';
        leaveCount[type] = (leaveCount[type] || 0) + (leave.total_days || 0);
      }
    });
    return Object.entries(leaveCount).map(([name, value]) => ({ name, value }));
  }, [leaves]);

  // Performance ratings distribution
  const performanceData = useMemo(() => {
    const ratings = {
      'Excellent (4.5-5.0)': 0,
      'Good (3.5-4.4)': 0,
      'Average (2.5-3.4)': 0,
      'Below Average (<2.5)': 0
    };
    
    performanceReviews.forEach(review => {
      const rating = review.overall_rating || 0;
      if (rating >= 4.5) ratings['Excellent (4.5-5.0)']++;
      else if (rating >= 3.5) ratings['Good (3.5-4.4)']++;
      else if (rating >= 2.5) ratings['Average (2.5-3.4)']++;
      else ratings['Below Average (<2.5)']++;
    });
    
    return Object.entries(ratings).map(([name, value]) => ({ name, value }));
  }, [performanceReviews]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Employees</p>
                <p className="text-3xl font-bold text-emerald-600">{employees.length}</p>
              </div>
              <Users className="w-12 h-12 text-emerald-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Active Projects</p>
                <p className="text-3xl font-bold text-blue-600">
                  {projects.filter(p => p.status === 'in_progress').length}
                </p>
              </div>
              <Briefcase className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Hours</p>
                <p className="text-3xl font-bold text-purple-600">
                  {timeEntries.reduce((sum, t) => sum + (t.hours || 0), 0).toFixed(0)}h
                </p>
              </div>
              <Clock className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Avg Salary</p>
                <p className="text-3xl font-bold text-amber-600">
                  {payrolls.length > 0 
                    ? (payrolls.reduce((sum, p) => sum + (p.net_salary || 0), 0) / payrolls.length).toFixed(0)
                    : 0}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-amber-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Employees by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Status */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Projects by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Hours Trend */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Hours Logged Trend (6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hoursData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Statistics */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Payroll Trend */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              Payroll Trend (6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={payrollData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="gross" stroke="#10b981" strokeWidth={2} name="Gross" />
                <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} name="Net" />
                <Line type="monotone" dataKey="deductions" stroke="#ef4444" strokeWidth={2} name="Deductions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leave Distribution */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Leave Days by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leaveData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}d`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leaveData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Distribution */}
      {performanceReviews.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Performance Ratings Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}