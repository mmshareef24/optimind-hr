import React, { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, User, Mail, Phone, MapPin, Briefcase, Star } from "lucide-react";
import CandidateForm from "./CandidateForm";
import { toast } from "sonner";

export default function CandidateBoard({ candidates, requisitions, interviews, employees }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [selectedStage, setSelectedStage] = useState('all');

  const stages = [
    { value: 'all', label: 'All Candidates', color: 'bg-slate-100' },
    { value: 'applied', label: 'Applied', color: 'bg-blue-100' },
    { value: 'screening', label: 'Screening', color: 'bg-purple-100' },
    { value: 'phone_interview', label: 'Phone Interview', color: 'bg-indigo-100' },
    { value: 'technical_test', label: 'Technical Test', color: 'bg-orange-100' },
    { value: 'in_person_interview', label: 'Interview', color: 'bg-amber-100' },
    { value: 'final_interview', label: 'Final', color: 'bg-emerald-100' },
    { value: 'offer_extended', label: 'Offer Extended', color: 'bg-green-100' },
    { value: 'hired', label: 'Hired', color: 'bg-green-200' }
  ];

  const createCandidateMutation = useMutation({
    mutationFn: (data) => base44.entities.Candidate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['candidates']);
      setShowForm(false);
      setEditingCandidate(null);
      toast.success('Candidate added successfully');
    }
  });

  const updateCandidateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Candidate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['candidates']);
      toast.success('Candidate updated successfully');
    }
  });

  const handleSubmit = (data) => {
    if (editingCandidate) {
      updateCandidateMutation.mutate({ id: editingCandidate.id, data });
    } else {
      createCandidateMutation.mutate(data);
    }
  };

  const handleStageChange = (candidate, newStage) => {
    updateCandidateMutation.mutate({
      id: candidate.id,
      data: { ...candidate, stage: newStage }
    });
  };

  const filteredCandidates = selectedStage === 'all' 
    ? candidates 
    : candidates.filter(c => c.stage === selectedStage);

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center justify-between">
            <CardTitle>Candidate Pipeline</CardTitle>
            <Button
              onClick={() => {
                setEditingCandidate(null);
                setShowForm(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Candidate
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Stage Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {stages.map(stage => {
              const count = stage.value === 'all' 
                ? candidates.length 
                : candidates.filter(c => c.stage === stage.value).length;
              
              return (
                <Button
                  key={stage.value}
                  variant={selectedStage === stage.value ? "default" : "outline"}
                  onClick={() => setSelectedStage(stage.value)}
                  className="whitespace-nowrap"
                >
                  {stage.label} ({count})
                </Button>
              );
            })}
          </div>

          {/* Candidates Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCandidates.map(candidate => {
              const requisition = requisitions.find(r => r.id === candidate.requisition_id);
              const candidateInterviews = interviews.filter(i => i.candidate_id === candidate.id);
              
              return (
                <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {candidate.first_name} {candidate.last_name}
                          </h4>
                          <Badge className="text-xs mt-1">
                            {candidate.stage.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      {candidate.overall_rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-semibold">{candidate.overall_rating}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-slate-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        <span className="truncate">{requisition?.job_title || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{candidate.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{candidate.phone}</span>
                      </div>
                      {candidate.current_location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{candidate.current_location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="text-xs text-slate-500">
                        {candidateInterviews.length} interview{candidateInterviews.length !== 1 ? 's' : ''}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingCandidate(candidate);
                          setShowForm(true);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredCandidates.length === 0 && (
            <div className="text-center py-12">
              <User className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-4">No candidates in this stage</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Candidate
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Candidate Form */}
      {showForm && (
        <CandidateForm
          candidate={editingCandidate}
          requisitions={requisitions}
          employees={employees}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingCandidate(null);
          }}
          open={showForm}
          onOpenChange={setShowForm}
        />
      )}
    </div>
  );
}