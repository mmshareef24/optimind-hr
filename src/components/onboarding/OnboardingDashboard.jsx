import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, CheckCircle, Clock, AlertCircle, TrendingUp, Calendar } from "lucide-react";

export default function OnboardingDashboard({ employees, tasks, checklists }) {
  // Calculate statistics
  const newHires = employees.filter(e => {
    const hireDate = new Date(e.hire_date);
    const now = new Date();
    const daysSinceHire = Math.floor((now - hireDate) / (1000 * 60 * 60 * 24));
    return daysSinceHire <= 90 && e.status === 'active'; // New hires within 90 days
  });

  const activeOnboarding = newHires.length;
  
  // Group tasks by employee
  const tasksByEmployee = {};
  tasks.forEach(task => {
    if (!tasksByEmployee[task.employee_id]) {
      tasksByEmployee[task.employee_id] = [];
    }
    tasksByEmployee[task.employee_id].push(task);
  });

  // Calculate completion rates
  const completionData = newHires.map(emp => {
    const empTasks = tasksByEmployee[emp.id] || [];
    const completed = empTasks.filter(t => t.status === 'completed').length;
    const total = empTasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      employee: emp,
      completed,
      total,
      percentage,
      overdue: empTasks.filter(t => t.status === 'overdue').length,
      inProgress: empTasks.filter(t => t.status === 'in_progress').length
    };
  });

  const averageCompletion = completionData.length > 0
    ? Math.round(completionData.reduce((sum, d) => sum + d.percentage, 0) / completionData.length)
    : 0;

  const fullyOnboarded = completionData.filter(d => d.percentage === 100).length;
  const atRisk = completionData.filter(d => d.overdue > 0).length;

  // Recent activity
  const recentCompletions = tasks
    .filter(t => t.status === 'completed' && t.completed_date)
    .sort((a, b) => new Date(b.completed_date) - new Date(a.completed_date))
    .slice(0, 5);

  const overdueTasksCount = tasks.filter(t => t.status === 'overdue').length;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Active Onboarding</p>
                <p className="text-3xl font-bold text-blue-600">{activeOnboarding}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Fully Onboarded</p>
                <p className="text-3xl font-bold text-emerald-600">{fullyOnboarded}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">At Risk</p>
                <p className="text-3xl font-bold text-amber-600">{atRisk}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">{overdueTasksCount} overdue tasks</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Avg. Completion</p>
                <p className="text-3xl font-bold text-purple-600">{averageCompletion}%</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Progress */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Onboarding Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {completionData.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No active onboarding processes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completionData.map((data) => (
                <div key={data.employee.id} className="p-4 border rounded-lg hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {data.employee.first_name} {data.employee.last_name}
                      </h4>
                      <p className="text-sm text-slate-600">
                        {data.employee.job_title} • {data.employee.department}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Started: {new Date(data.employee.hire_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900 mb-1">
                        {data.percentage}%
                      </div>
                      <p className="text-xs text-slate-500">
                        {data.completed}/{data.total} tasks
                      </p>
                    </div>
                  </div>
                  
                  <Progress value={data.percentage} className="h-2 mb-2" />
                  
                  <div className="flex gap-2 mt-3">
                    {data.percentage === 100 && (
                      <Badge className="bg-emerald-100 text-emerald-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                    {data.inProgress > 0 && (
                      <Badge className="bg-blue-100 text-blue-700">
                        <Clock className="w-3 h-3 mr-1" />
                        {data.inProgress} in progress
                      </Badge>
                    )}
                    {data.overdue > 0 && (
                      <Badge className="bg-red-100 text-red-700">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {data.overdue} overdue
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Recent Completions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {recentCompletions.length === 0 ? (
            <p className="text-center py-8 text-slate-500">No recent completions</p>
          ) : (
            <div className="space-y-3">
              {recentCompletions.map((task) => {
                const employee = employees.find(e => e.id === task.employee_id);
                return (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-medium text-slate-900">{task.task_title}</p>
                        <p className="text-sm text-slate-600">
                          {employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {new Date(task.completed_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}