import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, addMonths, subMonths } from "date-fns";

export default function LeaveCalendar({ leaveRequests = [], employees = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

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

  const getLeaveForDay = (day) => {
    return leaveRequests.filter(request => {
      if (request.status !== 'approved') return false;
      const startDate = new Date(request.start_date);
      const endDate = new Date(request.end_date);
      return isWithinInterval(day, { start: startDate, end: endDate });
    });
  };

  const getDayOfWeek = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 5 || day === 6; // Friday and Saturday
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Leave Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[150px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-slate-600 py-2 border-b"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {daysInMonth.map((day, idx) => {
            const dayLeaves = getLeaveForDay(day);
            const isToday = isSameDay(day, new Date());
            const isWeekendDay = isWeekend(day);

            return (
              <div
                key={idx}
                className={`
                  min-h-[100px] p-2 border rounded-lg
                  ${isWeekendDay ? 'bg-slate-50' : 'bg-white'}
                  ${isToday ? 'ring-2 ring-emerald-500' : 'border-slate-200'}
                  hover:shadow-md transition-all
                `}
              >
                <div className={`
                  text-sm font-semibold mb-2
                  ${isToday ? 'text-emerald-600' : isWeekendDay ? 'text-slate-400' : 'text-slate-700'}
                `}>
                  {format(day, 'd')}
                </div>

                {dayLeaves.length > 0 && (
                  <div className="space-y-1">
                    {dayLeaves.slice(0, 3).map((leave, leaveIdx) => {
                      const employee = employees?.find(e => e.id === leave.employee_id);
                      return (
                        <div
                          key={leaveIdx}
                          className={`
                            text-xs px-2 py-1 rounded text-white truncate
                            ${leaveTypeColors[leave.leave_type] || 'bg-slate-500'}
                          `}
                          title={`${employee ? `${employee.first_name} ${employee.last_name}` : 'Employee'} - ${leave.leave_type}`}
                        >
                          {employee ? `${employee.first_name.charAt(0)}. ${employee.last_name}` : 'Employee'}
                        </div>
                      );
                    })}
                    {dayLeaves.length > 3 && (
                      <div className="text-xs text-slate-500 text-center">
                        +{dayLeaves.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Leave Types</h4>
          <div className="flex flex-wrap gap-3">
            {Object.entries(leaveTypeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${color}`} />
                <span className="text-xs text-slate-600 capitalize">
                  {type.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}