
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CheckCircle2, Clock, AlertCircle, Circle, Plus, Edit, Trash2,
  ChevronRight, ChevronDown, Link as LinkIcon
} from "lucide-react";
import { format } from "date-fns";

export default function TaskManagement({ 
  tasks = [], 
  employees = [],
  onAddTask,
  onEditTask,
  onDeleteTask,
  onUpdateTaskStatus
}) {
  const [expandedTasks, setExpandedTasks] = useState(new Set());

  const toggleTask = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const statusConfig = {
    todo: { 
      icon: Circle, 
      color: 'text-slate-400 bg-slate-100', 
      label: 'To Do',
      badgeColor: 'bg-slate-100 text-slate-700'
    },
    in_progress: { 
      icon: Clock, 
      color: 'text-blue-500 bg-blue-100', 
      label: 'In Progress',
      badgeColor: 'bg-blue-100 text-blue-700'
    },
    review: { 
      icon: AlertCircle, 
      color: 'text-amber-500 bg-amber-100', 
      label: 'Review',
      badgeColor: 'bg-amber-100 text-amber-700'
    },
    completed: { 
      icon: CheckCircle2, 
      color: 'text-emerald-500 bg-emerald-100', 
      label: 'Completed',
      badgeColor: 'bg-emerald-100 text-emerald-700'
    },
    blocked: { 
      icon: AlertCircle, 
      color: 'text-red-500 bg-red-100', 
      label: 'Blocked',
      badgeColor: 'bg-red-100 text-red-700'
    }
  };

  const priorityColors = {
    low: 'border-slate-300',
    medium: 'border-blue-300',
    high: 'border-orange-300',
    urgent: 'border-red-400'
  };

  const getEmployee = (employeeId) => {
    return employees.find(e => e.id === employeeId);
  };

  const getDependentTasks = (taskId) => {
    return tasks.filter(t => t.dependencies?.includes(taskId));
  };

  const getTaskById = (taskId) => {
    return tasks.find(t => t.id === taskId);
  };

  const renderTask = (task, level = 0) => {
    const StatusIcon = statusConfig[task.status]?.icon || Circle;
    const assignee = getEmployee(task.assigned_to);
    const isExpanded = expandedTasks.has(task.id);
    const dependentTasks = getDependentTasks(task.id);
    const hasDependencies = task.dependencies && task.dependencies.length > 0;
    const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'completed';

    return (
      <div key={task.id} style={{ marginLeft: `${level * 24}px` }} className="mb-2">
        <Card className={`border-l-4 ${priorityColors[task.priority]} hover:shadow-md transition-all`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Status Icon */}
              <button
                onClick={() => onUpdateTaskStatus && onUpdateTaskStatus(task)}
                className={`p-2 rounded-lg ${statusConfig[task.status]?.color} hover:opacity-80 transition-all`}
              >
                <StatusIcon className="w-5 h-5" />
              </button>

              {/* Task Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <h4 className={`font-semibold text-slate-900 ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                      {task.task_name}
                    </h4>
                    {task.description && (
                      <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditTask(task)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteTask(task.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Task Meta */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge className={statusConfig[task.status]?.badgeColor}>
                    {statusConfig[task.status]?.label}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {task.priority} priority
                  </Badge>
                  {isOverdue && (
                    <Badge className="bg-red-100 text-red-700">Overdue</Badge>
                  )}
                  {hasDependencies && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <LinkIcon className="w-3 h-3" />
                      {task.dependencies.length} dependencies
                    </Badge>
                  )}
                </div>

                {/* Progress Bar */}
                {task.progress !== undefined && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600">Progress</span>
                      <span className="text-xs font-semibold text-emerald-600">{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-1.5" />
                  </div>
                )}

                {/* Task Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {assignee && (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6 border">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs">
                          {assignee.first_name?.[0]}{assignee.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-slate-600 truncate">
                        {assignee.first_name} {assignee.last_name}
                      </span>
                    </div>
                  )}

                  {task.due_date && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                        Due: {format(new Date(task.due_date), 'MMM dd')}
                      </span>
                    </div>
                  )}

                  {(task.estimated_hours || task.actual_hours) && (
                    <div className="text-slate-600">
                      <span className="font-semibold">{task.actual_hours || 0}</span>
                      <span className="text-slate-400">/{task.estimated_hours || 0}h</span>
                    </div>
                  )}
                </div>

                {/* Dependencies */}
                {hasDependencies && isExpanded && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <h5 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" />
                      Depends on:
                    </h5>
                    <div className="space-y-1">
                      {task.dependencies.map(depId => {
                        const depTask = getTaskById(depId);
                        if (!depTask) return null;
                        return (
                          <div key={depId} className="flex items-center gap-2 text-xs">
                            <Badge className={`${statusConfig[depTask.status]?.badgeColor} text-xs`}>
                              {statusConfig[depTask.status]?.label}
                            </Badge>
                            <span className="text-slate-700">{depTask.task_name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Toggle Dependencies Button */}
                {hasDependencies && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTask(task.id)}
                    className="mt-2 h-7 text-xs"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronDown className="w-3 h-3 mr-1" />
                        Hide Dependencies
                      </>
                    ) : (
                      <>
                        <ChevronRight className="w-3 h-3 mr-1" />
                        Show Dependencies
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Group tasks by status
  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    review: tasks.filter(t => t.status === 'review'),
    completed: tasks.filter(t => t.status === 'completed'),
    blocked: tasks.filter(t => t.status === 'blocked')
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-900">Tasks</h3>
        <Button onClick={onAddTask} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 mb-4">No tasks yet</p>
            <Button onClick={onAddTask} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create First Task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Task Statistics */}
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
              <Card key={status} className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">{statusConfig[status]?.label}</span>
                    <span className="text-lg font-bold text-slate-900">{statusTasks.length}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Task List */}
          <div className="space-y-2">
            {tasks.map(task => renderTask(task))}
          </div>
        </div>
      )}
    </div>
  );
}
