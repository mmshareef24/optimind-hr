
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { Clock, Calendar, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ClockInOut from "../components/time/ClockInOut";
import OvertimeCalculator, { calculateOvertimePay } from "../components/time/OvertimeCalculator";
import StatCard from "../components/hrms/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import ProtectedModule from '@/components/ProtectedModule';
import { useAccessControl } from '@/components/AccessControlContext';

function TimeManagementContent() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const { selectedCompanyId, getAccessibleCompanyIds } = useAccessControl();

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const queryClient = useQueryClient();

  const { data: allEmployees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list(),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['shift-assignments'],
    queryFn: () => base44.entities.ShiftAssignment.list(),
  });

  const { data: allAttendance = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance-all'],
    queryFn: () => base44.entities.Attendance.list('-date'),
  });

  const { data: timesheets = [] } = useQuery({
    queryKey: ['timesheets'],
    queryFn: () => base44.entities.Timesheet.list('-period_start'),
  });

  // Filter by accessible companies
  const accessibleCompanyIds = getAccessibleCompanyIds();
  const employees = selectedCompanyId === 'all'
    ? allEmployees.filter(e => accessibleCompanyIds.includes(e.company_id))
    : allEmployees.filter(e => e.company_id === selectedCompanyId);

  const attendance = allAttendance.filter(att => 
    employees.some(e => e.id === att.employee_id)
  );

  const createAttendanceMutation = useMutation({
    mutationFn: (data) => base44.entities.Attendance.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance-all']); // Invalidate the main attendance query
      toast.success(t('clocked_in_success'));
    }
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Attendance.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance-all']); // Invalidate the main attendance query
      toast.success(t('attendance_updated'));
    }
  });

  const createTimesheetMutation = useMutation({
    mutationFn: (data) => base44.entities.Timesheet.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['timesheets']);
      toast.success('Timesheet generated successfully');
    }
  });

  const getEmployeeShift = (employeeId) => {
    const assignment = assignments.find(
      a => a.employee_id === employeeId && a.status === 'active'
    );
    return shifts.find(s => s.id === assignment?.shift_id);
  };

  const getTodayAttendance = (employeeId) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return attendance.find(
      a => a.employee_id === employeeId && a.date === today
    );
  };

  const handleClockIn = (data) => {
    createAttendanceMutation.mutate(data);
  };

  const handleClockOut = (data) => {
    updateAttendanceMutation.mutate({ id: data.id, data });
  };

  const handleBreakStart = (data) => {
    updateAttendanceMutation.mutate({ id: data.id, data });
  };

  const handleBreakEnd = (data) => {
    updateAttendanceMutation.mutate({ id: data.id, data });
  };

  const generateTimesheet = (employeeId) => {
    const periodStart = startOfMonth(new Date(selectedMonth + '-01'));
    const periodEnd = endOfMonth(new Date(selectedMonth + '-01'));
    
    const monthAttendances = attendance.filter(
      a => a.employee_id === employeeId &&
           a.date >= format(periodStart, 'yyyy-MM-dd') &&
           a.date <= format(periodEnd, 'yyyy-MM-dd')
    );

    const totalWorkingDays = monthAttendances.length;
    const daysPresent = monthAttendances.filter(a => a.status === 'present').length;
    const daysAbsent = monthAttendances.filter(a => a.status === 'absent').length;
    const daysOnLeave = monthAttendances.filter(a => a.status === 'on_leave').length;
    const lateArrivals = monthAttendances.filter(a => a.late_by > 0).length;
    const earlyDepartures = monthAttendances.filter(a => a.early_departure > 0).length;
    
    const totalHours = monthAttendances.reduce((sum, a) => sum + (a.actual_hours || 0), 0);
    const overtimeHours = monthAttendances.reduce((sum, a) => sum + (a.overtime_hours || 0), 0);
    const regularHours = totalHours - overtimeHours;

    const employee = employees.find(e => e.id === employeeId);
    const overtimeCalc = calculateOvertimePay(employee?.basic_salary || 0, overtimeHours);

    const timesheetData = {
      employee_id: employeeId,
      period_start: format(periodStart, 'yyyy-MM-dd'),
      period_end: format(periodEnd, 'yyyy-MM-dd'),
      total_working_days: totalWorkingDays,
      days_present: daysPresent,
      days_absent: daysAbsent,
      days_on_leave: daysOnLeave,
      late_arrivals: lateArrivals,
      early_departures: earlyDepartures,
      total_hours_worked: parseFloat(totalHours.toFixed(2)),
      regular_hours: parseFloat(regularHours.toFixed(2)),
      overtime_hours: parseFloat(overtimeHours.toFixed(2)),
      overtime_amount: overtimeCalc.overtimePay,
      status: 'draft'
    };

    createTimesheetMutation.mutate(timesheetData);
  };

  const todayAttendances = attendance.filter(
    a => a.date === format(new Date(), 'yyyy-MM-dd')
  );
  const presentToday = todayAttendances.filter(a => a.status === 'present').length;
  // This calculates absent based on all *filtered* employees, which is correct.
  const absentToday = employees.length - presentToday; 
  const totalOvertimeHours = attendance.reduce((sum, a) => sum + (a.overtime_hours || 0), 0);
  const lateToday = todayAttendances.filter(a => a.late_by > 0).length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className={isRTL ? 'text-right' : ''}>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('time_management')}</h1>
        <p className="text-slate-600">{t('time_management_desc')}</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('present_today')}
          value={presentToday}
          icon={CheckCircle}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title={t('absent_today')}
          value={absentToday}
          icon={AlertCircle}
          bgColor="from-red-500 to-red-600"
        />
        <StatCard
          title={t('late_arrivals')}
          value={lateToday}
          icon={Clock}
          bgColor="from-amber-500 to-amber-600"
        />
        <StatCard
          title={t('total_overtime_month')}
          value={`${totalOvertimeHours.toFixed(1)}h`}
          icon={TrendingUp}
          bgColor="from-blue-500 to-blue-600"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="clock" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="clock" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Clock className="w-4 h-4 mr-2" />
            {t('clock_in_slash_out')}
          </TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Calendar className="w-4 h-4 mr-2" />
            {t('attendance_records')}
          </TabsTrigger>
          <TabsTrigger value="timesheets" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <TrendingUp className="w-4 h-4 mr-2" />
            {t('timesheets')}
          </TabsTrigger>
        </TabsList>

        {/* Clock In/Out Tab */}
        <TabsContent value="clock">
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <Card className="border-0 shadow-lg mb-6">
                <CardHeader className="border-b">
                  <CardTitle className={isRTL ? 'text-right' : ''}>{t('select_employee')}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Label>{t('employee')}</Label>
                  <Select
                    value={selectedEmployee?.id}
                    onValueChange={(id) => {
                      const emp = employees.find(e => e.id === id);
                      setSelectedEmployee(emp);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('choose_employee')} />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name} - {emp.employee_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {selectedEmployee && (
                <ClockInOut
                  employee={selectedEmployee}
                  todayAttendance={getTodayAttendance(selectedEmployee.id)}
                  shift={getEmployeeShift(selectedEmployee.id)}
                  onClockIn={handleClockIn}
                  onClockOut={handleClockOut}
                  onBreakStart={handleBreakStart}
                  onBreakEnd={handleBreakEnd}
                />
              )}
            </div>

            {selectedEmployee && (
              <OvertimeCalculator
                employee={selectedEmployee}
                overtimeHours={
                  attendance
                    .filter(a => a.employee_id === selectedEmployee.id)
                    .reduce((sum, a) => sum + (a.overtime_hours || 0), 0)
                }
                month={selectedMonth}
              />
            )}
          </div>
        </TabsContent>

        {/* Attendance Records Tab */}
        <TabsContent value="attendance">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-white">
              <CardTitle className={isRTL ? 'text-right' : ''}>{t('attendance_records')}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loadingAttendance ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
                </div>
              ) : attendance.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">{t('no_attendance_records')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attendance.slice(0, 20).map((att) => { // Renamed attendance to att to avoid conflict
                    const employee = employees.find(e => e.id === att.employee_id);
                    return (
                      <Card key={att.id} className="border border-slate-200 hover:shadow-md transition-all">
                        <CardContent className="p-4">
                          <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
                            <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                              <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <h3 className="font-semibold text-slate-900">
                                  {employee?.first_name} {employee?.last_name}
                                </h3>
                                <span className="text-sm text-slate-500">
                                  {format(new Date(att.date), 'MMM dd, yyyy')}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="text-slate-500">{t('clock_in')}:</span>
                                  <span className={`${isRTL ? 'mr-2' : 'ml-2'} font-semibold text-emerald-600`}>
                                    {att.clock_in || '-'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500">{t('clock_out')}:</span>
                                  <span className={`${isRTL ? 'mr-2' : 'ml-2'} font-semibold text-slate-600`}>
                                    {att.clock_out || '-'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500">{t('hours')}:</span>
                                  <span className={`${isRTL ? 'mr-2' : 'ml-2'} font-semibold text-blue-600`}>
                                    {att.actual_hours?.toFixed(2) || 0}h
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500">{t('overtime')}:</span>
                                  <span className={`${isRTL ? 'mr-2' : 'ml-2'} font-semibold text-purple-600`}>
                                    {att.overtime_hours?.toFixed(2) || 0}h
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timesheets Tab */}
        <TabsContent value="timesheets">
          <div className="space-y-6">
            {/* Generate Timesheet */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
                <CardTitle className={isRTL ? 'text-right' : ''}>{t('generate_timesheet')}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>{t('employee')}</Label>
                    <Select
                      value={selectedEmployee?.id}
                      onValueChange={(id) => {
                        const emp = employees.find(e => e.id === id);
                        setSelectedEmployee(emp);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('choose_employee')} />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.first_name} {emp.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('period')}</Label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => selectedEmployee && generateTimesheet(selectedEmployee.id)}
                      disabled={!selectedEmployee}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {t('generate_timesheet')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timesheets List */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-white">
                <CardTitle className={isRTL ? 'text-right' : ''}>{t('generated_timesheets')}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {timesheets.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">{t('no_timesheets_yet')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {timesheets.map((timesheet) => {
                      const employee = employees.find(e => e.id === timesheet.employee_id);
                      return (
                        <Card key={timesheet.id} className="border border-slate-200 hover:shadow-md transition-all">
                          <CardContent className="p-5">
                            <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
                              <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                                <h3 className="font-semibold text-slate-900 mb-2">
                                  {employee?.first_name} {employee?.last_name}
                                </h3>
                                <p className="text-sm text-slate-500 mb-3">
                                  {format(new Date(timesheet.period_start), 'MMM dd')} - {format(new Date(timesheet.period_end), 'MMM dd, yyyy')}
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  <div>
                                    <span className="text-slate-500">{t('present')}:</span>
                                    <span className={`${isRTL ? 'mr-2' : 'ml-2'} font-semibold text-emerald-600`}>
                                      {timesheet.days_present} {t('days')}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">{t('total_hours')}:</span>
                                    <span className={`${isRTL ? 'mr-2' : 'ml-2'} font-semibold text-blue-600`}>
                                      {timesheet.total_hours_worked?.toFixed(1)}h
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">{t('overtime')}:</span>
                                    <span className={`${isRTL ? 'mr-2' : 'ml-2'} font-semibold text-purple-600`}>
                                      {timesheet.overtime_hours?.toFixed(1)}h
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">{t('ot_pay')}:</span>
                                    <span className={`${isRTL ? 'mr-2' : 'ml-2'} font-semibold text-slate-900`}>
                                      {timesheet.overtime_amount?.toLocaleString()} SAR
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function TimeManagement() {
  return (
    <ProtectedModule moduleName="TimeManagement">
      <TimeManagementContent />
    </ProtectedModule>
  );
}
