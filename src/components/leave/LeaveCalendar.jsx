import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isWeekend } from "date-fns";

export default function LeaveCalendar({ leaveRequests, currentMonth = new Date() }) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getLeaveForDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return leaveRequests.filter(leave => {
      if (leave.status !== 'approved') return false;
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      const current = new Date(dayStr);
      return current >= start && current <= end;
    });
  };

  const leaveTypeColors = {
    annual: 'bg-blue-500',
    sick: 'bg-red-500',
    maternity: 'bg-pink-500',
    paternity: 'bg-purple-500',
    unpaid: 'bg-slate-500',
    hajj: 'bg-emerald-500',
    marriage: 'bg-amber-500',
    bereavement: 'bg-slate-600',
    emergency: 'bg-orange-500'
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-white">
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-emerald-600" />
          Leave Calendar - {format(currentMonth, 'MMMM yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Days of the month */}
          {daysInMonth.map((day) => {
            const leavesOnDay = getLeaveForDay(day);
            const isWeekendDay = isWeekend(day);
            const isTodayDay = isToday(day);

            return (
              <div
                key={day.toString()}
                className={`
                  aspect-square p-2 rounded-lg border transition-all
                  ${isTodayDay ? 'border-2 border-emerald-500 bg-emerald-50' : 'border-slate-200'}
                  ${isWeekendDay ? 'bg-slate-50' : 'bg-white'}
                  ${leavesOnDay.length > 0 ? 'ring-2 ring-blue-200' : ''}
                  hover:shadow-md
                `}
              >
                <div className="flex flex-col h-full">
                  <span className={`text-sm font-semibold ${isTodayDay ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {format(day, 'd')}
                  </span>
                  <div className="flex-1 mt-1 space-y-1">
                    {leavesOnDay.slice(0, 2).map((leave, idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 rounded-full ${leaveTypeColors[leave.leave_type] || 'bg-slate-400'}`}
                        title={`${leave.leave_type} leave`}
                      />
                    ))}
                    {leavesOnDay.length > 2 && (
                      <span className="text-xs text-slate-500">+{leavesOnDay.length - 2}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-slate-500 mb-2 font-semibold">Leave Types:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(leaveTypeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${color}`} />
                <span className="text-xs text-slate-600 capitalize">{type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}