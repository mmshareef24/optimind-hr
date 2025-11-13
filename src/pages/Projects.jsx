
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { FolderKanban, Plus, Search, Filter, X, TrendingUp, Users, Target, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import StatCard from "../components/hrms/StatCard";
import ProjectCard from "../components/projects/ProjectCard";
import ProjectForm from "../components/projects/ProjectForm";
import ProjectDetailsModal from "../components/projects/ProjectDetailsModal";
import AssignTeamMemberModal from "../components/projects/AssignTeamMemberModal";
import BulkAssignTeamMembersModal from "../components/projects/BulkAssignTeamMembersModal";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function Projects() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    status: 'all', priority: 'all', department: 'all', projectManager: 'all', riskLevel: 'all'
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
      toast.success(t('project_created_success'));
    },
    onError: () => toast.error(t('failed_to_create_project'))
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      setShowDialog(false);
      setEditingProject(null);
      toast.success(t('project_updated_success'));
    },
    onError: () => toast.error(t('failed_to_update_project'))
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
      toast.success(t('team_member_assigned_success'));
    },
    onError: () => toast.error(t('failed_to_assign_team_member'))
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
      toast.success(t('team_members_assigned_success', { count: assignmentsData.length }));
    },
    onError: () => toast.error(t('failed_to_assign_team_members'))
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectTask.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-tasks']);
      toast.success(t('task_created_success'));
    },
    onError: () => toast.error(t('failed_to_create_task'))
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-tasks']);
      toast.success(t('task_updated_success'));
    },
    onError: () => toast.error(t('failed_to_update_task'))
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-tasks']);
      toast.success(t('task_deleted_success'));
    },
    onError: () => toast.error(t('failed_to_delete_task'))
  });

  const createMilestoneMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectMilestone.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-milestones']);
      toast.success(t('milestone_created_success'));
    },
    onError: () => toast.error(t('failed_to_create_milestone'))
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectMilestone.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-milestones']);
      toast.success(t('milestone_updated_success'));
    },
    onError: () => toast.error(t('failed_to_update_milestone'))
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

  const departments = [...new Set(projects.map(p => p.department).filter(Boolean))];
  const projectManagers = [...new Set(projects.map(p => p.project_manager_id).filter(Boolean))]
    .map(id => employees.find(e => e.id === id))
    .filter(Boolean);

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
    setFilters({ status: 'all', priority: 'all', department: 'all', projectManager: 'all', riskLevel: 'all' });
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
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('project_management')}</h1>
          <p className="text-slate-600">{t('project_management_desc')}</p>
        </div>
        <Button
          onClick={() => { setEditingProject(null); setShowDialog(true); }}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" /> {t('new_project')}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('total_projects')} value={projects.length} icon={FolderKanban} bgColor="from-blue-500 to-blue-600" />
        <StatCard title={t('active_projects')} value={activeProjects} icon={TrendingUp} bgColor="from-emerald-500 to-emerald-600" />
        <StatCard title={t('team_members')} value={totalTeamMembers} icon={Users} bgColor="from-purple-500 to-purple-600" />
        <StatCard title={t('total_budget')} value={`${(totalBudget / 1000000).toFixed(1)}M SAR`} icon={DollarSign} bgColor="from-amber-500 to-amber-600" />
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400`} />
                <Input
                  placeholder={t('search_projects_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={isRTL ? 'pr-10' : 'pl-10'}
                />
              </div>
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="relative">
                    <Filter className="w-4 h-4 mr-2" />
                    {t('advanced_filters')}
                    {hasActiveFilters && <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-600 rounded-full" />}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96" align="end">
                  <div className="space-y-4">
                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <h3 className="font-semibold text-slate-900">{t('filter_projects')}</h3>
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          <X className="w-4 h-4 mr-1" />
                          {t('clear_all')}
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* Status Filter */}
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">{t('status')}</label>
                        <Select
                          value={filters.status}
                          onValueChange={(val) => setFilters({ ...filters, status: val })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('all_status')}</SelectItem>
                            <SelectItem value="planning">{t('status_planning')}</SelectItem>
                            <SelectItem value="in_progress">{t('status_in_progress')}</SelectItem>
                            <SelectItem value="on_hold">{t('status_on_hold')}</SelectItem>
                            <SelectItem value="completed">{t('status_completed')}</SelectItem>
                            <SelectItem value="cancelled">{t('status_cancelled')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Priority Filter */}
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">{t('priority')}</label>
                        <Select
                          value={filters.priority}
                          onValueChange={(val) => setFilters({ ...filters, priority: val })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('all_priorities')}</SelectItem>
                            <SelectItem value="low">{t('priority_low')}</SelectItem>
                            <SelectItem value="medium">{t('priority_medium')}</SelectItem>
                            <SelectItem value="high">{t('priority_high')}</SelectItem>
                            <SelectItem value="critical">{t('priority_critical')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Department Filter */}
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">{t('department')}</label>
                        <Select
                          value={filters.department}
                          onValueChange={(val) => setFilters({ ...filters, department: val })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('all_departments')}</SelectItem>
                            {departments.map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Project Manager Filter */}
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">{t('project_manager')}</label>
                        <Select
                          value={filters.projectManager}
                          onValueChange={(val) => setFilters({ ...filters, projectManager: val })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('all_managers')}</SelectItem>
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
                        <label className="text-sm font-medium text-slate-700 mb-1 block">{t('risk_level')}</label>
                        <Select
                          value={filters.riskLevel}
                          onValueChange={(val) => setFilters({ ...filters, riskLevel: val })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('all_risk_levels')}</SelectItem>
                            <SelectItem value="low">{t('risk_low')}</SelectItem>
                            <SelectItem value="medium">{t('risk_medium')}</SelectItem>
                            <SelectItem value="high">{t('risk_high')}</SelectItem>
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
                  } else if (key === 'status') {
                    displayValue = t(`status_${value}`);
                  } else if (key === 'priority') {
                    displayValue = t(`priority_${value}`);
                  } else if (key === 'riskLevel') {
                    displayValue = t(`risk_${value}`);
                  }

                  return (
                    <Badge key={key} variant="secondary" className="gap-1">
                      {t(key)}: {displayValue}
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
            <div className="flex items-center text-sm text-slate-600">
              <p>{t('showing')} <strong>{filteredProjects.length}</strong> {t('of')} <strong>{projects.length}</strong> {t('projects_plural')}</p>
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
                {hasActiveFilters || searchTerm ? t('no_projects_match') : t('no_projects_yet')}
              </p>
              {hasActiveFilters || searchTerm ? (
                <Button variant="outline" onClick={() => { clearFilters(); setSearchTerm(''); }}>
                  {t('clear_all_filters')}
                </Button>
              ) : (
                <Button onClick={() => setShowDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('create_first_project')}
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
            <DialogTitle>{editingProject ? t('edit_project') : t('create_new_project')}</DialogTitle>
          </DialogHeader>
          <ProjectForm
            project={editingProject}
            employees={employees.filter(e => e.status === 'active')}
            onSubmit={handleSubmitProject}
            onCancel={() => { setShowDialog(false); setEditingProject(null); }}
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
        onClose={() => { setShowAssignModal(false); setShowDetailsModal(true); }}
        onAssign={handleAssignTeamMember}
      />

      <BulkAssignTeamMembersModal
        project={selectedProject}
        employees={employees}
        existingAssignments={selectedProject ? getProjectAssignments(selectedProject.id) : []}
        isOpen={showBulkAssignModal}
        onClose={() => { setShowBulkAssignModal(false); setShowDetailsModal(true); }}
        onBulkAssign={handleBulkAssignTeamMembers}
      />
    </div>
  );
}
