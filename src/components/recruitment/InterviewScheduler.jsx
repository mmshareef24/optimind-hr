import React, { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, MapPin, Users, Plus } from "lucide-react";
import InterviewForm from "./InterviewForm";
import { toast } from "sonner";
import { format } from "date-fns";

export default function InterviewScheduler({ interviews, candidates, requisitions, employees }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);

  const createInterviewMutation = useMutation({
    mutationFn: (data) => base44.entities.Interview.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['interviews']);
      setShowForm(false);
      setEditingInterview(null);
      toast.success('Interview scheduled successfully');
    }
  });

  const updateInterviewMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Interview.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['interviews']);
      setShowForm(false);
      setEditingInterview(null);
      toast.success('Interview updated successfully');
    }
  });

  const handleSubmit = (data) => {
    if (editingInterview) {
      updateInterviewMutation.mutate({ id: editingInterview.id, data });
    } else {
      createInterviewMutation.mutate(data);
    }
  };

  const statusColors = {
    scheduled: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    rescheduled: "bg-amber-100 text-amber-700",
    no_show: "bg-slate-100 text-slate-700"
  };

  const modeIcons = {
    in_person: MapPin,
    video_call: Video,
    phone_call: Clock
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-center justify-between">
            <CardTitle>Interview Schedule</CardTitle>
            <Button
              onClick={() => {
                setEditingInterview(null);
                setShowForm(true);
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Interview
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {interviews.map(interview => {
              const candidate = candidates.find(c => c.id === interview.candidate_id);
              const requisition = requisitions.find(r => r.id === interview.requisition_id);
              const ModeIcon = modeIcons[interview.interview_mode] || Clock;
              
              return (
                <Card key={interview.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-slate-900">
                            {candidate?.first_name} {candidate?.last_name}
                          </h4>
                          <Badge className={statusColors[interview.status]}>
                            {interview.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {interview.interview_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{requisition?.job_title}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingInterview(interview);
                          setShowForm(true);
                        }}
                      >
                        View Details
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(interview.interview_date), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span>{interview.interview_time} ({interview.duration_minutes}min)</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <ModeIcon className="w-4 h-4" />
                        <span className="capitalize">{interview.interview_mode.replace('_', ' ')}</span>
                      </div>
                    </div>

                    {interview.location && (
                      <p className="text-sm text-slate-500 mt-2 truncate">
                        Location: {interview.location}
                      </p>
                    )}

                    {interview.overall_rating && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-slate-600">Rating: {interview.overall_rating}/5</span>
                          {interview.recommendation && (
                            <Badge variant="outline">
                              {interview.recommendation.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {interviews.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 mb-4">No interviews scheduled</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule First Interview
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Interview Form */}
      {showForm && (
        <InterviewForm
          interview={editingInterview}
          candidates={candidates}
          requisitions={requisitions}
          employees={employees}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingInterview(null);
          }}
          open={showForm}
          onOpenChange={setShowForm}
        />
      )}
    </div>
  );
}