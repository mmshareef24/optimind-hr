import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Layers, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from '@/components/TranslationContext';

const DEFAULT_LEVELS = [
  { level_number: 1, name_en: "Executive", name_ar: "تنفيذي", color: "#9333ea" },
  { level_number: 2, name_en: "Senior Manager", name_ar: "مدير أول", color: "#3b82f6" },
  { level_number: 3, name_en: "Manager", name_ar: "مدير", color: "#10b981" },
  { level_number: 4, name_en: "Team Lead", name_ar: "قائد فريق", color: "#f59e0b" },
  { level_number: 5, name_en: "Senior Staff", name_ar: "موظف أول", color: "#6366f1" },
  { level_number: 6, name_en: "Staff", name_ar: "موظف", color: "#64748b" },
  { level_number: 7, name_en: "Junior Staff", name_ar: "موظف مبتدئ", color: "#94a3b8" },
];

export default function OrgLevelManager({ isOpen, onClose }) {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [formData, setFormData] = useState({
    level_number: 1,
    name_en: "",
    name_ar: "",
    description: "",
    color: "#10b981",
    status: "active"
  });

  const { data: orgLevels = [], isLoading } = useQuery({
    queryKey: ['org-levels'],
    queryFn: () => base44.entities.OrgLevel.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OrgLevel.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['org-levels']);
      setShowForm(false);
      resetForm();
      toast.success(language === 'ar' ? 'تم إنشاء المستوى بنجاح' : 'Level created successfully');
    },
    onError: () => toast.error('Failed to create level')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OrgLevel.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['org-levels']);
      setShowForm(false);
      setEditingLevel(null);
      resetForm();
      toast.success(language === 'ar' ? 'تم تحديث المستوى بنجاح' : 'Level updated successfully');
    },
    onError: () => toast.error('Failed to update level')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.OrgLevel.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['org-levels']);
      toast.success(language === 'ar' ? 'تم حذف المستوى' : 'Level deleted');
    },
    onError: () => toast.error('Failed to delete level')
  });

  const initializeDefaultsMutation = useMutation({
    mutationFn: async () => {
      for (const level of DEFAULT_LEVELS) {
        await base44.entities.OrgLevel.create({ ...level, status: 'active' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['org-levels']);
      toast.success(language === 'ar' ? 'تم تهيئة المستويات الافتراضية' : 'Default levels initialized');
    },
    onError: () => toast.error('Failed to initialize levels')
  });

  const resetForm = () => {
    setFormData({
      level_number: (orgLevels.length > 0 ? Math.max(...orgLevels.map(l => l.level_number)) + 1 : 1),
      name_en: "",
      name_ar: "",
      description: "",
      color: "#10b981",
      status: "active"
    });
  };

  const handleEdit = (level) => {
    setEditingLevel(level);
    setFormData({
      level_number: level.level_number,
      name_en: level.name_en,
      name_ar: level.name_ar || "",
      description: level.description || "",
      color: level.color || "#10b981",
      status: level.status || "active"
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingLevel) {
      updateMutation.mutate({ id: editingLevel.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (level) => {
    if (window.confirm(`Delete level "${level.name_en}"?`)) {
      deleteMutation.mutate(level.id);
    }
  };

  const sortedLevels = [...orgLevels].sort((a, b) => a.level_number - b.level_number);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Layers className="w-5 h-5 text-emerald-600" />
            {language === 'ar' ? 'إدارة المستويات التنظيمية' : 'Manage Organizational Levels'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Actions */}
          <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              onClick={() => { resetForm(); setEditingLevel(null); setShowForm(true); }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'إضافة مستوى' : 'Add Level'}
            </Button>
            {orgLevels.length === 0 && (
              <Button
                variant="outline"
                onClick={() => initializeDefaultsMutation.mutate()}
                disabled={initializeDefaultsMutation.isPending}
              >
                {initializeDefaultsMutation.isPending 
                  ? (language === 'ar' ? 'جاري التهيئة...' : 'Initializing...')
                  : (language === 'ar' ? 'تهيئة الافتراضيات' : 'Initialize Defaults')
                }
              </Button>
            )}
          </div>

          {/* Levels List */}
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : sortedLevels.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Layers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>{language === 'ar' ? 'لم يتم تعريف مستويات بعد' : 'No levels defined yet'}</p>
              <p className="text-sm mt-1">{language === 'ar' ? 'أضف مستوى جديد أو قم بتهيئة الافتراضيات' : 'Add a new level or initialize defaults'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedLevels.map((level) => (
                <Card key={level.id} className="border border-slate-200 hover:border-emerald-300 transition-colors">
                  <CardContent className="p-4">
                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-md"
                          style={{ backgroundColor: level.color || '#10b981' }}
                        >
                          {level.level_number}
                        </div>
                        <div className={isRTL ? 'text-right' : ''}>
                          <p className="font-semibold text-slate-900">
                            {language === 'ar' ? (level.name_ar || level.name_en) : level.name_en}
                          </p>
                          {level.description && (
                            <p className="text-xs text-slate-500">{level.description}</p>
                          )}
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Badge variant={level.status === 'active' ? 'default' : 'secondary'}>
                          {level.status}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(level)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(level)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Add/Edit Form */}
          {showForm && (
            <Card className="border-2 border-emerald-200 bg-emerald-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {editingLevel 
                    ? (language === 'ar' ? 'تعديل المستوى' : 'Edit Level')
                    : (language === 'ar' ? 'إضافة مستوى جديد' : 'Add New Level')
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>{language === 'ar' ? 'رقم المستوى' : 'Level Number'} *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.level_number}
                        onChange={(e) => setFormData({ ...formData, level_number: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label>{language === 'ar' ? 'اللون' : 'Color'}</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="w-14 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          placeholder="#10b981"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>{language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'} *</Label>
                      <Input
                        value={formData.name_en}
                        onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                        placeholder="e.g., Executive"
                        required
                      />
                    </div>
                    <div>
                      <Label>{language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                      <Input
                        value={formData.name_ar}
                        onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                        placeholder="مثال: تنفيذي"
                        dir="rtl"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={language === 'ar' ? 'وصف اختياري...' : 'Optional description...'}
                    />
                  </div>
                  <div className={`flex justify-end gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingLevel(null); }}>
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                      {editingLevel 
                        ? (language === 'ar' ? 'تحديث' : 'Update')
                        : (language === 'ar' ? 'إنشاء' : 'Create')
                      }
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}