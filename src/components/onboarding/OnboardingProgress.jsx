import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function OnboardingProgress({ employee, tasks }) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const overdue = tasks.filter(t => t.status === 'overdue').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          Onboarding Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Overall Completion</span>
              <span className="text-2xl font-bold text-slate-900">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-xs text-slate-500 mt-2">
              {completed} of {total} tasks completed
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
              <p className="text-2xl font-bold text-emerald-900">{completed}</p>
              <p className="text-xs text-emerald-700">Completed</p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Clock className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-900">{inProgress}</p>
              <p className="text-xs text-blue-700">In Progress</p>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-600" />
              <p className="text-2xl font-bold text-red-900">{overdue}</p>
              <p className="text-xs text-red-700">Overdue</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <Badge className={
              progress === 100 ? 'bg-emerald-100 text-emerald-700' :
              progress >= 50 ? 'bg-blue-100 text-blue-700' :
              'bg-amber-100 text-amber-700'
            }>
              {progress === 100 ? 'Completed' : progress >= 50 ? 'On Track' : 'Getting Started'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}