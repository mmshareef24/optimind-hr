import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Users, AlertTriangle } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend, addMonths, subMonths } from "date-fns";

export default function TeamLeaveCalendar({ leaveRequests = [], employees = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get approved leaves for the current month
  const approvedLeaves = useMemo(() => {
    return leaveRequests.filter(req => 
      req.status === 'approved' && 
      req.start_date && 
      req.end_date
    );
  }, [leaveRequests]);

  // Check if a date has any leaves
  const getLeavesForDate = (date) => {
    return approvedLeaves.filter(leave => {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      return date >= start && date <= end;
    });
  };

  // Get color for leave type
  const getLeaveColor = (leaveType) => {
    const colors = {
      annual: 'bg-blue-500',
      sick: 'bg-red-500',
      emergency: 'bg-orange-500',
      maternity: 'bg-pink-500',
      paternity: 'bg-purple-500',
      hajj: 'bg-emerald-500',
      marriage: 'bg-amber-500',
      bereavement: 'bg-slate-500',
      unpaid: 'bg-gray-500'
    };
    return colors[leaveType] || 'bg-gray-500';
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Check for potential conflicts (more than 30% of team on leave)
  const conflictDates = useMemo(() => {
    const conflicts = [];
    const threshold = Math.ceil(employees.length * 0.3);
    
    daysInMonth.forEach(day => {
      const leavesOnDay = getLeavesForDate(day);
      if (leavesOnDay.length >= threshold && !isWeekend(day)) {
        conflicts.push({ date: day, count: leavesOnDay.length });
      }
    });
    
    return conflicts;
  }, [daysInMonth, approvedLeaves, employees]);

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Team Leave Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-lg font-semibold text-slate-900 mt-2">
            {format(currentDate, 'MMMM yyyy')}
          </p>
        </CardHeader>
        <CardContent className="p-6">
          {/* Conflict Warning */}
          {conflictDates.length > 0 && (
            <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">
                    High Leave Conflict Detected
                  </h4>
                  <p className="text-sm text-amber-700">
                    {conflictDates.length} day{conflictDates.length !== 1 ? 's' : ''} with over 30% of team on leave:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {conflictDates.slice(0, 5).map(({ date, count }) => (
                      <Badge key={date.toISOString()} className="bg-amber-100 text-amber-700">
                        {format(date, 'MMM dd')}: {count} employee{count !== 1 ? 's' : ''}
                      </Badge>
                    ))}
                    {conflictDates.length > 5 && (
                      <Badge className="bg-amber-100 text-amber-700">
                        +{conflictDates.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-semibold text-sm text-slate-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Month days */}
              {daysInMonth.map(day => {
                const leavesOnDay = getLeavesForDate(day);
                const isToday = isSameDay(day, new Date());
                const isWeekendDay = isWeekend(day);
                const hasConflict = conflictDates.some(c => isSameDay(c.date, day));

                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      aspect-square border rounded-lg p-2 relative group
                      ${isWeekendDay ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'}
                      ${isToday ? 'ring-2 ring-emerald-500 border-emerald-500' : ''}
                      ${hasConflict ? 'border-amber-400 bg-amber-50' : ''}
                      ${leavesOnDay.length > 0 ? 'hover:shadow-lg transition-all cursor-pointer' : ''}
                    `}
                  >
                    <div className="flex flex-col h-full">
                      <span className={`
                        text-xs font-medium
                        ${isWeekendDay ? 'text-slate-400' : 'text-slate-700'}
                        ${isToday ? 'text-emerald-600 font-bold' : ''}
                      `}>
                        {format(day, 'd')}
                      </span>

                      {leavesOnDay.length > 0 && (
                        <div className="mt-1 space-y-0.5 flex-1 overflow-hidden">
                          {leavesOnDay.slice(0, 3).map((leave, idx) => {
                            const employee = employees.find(e => e.id === leave.employee_id);
                            return (
                              <div
                                key={`${leave.id}-${idx}`}
                                className={`
                                  h-1.5 rounded-full ${getLeaveColor(leave.leave_type)}
                                  opacity-80 group-hover:opacity-100 transition-opacity
                                `}
                                title={`${employee?.first_name} ${employee?.last_name} - ${leave.leave_type}`}
                              />
                            );
                          })}
                          {leavesOnDay.length > 3 && (
                            <div className="text-[8px] text-slate-500 font-medium">
                              +{leavesOnDay.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tooltip on hover */}
                    {leavesOnDay.length > 0 && (
                      <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-10 w-64 bg-white border-2 border-slate-200 rounded-lg shadow-xl p-3">
                        <p className="text-xs font-semibold text-slate-900 mb-2">
                          {format(day, 'MMMM d, yyyy')}
                        </p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {leavesOnDay.map(leave => {
                            const employee = employees.find(e => e.id === leave.employee_id);
                            return (
                              <div key={leave.id} className="flex items-start gap-2 text-xs">
                                <div className={`w-2 h-2 rounded-full ${getLeaveColor(leave.leave_type)} mt-1 flex-shrink-0`} />
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {employee?.first_name} {employee?.last_name}
                                  </p>
                                  <p className="text-slate-600 capitalize">
                                    {leave.leave_type.replace(/_/g, ' ')}
                                  </p>
                                  <p className="text-slate-500">
                                    {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d')}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="text-sm font-semibold text-slate-700">Leave Types</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { type: 'annual', label: 'Annual' },
              { type: 'sick', label: 'Sick' },
              { type: 'emergency', label: 'Emergency' },
              { type: 'maternity', label: 'Maternity' },
              { type: 'paternity', label: 'Paternity' },
              { type: 'hajj', label: 'Hajj' },
              { type: 'marriage', label: 'Marriage' },
              { type: 'bereavement', label: 'Bereavement' }
            ].map(({ type, label }) => (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getLeaveColor(type)}`} />
                <span className="text-xs text-slate-600">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Summary */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Availability
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-white rounded-lg border border-emerald-200">
              <p className="text-sm text-slate-600 mb-1">Available</p>
              <p className="text-3xl font-bold text-emerald-600">
                {employees.length - getLeavesForDate(new Date()).length}
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-200">
              <p className="text-sm text-slate-600 mb-1">On Leave Today</p>
              <p className="text-3xl font-bold text-blue-600">
                {getLeavesForDate(new Date()).length}
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-white rounded-lg border border-amber-200">
              <p className="text-sm text-slate-600 mb-1">Total Team</p>
              <p className="text-3xl font-bold text-amber-600">
                {employees.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}