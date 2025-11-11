import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Calendar, Flag, CheckCircle2 } from "lucide-react";

export default function GanttChart({ 
  project,
  tasks = [],
  milestones = [],
  employees = []
}) {
  const { startDate, endDate, monthsInProject, daysInProject } = useMemo(() => {
    const start = new Date(project.start_date);
    const end = new Date(project.end_date);
    const days = differenceInDays(end, start) + 1;
    
    // Calculate months for column headers
    const months = [];
    let current = startOfMonth(start);
    const projectEnd = endOfMonth(end);
    
    while (current <= projectEnd) {
      months.push(current);
      current = addDays(endOfMonth(current), 1);
    }

    return {
      startDate: start,
      endDate: end,
      monthsInProject: months,
      daysInProject: days
    };
  }, [project]);

  const getEmployee = (employeeId) => {
    return employees.find(e => e.id === employeeId);
  };

  const calculatePosition = (itemStart, itemEnd) => {
    const start = new Date(itemStart);
    const end = new Date(itemEnd);
    
    const startOffset = differenceInDays(start, startDate);
    const duration = differenceInDays(end, start) + 1;
    
    const leftPercent = (startOffset / daysInProject) * 100;
    const widthPercent = (duration / daysInProject) * 100;
    
    return {
      left: `${Math.max(0, leftPercent)}%`,
      width: `${Math.min(widthPercent, 100 - leftPercent)}%`,
      days: duration
    };
  };

  const getStatusColor = (status, progress) => {
    if (status === 'completed') return 'bg-emerald-500';
    if (status === 'blocked') return 'bg-red-500';
    if (status === 'review') return 'bg-amber-500';
    if (status === 'in_progress') return 'bg-blue-500';
    return 'bg-slate-400';
  };

  // Sort tasks by start date
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = new Date(a.start_date || project.start_date);
    const dateB = new Date(b.start_date || project.start_date);
    return dateA - dateB;
  });

  // Sort milestones by due date
  const sortedMilestones = [...milestones].sort((a, b) => {
    return new Date(a.due_date) - new Date(b.due_date);
  });

  // Calculate days per month for column widths
  const monthColumns = monthsInProject.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
    const widthPercent = (daysInMonth / daysInProject) * 100;
    return {
      month,
      width: widthPercent
    };
  });

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-blue-50">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Project Timeline - Gantt Chart
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Timeline Header */}
              <div className="flex border-b bg-slate-50">
                <div className="w-64 flex-shrink-0 p-4 border-r font-semibold text-slate-700">
                  Item
                </div>
                <div className="flex-1 flex">
                  {monthColumns.map(({ month, width }, idx) => (
                    <div
                      key={idx}
                      className="border-r p-2 text-center text-sm font-semibold text-slate-700"
                      style={{ width: `${width}%` }}
                    >
                      {format(month, 'MMM yyyy')}
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestones Section */}
              {sortedMilestones.length > 0 && (
                <div className="border-b bg-purple-50/30">
                  <div className="flex border-b bg-purple-100">
                    <div className="w-64 flex-shrink-0 p-2 px-4 border-r">
                      <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                        <Flag className="w-4 h-4" />
                        Milestones
                      </h3>
                    </div>
                    <div className="flex-1" />
                  </div>
                  {sortedMilestones.map((milestone) => {
                    const position = calculatePosition(milestone.due_date, milestone.due_date);
                    const isCompleted = milestone.status === 'completed';
                    
                    return (
                      <div key={milestone.id} className="flex items-center border-b hover:bg-purple-50 transition-colors">
                        <div className="w-64 flex-shrink-0 p-3 px-4 border-r">
                          <div className="flex items-center gap-2">
                            <Flag className={`w-4 h-4 ${isCompleted ? 'text-emerald-600' : 'text-purple-600'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-900 truncate">
                                {milestone.milestone_name}
                              </p>
                              <Badge className={`mt-1 text-xs ${
                                isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {milestone.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 relative h-16 p-2">
                          <div
                            className="absolute top-1/2 transform -translate-y-1/2 h-8 flex items-center justify-center"
                            style={{ left: position.left }}
                          >
                            <div className={`w-6 h-6 rounded-full ${
                              isCompleted ? 'bg-emerald-500' : 'bg-purple-500'
                            } border-4 border-white shadow-lg flex items-center justify-center`}>
                              {isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
                            </div>
                            <div className="ml-2 px-2 py-1 bg-white rounded shadow-sm border text-xs font-medium whitespace-nowrap">
                              {format(new Date(milestone.due_date), 'MMM dd')}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tasks Section */}
              {sortedTasks.length > 0 && (
                <div>
                  <div className="flex border-b bg-blue-100">
                    <div className="w-64 flex-shrink-0 p-2 px-4 border-r">
                      <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Tasks
                      </h3>
                    </div>
                    <div className="flex-1" />
                  </div>
                  {sortedTasks.map((task) => {
                    if (!task.start_date || !task.due_date) return null;
                    
                    const position = calculatePosition(task.start_date, task.due_date);
                    const assignee = getEmployee(task.assigned_to);
                    const barColor = getStatusColor(task.status, task.progress);
                    
                    return (
                      <div key={task.id} className="flex items-center border-b hover:bg-slate-50 transition-colors">
                        <div className="w-64 flex-shrink-0 p-3 px-4 border-r">
                          <div className="flex items-center gap-2">
                            {assignee && (
                              <Avatar className="w-6 h-6 border">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs">
                                  {assignee.first_name?.[0]}{assignee.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-900 truncate">
                                {task.task_name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {task.status}
                                </Badge>
                                {task.progress > 0 && (
                                  <span className="text-xs text-slate-500">{task.progress}%</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 relative h-16 p-2">
                          <div
                            className="absolute top-1/2 transform -translate-y-1/2 h-6 rounded-full shadow-md overflow-hidden"
                            style={{
                              left: position.left,
                              width: position.width,
                              minWidth: '60px'
                            }}
                          >
                            {/* Background bar */}
                            <div className={`h-full ${barColor} opacity-30`} />
                            {/* Progress bar */}
                            <div
                              className={`absolute top-0 left-0 h-full ${barColor}`}
                              style={{ width: `${task.progress}%` }}
                            />
                            {/* Duration label */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-semibold text-white drop-shadow-md">
                                {position.days}d
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty State */}
              {sortedTasks.length === 0 && sortedMilestones.length === 0 && (
                <div className="p-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">No tasks or milestones to display on timeline</p>
                  <p className="text-sm text-slate-400 mt-1">Add tasks and milestones with dates to see them here</p>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="border-t bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-semibold text-slate-700">Status Legend:</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-400" />
                <span className="text-slate-600">To Do</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500" />
                <span className="text-slate-600">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-500" />
                <span className="text-slate-600">Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500" />
                <span className="text-slate-600">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500" />
                <span className="text-slate-600">Blocked</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}