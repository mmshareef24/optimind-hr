import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Clock, AlertCircle, FileText, Pen } from "lucide-react";
import { format } from "date-fns";

export default function TaskBoard({ tasks, employees, currentUser, onCompleteTask, onUpdateTask }) {
  const [filter, setFilter] = useState('all');

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'pending') return task.status !== 'completed';
    if (filter === 'completed') return task.status === 'completed';
    if (filter === 'overdue') return task.status === 'overdue';
    return true;
  });

  const tasksByStatus = {
    not_started: filteredTasks.filter(t => t.status === 'not_started'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
    overdue: filteredTasks.filter(t => t.status === 'overdue')
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700'
  };

  const typeIcons = {
    document_submission: FileText,
    training: CheckCircle,
    meeting: Clock,
    system_access: CheckCircle,
    equipment_setup: CheckCircle,
    policy_review: FileText,
    orientation: CheckCircle,
    general: CheckCircle
  };

  const TaskCard = ({ task }) => {
    const employee = employees.find(e => e.id === task.employee_id);
    const Icon = typeIcons[task.task_type] || CheckCircle;
    const isMyTask = task.employee_id === currentUser?.id || task.assigned_user_id === currentUser?.id;

    return (
      <Card className="border border-slate-200 hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
              task.status === 'completed' ? 'from-emerald-500 to-emerald-600' :
              task.status === 'overdue' ? 'from-red-500 to-red-600' :
              'from-blue-500 to-blue-600'
            } flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-slate-900">{task.task_title}</h4>
                {task.status !== 'completed' && isMyTask && (
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => onCompleteTask(task.id)}
                  />
                )}
              </div>

              {task.task_description && (
                <p className="text-sm text-slate-600 mb-2">{task.task_description}</p>
              )}

              <div className="flex flex-wrap gap-2 mb-2">
                <Badge className={priorityColors[task.priority]}>
                  {task.priority}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {task.assigned_to.replace(/_/g, ' ')}
                </Badge>
                {task.requires_document && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                    <FileText className="w-3 h-3 mr-1" />
                    Document
                  </Badge>
                )}
                {task.requires_signature && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700">
                    <Pen className="w-3 h-3 mr-1" />
                    Signature
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {employee?.first_name} {employee?.last_name}
                </span>
                {task.due_date && (
                  <span>Due: {format(new Date(task.due_date), 'MMM dd')}</span>
                )}
              </div>

              {task.status === 'in_progress' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => onCompleteTask(task.id)}
                >
                  Mark Complete
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
      <div className="flex gap-2">
        {['all', 'pending', 'completed', 'overdue'].map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? 'bg-blue-600' : ''}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Task Columns */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Not Started */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              To Do ({tasksByStatus.not_started.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksByStatus.not_started.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              In Progress ({tasksByStatus.in_progress.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksByStatus.in_progress.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </CardContent>
        </Card>

        {/* Completed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Completed ({tasksByStatus.completed.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksByStatus.completed.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              Overdue ({tasksByStatus.overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksByStatus.overdue.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}