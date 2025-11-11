import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Target, Calendar, TrendingUp, Edit, CheckCircle, AlertCircle } from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";

export default function GoalCard({ goal, employee, onEdit, onUpdateProgress, isManager = false }) {
  const targetDate = new Date(goal.target_date);
  const isOverdue = isPast(targetDate) && goal.status !== 'completed';
  const daysRemaining = differenceInDays(targetDate, new Date());

  const statusConfig = {
    not_started: { label: 'Not Started', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200' },
    overdue: { label: 'Overdue', color: 'bg-orange-100 text-orange-700 border-orange-200' }
  };

  const priorityConfig = {
    low: { label: 'Low', color: 'bg-slate-100 text-slate-600' },
    medium: { label: 'Medium', color: 'bg-blue-100 text-blue-600' },
    high: { label: 'High', color: 'bg-amber-100 text-amber-600' },
    critical: { label: 'Critical', color: 'bg-red-100 text-red-600' }
  };

  const categoryConfig = {
    individual: { label: 'Individual', icon: Target },
    team: { label: 'Team', icon: Target },
    organizational: { label: 'Organizational', icon: Target },
    development: { label: 'Development', icon: TrendingUp }
  };

  const currentStatus = isOverdue ? statusConfig.overdue : statusConfig[goal.status];
  const Icon = categoryConfig[goal.category]?.icon || Target;

  return (
    <Card className="border border-slate-200 hover:shadow-md transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
              goal.status === 'completed' ? 'from-emerald-500 to-emerald-600' :
              isOverdue ? 'from-orange-500 to-orange-600' :
              'from-blue-500 to-blue-600'
            } flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 mb-1">{goal.title}</h4>
              <p className="text-sm text-slate-600 line-clamp-2">{goal.description}</p>
            </div>
          </div>
          {isManager && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(goal)}
              className="flex-shrink-0"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge className={currentStatus.color}>
            {currentStatus.label}
          </Badge>
          <Badge className={priorityConfig[goal.priority].color}>
            {priorityConfig[goal.priority].label}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {categoryConfig[goal.category]?.label}
          </Badge>
          {goal.weight > 0 && (
            <Badge variant="outline" className="text-xs">
              Weight: {goal.weight}%
            </Badge>
          )}
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600">Progress</span>
            <span className="font-semibold text-slate-900">{goal.progress}%</span>
          </div>
          <Progress value={goal.progress} className="h-2" />
        </div>

        {/* KPI Display */}
        {goal.kpi_target && (
          <div className="bg-slate-50 p-3 rounded-lg mb-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">KPI Progress</span>
              <span className="font-semibold">
                {goal.kpi_current} / {goal.kpi_target} {goal.kpi_unit}
              </span>
            </div>
            <Progress 
              value={(goal.kpi_current / goal.kpi_target) * 100} 
              className="h-2 mt-2"
            />
          </div>
        )}

        {/* Target Date */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4" />
            <span>Target: {format(targetDate, 'MMM dd, yyyy')}</span>
          </div>
          {!isOverdue && goal.status !== 'completed' && daysRemaining >= 0 && (
            <span className={`font-medium ${
              daysRemaining <= 7 ? 'text-orange-600' :
              daysRemaining <= 30 ? 'text-amber-600' :
              'text-slate-600'
            }`}>
              {daysRemaining} days left
            </span>
          )}
          {isOverdue && (
            <span className="font-medium text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Overdue
            </span>
          )}
          {goal.status === 'completed' && (
            <span className="font-medium text-emerald-600 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Completed
            </span>
          )}
        </div>

        {/* Measurement Criteria */}
        {goal.measurement_criteria && (
          <div className="mt-3 pt-3 border-t text-xs text-slate-500">
            <strong>Success Criteria:</strong> {goal.measurement_criteria}
          </div>
        )}
      </CardContent>
    </Card>
  );
}