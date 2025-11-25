import React, { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, BookOpen, Calendar, Award, Plus, Star } from "lucide-react";
import EnrollmentForm from "./EnrollmentForm";
import { toast } from "sonner";
import { format } from "date-fns";

export default function EnrollmentBoard({ enrollments, programs, sessions, employees, isAdmin }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState(null);

  const createEnrollmentMutation = useMutation({
    mutationFn: (data) => base44.entities.TrainingEnrollment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['training-enrollments']);
      setShowForm(false);
      toast.success('Employee enrolled');
    }
  });

  const updateEnrollmentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TrainingEnrollment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['training-enrollments']);
      setShowForm(false);
      toast.success('Enrollment updated');
    }
  });

  const handleSubmit = (data) => {
    if (editingEnrollment) {
      updateEnrollmentMutation.mutate({ id: editingEnrollment.id, data });
    } else {
      createEnrollmentMutation.mutate(data);
    }
  };

  const statusColors = {
    enrolled: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    withdrawn: "bg-slate-100 text-slate-700",
    failed: "bg-red-100 text-red-700",
    no_show: "bg-orange-100 text-orange-700"
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center justify-between">
            <CardTitle>Training Enrollments</CardTitle>
            {isAdmin && (
              <Button onClick={() => { setEditingEnrollment(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Enroll Employee
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {enrollments.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No enrollments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.map(enrollment => {
                const employee = employees.find(e => e.id === enrollment.employee_id);
                const program = programs.find(p => p.id === enrollment.program_id);
                const session = sessions.find(s => s.id === enrollment.session_id);
                
                return (
                  <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">
                              {employee?.first_name} {employee?.last_name}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <BookOpen className="w-4 h-4" />
                              <span>{program?.program_name}</span>
                            </div>
                            {session && (
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Calendar className="w-4 h-4" />
                                <span>{session.session_name}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[enrollment.status]}>{enrollment.status}</Badge>
                          {enrollment.passed && (
                            <Badge className="bg-emerald-100 text-emerald-700">
                              <Award className="w-3 h-3 mr-1" />
                              Passed
                            </Badge>
                          )}
                          {enrollment.feedback_rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                              <span className="text-sm font-semibold">{enrollment.feedback_rating}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className="text-xs text-slate-500">
                          Enrolled: {enrollment.enrollment_date ? format(new Date(enrollment.enrollment_date), 'MMM dd, yyyy') : 'N/A'}
                        </span>
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setEditingEnrollment(enrollment); setShowForm(true); }}
                          >
                            Update Status
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <EnrollmentForm
          enrollment={editingEnrollment}
          programs={programs}
          sessions={sessions}
          employees={employees}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingEnrollment(null); }}
          open={showForm}
          onOpenChange={setShowForm}
        />
      )}
    </div>
  );
}