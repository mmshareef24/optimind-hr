import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { GraduationCap, Users, Calendar, Award, Plus, BookOpen, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatCard from "@/components/hrms/StatCard";
import ProgramList from "@/components/training/ProgramList";
import SessionCalendar from "@/components/training/SessionCalendar";
import EnrollmentBoard from "@/components/training/EnrollmentBoard";
import ProgramForm from "@/components/training/ProgramForm";
import { toast } from "sonner";

export default function Training() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const queryClient = useQueryClient();
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['training-programs'],
    queryFn: () => base44.entities.TrainingProgram.list('-created_date')
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['training-sessions'],
    queryFn: () => base44.entities.TrainingSession.list('-start_date')
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['training-enrollments'],
    queryFn: () => base44.entities.TrainingEnrollment.list('-created_date')
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list()
  });

  const createProgramMutation = useMutation({
    mutationFn: (data) => base44.entities.TrainingProgram.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['training-programs']);
      setShowProgramForm(false);
      setEditingProgram(null);
      toast.success('Training program created');
    }
  });

  const updateProgramMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TrainingProgram.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['training-programs']);
      setShowProgramForm(false);
      setEditingProgram(null);
      toast.success('Training program updated');
    }
  });

  const handleSubmit = (data) => {
    if (editingProgram) {
      updateProgramMutation.mutate({ id: editingProgram.id, data });
    } else {
      createProgramMutation.mutate(data);
    }
  };

  const handleEdit = (program) => {
    setEditingProgram(program);
    setShowProgramForm(true);
  };

  const filteredPrograms = useMemo(() => {
    return programs.filter(p => categoryFilter === 'all' || p.category === categoryFilter);
  }, [programs, categoryFilter]);

  const stats = useMemo(() => {
    const activePrograms = programs.filter(p => p.status === 'active').length;
    const upcomingSessions = sessions.filter(s => s.status === 'scheduled' && new Date(s.start_date) >= new Date()).length;
    const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
    const totalEnrolled = enrollments.filter(e => e.status === 'enrolled' || e.status === 'in_progress').length;
    const totalHours = enrollments
      .filter(e => e.status === 'completed')
      .reduce((sum, e) => {
        const program = programs.find(p => p.id === e.program_id);
        return sum + (program?.duration_hours || 0);
      }, 0);

    return { activePrograms, upcomingSessions, completedEnrollments, totalEnrolled, totalHours };
  }, [programs, sessions, enrollments]);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {language === 'ar' ? 'التدريب والتطوير' : 'Training & Development'}
          </h1>
          <p className="text-slate-600">
            {language === 'ar' ? 'إدارة برامج التدريب وتطوير الموظفين' : 'Manage training programs and employee development'}
          </p>
        </div>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="soft_skills">Soft Skills</SelectItem>
              <SelectItem value="leadership">Leadership</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="safety">Safety</SelectItem>
              <SelectItem value="certification">Certification</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && (
            <Button
              onClick={() => {
                setEditingProgram(null);
                setShowProgramForm(true);
              }}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Program
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Programs"
          value={stats.activePrograms}
          icon={BookOpen}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Upcoming Sessions"
          value={stats.upcomingSessions}
          icon={Calendar}
          bgColor="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Currently Enrolled"
          value={stats.totalEnrolled}
          icon={Users}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Training Hours (Completed)"
          value={stats.totalHours}
          icon={Clock}
          bgColor="from-amber-500 to-amber-600"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="programs" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="programs">Training Programs</TabsTrigger>
          <TabsTrigger value="sessions">Sessions & Calendar</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
        </TabsList>

        <TabsContent value="programs">
          <ProgramList
            programs={filteredPrograms}
            sessions={sessions}
            enrollments={enrollments}
            employees={employees}
            onEdit={handleEdit}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="sessions">
          <SessionCalendar
            sessions={sessions}
            programs={programs}
            enrollments={enrollments}
            employees={employees}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="enrollments">
          <EnrollmentBoard
            enrollments={enrollments}
            programs={programs}
            sessions={sessions}
            employees={employees}
            isAdmin={isAdmin}
          />
        </TabsContent>
      </Tabs>

      {/* Program Form */}
      {showProgramForm && (
        <ProgramForm
          program={editingProgram}
          employees={employees}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowProgramForm(false);
            setEditingProgram(null);
          }}
          open={showProgramForm}
          onOpenChange={setShowProgramForm}
        />
      )}
    </div>
  );
}