import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, LogIn, LogOut, Coffee, CheckCircle, MapPin, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function ClockInOut({ employee, todayAttendance, shift, onClockIn, onClockOut, onBreakStart, onBreakEnd }) {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

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

  const getGeolocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      setFetchingLocation(true);
      setLocationError('');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const locationString = `${latitude.toFixed(6)},${longitude.toFixed(6)} (±${Math.round(accuracy)}m)`;
          setFetchingLocation(false);
          resolve(locationString);
        },
        (error) => {
          setFetchingLocation(false);
          let errorMessage = 'Unable to retrieve location';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = t('location_denied');
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = t('location_unavailable');
              break;
            case error.TIMEOUT:
              errorMessage = t('location_timeout');
              break;
            default:
              errorMessage = t('location_error');
          }
          
          setLocationError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const handleClockIn = async () => {
    try {
      const location = await getGeolocation();
      const timeString = format(currentTime, 'HH:mm:ss');
      
      onClockIn({
        employee_id: employee.id,
        shift_id: shift?.id,
        date: format(currentTime, 'yyyy-MM-dd'),
        clock_in: timeString,
        location_in: location,
        status: 'present'
      });
      
      setLocationError('');
    } catch (error) {
      // Error is already set in getGeolocation
      console.error('Clock in failed:', error);
    }
  };

  const handleClockOut = async () => {
    try {
      const location = await getGeolocation();
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
        location_out: location
      });
      
      setLocationError('');
    } catch (error) {
      // Error is already set in getGeolocation
      console.error('Clock out failed:', error);
    }
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
            {t('attendance_clock')}
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
            <p className="text-sm text-slate-500 mb-1">{t('today_shift')}</p>
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
              <div className="p-3 bg-emerald-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <LogIn className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-700">{t('clock_in')}</span>
                  </div>
                  <span className="font-bold text-emerald-600">{todayAttendance.clock_in}</span>
                </div>
                {todayAttendance.location_in && (
                  <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{todayAttendance.location_in}</span>
                  </div>
                )}
              </div>
            )}
            {todayAttendance.break_start && (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-medium text-slate-700">{t('break_started')}</span>
                </div>
                <span className="font-bold text-amber-600">{todayAttendance.break_start}</span>
              </div>
            )}
            {todayAttendance.break_end && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">{t('break_ended')}</span>
                </div>
                <span className="font-bold text-blue-600">{todayAttendance.break_end}</span>
              </div>
            )}
            {todayAttendance.clock_out && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <LogOut className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">{t('clock_out')}</span>
                  </div>
                  <span className="font-bold text-slate-600">{todayAttendance.clock_out}</span>
                </div>
                {todayAttendance.location_out && (
                  <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{todayAttendance.location_out}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Location Error Alert */}
        {locationError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {locationError}
              <p className="text-xs mt-2">
                💡 {t('location_help')}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Location Info */}
        {!locationError && (
          <Alert className="mb-4 border-blue-200 bg-blue-50">
            <MapPin className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900 text-sm">
              <strong>{t('location_required')}:</strong> {t('location_required_desc')}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isClockedIn && !isClockedOut && (
            <Button
              onClick={handleClockIn}
              disabled={fetchingLocation}
              className="w-full h-14 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {fetchingLocation ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {t('getting_location')}
                </>
              ) : (
                <>
                  <LogIn className="w-6 h-6 mr-2" />
                  {t('clock_in')}
                </>
              )}
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
                  {t('start_break')}
                </Button>
              ) : (
                <Button
                  onClick={handleBreakEnd}
                  variant="outline"
                  className="w-full h-12 border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {t('end_break')}
                </Button>
              )}

              <Button
                onClick={handleClockOut}
                disabled={fetchingLocation}
                className="w-full h-14 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {fetchingLocation ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {t('getting_location')}
                  </>
                ) : (
                  <>
                    <LogOut className="w-6 h-6 mr-2" />
                    {t('clock_out')}
                  </>
                )}
              </Button>
            </>
          )}

          {isClockedOut && (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 mx-auto mb-3 text-emerald-600" />
              <p className="font-semibold text-slate-900 text-lg">{t('attendance_recorded')}</p>
              <p className="text-sm text-slate-500">{t('clocked_out_today')}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}