import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { Clock3, Plus, Edit, Trash, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import ShiftForm from "../components/shifts/ShiftForm";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function Shifts() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const [showDialog, setShowDialog] = useState(false);
  const [editingShift, setEditingShift] = useState(null);

  const queryClient = useQueryClient();

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list('-created_date'),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['shift-assignments'],
    queryFn: () => base44.entities.ShiftAssignment.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Shift.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      setShowDialog(false);
      setEditingShift(null);
      toast.success(t('shift_created'));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Shift.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      setShowDialog(false);
      setEditingShift(null);
      toast.success(t('shift_updated'));
    }
  });

  const handleSubmit = (data) => {
    if (editingShift) {
      updateMutation.mutate({ id: editingShift.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (shift) => {
    setEditingShift(shift);
    setShowDialog(true);
  };

  const getEmployeeCount = (shiftId) => {
    return assignments.filter(a => a.shift_id === shiftId && a.status === 'active').length;
  };

  const getShiftTypeColor = (type) => {
    const colors = {
      morning: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      evening: 'bg-blue-100 text-blue-700 border-blue-200',
      night: 'bg-purple-100 text-purple-700 border-purple-200',
      flexible: 'bg-amber-100 text-amber-700 border-amber-200',
      rotating: 'bg-pink-100 text-pink-700 border-pink-200'
    };
    return colors[type] || colors.morning;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('shift_management')}</h1>
          <p className="text-slate-600">{t('shift_management_desc')}</p>
        </div>
        <Button
          onClick={() => { setEditingShift(null); setShowDialog(true); }}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" /> {t('create_shift')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 mb-1">{t('total_shifts')}</p>
            <p className="text-3xl font-bold text-emerald-600">{shifts.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 mb-1">{t('active_shifts')}</p>
            <p className="text-3xl font-bold text-blue-600">
              {shifts.filter(s => s.is_active).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 mb-1">{t('assigned_employees')}</p>
            <p className="text-3xl font-bold text-purple-600">
              {assignments.filter(a => a.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 mb-1">{t('departments')}</p>
            <p className="text-3xl font-bold text-amber-600">
              {new Set(shifts.map(s => s.department).filter(Boolean)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Shifts List */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
          <CardTitle className={isRTL ? 'text-right' : ''}>{t('all_shifts')}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-12">
              <Clock3 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">{t('no_shifts_created')}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shifts.map((shift) => (
                <Card
                  key={shift.id}
                  className="border-2 hover:shadow-lg transition-all"
                  style={{ borderColor: shift.color_code + '40' }}
                >
                  <CardContent className="p-6">
                    <div className={`flex items-start justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: shift.color_code }}
                      >
                        <Clock3 className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getShiftTypeColor(shift.shift_type)}>
                          {shift.shift_type}
                        </Badge>
                        {!shift.is_active && (
                          <Badge variant="outline" className="bg-slate-100">{t('inactive')}</Badge>
                        )}
                      </div>
                    </div>

                    <div className={isRTL ? 'text-right' : ''}>
                      <h3 className="font-bold text-lg text-slate-900 mb-1">{shift.shift_name}</h3>
                      <p className="text-sm text-slate-500 mb-4">{shift.shift_code}</p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{t('timing')}</span>
                          <span className="font-semibold text-slate-900">
                            {shift.start_time} - {shift.end_time}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{t('hours')}</span>
                          <span className="font-semibold text-slate-900">{shift.working_hours}h</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{t('break')}</span>
                          <span className="font-semibold text-slate-900">{shift.break_duration} min</span>
                        </div>
                        {shift.department && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">{t('department')}</span>
                            <span className="font-semibold text-slate-900">{shift.department}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={`flex items-center justify-between pt-4 border-t border-slate-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">
                          {getEmployeeCount(shift.id)} {t('employees')}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(shift)}
                      >
                        <Edit className="w-4 h-4 mr-1" /> {t('edit')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingShift ? t('edit_shift') : t('create_shift')}</DialogTitle>
          </DialogHeader>
          <ShiftForm
            shift={editingShift}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowDialog(false);
              setEditingShift(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}