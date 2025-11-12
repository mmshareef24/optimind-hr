import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar as CalendarIcon, Users } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isWeekend, startOfWeek, endOfWeek, isSameMonth } from "date-fns";

export default function TeamLeaveCalendar({ leaveRequests, employees, currentMonth = new Date() }) {
  const [selectedDay, setSelectedDay] = useState(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEmployeesOnLeave = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const onLeave = leaveRequests.filter(leave => {
      if (leave.status !== 'approved') return false;
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      const current = new Date(dayStr);
      return current >= start && current <= end;
    });
    
    return onLeave.map(leave => {
      const employee = employees.find(e => e.id === leave.employee_id);
      return { ...leave, employee };
    });
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="border-b-2 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold">Team Leave Overview</p>
            <p className="text-sm text-slate-600 font-normal">
              See who's out of office • {format(currentMonth, 'MMMM yyyy')}
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => (
            <div 
              key={day} 
              className={`text-center text-xs font-bold py-2 rounded-lg ${
                idx === 5 || idx === 6 
                  ? 'bg-slate-100 text-slate-500' 
                  : 'bg-blue-50 text-blue-700'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {allDays.map((day) => {
            const employeesOnLeave = getEmployeesOnLeave(day);
            const isWeekendDay = isWeekend(day);
            const isTodayDay = isToday(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <div
                key={day.toString()}
                onClick={() => employeesOnLeave.length > 0 && setSelectedDay(day)}
                className={`
                  aspect-square p-2 rounded-xl border-2 transition-all
                  ${!isCurrentMonth ? 'opacity-30' : ''}
                  ${isTodayDay ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200'}
                  ${isWeekendDay ? 'bg-slate-50' : 'bg-white'}
                  ${employeesOnLeave.length > 0 ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''}
                `}
              >
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-bold ${
                      isTodayDay ? 'text-blue-600' : 
                      isCurrentMonth ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {employeesOnLeave.length > 0 && (
                      <Badge className="text-xs px-1.5 py-0.5 bg-red-500 text-white">
                        {employeesOnLeave.length}
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5 mt-1">
                    {employeesOnLeave.slice(0, 3).map((leave, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 bg-red-50 rounded px-1 py-0.5"
                        title={`${leave.employee?.first_name} ${leave.employee?.last_name}`}
                      >
                        <Avatar className="w-3 h-3">
                          <AvatarFallback className="text-xs bg-red-600 text-white">
                            {leave.employee?.first_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    ))}
                    {employeesOnLeave.length > 3 && (
                      <p className="text-xs font-semibold text-red-600">+{employeesOnLeave.length - 3}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Day Details */}
        {selectedDay && (() => {
          const employeesOnLeave = getEmployeesOnLeave(selectedDay);
          
          return employeesOnLeave.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                {format(selectedDay, 'EEEE, MMMM d, yyyy')} - {employeesOnLeave.length} on leave
              </h4>
              <div className="space-y-2">
                {employeesOnLeave.map((leave, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={leave.employee?.profile_picture} />
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {leave.employee?.first_name?.[0]}{leave.employee?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {leave.employee?.first_name} {leave.employee?.last_name}
                      </p>
                      <p className="text-xs text-slate-600">{leave.employee?.job_title}</p>
                    </div>
                    <Badge className="capitalize bg-blue-100 text-blue-700">
                      {leave.leave_type.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}