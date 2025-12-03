import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  FolderOpen, Play, Trash2, FileSpreadsheet, FileDown, 
  MoreVertical, Calendar, Filter, ArrowUpDown 
} from "lucide-react";
import { useTranslation } from "@/components/TranslationContext";
import { format } from "date-fns";

export default function SavedReportsList({ templates, isLoading, onLoad, onDelete, onExport, moduleConfig }) {
  const { language } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12">
          <div className="text-center">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {language === 'ar' ? 'لا توجد تقارير محفوظة' : 'No Saved Reports'}
            </h3>
            <p className="text-slate-500">
              {language === 'ar' 
                ? 'قم بإنشاء تقرير وحفظه للوصول السريع'
                : 'Create and save a report for quick access'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => {
        const config = moduleConfig[template.module];
        const ModuleIcon = config?.icon || FileSpreadsheet;
        const filterCount = template.filters ? Object.keys(JSON.parse(template.filters)).length : 0;

        return (
          <Card key={template.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow group">
            <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <ModuleIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{template.report_name}</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">{config?.label}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onLoad(template)}>
                      <Play className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'تحميل' : 'Load Template'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport(template, 'csv')}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'تصدير CSV' : 'Export CSV'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport(template, 'pdf')}>
                      <FileDown className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'تصدير PDF' : 'Export PDF'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(template.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Template Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{template.selected_fields?.length || 0} fields</span>
                </div>
                {filterCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Filter className="w-4 h-4" />
                    <span>{filterCount} filters applied</span>
                  </div>
                )}
                {template.sort_field && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <ArrowUpDown className="w-4 h-4" />
                    <span>Sorted by {template.sort_field}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-4 h-4" />
                  <span>Created {format(new Date(template.created_date), 'MMM dd, yyyy')}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => onLoad(template)}
                >
                  <Play className="w-4 h-4 mr-1" />
                  {language === 'ar' ? 'تحميل' : 'Load'}
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => onExport(template, 'csv')}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-1" />
                  {language === 'ar' ? 'تصدير' : 'Export'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}