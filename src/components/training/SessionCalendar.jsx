import React, { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, Plus } from "lucide-react";
import SessionForm from "./SessionForm";
import { toast } from "sonner";
import { format } from "date-fns";

export default function SessionCalendar({ sessions, programs, enrollments, employees, isAdmin }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  const createSessionMutation = useMutation({
    mutationFn: (data) => base44.entities.TrainingSession.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['training-sessions']);
      setShowForm(false);
      toast.success('Session scheduled');
    }
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TrainingSession.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['training-sessions']);
      setShowForm(false);
      toast.success('Session updated');
    }
  });

  const handleSubmit = (data) => {
    if (editingSession) {
      updateSessionMutation.mutate({ id: editingSession.id, data });
    } else {
      createSessionMutation.mutate(data);
    }
  };

  const statusColors = {
    scheduled: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700"
  };

  const upcomingSessions = sessions.filter(s => s.status === 'scheduled' && new Date(s.start_date) >= new Date());

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-center justify-between">
            <CardTitle>Training Sessions</CardTitle>
            {isAdmin && (
              <Button onClick={() => { setEditingSession(null); setShowForm(true); }} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Session
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No sessions scheduled</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map(session => {
                const program = programs.find(p => p.id === session.program_id);
                const sessionEnrollments = enrollments.filter(e => e.session_id === session.id);
                
                return (
                  <Card key={session.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900">{session.session_name}</h4>
                          <p className="text-sm text-slate-600">{program?.program_name}</p>
                        </div>
                        <Badge className={statusColors[session.status]}>{session.status}</Badge>
                      </div>

                      <div className="grid md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(session.start_date), 'MMM dd, yyyy')}</span>
                        </div>
                        {session.start_time && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Clock className="w-4 h-4" />
                            <span>{session.start_time} - {session.end_time}</span>
                          </div>
                        )}
                        {session.location && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{session.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users className="w-4 h-4" />
                          <span>{sessionEnrollments.length}/{session.max_participants || '∞'}</span>
                        </div>
                      </div>

                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => { setEditingSession(session); setShowForm(true); }}
                        >
                          Edit Session
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <SessionForm
          session={editingSession}
          programs={programs}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingSession(null); }}
          open={showForm}
          onOpenChange={setShowForm}
        />
      )}
    </div>
  );
}