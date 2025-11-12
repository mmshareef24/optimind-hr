import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Circle, ArrowUpCircle, CheckCircle2, XCircle, Clock, Plus,
  ChevronDown, ChevronUp, Link as LinkIcon, Edit, Trash2, Flag
} from "lucide-react";
import { format } from "date-fns";

export default function TaskManagement({
  tasks = [],
  employees = [],
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete
}) {
  const [expandedTasks, setExpandedTasks] = useState({});

  const statusConfig = {
    todo: { 
      icon: Circle, 
      color: 'text-slate-400', 
      label: 'To Do',
      badgeColor: 'bg-slate-100 text-slate-700'
    },
    in_progress: { 
      icon: ArrowUpCircle, 
      color: 'text-blue-500', 
      label: 'In Progress',
      badgeColor: 'bg-blue-100 text-blue-700'
    },
    review: { 
      icon: Clock, 
      color: 'text-amber-500', 
      label: 'Review',
      badgeColor: 'bg-amber-100 text-amber-700'
    },
    completed: { 
      icon: CheckCircle2, 
      color: 'text-emerald-500', 
      label: 'Completed',
      badgeColor: 'bg-emerald-100 text-emerald-700'
    },
    blocked: { 
      icon: XCircle, 
      color: 'text-red-500', 
      label: 'Blocked',
      badgeColor: 'bg-red-100 text-red-700'
    }
  };

  const priorityConfig = {
    low: { color: 'border-blue-300', badge: 'bg-blue-100 text-blue-700' },
    medium: { color: 'border-amber-300', badge: 'bg-amber-100 text-amber-700' },
    high: { color: 'border-orange-300', badge: 'bg-orange-100 text-orange-700' },
    urgent: { color: 'border-red-400', badge: 'bg-red-100 text-red-700' }
  };

  const getEmployee = (empId) => employees.find(e => e.id === empId);

  const toggleExpanded = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const cycleStatus = (task) => {
    const statusOrder = ['todo', 'in_progress', 'review', 'completed'];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    
    onTaskUpdate(task.id, { ...task, status: nextStatus });
  };

  const getDependentTasks = (taskId) => {
    return tasks.filter(t => 
      t.dependencies && t.dependencies.includes(taskId)
    );
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  // Group by status
  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    review: tasks.filter(t => t.status === 'review'),
    completed: tasks.filter(t => t.status === 'completed'),
    blocked: tasks.filter(t => t.status === 'blocked')
  };

  const statusCounts = Object.entries(tasksByStatus).map(([status, tasks]) => ({
    status,
    count: tasks.length,
    ...statusConfig[status]
  }));

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-5 gap-3">
        {statusCounts.map(({ status, count, label, badgeColor }) => (
          <Card key={status} className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{count}</p>
              <Badge className={`${badgeColor} mt-2`}>{label}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No tasks yet. Click "Add Task" to create one.</p>
            </CardContent>
          </Card>
        ) : (
          tasks.map(task => {
            const StatusIcon = statusConfig[task.status]?.icon || Circle;
            const assignee = getEmployee(task.assigned_to);
            const dependentTasks = getDependentTasks(task.id);
            const isExpanded = expandedTasks[task.id];
            const overdue = isOverdue(task.due_date);

            return (
              <Card 
                key={task.id} 
                className={`border-l-4 ${priorityConfig[task.priority]?.color} hover:shadow-lg transition-all`}
              >
                <CardContent className="p-5">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => cycleStatus(task)}
                        className="mt-1 hover:scale-110 transition-transform"
                      >
                        <StatusIcon className={`w-6 h-6 ${statusConfig[task.status]?.color}`} />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="font-semibold text-slate-900 text-lg">
                            {task.task_name}
                          </h4>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onTaskUpdate(task.id, task)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onTaskDelete(task.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 mb-3">{task.description}</p>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={priorityConfig[task.priority]?.badge}>
                            <Flag className="w-3 h-3 mr-1" />
                            {task.priority}
                          </Badge>
                          <Badge className={statusConfig[task.status]?.badgeColor}>
                            {statusConfig[task.status]?.label}
                          </Badge>
                          {task.dependencies && task.dependencies.length > 0 && (
                            <Badge 
                              variant="outline" 
                              className="cursor-pointer hover:bg-slate-50"
                              onClick={() => toggleExpanded(task.id)}
                            >
                              <LinkIcon className="w-3 h-3 mr-1" />
                              {task.dependencies.length} dependencies
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3 ml-1" />
                              ) : (
                                <ChevronDown className="w-3 h-3 ml-1" />
                              )}
                            </Badge>
                          )}
                          {overdue && task.status !== 'completed' && (
                            <Badge className="bg-red-100 text-red-700">
                              <Clock className="w-3 h-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">Progress</span>
                            <span className="font-semibold text-slate-900">{task.progress || 0}%</span>
                          </div>
                          <Progress value={task.progress || 0} className="h-2" />
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-slate-500">Assigned to</p>
                            {assignee ? (
                              <div className="flex items-center gap-2 mt-1">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                                    {assignee.first_name?.[0]}{assignee.last_name?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-slate-900">
                                  {assignee.first_name} {assignee.last_name}
                                </span>
                              </div>
                            ) : (
                              <p className="text-slate-400 mt-1">Unassigned</p>
                            )}
                          </div>

                          {task.due_date && (
                            <div>
                              <p className="text-slate-500">Due Date</p>
                              <p className={`font-medium mt-1 ${overdue ? 'text-red-600' : 'text-slate-900'}`}>
                                {format(new Date(task.due_date), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          )}

                          {task.estimated_hours > 0 && (
                            <div>
                              <p className="text-slate-500">Estimated</p>
                              <p className="font-medium text-slate-900 mt-1">{task.estimated_hours}h</p>
                            </div>
                          )}

                          {task.actual_hours > 0 && (
                            <div>
                              <p className="text-slate-500">Actual</p>
                              <p className="font-medium text-slate-900 mt-1">{task.actual_hours}h</p>
                            </div>
                          )}
                        </div>

                        {/* Dependencies Expanded */}
                        {isExpanded && task.dependencies && task.dependencies.length > 0 && (
                          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-sm font-semibold text-slate-700 mb-2">Dependencies:</p>
                            <div className="space-y-2">
                              {task.dependencies.map(depId => {
                                const depTask = tasks.find(t => t.id === depId);
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

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {task.tags.map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}