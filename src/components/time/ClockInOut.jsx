import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut, Coffee, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function ClockInOut({ employee, todayAttendance, shift, onClockIn, onClockOut, onBreakStart, onBreakEnd }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnBreak, setIsOnBreak] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (todayAttendance?.break_start && !todayAttendance?.break_end) {
      setIsOnBreak(true);
    } else {
      setIsOnBreak(false);
    }
  }, [todayAttendance]);

  const isClockedIn = todayAttendance?.clock_in && !todayAttendance?.clock_out;
  const isClockedOut = todayAttendance?.clock_out;

  const handleClockIn = () => {
    const timeString = format(currentTime, 'HH:mm:ss');
    onClockIn({
      employee_id: employee.id,
      shift_id: shift?.id,
      date: format(currentTime, 'yyyy-MM-dd'),
      clock_in: timeString,
      location_in: 'Office', // You can implement geolocation here
      status: 'present'
    });
  };

  const handleClockOut = () => {
    const timeString = format(currentTime, 'HH:mm:ss');
    
    // Calculate actual hours worked
    const clockInTime = new Date(`${todayAttendance.date}T${todayAttendance.clock_in}`);
    const clockOutTime = currentTime;
    const diffMs = clockOutTime - clockInTime;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Calculate break duration
    let breakDuration = 0;
    if (todayAttendance.break_start && todayAttendance.break_end) {
      const breakStart = new Date(`${todayAttendance.date}T${todayAttendance.break_start}`);
      const breakEnd = new Date(`${todayAttendance.date}T${todayAttendance.break_end}`);
      breakDuration = (breakEnd - breakStart) / (1000 * 60); // in minutes
    }
    
    const actualHours = diffHours - (breakDuration / 60);
    const scheduledHours = shift?.working_hours || 8;
    const overtimeHours = Math.max(0, actualHours - scheduledHours);
    
    onClockOut({
      ...todayAttendance,
      clock_out: timeString,
      actual_hours: parseFloat(actualHours.toFixed(2)),
      overtime_hours: parseFloat(overtimeHours.toFixed(2)),
      location_out: 'Office'
    });
  };

  const handleBreakStart = () => {
    const timeString = format(currentTime, 'HH:mm:ss');
    onBreakStart({
      ...todayAttendance,
      break_start: timeString
    });
    setIsOnBreak(true);
  };

  const handleBreakEnd = () => {
    const timeString = format(currentTime, 'HH:mm:ss');
    
    // Calculate break duration
    const breakStart = new Date(`${todayAttendance.date}T${todayAttendance.break_start}`);
    const breakEnd = currentTime;
    const breakDuration = (breakEnd - breakStart) / (1000 * 60); // in minutes
    
    onBreakEnd({
      ...todayAttendance,
      break_end: timeString,
      actual_break_duration: Math.round(breakDuration)
    });
    setIsOnBreak(false);
  };

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-white">
      <CardHeader className="border-b border-emerald-100">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-600" />
            Attendance Clock
          </span>
          <div className="text-right">
            <div className="text-3xl font-bold text-slate-900 tabular-nums">
              {format(currentTime, 'HH:mm:ss')}
            </div>
            <div className="text-sm text-slate-500">
              {format(currentTime, 'EEEE, MMMM dd, yyyy')}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Shift Info */}
        {shift && (
          <div className="mb-6 p-4 bg-white rounded-lg border border-emerald-100">
            <p className="text-sm text-slate-500 mb-1">Today's Shift</p>
            <p className="font-semibold text-slate-900">{shift.shift_name}</p>
            <p className="text-sm text-slate-600">
              {shift.start_time} - {shift.end_time} ({shift.working_hours} hours)
            </p>
          </div>
        )}

        {/* Status Display */}
        {todayAttendance && (
          <div className="mb-6 space-y-3">
            {todayAttendance.clock_in && (
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-700">Clock In</span>
                </div>
                <span className="font-bold text-emerald-600">{todayAttendance.clock_in}</span>
              </div>
            )}
            {todayAttendance.break_start && (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-medium text-slate-700">Break Started</span>
                </div>
                <span className="font-bold text-amber-600">{todayAttendance.break_start}</span>
              </div>
            )}
            {todayAttendance.break_end && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">Break Ended</span>
                </div>
                <span className="font-bold text-blue-600">{todayAttendance.break_end}</span>
              </div>
            )}
            {todayAttendance.clock_out && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Clock Out</span>
                </div>
                <span className="font-bold text-slate-600">{todayAttendance.clock_out}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isClockedIn && !isClockedOut && (
            <Button
              onClick={handleClockIn}
              className="w-full h-14 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg text-lg"
            >
              <LogIn className="w-6 h-6 mr-2" />
              Clock In
            </Button>
          )}

          {isClockedIn && !isClockedOut && (
            <>
              {!isOnBreak ? (
                <Button
                  onClick={handleBreakStart}
                  variant="outline"
                  className="w-full h-12 border-amber-200 text-amber-700 hover:bg-amber-50"
                >
                  <Coffee className="w-5 h-5 mr-2" />
                  Start Break
                </Button>
              ) : (
                <Button
                  onClick={handleBreakEnd}
                  variant="outline"
                  className="w-full h-12 border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  End Break
                </Button>
              )}

              <Button
                onClick={handleClockOut}
                className="w-full h-14 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 shadow-lg text-lg"
              >
                <LogOut className="w-6 h-6 mr-2" />
                Clock Out
              </Button>
            </>
          )}

          {isClockedOut && (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 mx-auto mb-3 text-emerald-600" />
              <p className="font-semibold text-slate-900 text-lg">Attendance Recorded</p>
              <p className="text-sm text-slate-500">You have clocked out for today</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}