import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, DollarSign, TrendingUp, Edit, Eye } from "lucide-react";
import { useTranslation } from '@/components/TranslationContext';

export default function PositionCard({ position, employeeCount = 0, onView, onEdit }) {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  
  const levelColors = {
    1: 'from-purple-500 to-purple-600',
    2: 'from-blue-500 to-blue-600',
    3: 'from-emerald-500 to-emerald-600',
    4: 'from-teal-500 to-teal-600',
    5: 'from-cyan-500 to-cyan-600',
    6: 'from-slate-500 to-slate-600',
    7: 'from-gray-500 to-gray-600'
  };

  const levelNames = {
    1: 'Executive',
    2: 'Senior Manager',
    3: 'Manager',
    4: 'Team Lead',
    5: 'Senior Staff',
    6: 'Staff',
    7: 'Junior Staff'
  };

  const statusColors = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-100 text-slate-700 border-slate-200',
    frozen: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  const utilizationPercentage = position.headcount_allocated > 0 
    ? (employeeCount / position.headcount_allocated) * 100 
    : 0;

  return (
    <Card className="border-2 border-slate-200 hover:shadow-xl transition-all group">
      <CardContent className="p-5">
        <div className={`flex items-start justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-start gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${levelColors[position.level] || levelColors[6]} flex items-center justify-center shadow-lg`}>
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
              <h3 className="font-bold text-lg text-slate-900 mb-1">{position.position_title}</h3>
              {position.position_title_ar && (
                <p className="text-sm text-slate-600 mb-2">{position.position_title_ar}</p>
              )}
              <p className="text-xs text-slate-500">{position.position_code}</p>
            </div>
          </div>
          <Badge className={statusColors[position.status]}>
            {position.status}
          </Badge>
        </div>

        {/* Department & Level */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="text-xs">
            {position.department}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Level {position.level} - {levelNames[position.level]}
          </Badge>
          {position.job_grade && (
            <Badge variant="outline" className="text-xs">
              Grade: {position.job_grade}
            </Badge>
          )}
          {position.is_managerial && (
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
              Managerial
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-3 mb-4">
          <div className={`flex items-center justify-between p-3 bg-blue-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-900">Headcount</span>
            </div>
            <span className="font-bold text-blue-900">
              {employeeCount}/{position.headcount_allocated}
            </span>
          </div>

          {position.salary_range_min > 0 && (
            <div className={`flex items-center justify-between p-3 bg-emerald-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-emerald-900">Salary Range</span>
              </div>
              <span className="font-bold text-emerald-900 text-xs">
                {position.salary_range_min.toLocaleString()} - {position.salary_range_max.toLocaleString()} SAR
              </span>
            </div>
          )}

          {utilizationPercentage > 0 && (
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm text-purple-900">Utilization</span>
                <span className="font-bold text-purple-900">{utilizationPercentage.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all"
                  style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Responsibilities Preview */}
        {position.responsibilities && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <p className={`text-xs text-slate-600 line-clamp-2 ${isRTL ? 'text-right' : ''}`}>
              {position.responsibilities}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(position)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            {t('view')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(position)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-2" />
            {t('edit')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}