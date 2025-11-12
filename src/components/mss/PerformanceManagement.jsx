import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Target, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function PerformanceManagement({ teamMembers, performanceGoals, performanceReviews, managerId }) {
  const getEmployeePerformance = (employeeId) => {
    const goals = performanceGoals.filter(g => g.employee_id === employeeId);
    const reviews = performanceReviews.filter(r => r.employee_id === employeeId);
    
    const activeGoals = goals.filter(g => g.status === 'in_progress');
    const completedGoals = goals.filter(g => g.status === 'completed');
    const avgProgress = goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length)
      : 0;
    
    const latestReview = reviews[0];
    
    return { activeGoals: activeGoals.length, completedGoals: completedGoals.length, avgProgress, latestReview };
  };

  // Top performers
  const performanceData = teamMembers.map(member => ({
    ...member,
    performance: getEmployeePerformance(member.id)
  })).sort((a, b) => b.performance.avgProgress - a.performance.avgProgress);

  const topPerformers = performanceData.slice(0, 5);

  // Goals overview
  const allGoals = performanceGoals;
  const goalsByStatus = {
    in_progress: allGoals.filter(g => g.status === 'in_progress').length,
    completed: allGoals.filter(g => g.status === 'completed').length,
    not_started: allGoals.filter(g => g.status === 'not_started').length,
    overdue: allGoals.filter(g => g.status === 'overdue').length
  };

  // Reviews overview
  const pendingReviews = performanceReviews.filter(r => 
    r.status === 'draft' || r.status === 'manager_review_pending'
  );

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Active Goals</p>
                <p className="text-2xl font-bold text-purple-600">{goalsByStatus.in_progress}</p>
              </div>
              <Target className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Completed</p>
                <p className="text-2xl font-bold text-emerald-600">{goalsByStatus.completed}</p>
              </div>
              <Award className="w-8 h-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Pending Reviews</p>
                <p className="text-2xl font-bold text-amber-600">{pendingReviews.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Total Goals</p>
                <p className="text-2xl font-bold text-blue-600">{allGoals.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.map((member, index) => (
              <div key={member.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600 text-white font-bold rounded-full">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">
                    {member.first_name} {member.last_name}
                  </h4>
                  <p className="text-sm text-slate-500">{member.job_title}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">
                    {member.performance.activeGoals} active goals
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                        style={{ width: `${member.performance.avgProgress}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      {member.performance.avgProgress}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Performance Details */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceData.map(member => (
              <div key={member.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      {member.first_name} {member.last_name}
                    </h4>
                    <p className="text-sm text-slate-500">{member.job_title}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-purple-100 text-purple-700">
                      {member.performance.avgProgress}% Avg Progress
                    </Badge>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Active Goals</p>
                    <p className="font-semibold text-slate-900">{member.performance.activeGoals}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Completed Goals</p>
                    <p className="font-semibold text-emerald-600">{member.performance.completedGoals}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Latest Review</p>
                    <p className="font-semibold text-slate-900">
                      {member.performance.latestReview 
                        ? format(new Date(member.performance.latestReview.review_date || member.performance.latestReview.created_date), 'MMM yyyy')
                        : 'No reviews'
                      }
                    </p>
                  </div>
                </div>

                {member.performance.activeGoals > 0 && (
                  <div className="mt-3">
                    <Progress value={member.performance.avgProgress} className="h-2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}