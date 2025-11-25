import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Users, Award, Edit, Calendar } from "lucide-react";

export default function ProgramList({ programs, sessions, enrollments, employees, onEdit, isAdmin }) {
  const categoryColors = {
    technical: "bg-blue-100 text-blue-700",
    soft_skills: "bg-purple-100 text-purple-700",
    leadership: "bg-amber-100 text-amber-700",
    compliance: "bg-red-100 text-red-700",
    safety: "bg-orange-100 text-orange-700",
    onboarding: "bg-emerald-100 text-emerald-700",
    certification: "bg-indigo-100 text-indigo-700",
    other: "bg-slate-100 text-slate-700"
  };

  const deliveryIcons = {
    in_person: "🏢",
    online: "💻",
    blended: "🔄",
    self_paced: "📚"
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
        <CardTitle>Training Programs</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {programs.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No training programs found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map(program => {
              const programSessions = sessions.filter(s => s.program_id === program.id);
              const programEnrollments = enrollments.filter(e => e.program_id === program.id);
              const completedCount = programEnrollments.filter(e => e.status === 'completed').length;
              
              return (
                <Card key={program.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{deliveryIcons[program.delivery_method]}</span>
                          <Badge className={categoryColors[program.category]}>
                            {program.category.replace('_', ' ')}
                          </Badge>
                          {program.is_mandatory && (
                            <Badge className="bg-red-100 text-red-700">Mandatory</Badge>
                          )}
                        </div>
                        <h4 className="font-semibold text-slate-900 mb-1">{program.program_name}</h4>
                        {program.program_code && (
                          <p className="text-xs text-slate-500">{program.program_code}</p>
                        )}
                      </div>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => onEdit(program)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                      {program.description || 'No description'}
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span>{program.duration_hours}h</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>{programSessions.length} sessions</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Users className="w-4 h-4" />
                        <span>{completedCount} completed</span>
                      </div>
                      {program.certification_awarded && (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <Award className="w-4 h-4" />
                          <span>Certificate</span>
                        </div>
                      )}
                    </div>

                    {program.cost_per_participant > 0 && (
                      <p className="text-sm font-medium text-slate-900">
                        {program.cost_per_participant.toLocaleString()} SAR / participant
                      </p>
                    )}

                    <Badge className={program.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                      {program.status}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}