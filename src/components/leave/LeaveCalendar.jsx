import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Users, Info } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isWeekend, startOfWeek, endOfWeek, addDays } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

export default function LeaveCalendar({ leaveRequests, currentMonth = new Date() }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayDetails, setShowDayDetails] = useState(false);

  // Fetch public holidays for the current month's year
  const { data: holidays = [] } = useQuery({
    queryKey: ['public-holidays-calendar', currentMonth.getFullYear()],
    queryFn: () => base44.entities.PublicHoliday.filter({ 
      year: currentMonth.getFullYear(),
      is_active: true 
    }),
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const allCalendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

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

  const getHolidayForDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return holidays.find(h => h.date === dayStr);
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

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setShowDayDetails(true);
  };

  return (
    <>
      <Card className="border-0 shadow-xl">
        <CardHeader className="border-b-2 bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold">{format(currentMonth, 'MMMM yyyy')}</p>
                <p className="text-sm text-slate-600 font-normal">
                  {leaveRequests.filter(r => r.status === 'approved').length} approved leaves this month
                </p>
              </div>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-3 mb-3">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => (
              <div 
                key={day} 
                className={`text-center text-sm font-bold py-3 rounded-lg ${
                  idx === 5 || idx === 6 
                    ? 'bg-slate-100 text-slate-500' 
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-3">
            {/* All calendar days including previous/next month */}
            {allCalendarDays.map((day) => {
              const leavesOnDay = getLeaveForDay(day);
              const holiday = getHolidayForDay(day);
              const isWeekendDay = isWeekend(day);
              const isTodayDay = isToday(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <button
                  key={day.toString()}
                  onClick={() => handleDayClick(day)}
                  disabled={!isCurrentMonth}
                  className={`
                    aspect-square p-3 rounded-xl border-2 transition-all
                    ${!isCurrentMonth ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}
                    ${isTodayDay ? 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-200' : 'border-slate-200'}
                    ${holiday ? 'bg-gradient-to-br from-emerald-50 to-green-50 ring-2 ring-emerald-300' : isWeekendDay ? 'bg-slate-50' : 'bg-white'}
                    ${leavesOnDay.length > 0 ? 'ring-2 ring-blue-300 bg-blue-50' : ''}
                    hover:scale-105
                  `}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-lg font-bold ${
                        isTodayDay ? 'text-emerald-600' : 
                        holiday ? 'text-emerald-700' :
                        isCurrentMonth ? 'text-slate-900' : 'text-slate-400'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      <div className="flex gap-1">
                        {holiday && <span className="text-sm">🎉</span>}
                        {leavesOnDay.length > 0 && (
                          <Badge className="text-xs px-1.5 py-0.5 bg-blue-600 text-white">
                            {leavesOnDay.length}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {holiday && (
                      <p className="text-xs font-semibold text-emerald-700 truncate mb-1">
                        {holiday.holiday_name}
                      </p>
                    )}
                    <div className="flex-1 space-y-1">
                      {leavesOnDay.slice(0, 2).map((leave, idx) => (
                        <div
                          key={idx}
                          className={`h-2 rounded-full ${leaveTypeColors[leave.leave_type] || 'bg-slate-400'} shadow-sm`}
                          title={`${leave.leave_type} leave`}
                        />
                      ))}
                      {leavesOnDay.length > 2 && (
                        <p className="text-xs font-semibold text-blue-600">+{leavesOnDay.length - 2}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

        {/* Legend */}
        <div className="mt-8 pt-6 border-t-2">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-bold text-slate-900">Leave Types Legend</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(leaveTypeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <div className={`w-4 h-4 rounded-full ${color} shadow-md`} />
                <span className="text-sm font-medium text-slate-700 capitalize">{type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
            <p className="text-sm text-blue-700 mb-1">Total Leaves</p>
            <p className="text-2xl font-bold text-blue-900">
              {leaveRequests.filter(r => r.status === 'approved').length}
            </p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
            <p className="text-sm text-emerald-700 mb-1">Days Off</p>
            <p className="text-2xl font-bold text-emerald-900">
              {leaveRequests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.total_days, 0)}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
            <p className="text-sm text-purple-700 mb-1">Weekend Days</p>
            <p className="text-2xl font-bold text-purple-900">
              {daysInMonth.filter(d => isWeekend(d)).length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

      {/* Day Details Dialog */}
      <Dialog open={showDayDetails} onOpenChange={setShowDayDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-600" />
              {selectedDay && format(selectedDay, 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>

          {selectedDay && (() => {
            const leavesOnDay = getLeaveForDay(selectedDay);
            const holiday = getHolidayForDay(selectedDay);
            
            if (leavesOnDay.length === 0 && !holiday) {
              return (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500">No leave requests or holidays for this day</p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {/* Show holiday if exists */}
                {holiday && (
                  <Card className="border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🎉</span>
                        <div>
                          <Badge className="bg-emerald-600 text-white mb-1">Public Holiday</Badge>
                          <h3 className="font-bold text-slate-900">{holiday.holiday_name}</h3>
                          {holiday.holiday_name_ar && (
                            <p className="text-sm text-slate-600" dir="rtl">{holiday.holiday_name_ar}</p>
                          )}
                        </div>
                      </div>
                      {holiday.description && (
                        <p className="text-xs text-slate-600 mt-2 p-2 bg-white rounded">
                          {holiday.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {leavesOnDay.length > 0 && (
                  <>
                    <p className="text-sm text-slate-600 mb-4">
                      <Users className="w-4 h-4 inline mr-2" />
                      {leavesOnDay.length} employee{leavesOnDay.length > 1 ? 's' : ''} on leave
                    </p>
                    {leavesOnDay.map((leave, idx) => (
                      <Card key={idx} className="border-2 border-slate-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${leaveTypeColors[leave.leave_type]}`} />
                              <h4 className="font-semibold text-slate-900 capitalize">
                                {leave.leave_type.replace('_', ' ')} Leave
                              </h4>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700">
                              {leave.total_days} days
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600 space-y-1">
                            <p><strong>Period:</strong> {format(new Date(leave.start_date), 'MMM dd')} - {format(new Date(leave.end_date), 'MMM dd, yyyy')}</p>
                            {leave.reason && <p><strong>Reason:</strong> {leave.reason}</p>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}