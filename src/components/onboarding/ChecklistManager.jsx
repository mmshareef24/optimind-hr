import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Edit, Trash2, Calendar, Briefcase } from "lucide-react";

export default function ChecklistManager({ checklists, onEdit, onDelete }) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-emerald-600" />
          Onboarding Checklists ({checklists.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {checklists.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-4">No checklists created yet</p>
            <p className="text-sm text-slate-400">Create your first checklist to get started</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {checklists.map((checklist) => (
              <Card key={checklist.id} className="border border-slate-200 hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1">{checklist.checklist_name}</h3>
                      {checklist.description && (
                        <p className="text-sm text-slate-600 mb-2 line-clamp-2">{checklist.description}</p>
                      )}
                    </div>
                    <Badge className={checklist.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                      {checklist.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    {checklist.department && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{checklist.department}</span>
                      </div>
                    )}
                    {checklist.job_role && (
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">Role: {checklist.job_role}</span>
                      </div>
                    )}
                    {checklist.duration_days && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{checklist.duration_days} days</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(checklist)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(checklist.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}