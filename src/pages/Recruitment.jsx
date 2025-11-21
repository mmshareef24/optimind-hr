import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { Briefcase, Users, TrendingUp, Clock, Plus, Filter, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/hrms/StatCard";
import RequisitionForm from "@/components/recruitment/RequisitionForm";
import RequisitionCard from "@/components/recruitment/RequisitionCard";
import CandidateBoard from "@/components/recruitment/CandidateBoard";
import InterviewScheduler from "@/components/recruitment/InterviewScheduler";
import { toast } from "sonner";

export default function Recruitment() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const queryClient = useQueryClient();
  const [showRequisitionForm, setShowRequisitionForm] = useState(false);
  const [editingRequisition, setEditingRequisition] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: requisitions = [], isLoading } = useQuery({
    queryKey: ['requisitions'],
    queryFn: () => base44.entities.JobRequisition.list('-created_date')
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => base44.entities.Candidate.list('-created_date')
  });

  const { data: interviews = [] } = useQuery({
    queryKey: ['interviews'],
    queryFn: () => base44.entities.Interview.list('-interview_date')
  });

  const { data: positions = [] } = useQuery({
    queryKey: ['positions'],
    queryFn: () => base44.entities.Position.list()
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list()
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list()
  });

  const createRequisitionMutation = useMutation({
    mutationFn: (data) => base44.entities.JobRequisition.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['requisitions']);
      setShowRequisitionForm(false);
      setEditingRequisition(null);
      toast.success('Requisition created successfully');
    },
    onError: () => toast.error('Failed to create requisition')
  });

  const updateRequisitionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.JobRequisition.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['requisitions']);
      setShowRequisitionForm(false);
      setEditingRequisition(null);
      toast.success('Requisition updated successfully');
    },
    onError: () => toast.error('Failed to update requisition')
  });

  const deleteRequisitionMutation = useMutation({
    mutationFn: (id) => base44.entities.JobRequisition.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['requisitions']);
      toast.success('Requisition deleted successfully');
    },
    onError: () => toast.error('Failed to delete requisition')
  });

  const handleSubmit = (data) => {
    if (editingRequisition) {
      updateRequisitionMutation.mutate({ id: editingRequisition.id, data });
    } else {
      createRequisitionMutation.mutate(data);
    }
  };

  const handleEdit = (requisition) => {
    setEditingRequisition(requisition);
    setShowRequisitionForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this requisition?')) {
      deleteRequisitionMutation.mutate(id);
    }
  };

  const filteredRequisitions = useMemo(() => {
    return requisitions.filter(r => {
      const statusMatch = statusFilter === 'all' || r.status === statusFilter;
      const deptMatch = departmentFilter === 'all' || r.department === departmentFilter;
      return statusMatch && deptMatch;
    });
  }, [requisitions, statusFilter, departmentFilter]);

  const departments = useMemo(() => {
    return [...new Set(requisitions.map(r => r.department).filter(Boolean))];
  }, [requisitions]);

  const stats = useMemo(() => {
    const open = requisitions.filter(r => r.status === 'open' || r.status === 'in_progress').length;
    const pending = requisitions.filter(r => r.status === 'pending_approval').length;
    const filled = requisitions.filter(r => r.status === 'filled').length;
    const totalCandidates = candidates.length;
    const activeCandidates = candidates.filter(c => c.status === 'active').length;
    const upcomingInterviews = interviews.filter(i => {
      return i.status === 'scheduled' && new Date(i.interview_date) >= new Date();
    }).length;

    return { open, pending, filled, totalCandidates, activeCandidates, upcomingInterviews };
  }, [requisitions, candidates, interviews]);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Recruitment & Hiring
          </h1>
          <p className="text-slate-600">
            Manage job requisitions, candidates, and hiring workflow
          </p>
        </div>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Button
              onClick={() => {
                setEditingRequisition(null);
                setShowRequisitionForm(true);
              }}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Requisition
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Open Positions"
          value={stats.open}
          icon={Briefcase}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Pending Approval"
          value={stats.pending}
          icon={Clock}
          bgColor="from-amber-500 to-amber-600"
        />
        <StatCard
          title="Active Candidates"
          value={stats.activeCandidates}
          icon={Users}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Upcoming Interviews"
          value={stats.upcomingInterviews}
          icon={TrendingUp}
          bgColor="from-purple-500 to-purple-600"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="requisitions" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="requisitions">Job Requisitions</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
        </TabsList>

        <TabsContent value="requisitions">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle>Job Requisitions</CardTitle>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="filled">Filled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="text-center py-12">Loading...</div>
              ) : filteredRequisitions.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 mb-4">No requisitions found</p>
                  {isAdmin && (
                    <Button onClick={() => setShowRequisitionForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Requisition
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredRequisitions.map(requisition => (
                    <RequisitionCard
                      key={requisition.id}
                      requisition={requisition}
                      positions={positions}
                      budgets={budgets}
                      candidates={candidates.filter(c => c.requisition_id === requisition.id)}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="candidates">
          <CandidateBoard
            candidates={candidates}
            requisitions={requisitions}
            interviews={interviews}
            employees={employees}
          />
        </TabsContent>

        <TabsContent value="interviews">
          <InterviewScheduler
            interviews={interviews}
            candidates={candidates}
            requisitions={requisitions}
            employees={employees}
          />
        </TabsContent>
      </Tabs>

      {/* Requisition Form */}
      {showRequisitionForm && (
        <RequisitionForm
          requisition={editingRequisition}
          positions={positions}
          budgets={budgets}
          employees={employees}
          departments={departments}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowRequisitionForm(false);
            setEditingRequisition(null);
          }}
          open={showRequisitionForm}
          onOpenChange={setShowRequisitionForm}
        />
      )}
    </div>
  );
}