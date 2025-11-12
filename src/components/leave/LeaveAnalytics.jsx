import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Calendar, Users } from "lucide-react";

export default function LeaveAnalytics({ leaveRequests, employees }) {
  // Leave types distribution
  const leaveTypeData = Object.entries(
    leaveRequests
      .filter(r => r.status === 'approved')
      .reduce((acc, req) => {
        acc[req.leave_type] = (acc[req.leave_type] || 0) + req.total_days;
        return acc;
      }, {})
  ).map(([type, days]) => ({
    name: type.replace('_', ' '),
    days,
    displayName: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
  }));

  // Monthly trend
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthRequests = leaveRequests.filter(r => {
      const startDate = new Date(r.start_date);
      return startDate.getMonth() + 1 === month && r.status === 'approved';
    });
    
    return {
      month: new Date(2025, i).toLocaleDateString('en-US', { month: 'short' }),
      leaves: monthRequests.length,
      days: monthRequests.reduce((sum, r) => sum + r.total_days, 0)
    };
  });

  // Department distribution
  const departmentData = Object.entries(
    leaveRequests
      .filter(r => r.status === 'approved')
      .reduce((acc, req) => {
        const emp = employees.find(e => e.id === req.employee_id);
        const dept = emp?.department || 'Unknown';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {})
  ).map(([dept, count]) => ({
    name: dept,
    value: count
  }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Monthly Trends */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Monthly Leave Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #e2e8f0', 
                  borderRadius: '12px',
                  padding: '12px'
                }}
              />
              <Legend />
              <Bar dataKey="leaves" fill="#10b981" name="Number of Leaves" radius={[8, 8, 0, 0]} />
              <Bar dataKey="days" fill="#3b82f6" name="Total Days" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Leave Types Distribution */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-white">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Leave Types Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leaveTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="days"
                >
                  {leaveTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-white">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Department Leave Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {departmentData.length === 0 ? (
                <p className="text-center py-8 text-slate-500">No data available</p>
              ) : (
                departmentData.map((dept, idx) => (
                  <div key={dept.name} className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-slate-700">{dept.name}</span>
                        <span className="text-sm font-bold text-slate-900">{dept.value} requests</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(dept.value / Math.max(...departmentData.map(d => d.value))) * 100}%`,
                            backgroundColor: COLORS[idx % COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}