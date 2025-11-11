import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, Clock, AlertTriangle, Plus, Edit, Flag, Calendar
} from "lucide-react";
import { format } from "date-fns";

export default function MilestoneTracker({ 
  milestones = [],
  onAddMilestone,
  onEditMilestone
}) {
  const statusConfig = {
    pending: { 
      icon: Clock, 
      color: 'text-slate-500 bg-slate-100',
      badgeColor: 'bg-slate-100 text-slate-700',
      label: 'Pending'
    },
    in_progress: { 
      icon: Clock, 
      color: 'text-blue-500 bg-blue-100',
      badgeColor: 'bg-blue-100 text-blue-700',
      label: 'In Progress'
    },
    completed: { 
      icon: CheckCircle2, 
      color: 'text-emerald-500 bg-emerald-100',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      label: 'Completed'
    },
    missed: { 
      icon: AlertTriangle, 
      color: 'text-red-500 bg-red-100',
      badgeColor: 'bg-red-100 text-red-700',
      label: 'Missed'
    }
  };

  // Sort milestones by order and due date
  const sortedMilestones = [...milestones].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return new Date(a.due_date) - new Date(b.due_date);
  });

  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const progressPercentage = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-slate-900">Milestones</h3>
          <p className="text-sm text-slate-600">
            {completedCount} of {milestones.length} completed
          </p>
        </div>
        <Button onClick={onAddMilestone} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      {/* Overall Progress */}
      {milestones.length > 0 && (
        <Card className="border-0 bg-gradient-to-r from-emerald-50 to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-slate-900">Overall Progress</span>
              <span className="text-2xl font-bold text-emerald-600">{progressPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </CardContent>
        </Card>
      )}

      {milestones.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-12 text-center">
            <Flag className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 mb-4">No milestones yet</p>
            <Button onClick={onAddMilestone} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create First Milestone
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 via-emerald-300 to-slate-200" />

          {/* Milestones */}
          <div className="space-y-4">
            {sortedMilestones.map((milestone, index) => {
              const StatusIcon = statusConfig[milestone.status]?.icon || Clock;
              const isOverdue = new Date(milestone.due_date) < new Date() && milestone.status !== 'completed';
              const isCompleted = milestone.status === 'completed';

              return (
                <div key={milestone.id} className="relative pl-14">
                  {/* Timeline Dot */}
                  <div className={`absolute left-0 top-4 w-12 h-12 rounded-full border-4 border-white shadow-lg ${statusConfig[milestone.status]?.color} flex items-center justify-center z-10`}>
                    <StatusIcon className="w-6 h-6" />
                  </div>

                  {/* Milestone Card */}
                  <Card className={`border-l-4 ${
                    isCompleted ? 'border-emerald-500 bg-emerald-50/30' :
                    isOverdue ? 'border-red-400 bg-red-50/30' :
                    'border-blue-400'
                  }`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className={`font-bold text-lg ${isCompleted ? 'text-emerald-700' : 'text-slate-900'}`}>
                              {milestone.milestone_name}
                            </h4>
                            <Badge className={statusConfig[milestone.status]?.badgeColor}>
                              {statusConfig[milestone.status]?.label}
                            </Badge>
                            {isOverdue && (
                              <Badge className="bg-red-100 text-red-700">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                          </div>

                          {milestone.description && (
                            <p className="text-slate-600 mb-3">{milestone.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span className={`${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
                                Due: {format(new Date(milestone.due_date), 'MMM dd, yyyy')}
                              </span>
                            </div>

                            {milestone.completed_date && (
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-emerald-700 font-semibold">
                                  Completed: {format(new Date(milestone.completed_date), 'MMM dd, yyyy')}
                                </span>
                              </div>
                            )}
                          </div>

                          {milestone.deliverables && (
                            <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                              <h5 className="text-xs font-semibold text-slate-700 mb-1">Deliverables:</h5>
                              <p className="text-sm text-slate-600">{milestone.deliverables}</p>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditMilestone(milestone)}
                          className="flex-shrink-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}