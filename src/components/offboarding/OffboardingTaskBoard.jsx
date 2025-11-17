import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Clock, AlertCircle, User } from "lucide-react";
import { format, isPast } from "date-fns";

export default function OffboardingTaskBoard({ tasks, processes, employees, onUpdateTask }) {
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTasks = tasks.filter(task => {
    const roleMatch = roleFilter === 'all' || task.assigned_to_role === roleFilter;
    const statusMatch = statusFilter === 'all' || task.status === statusFilter;
    return roleMatch && statusMatch;
  });

  const groupedTasks = {
    pending: filteredTasks.filter(t => t.status === 'pending'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
    blocked: filteredTasks.filter(t => t.status === 'blocked')
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-700 border-blue-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    critical: 'bg-red-100 text-red-700 border-red-200'
  };

  const roleColors = {
    hr: 'bg-purple-100 text-purple-700',
    it: 'bg-blue-100 text-blue-700',
    manager: 'bg-emerald-100 text-emerald-700',
    finance: 'bg-amber-100 text-amber-700',
    employee: 'bg-slate-100 text-slate-700',
    admin: 'bg-indigo-100 text-indigo-700'
  };

  const TaskCard = ({ task }) => {
    const employee = employees.find(e => e.id === task.employee_id);
    const process = processes.find(p => p.id === task.offboarding_process_id);
    const isOverdue = task.status === 'pending' && isPast(new Date(task.due_date));

    return (
      <Card className={`mb-3 hover:shadow-md transition-all ${isOverdue ? 'border-red-300' : ''}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">{task.task_name}</h4>
              {employee && (
                <p className="text-sm text-slate-600">
                  {employee.first_name} {employee.last_name} • {employee.employee_id}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={roleColors[task.assigned_to_role]}>
                {task.assigned_to_role.toUpperCase()}
              </Badge>
              <Badge className={priorityColors[task.priority]}>
                {task.priority}
              </Badge>
              {isOverdue && (
                <Badge className="bg-red-100 text-red-700">
                  Overdue
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4" />
              Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
            </div>

            {task.task_description && (
              <p className="text-sm text-slate-600 line-clamp-2">{task.task_description}</p>
            )}

            <div className="flex gap-2 pt-2">
              {task.status === 'pending' && (
                <Button 
                  size="sm" 
                  onClick={() => onUpdateTask(task.id, { status: 'in_progress' })}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Start
                </Button>
              )}
              {task.status === 'in_progress' && (
                <Button 
                  size="sm" 
                  onClick={() => onUpdateTask(task.id, { 
                    status: 'completed',
                    completion_date: format(new Date(), 'yyyy-MM-dd')
                  })}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Complete
                </Button>
              )}
              {task.status === 'blocked' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onUpdateTask(task.id, { status: 'pending' })}
                >
                  Unblock
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="it">IT</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Task Board */}
      <div className="grid md:grid-cols-4 gap-6">
        {/* Pending */}
        <div>
          <Card className="border-0 shadow-lg bg-slate-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Pending ({groupedTasks.pending.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupedTasks.pending.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* In Progress */}
        <div>
          <Card className="border-0 shadow-lg bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                In Progress ({groupedTasks.in_progress.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupedTasks.in_progress.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Blocked */}
        <div>
          <Card className="border-0 shadow-lg bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                Blocked ({groupedTasks.blocked.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupedTasks.blocked.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Completed */}
        <div>
          <Card className="border-0 shadow-lg bg-emerald-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Completed ({groupedTasks.completed.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupedTasks.completed.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}