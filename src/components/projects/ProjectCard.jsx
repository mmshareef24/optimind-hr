import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar, DollarSign, Users, TrendingUp, Eye, Edit,
  AlertTriangle, CheckCircle2, Clock, Target
} from "lucide-react";
import { format } from "date-fns";

export default function ProjectCard({ project, projectManager, teamSize, onView, onEdit }) {
  const statusColors = {
    planning: 'bg-blue-100 text-blue-700 border-blue-200',
    in_progress: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    on_hold: 'bg-amber-100 text-amber-700 border-amber-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200'
  };

  const priorityColors = {
    low: 'bg-slate-100 text-slate-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700'
  };

  const riskColors = {
    low: 'text-emerald-600',
    medium: 'text-amber-600',
    high: 'text-red-600'
  };

  const isOverBudget = project.actual_cost > project.budget;
  const budgetPercentage = project.budget > 0 ? (project.actual_cost / project.budget) * 100 : 0;
  const isOverdue = new Date(project.end_date) < new Date() && project.status !== 'completed';

  return (
    <Card className="border border-slate-200 hover:shadow-lg transition-all duration-300">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-lg text-slate-900">{project.project_name}</h3>
              {isOverdue && (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
            </div>
            <p className="text-sm text-slate-600 line-clamp-2">{project.description}</p>
            <p className="text-xs text-slate-500 mt-1">Code: {project.project_code}</p>
          </div>
        </div>

        {/* Status and Priority Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge className={statusColors[project.status]}>
            {project.status.replace('_', ' ')}
          </Badge>
          <Badge className={priorityColors[project.priority]}>
            {project.priority} priority
          </Badge>
          {project.risk_level && project.risk_level !== 'low' && (
            <Badge variant="outline" className="gap-1">
              <AlertTriangle className={`w-3 h-3 ${riskColors[project.risk_level]}`} />
              {project.risk_level} risk
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Progress</span>
            <span className="text-sm font-bold text-emerald-600">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs text-slate-500">Timeline</p>
              <p className="font-semibold text-slate-900">
                {format(new Date(project.start_date), 'MMM dd')} - {format(new Date(project.end_date), 'MMM dd')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-xs text-slate-500">Team Size</p>
              <p className="font-semibold text-slate-900">{teamSize || project.team_size || 0} members</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-emerald-500" />
            <div>
              <p className="text-xs text-slate-500">Tasks</p>
              <p className="font-semibold text-slate-900">
                {project.completed_tasks || 0}/{project.total_tasks || 0}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-xs text-slate-500">Budget</p>
              <p className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-slate-900'}`}>
                {budgetPercentage.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        {/* Project Manager */}
        {projectManager && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded-lg">
            <Avatar className="w-8 h-8 border-2 border-white">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs">
                {projectManager.first_name?.[0]}{projectManager.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500">Project Manager</p>
              <p className="font-semibold text-sm text-slate-900 truncate">
                {projectManager.first_name} {projectManager.last_name}
              </p>
            </div>
          </div>
        )}

        {/* Client */}
        {project.client_name && (
          <div className="text-sm text-slate-600 mb-4">
            <span className="text-slate-500">Client:</span> <span className="font-semibold">{project.client_name}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(project)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(project)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}