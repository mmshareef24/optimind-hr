
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FolderKanban, Plus, Search, Filter, X, TrendingUp, Users, Target, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import StatCard from "../components/hrms/StatCard";
import ProjectCard from "../components/projects/ProjectCard";
import ProjectForm from "../components/projects/ProjectForm";
import ProjectDetailsModal from "../components/projects/ProjectDetailsModal";
import AssignTeamMemberModal from "../components/projects/AssignTeamMemberModal";
import BulkAssignTeamMembersModal from "../components/projects/BulkAssignTeamMembersModal";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    department: 'all',
    projectManager: 'all',
    riskLevel: 'all'
  });

  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date'),
  });

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['project-assignments'],
    queryFn: () => base44.entities.ProjectAssignment.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['project-tasks'],
    queryFn: () => base44.entities.ProjectTask.list(),
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['project-milestones'],
    queryFn: () => base44.entities.ProjectMilestone.list(),
  });

  const createProjectMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      setShowDialog(false);
      setEditingProject(null);
      toast.success('Project created successfully');
    },
    onError: () => {
      toast.error('Failed to create project');
    }
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      setShowDialog(false);
      setEditingProject(null);
      toast.success('Project updated successfully');
    },
    onError: () => {
      toast.error('Failed to update project');
    }
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data) => {
      const assignment = await base44.entities.ProjectAssignment.create(data);
      const project = projects.find(p => p.id === data.project_id);
      if (project) {
        const currentAssignments = assignments.filter(a => a.project_id === data.project_id);
        await base44.entities.Project.update(project.id, {
          ...project,
          team_size: currentAssignments.length + 1
        });
      }
      return assignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project-assignments']);
      queryClient.invalidateQueries(['projects']);
      setShowAssignModal(false);
      toast.success('Team member assigned successfully');
    },
    onError: () => {
      toast.error('Failed to assign team member');
    }
  });

  const bulkCreateAssignmentsMutation = useMutation({
    mutationFn: async (assignmentsData) => {
      const createdAssignments = await Promise.all(
        assignmentsData.map(data => base44.entities.ProjectAssignment.create(data))
      );

      if (assignmentsData.length > 0) {
        const projectId = assignmentsData[0].project_id;
        const project = projects.find(p => p.id === projectId);
        if (project) {
          const currentAssignments = assignments.filter(a => a.project_id === projectId);
          await base44.entities.Project.update(project.id, {
            ...project,
            team_size: currentAssignments.length + assignmentsData.length
          });
        }
      }

      return createdAssignments;
    },
    onSuccess: (_, assignmentsData) => {
      queryClient.invalidateQueries(['project-assignments']);
      queryClient.invalidateQueries(['projects']);
      setShowBulkAssignModal(false);
      toast.success(`Successfully assigned ${assignmentsData.length} team member${assignmentsData.length === 1 ? '' : 's'}`);
    },
    onError: () => {
      toast.error('Failed to assign team members');
    }
  });

  // NEW: Task mutations
  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectTask.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-tasks']);
      toast.success('Task created successfully');
    },
    onError: () => {
      toast.error('Failed to create task');
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-tasks']);
      toast.success('Task updated successfully');
    },
    onError: () => {
      toast.error('Failed to update task');
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-tasks']);
      toast.success('Task deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete task');
    }
  });

  // NEW: Milestone mutations
  const createMilestoneMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectMilestone.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-milestones']);
      toast.success('Milestone created successfully');
    },
    onError: () => {
      toast.error('Failed to create milestone');
    }
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectMilestone.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-milestones']);
      toast.success('Milestone updated successfully');
    },
    onError: () => {
      toast.error('Failed to update milestone');
    }
  });

  const handleSubmitProject = (data) => {
    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, data });
    } else {
      createProjectMutation.mutate(data);
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowDialog(true);
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const handleAddTeamMember = () => {
    setShowDetailsModal(false);
    setShowAssignModal(true);
  };

  const handleBulkAddTeamMembers = () => {
    setShowDetailsModal(false);
    setShowBulkAssignModal(true);
  };

  const handleAssignTeamMember = (data) => {
    createAssignmentMutation.mutate(data);
  };

  const handleBulkAssignTeamMembers = (assignmentsData) => {
    bulkCreateAssignmentsMutation.mutate(assignmentsData);
  };

  // Get unique values for filters
  const departments = [...new Set(projects.map(p => p.department).filter(Boolean))];
  const projectManagers = [...new Set(projects.map(p => p.project_manager_id).filter(Boolean))]
    .map(id => employees.find(e => e.id === id))
    .filter(Boolean);

  // Apply filters
  const filteredProjects = projects.filter(project => {
    const projectManager = employees.find(e => e.id === project.project_manager_id);
    const projectName = project.project_name?.toLowerCase() || '';
    const projectCode = project.project_code?.toLowerCase() || '';
    const clientName = project.client_name?.toLowerCase() || '';
    const managerName = projectManager ? `${projectManager.first_name} ${projectManager.last_name}`.toLowerCase() : '';

    const matchesSearch =
      projectName.includes(searchTerm.toLowerCase()) ||
      projectCode.includes(searchTerm.toLowerCase()) ||
      clientName.includes(searchTerm.toLowerCase()) ||
      managerName.includes(searchTerm.toLowerCase());

    const matchesStatus = filters.status === 'all' || project.status === filters.status;
    const matchesPriority = filters.priority === 'all' || project.priority === filters.priority;
    const matchesDepartment = filters.department === 'all' || project.department === filters.department;
    const matchesManager = filters.projectManager === 'all' || project.project_manager_id === filters.projectManager;
    const matchesRisk = filters.riskLevel === 'all' || project.risk_level === filters.riskLevel;

    return matchesSearch && matchesStatus && matchesPriority && matchesDepartment && matchesManager && matchesRisk;
  });

  const clearFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      department: 'all',
      projectManager: 'all',
      riskLevel: 'all'
    });
  };

  const hasActiveFilters = Object.values(filters).some(f => f !== 'all');

  const activeProjects = projects.filter(p => p.status === 'in_progress').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalTeamMembers = assignments.filter(a => a.status === 'active').length;

  const getTeamSize = (projectId) => {
    return assignments.filter(a => a.project_id === projectId && a.status === 'active').length;
  };

  const getProjectAssignments = (projectId) => {
    return assignments.filter(a => a.project_id === projectId);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Project Management</h1>
          <p className="text-slate-600">Track projects and manage team assignments</p>
        </div>
        <Button
          onClick={() => { setEditingProject(null); setShowDialog(true); }}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" /> New Project
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Projects"
          value={projects.length}
          icon={FolderKanban}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Active Projects"
          value={activeProjects}
          icon={TrendingUp}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Team Members"
          value={totalTeamMembers}
          icon={Users}
          bgColor="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Total Budget"
          value={`${(totalBudget / 1000000).toFixed(1)}M SAR`}
          icon={DollarSign}
          bgColor="from-amber-500 to-amber-600"
        />
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by project name, code, client, or manager..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="relative">
                    <Filter className="w-4 h-4 mr-2" />
                    Advanced Filters
                    {hasActiveFilters && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-600 rounded-full" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">Filter Projects</h3>
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          <X className="w-4 h-4 mr-1" />
                          Clear All
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* Status Filter */}
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Status</label>
                        <Select
                          value={filters.status}
                          onValueChange={(val) => setFilters({ ...filters, status: val })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="planning">Planning</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Priority Filter */}
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Priority</label>
                        <Select
                          value={filters.priority}
                          onValueChange={(val) => setFilters({ ...filters, priority: val })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Department Filter */}
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Department</label>
                        <Select
                          value={filters.department}
                          onValueChange={(val) => setFilters({ ...filters, department: val })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments.map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Project Manager Filter */}
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Project Manager</label>
                        <Select
                          value={filters.projectManager}
                          onValueChange={(val) => setFilters({ ...filters, projectManager: val })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Managers</SelectItem>
                            {projectManagers.map(pm => (
                              <SelectItem key={pm.id} value={pm.id}>
                                {pm.first_name} {pm.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Risk Level Filter */}
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Risk Level</label>
                        <Select
                          value={filters.riskLevel}
                          onValueChange={(val) => setFilters({ ...filters, riskLevel: val })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Risk Levels</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (value === 'all') return null;
                  let displayValue = value;
                  if (key === 'projectManager') {
                    const pm = employees.find(e => e.id === value);
                    displayValue = pm ? `${pm.first_name} ${pm.last_name}` : value;
                  }
                  return (
                    <Badge key={key} variant="secondary" className="gap-1">
                      {key}: {displayValue}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setFilters({ ...filters, [key]: 'all' })}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Results Count */}
            <div className="flex items-center justify-between text-sm text-slate-600">
              <p>Showing <strong>{filteredProjects.length}</strong> of <strong>{projects.length}</strong> projects</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {loadingProjects || loadingEmployees ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-96" />)}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <FolderKanban className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-2">
                {hasActiveFilters || searchTerm ? 'No projects match the selected filters' : 'No projects yet'}
              </p>
              {hasActiveFilters || searchTerm ? (
                <Button variant="outline" onClick={() => {
                  clearFilters();
                  setSearchTerm('');
                }}>
                  Clear All Filters
                </Button>
              ) : (
                <Button onClick={() => setShowDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Project
                </Button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => {
                const projectManager = employees.find(e => e.id === project.project_manager_id);
                const teamSize = getTeamSize(project.id);

                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    projectManager={projectManager}
                    teamSize={teamSize}
                    onView={handleViewProject}
                    onEdit={handleEditProject}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? 'Edit Project' : 'Create New Project'}
            </DialogTitle>
          </DialogHeader>
          <ProjectForm
            project={editingProject}
            employees={employees.filter(e => e.status === 'active')}
            onSubmit={handleSubmitProject}
            onCancel={() => {
              setShowDialog(false);
              setEditingProject(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Project Details Modal with NEW task/milestone handlers */}
      <ProjectDetailsModal
        project={selectedProject}
        projectManager={selectedProject ? employees.find(e => e.id === selectedProject.project_manager_id) : null}
        assignments={selectedProject ? getProjectAssignments(selectedProject.id) : []}
        employees={employees}
        tasks={tasks}
        milestones={milestones}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onEdit={handleEditProject}
        onAddTeamMember={handleAddTeamMember}
        onBulkAddTeamMembers={handleBulkAddTeamMembers}
        onTaskCreate={(data) => createTaskMutation.mutate(data)}
        onTaskUpdate={(id, data) => updateTaskMutation.mutate({ id, data })}
        onTaskDelete={(id) => deleteTaskMutation.mutate(id)}
        onMilestoneCreate={(data) => createMilestoneMutation.mutate(data)}
        onMilestoneUpdate={(id, data) => updateMilestoneMutation.mutate({ id, data })}
      />

      {/* Team Assignment Modals */}
      <AssignTeamMemberModal
        project={selectedProject}
        employees={employees}
        existingAssignments={selectedProject ? getProjectAssignments(selectedProject.id) : []}
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setShowDetailsModal(true);
        }}
        onAssign={handleAssignTeamMember}
      />

      <BulkAssignTeamMembersModal
        project={selectedProject}
        employees={employees}
        existingAssignments={selectedProject ? getProjectAssignments(selectedProject.id) : []}
        isOpen={showBulkAssignModal}
        onClose={() => {
          setShowBulkAssignModal(false);
          setShowDetailsModal(true);
        }}
        onBulkAssign={handleBulkAssignTeamMembers}
      />
    </div>
  );
}
