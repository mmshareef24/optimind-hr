
import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar, DollarSign, Users, Target, AlertTriangle, Info,
  CheckCircle2, Clock, TrendingUp, Edit, UserPlus, UsersRound,
  ListTodo, Flag, GanttChartSquare
} from "lucide-react";
import { format } from "date-fns";
import TaskManagement from './TaskManagement';
import TaskForm from './TaskForm';
import MilestoneTracker from './MilestoneTracker';
import MilestoneForm from './MilestoneForm';
import GanttChart from './GanttChart';

export default function ProjectDetailsModal({ 
  project, 
  projectManager, 
  assignments = [], 
  employees = [],
  tasks = [],
  milestones = [],
  isOpen, 
  onClose,
  onEdit,
  onAddTeamMember,
  onBulkAddTeamMembers,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  onMilestoneCreate,
  onMilestoneUpdate
}) {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingMilestone, setEditingMilestone] = useState(null);

  if (!project) return null;

  const statusColors = {
    planning: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-emerald-100 text-emerald-700',
    on_hold: 'bg-amber-100 text-amber-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  const isOverBudget = project.actual_cost > project.budget;
  const budgetUsed = project.budget > 0 ? (project.actual_cost / project.budget) * 100 : 0;
  const isOverdue = new Date(project.end_date) < new Date() && project.status !== 'completed';

  // Filter project tasks and milestones
  const projectTasks = tasks.filter(t => t.project_id === project.id);
  const projectMilestones = milestones.filter(m => m.project_id === project.id);

  // Get team members assigned to this project
  const projectAssignments = assignments.filter(a => a.project_id === project.id);
  const assignedEmployeeIds = projectAssignments.map(a => a.employee_id);
  const teamMembers = employees.filter(e => assignedEmployeeIds.includes(e.id));

  const handleAddTask = () => {
    setEditingTask(null);
    setShowTaskForm(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleSubmitTask = (taskData) => {
    if (editingTask) {
      onTaskUpdate(editingTask.id, taskData);
    } else {
      onTaskCreate(taskData);
    }
    setShowTaskForm(false);
    setEditingTask(null);
  };

  const handleAddMilestone = () => {
    setEditingMilestone(null);
    setShowMilestoneForm(true);
  };

  const handleEditMilestone = (milestone) => {
    setEditingMilestone(milestone);
    setShowMilestoneForm(true);
  };

  const handleSubmitMilestone = (milestoneData) => {
    if (editingMilestone) {
      onMilestoneUpdate(editingMilestone.id, milestoneData);
    } else {
      onMilestoneCreate(milestoneData);
    }
    setShowMilestoneForm(false);
    setEditingMilestone(null);
  };

  const InfoItem = ({ icon: Icon, label, value, color = "text-slate-600" }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
      <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100')}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Project Details</span>
            <Button onClick={() => onEdit(project)} variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <Card className="border-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-slate-900">{project.project_name}</h2>
                    {isOverdue && <AlertTriangle className="w-5 h-5 text-red-500" />}
                  </div>
                  <p className="text-slate-600 mb-2">{project.description}</p>
                  <p className="text-sm text-slate-500">Code: {project.project_code}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={statusColors[project.status]}>
                  {project.status.replace('_', ' ')}
                </Badge>
                <Badge variant="outline">{project.priority} priority</Badge>
                {project.client_name && (
                  <Badge variant="outline">Client: {project.client_name}</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress Overview */}
          <Card>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Progress</span>
                    <span className="text-lg font-bold text-emerald-600">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-3" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Budget Used</span>
                    <span className={`text-lg font-bold ${isOverBudget ? 'text-red-600' : 'text-blue-600'}`}>
                      {budgetUsed.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={Math.min(budgetUsed, 100)} className="h-3" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Tasks Completed</span>
                    <span className="text-lg font-bold text-purple-600">
                      {project.completed_tasks}/{project.total_tasks}
                    </span>
                  </div>
                  <Progress 
                    value={project.total_tasks > 0 ? (project.completed_tasks / project.total_tasks) * 100 : 0} 
                    className="h-3" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid grid-cols-3 lg:grid-cols-7 w-full">
              <TabsTrigger value="overview">
                <Info className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="team">
                <Users className="w-4 h-4 mr-2" />
                Team
              </TabsTrigger>
              <TabsTrigger value="tasks">
                <ListTodo className="w-4 h-4 mr-2" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="milestones">
                <Flag className="w-4 h-4 mr-2" />
                Milestones
              </TabsTrigger>
              <TabsTrigger value="gantt">
                <GanttChartSquare className="w-4 h-4 mr-2" />
                Gantt
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <Calendar className="w-4 h-4 mr-2" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="budget">
                <DollarSign className="w-4 h-4 mr-2" />
                Budget
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <Card>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <InfoItem
                      icon={Users}
                      label="Project Manager"
                      value={projectManager ? `${projectManager.first_name} ${projectManager.last_name}` : 'Not Assigned'}
                      color="text-blue-600"
                    />
                    <InfoItem
                      icon={Target}
                      label="Department"
                      value={project.department}
                      color="text-emerald-600"
                    />
                    <InfoItem
                      icon={Calendar}
                      label="Start Date"
                      value={format(new Date(project.start_date), 'MMM dd, yyyy')}
                      color="text-purple-600"
                    />
                    <InfoItem
                      icon={Calendar}
                      label="End Date"
                      value={format(new Date(project.end_date), 'MMM dd, yyyy')}
                      color="text-amber-600"
                    />
                    <InfoItem
                      icon={Users}
                      label="Team Size"
                      value={`${projectAssignments.length} members`}
                      color="text-indigo-600"
                    />
                    <InfoItem
                      icon={AlertTriangle}
                      label="Risk Level"
                      value={project.risk_level}
                      color="text-red-600"
                    />
                  </div>

                  {project.notes && (
                    <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold text-slate-900 mb-2">Notes</h4>
                      <p className="text-slate-600 text-sm whitespace-pre-wrap">{project.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team">
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-slate-900">Team Members</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={onBulkAddTeamMembers}>
                        <UsersRound className="w-4 h-4 mr-2" />
                        Add Multiple
                      </Button>
                      <Button size="sm" onClick={onAddTeamMember}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Member
                      </Button>
                    </div>
                  </div>

                  {projectAssignments.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-500 mb-4">No team members assigned yet</p>
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" variant="outline" onClick={onBulkAddTeamMembers}>
                          <UsersRound className="w-4 h-4 mr-2" />
                          Add Multiple Members
                        </Button>
                        <Button size="sm" onClick={onAddTeamMember}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Single Member
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {projectAssignments.map((assignment) => {
                        const employee = employees.find(e => e.id === assignment.employee_id);
                        if (!employee) return null;

                        return (
                          <div key={assignment.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <Avatar className="w-12 h-12 border-2 border-white">
                              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                                {employee.first_name?.[0]}{employee.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900">
                                {employee.first_name} {employee.last_name}
                              </p>
                              <p className="text-sm text-slate-600">{assignment.role}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {assignment.allocation_percentage}% allocated
                                </Badge>
                                {assignment.total_hours_logged > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {assignment.total_hours_logged}h logged
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Badge className={assignment.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                              {assignment.status}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* NEW: Tasks Tab */}
            <TabsContent value="tasks">
              <Card>
                <CardContent className="p-6">
                  <TaskManagement
                    tasks={projectTasks}
                    employees={teamMembers}
                    onAddTask={handleAddTask}
                    onEditTask={handleEditTask}
                    onDeleteTask={onTaskDelete}
                    onUpdateTaskStatus={(task) => {
                      // Cycle through statuses
                      const statuses = ['todo', 'in_progress', 'review', 'completed'];
                      const currentIndex = statuses.indexOf(task.status);
                      const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                      onTaskUpdate(task.id, { ...task, status: nextStatus });
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* NEW: Milestones Tab */}
            <TabsContent value="milestones">
              <Card>
                <CardContent className="p-6">
                  <MilestoneTracker
                    milestones={projectMilestones}
                    onAddMilestone={handleAddMilestone}
                    onEditMilestone={handleEditMilestone}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* NEW: Gantt Chart Tab */}
            <TabsContent value="gantt">
              <GanttChart
                project={project}
                tasks={projectTasks}
                milestones={projectMilestones}
                employees={employees} // Use all employees as tasks can be assigned to anyone, not just project team members
              />
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                      <Calendar className="w-8 h-8 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm text-slate-600 mb-1">Project Duration</p>
                        <p className="font-semibold text-slate-900">
                          {format(new Date(project.start_date), 'MMM dd, yyyy')} → {format(new Date(project.end_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>

                    {project.actual_start_date && (
                      <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-lg">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                        <div className="flex-1">
                          <p className="text-sm text-slate-600 mb-1">Actual Start</p>
                          <p className="font-semibold text-slate-900">
                            {format(new Date(project.actual_start_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    )}

                    {project.actual_end_date && (
                      <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                        <div className="flex-1">
                          <p className="text-sm text-slate-600 mb-1">Actual Completion</p>
                          <p className="font-semibold text-slate-900">
                            {format(new Date(project.actual_end_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    )}

                    {isOverdue && (
                      <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                        <div className="flex-1">
                          <p className="font-semibold text-red-900">Project is Overdue</p>
                          <p className="text-sm text-red-700">
                            Expected completion: {format(new Date(project.end_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Budget Tab */}
            <TabsContent value="budget">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-5 h-5 text-blue-600" />
                          <p className="text-sm text-slate-600">Allocated Budget</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          {project.budget.toLocaleString()} SAR
                        </p>
                      </div>

                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-purple-600" />
                          <p className="text-sm text-slate-600">Actual Cost</p>
                        </div>
                        <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-purple-600'}`}>
                          {(project.actual_cost || 0).toLocaleString()} SAR
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-700">Budget Utilization</p>
                        <p className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-slate-900'}`}>
                          {budgetUsed.toFixed(1)}%
                        </p>
                      </div>
                      <Progress value={Math.min(budgetUsed, 100)} className="h-3" />
                      {isOverBudget && (
                        <p className="text-xs text-red-600 mt-2">
                          Over budget by {((project.actual_cost - project.budget)).toLocaleString()} SAR
                        </p>
                      )}
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <p className="text-sm text-slate-600">Remaining Budget</p>
                      </div>
                      <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-emerald-600'}`}>
                        {(project.budget - (project.actual_cost || 0)).toLocaleString()} SAR
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Task Form Dialog */}
        <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
          <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            </DialogHeader>
            <TaskForm
              task={editingTask}
              projectId={project.id}
              employees={teamMembers}
              allTasks={projectTasks}
              onSubmit={handleSubmitTask}
              onCancel={() => {
                setShowTaskForm(false);
                setEditingTask(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Milestone Form Dialog */}
        <Dialog open={showMilestoneForm} onOpenChange={setShowMilestoneForm}>
          <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMilestone ? 'Edit Milestone' : 'Create New Milestone'}</DialogTitle>
            </DialogHeader>
            <MilestoneForm
              milestone={editingMilestone}
              projectId={project.id}
              existingMilestones={projectMilestones}
              onSubmit={handleSubmitMilestone}
              onCancel={() => {
                setShowMilestoneForm(false);
                setEditingMilestone(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
