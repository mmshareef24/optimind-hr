import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, Phone, Calendar, Award } from "lucide-react";

export default function TeamMembersList({ teamMembers, attendance, leaveRequests, performanceGoals }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = teamMembers.filter(member =>
    `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMemberStats = (memberId) => {
    // Recent attendance (last 30 records)
    const memberAttendance = attendance.filter(a => a.employee_id === memberId).slice(0, 30);
    const presentDays = memberAttendance.filter(a => a.status === 'present').length;
    const attendanceRate = memberAttendance.length > 0
      ? Math.round((presentDays / memberAttendance.length) * 100)
      : 0;

    // Leave balance
    const memberLeaves = leaveRequests.filter(l => l.employee_id === memberId && l.status === 'approved');
    const totalLeaveDays = memberLeaves.reduce((sum, l) => sum + (l.total_days || 0), 0);

    // Active goals
    const memberGoals = performanceGoals.filter(g => g.employee_id === memberId && g.status === 'in_progress');
    const avgProgress = memberGoals.length > 0
      ? Math.round(memberGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / memberGoals.length)
      : 0;

    return { attendanceRate, totalLeaveDays, activeGoals: memberGoals.length, avgProgress };
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search team members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results */}
      <div className="text-sm text-slate-600 mb-2">
        Showing {filteredMembers.length} of {teamMembers.length} team members
      </div>

      {/* Team Members Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredMembers.map(member => {
          const stats = getMemberStats(member.id);
          
          return (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="w-14 h-14 border-2 border-blue-100">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                      {member.first_name?.[0]}{member.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">
                      {member.first_name} {member.last_name}
                    </h3>
                    <p className="text-sm text-slate-600">{member.job_title}</p>
                    <p className="text-xs text-slate-500">{member.department}</p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Phone className="w-3 h-3" />
                          {member.phone}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Attendance</p>
                        <p className={`text-sm font-bold ${
                          stats.attendanceRate >= 95 ? 'text-emerald-600' :
                          stats.attendanceRate >= 85 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {stats.attendanceRate}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Leave Days</p>
                        <p className="text-sm font-bold text-blue-600">{stats.totalLeaveDays}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Goals</p>
                        <p className="text-sm font-bold text-purple-600">{stats.activeGoals}</p>
                      </div>
                    </div>

                    {stats.activeGoals > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-600">Goal Progress</span>
                          <span className="font-semibold text-slate-900">{stats.avgProgress}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                            style={{ width: `${stats.avgProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No team members found matching your search</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}