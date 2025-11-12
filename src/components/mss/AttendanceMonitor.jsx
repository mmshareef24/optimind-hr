import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function AttendanceMonitor({ teamMembers, attendance, timesheets }) {
  const today = new Date().toISOString().split('T')[0];
  
  // Today's attendance
  const todayAttendance = attendance.filter(a => a.date === today);
  
  // Calculate stats per employee
  const employeeStats = teamMembers.map(member => {
    const memberAttendance = attendance.filter(a => a.employee_id === member.id).slice(0, 30);
    const todayRecord = todayAttendance.find(a => a.employee_id === member.id);
    
    const presentCount = memberAttendance.filter(a => a.status === 'present').length;
    const lateCount = memberAttendance.filter(a => a.status === 'late').length;
    const absentCount = memberAttendance.filter(a => a.status === 'absent').length;
    const attendanceRate = memberAttendance.length > 0
      ? Math.round((presentCount / memberAttendance.length) * 100)
      : 0;
    
    return {
      ...member,
      todayRecord,
      attendanceRate,
      presentCount,
      lateCount,
      absentCount,
      totalRecords: memberAttendance.length
    };
  });

  const statusColors = {
    present: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    late: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    absent: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    on_leave: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    weekend: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
    holiday: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' }
  };

  // Sort by attendance rate
  const sortedStats = [...employeeStats].sort((a, b) => a.attendanceRate - b.attendanceRate);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Present Today</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {todayAttendance.filter(a => a.status === 'present').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Late Today</p>
                <p className="text-2xl font-bold text-amber-600">
                  {todayAttendance.filter(a => a.status === 'late').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Absent Today</p>
                <p className="text-2xl font-bold text-red-600">
                  {todayAttendance.filter(a => a.status === 'absent').length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">On Leave</p>
                <p className="text-2xl font-bold text-blue-600">
                  {todayAttendance.filter(a => a.status === 'on_leave').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {employeeStats.map(stat => {
              const colors = stat.todayRecord 
                ? statusColors[stat.todayRecord.status] 
                : { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
              
              return (
                <div key={stat.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">
                      {stat.first_name} {stat.last_name}
                    </p>
                    <p className="text-sm text-slate-500">{stat.job_title}</p>
                  </div>
                  <div className="text-right">
                    {stat.todayRecord ? (
                      <>
                        <Badge className={`${colors.bg} ${colors.text} ${colors.border}`}>
                          {stat.todayRecord.status.replace(/_/g, ' ')}
                        </Badge>
                        {stat.todayRecord.clock_in && (
                          <p className="text-xs text-slate-500 mt-1">
                            In: {stat.todayRecord.clock_in}
                            {stat.todayRecord.clock_out && ` • Out: ${stat.todayRecord.clock_out}`}
                          </p>
                        )}
                      </>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-700">No record</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 30-Day Attendance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>30-Day Attendance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedStats.map(stat => (
              <div key={stat.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      {stat.first_name} {stat.last_name}
                    </h4>
                    <p className="text-sm text-slate-500">{stat.job_title}</p>
                  </div>
                  <Badge className={
                    stat.attendanceRate >= 95 ? 'bg-emerald-100 text-emerald-700' :
                    stat.attendanceRate >= 85 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }>
                    {stat.attendanceRate}% Attendance
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Present</p>
                    <p className="font-semibold text-emerald-600">{stat.presentCount}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Late</p>
                    <p className="font-semibold text-amber-600">{stat.lateCount}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Absent</p>
                    <p className="font-semibold text-red-600">{stat.absentCount}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Total Days</p>
                    <p className="font-semibold text-slate-900">{stat.totalRecords}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        stat.attendanceRate >= 95 ? 'bg-emerald-600' :
                        stat.attendanceRate >= 85 ? 'bg-amber-600' :
                        'bg-red-600'
                      }`}
                      style={{ width: `${stat.attendanceRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}