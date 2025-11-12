import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { UserPlus, Calendar, Briefcase, CheckSquare, Send } from "lucide-react";

export default function NewHiresList({ newHires, tasks, checklists, onAssignChecklist = null }) {
  const getEmployeeProgress = (employeeId) => {
    const employeeTasks = tasks.filter(t => t.employee_id === employeeId);
    if (employeeTasks.length === 0) return { total: 0, completed: 0, progress: 0 };
    
    const completed = employeeTasks.filter(t => t.status === 'completed').length;
    const progress = Math.round((completed / employeeTasks.length) * 100);
    
    return { total: employeeTasks.length, completed, progress };
  };

  const getDaysSinceHire = (hireDate) => {
    const hire = new Date(hireDate);
    const today = new Date();
    const diffTime = Math.abs(today - hire);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-600" />
          New Hires ({newHires.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {newHires.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No new hires in the last 90 days</p>
          </div>
        ) : (
          <div className="space-y-4">
            {newHires.map((employee) => {
              const progress = getEmployeeProgress(employee.id);
              const daysSinceHire = getDaysSinceHire(employee.hire_date);
              const hasChecklist = progress.total > 0;

              return (
                <Card key={employee.id} className="border border-slate-200 hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-14 h-14 border-2 border-blue-100">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                          {employee.first_name?.[0]}{employee.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-slate-900">
                              {employee.first_name} {employee.last_name}
                            </h3>
                            <p className="text-sm text-slate-600">{employee.job_title}</p>
                          </div>
                          <Badge className={
                            daysSinceHire <= 7 ? 'bg-blue-100 text-blue-700' :
                            daysSinceHire <= 30 ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-700'
                          }>
                            Day {daysSinceHire}
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-3 gap-3 mb-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">Started: {employee.hire_date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">{employee.department}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">
                              {progress.completed} / {progress.total} tasks
                            </span>
                          </div>
                        </div>

                        {hasChecklist ? (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-slate-600">Onboarding Progress</span>
                              <span className="text-sm font-semibold text-slate-900">{progress.progress}%</span>
                            </div>
                            <Progress value={progress.progress} className="h-2" />
                          </div>
                        ) : (
                          <Button
                            onClick={() => onAssignChecklist(employee.id)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <CheckSquare className="w-4 h-4 mr-2" />
                            Assign Checklist
                          </Button>
                        )}
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
  );
}