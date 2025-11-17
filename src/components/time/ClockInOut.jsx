import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, LogIn, LogOut, Coffee, CheckCircle, MapPin, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ClockInOut() {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employee-by-email', user?.email],
    queryFn: () => base44.entities.Employee.filter({ email: user.email }),
    enabled: !!user?.email
  });

  const employee = employees[0];
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: todayPunches = [] } = useQuery({
    queryKey: ['punch-events', employee?.id, today],
    queryFn: () => base44.entities.PunchEvent.filter({ 
      employee_id: employee.id, 
      date: today 
    }),
    enabled: !!employee?.id,
    refetchInterval: 5000
  });

  const { data: shiftAssignments = [] } = useQuery({
    queryKey: ['shift-assignments', employee?.id],
    queryFn: () => base44.entities.ShiftAssignment.filter({ 
      employee_id: employee.id,
      status: 'active'
    }),
    enabled: !!employee?.id
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list(),
    enabled: shiftAssignments.length > 0
  });

  // Find today's shift
  const todayShift = React.useMemo(() => {
    if (!shiftAssignments.length || !shifts.length) return null;
    
    const activeAssignment = shiftAssignments.find(assignment => {
      const startDate = new Date(assignment.start_date);
      const endDate = assignment.end_date ? new Date(assignment.end_date) : null;
      const todayDate = new Date(today);
      return todayDate >= startDate && (!endDate || todayDate <= endDate);
    });

    if (activeAssignment) {
      return shifts.find(s => s.id === activeAssignment.shift_id);
    }
    return null;
  }, [shiftAssignments, shifts, today]);

  const sortedPunches = todayPunches.sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  const lastPunch = sortedPunches[sortedPunches.length - 1];
  const currentStatus = lastPunch?.punch_type || 'not_clocked_in';

  const punchMutation = useMutation({
    mutationFn: async ({ punch_type, location, notes }) => {
      const response = await base44.functions.invoke('processPunchEvent', {
        punch_type,
        location,
        notes
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['punch-events']);
      queryClient.invalidateQueries(['attendance']);
      toast.success(`${data.punchEvent.punch_type.replace('_', ' ')} recorded`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to process punch');
    }
  });

  const getGeolocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
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
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handlePunch = async (punchType) => {
    try {
      const location = await getGeolocation();
      await punchMutation.mutateAsync({ punch_type: punchType, location });
      setLocationError('');
    } catch (error) {
      console.error('Punch failed:', error);
    }
  };

  if (!employee) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="text-slate-600">Employee record not found</p>
        </CardContent>
      </Card>
    );
  }

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
        {todayShift ? (
          <div className="mb-6 p-4 bg-white rounded-lg border border-emerald-100">
            <p className="text-sm text-slate-500 mb-1">{t('today_shift')}</p>
            <p className="font-semibold text-slate-900">{todayShift.shift_name}</p>
            <p className="text-sm text-slate-600">
              {todayShift.start_time} - {todayShift.end_time} ({todayShift.working_hours} hours)
            </p>
          </div>
        ) : (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No active shift assigned for today. Contact your manager.
            </AlertDescription>
          </Alert>
        )}

        {/* Punch History */}
        {sortedPunches.length > 0 && (
          <div className="mb-6 space-y-3">
            {sortedPunches.map((punch, idx) => (
              <div 
                key={punch.id}
                className={`p-3 rounded-lg ${
                  punch.punch_type === 'clock_in' ? 'bg-emerald-50' :
                  punch.punch_type === 'clock_out' ? 'bg-slate-50' :
                  punch.punch_type === 'break_start' ? 'bg-amber-50' :
                  'bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {punch.punch_type === 'clock_in' && <LogIn className="w-5 h-5 text-emerald-600" />}
                    {punch.punch_type === 'clock_out' && <LogOut className="w-5 h-5 text-slate-600" />}
                    {punch.punch_type === 'break_start' && <Coffee className="w-5 h-5 text-amber-600" />}
                    {punch.punch_type === 'break_end' && <CheckCircle className="w-5 h-5 text-blue-600" />}
                    <span className="text-sm font-medium text-slate-700">
                      {punch.punch_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <span className={`font-bold ${
                    punch.punch_type === 'clock_in' ? 'text-emerald-600' :
                    punch.punch_type === 'clock_out' ? 'text-slate-600' :
                    punch.punch_type === 'break_start' ? 'text-amber-600' :
                    'text-blue-600'
                  }`}>
                    {format(new Date(punch.timestamp), 'HH:mm:ss')}
                  </span>
                </div>
                {punch.location && (
                  <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{punch.location}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Location Error Alert */}
        {locationError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {locationError}
              <p className="text-xs mt-2">💡 {t('location_help')}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Location Info */}
        {!locationError && todayShift && (
          <Alert className="mb-4 border-blue-200 bg-blue-50">
            <MapPin className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900 text-sm">
              <strong>{t('location_required')}:</strong> {t('location_required_desc')}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        {todayShift && (
          <div className="space-y-3">
            {currentStatus === 'not_clocked_in' && (
              <Button
                onClick={() => handlePunch('clock_in')}
                disabled={fetchingLocation || punchMutation.isPending}
                className="w-full h-14 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg text-lg"
              >
                {(fetchingLocation || punchMutation.isPending) ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {fetchingLocation ? t('getting_location') : 'Processing...'}
                  </>
                ) : (
                  <>
                    <LogIn className="w-6 h-6 mr-2" />
                    {t('clock_in')}
                  </>
                )}
              </Button>
            )}

            {currentStatus === 'clock_in' && (
              <>
                <Button
                  onClick={() => handlePunch('break_start')}
                  disabled={punchMutation.isPending}
                  variant="outline"
                  className="w-full h-12 border-amber-200 text-amber-700 hover:bg-amber-50"
                >
                  <Coffee className="w-5 h-5 mr-2" />
                  {t('start_break')}
                </Button>

                <Button
                  onClick={() => handlePunch('clock_out')}
                  disabled={fetchingLocation || punchMutation.isPending}
                  className="w-full h-14 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 shadow-lg text-lg"
                >
                  {(fetchingLocation || punchMutation.isPending) ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      {fetchingLocation ? t('getting_location') : 'Processing...'}
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

            {currentStatus === 'break_start' && (
              <>
                <Button
                  onClick={() => handlePunch('break_end')}
                  disabled={punchMutation.isPending}
                  variant="outline"
                  className="w-full h-12 border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {t('end_break')}
                </Button>

                <Button
                  onClick={() => handlePunch('clock_out')}
                  disabled={fetchingLocation || punchMutation.isPending}
                  className="w-full h-14 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 shadow-lg text-lg"
                >
                  {(fetchingLocation || punchMutation.isPending) ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      {fetchingLocation ? t('getting_location') : 'Processing...'}
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

            {currentStatus === 'break_end' && (
              <Button
                onClick={() => handlePunch('clock_out')}
                disabled={fetchingLocation || punchMutation.isPending}
                className="w-full h-14 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 shadow-lg text-lg"
              >
                {(fetchingLocation || punchMutation.isPending) ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {fetchingLocation ? t('getting_location') : 'Processing...'}
                  </>
                ) : (
                  <>
                    <LogOut className="w-6 h-6 mr-2" />
                    {t('clock_out')}
                  </>
                )}
              </Button>
            )}

            {currentStatus === 'clock_out' && (
              <div className="text-center py-4">
                <CheckCircle className="w-16 h-16 mx-auto mb-3 text-emerald-600" />
                <p className="font-semibold text-slate-900 text-lg">{t('attendance_recorded')}</p>
                <p className="text-sm text-slate-500">{t('clocked_out_today')}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}