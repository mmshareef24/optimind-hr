import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Clock, Plus, Calendar, TrendingUp, CheckCircle2, AlertCircle,
  FileText, Edit, Trash2
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";

export default function TimeTrackingDashboard({
  employee,
  timeEntries = [],
  projects = [],
  tasks = [],
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  onGenerateTimesheet
}) {
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Filter entries for current week
  const weekEntries = timeEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= weekStart && entryDate <= weekEnd;
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const totalHours = weekEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
    const overtimeHours = weekEntries.reduce((sum, e) => sum + (e.overtime_hours || 0), 0);
    const submittedCount = weekEntries.filter(e => e.status === 'submitted').length;
    const approvedCount = weekEntries.filter(e => e.status === 'approved').length;

    return {
      totalHours: totalHours.toFixed(1),
      overtimeHours: overtimeHours.toFixed(1),
      submittedCount,
      approvedCount,
      draftCount: weekEntries.filter(e => e.status === 'draft').length
    };
  }, [weekEntries]);

  const getProject = (projectId) => projects.find(p => p.id === projectId);
  const getTask = (taskId) => tasks.find(t => t.id === taskId);

  const getEntriesForDay = (day) => {
    return weekEntries.filter(entry => isSameDay(new Date(entry.date), day));
  };

  const statusColors = {
    draft: 'bg-slate-100 text-slate-700',
    submitted: 'bg-blue-100 text-blue-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700'
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedWeek(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedWeek(newDate);
  };

  const goToCurrentWeek = () => {
    setSelectedWeek(new Date());
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Hours</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.totalHours}h</p>
              </div>
              <Clock className="w-10 h-10 text-emerald-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Overtime</p>
                <p className="text-3xl font-bold text-amber-600">{stats.overtimeHours}h</p>
              </div>
              <TrendingUp className="w-10 h-10 text-amber-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Submitted</p>
                <p className="text-3xl font-bold text-blue-600">{stats.submittedCount}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Approved</p>
                <p className="text-3xl font-bold text-purple-600">{stats.approvedCount}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week Navigation */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={goToPreviousWeek}>
                ← Previous
              </Button>
              <Button variant="outline" onClick={goToCurrentWeek}>
                This Week
              </Button>
              <Button variant="outline" onClick={goToNextWeek}>
                Next →
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-slate-600">Week of</p>
                <p className="font-semibold text-slate-900">
                  {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
                </p>
              </div>
              <Button onClick={onAddEntry} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Log Hours
              </Button>
              <Button onClick={onGenerateTimesheet} variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Generate Timesheet
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const dayEntries = getEntriesForDay(day);
              const dayHours = dayEntries.reduce((sum, e) => sum + (e.hours || 0) + (e.overtime_hours || 0), 0);
              const isToday = isSameDay(day, new Date());

              return (
                <Card 
                  key={day.toString()} 
                  className={`${isToday ? 'border-2 border-emerald-500' : 'border'}`}
                >
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <p className="text-xs text-slate-500 font-medium">
                        {format(day, 'EEE')}
                      </p>
                      <p className={`text-lg font-bold ${isToday ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {format(day, 'dd')}
                      </p>
                      {dayHours > 0 && (
                        <p className="text-xs text-slate-600 mt-1">
                          <strong>{dayHours.toFixed(1)}h</strong> logged
                        </p>
                      )}
                    </div>

                    {dayEntries.length > 0 ? (
                      <div className="space-y-2">
                        {dayEntries.map((entry) => {
                          const project = getProject(entry.project_id);
                          const task = getTask(entry.task_id);

                          return (
                            <div 
                              key={entry.id}
                              className="p-2 bg-slate-50 rounded border border-slate-200 hover:shadow-md transition-all"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-slate-900 truncate">
                                    {entry.hours + entry.overtime_hours}h
                                  </p>
                                  {project && (
                                    <p className="text-xs text-slate-600 truncate">
                                      {project.project_code}
                                    </p>
                                  )}
                                </div>
                                <Badge className={`${statusColors[entry.status]} text-xs`}>
                                  {entry.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                                {entry.description}
                              </p>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onEditEntry(entry)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onDeleteEntry(entry.id)}
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-xs text-slate-400">No entries</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}