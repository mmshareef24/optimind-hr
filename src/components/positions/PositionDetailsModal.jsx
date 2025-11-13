import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Briefcase, Users, DollarSign, TrendingUp, FileText, Target, Edit, Building2, Crown
} from "lucide-react";
import { useTranslation } from '@/components/TranslationContext';

export default function PositionDetailsModal({ 
  position, 
  parentPosition, 
  subordinatePositions = [],
  employees = [],
  isOpen, 
  onClose,
  onEdit 
}) {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  
  if (!position) return null;

  const levelNames = {
    1: 'Executive',
    2: 'Senior Manager',
    3: 'Manager',
    4: 'Team Lead',
    5: 'Senior Staff',
    6: 'Staff',
    7: 'Junior Staff'
  };

  const utilizationPercentage = position.headcount_allocated > 0 
    ? (employees.length / position.headcount_allocated) * 100 
    : 0;

  const InfoItem = ({ icon: Icon, label, value, color = "text-slate-600" }) => (
    <div className={`flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
      <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100')}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span>Position Details</span>
            <Button onClick={() => onEdit(position)} variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              {t('edit')}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Card */}
          <Card className="border-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
            <CardContent className="p-6">
              <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">{position.position_title}</h2>
                  {position.position_title_ar && (
                    <p className="text-lg text-slate-600 mb-2">{position.position_title_ar}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{position.position_code}</Badge>
                    <Badge variant="outline">Level {position.level} - {levelNames[position.level]}</Badge>
                    {position.job_grade && <Badge variant="outline">Grade: {position.job_grade}</Badge>}
                    {position.is_managerial && (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                        Managerial
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full">
              <TabsTrigger value="overview">
                <FileText className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="hierarchy">
                <Crown className="w-4 h-4 mr-2" />
                Hierarchy
              </TabsTrigger>
              <TabsTrigger value="employees">
                <Users className="w-4 h-4 mr-2" />
                Employees ({employees.length})
              </TabsTrigger>
              <TabsTrigger value="compensation">
                <DollarSign className="w-4 h-4 mr-2" />
                Compensation
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <Card>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <InfoItem
                      icon={Building2}
                      label="Department"
                      value={position.department}
                      color="text-emerald-600"
                    />
                    <InfoItem
                      icon={Users}
                      label="Headcount"
                      value={`${employees.length} / ${position.headcount_allocated}`}
                      color="text-blue-600"
                    />
                    <InfoItem
                      icon={TrendingUp}
                      label="Utilization"
                      value={`${utilizationPercentage.toFixed(0)}%`}
                      color="text-purple-600"
                    />
                    <InfoItem
                      icon={Target}
                      label="Status"
                      value={position.status}
                      color="text-amber-600"
                    />
                  </div>

                  {position.responsibilities && (
                    <div className="mb-6">
                      <h4 className={`font-semibold text-slate-900 mb-2 ${isRTL ? 'text-right' : ''}`}>Responsibilities</h4>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className={`text-sm text-slate-700 whitespace-pre-wrap ${isRTL ? 'text-right' : ''}`}>
                          {position.responsibilities}
                        </p>
                      </div>
                    </div>
                  )}

                  {position.requirements && (
                    <div>
                      <h4 className={`font-semibold text-slate-900 mb-2 ${isRTL ? 'text-right' : ''}`}>Requirements</h4>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className={`text-sm text-slate-700 whitespace-pre-wrap ${isRTL ? 'text-right' : ''}`}>
                          {position.requirements}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Hierarchy Tab */}
            <TabsContent value="hierarchy">
              <Card>
                <CardContent className="p-6 space-y-4">
                  {parentPosition && (
                    <div>
                      <h4 className={`font-semibold text-slate-900 mb-3 ${isRTL ? 'text-right' : ''}`}>Reports To</h4>
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-lg border border-blue-200">
                        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-white" />
                          </div>
                          <div className={isRTL ? 'text-right' : ''}>
                            <p className="font-semibold text-slate-900">{parentPosition.position_title}</p>
                            <p className="text-sm text-slate-600">{parentPosition.department}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {subordinatePositions.length > 0 && (
                    <div>
                      <h4 className={`font-semibold text-slate-900 mb-3 ${isRTL ? 'text-right' : ''}`}>
                        Direct Reports ({subordinatePositions.length})
                      </h4>
                      <div className="space-y-2">
                        {subordinatePositions.map((subPos) => (
                          <div key={subPos.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                                <Briefcase className="w-4 h-4 text-white" />
                              </div>
                              <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                                <p className="font-semibold text-slate-900 text-sm">{subPos.position_title}</p>
                                <p className="text-xs text-slate-600">{subPos.department}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                Level {subPos.level}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Employees Tab */}
            <TabsContent value="employees">
              <Card>
                <CardContent className="p-6">
                  {employees.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-500">No employees currently in this position</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {employees.map((employee) => (
                        <div key={employee.id} className={`flex items-center gap-3 p-3 bg-slate-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Avatar className="w-10 h-10 border-2 border-white">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                              {employee.first_name?.[0]}{employee.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                            <p className="font-semibold text-slate-900">
                              {employee.first_name} {employee.last_name}
                            </p>
                            <p className="text-sm text-slate-600">{employee.email}</p>
                          </div>
                          <Badge className={employee.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                            {employee.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Compensation Tab */}
            <TabsContent value="compensation">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <DollarSign className="w-5 h-5 text-emerald-600" />
                          <p className="text-sm text-emerald-900 font-medium">Minimum Salary</p>
                        </div>
                        <p className="text-2xl font-bold text-emerald-900">
                          {position.salary_range_min.toLocaleString()} SAR
                        </p>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <DollarSign className="w-5 h-5 text-blue-600" />
                          <p className="text-sm text-blue-900 font-medium">Maximum Salary</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">
                          {position.salary_range_max.toLocaleString()} SAR
                        </p>
                      </div>
                    </div>

                    {employees.length > 0 && (
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <TrendingUp className="w-5 h-5 text-purple-600" />
                          <p className="text-sm text-purple-900 font-medium">Current Employees Salary Stats</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-purple-700 mb-1">Average:</p>
                            <p className="font-bold text-purple-900">
                              {(employees.reduce((sum, e) => sum + (e.basic_salary || 0), 0) / employees.length).toLocaleString()} SAR
                            </p>
                          </div>
                          <div>
                            <p className="text-purple-700 mb-1">Lowest:</p>
                            <p className="font-bold text-purple-900">
                              {Math.min(...employees.map(e => e.basic_salary || 0)).toLocaleString()} SAR
                            </p>
                          </div>
                          <div>
                            <p className="text-purple-700 mb-1">Highest:</p>
                            <p className="font-bold text-purple-900">
                              {Math.max(...employees.map(e => e.basic_salary || 0)).toLocaleString()} SAR
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className={`text-xs text-slate-600 ${isRTL ? 'text-right' : ''}`}>
                        <strong>Note:</strong> Salary ranges are guidelines for hiring and performance reviews. 
                        Actual employee salaries may vary based on experience, performance, and market conditions.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}