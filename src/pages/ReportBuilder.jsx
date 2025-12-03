import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from "@/components/TranslationContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText, Download, Save, FolderOpen, Filter, ArrowUpDown,
  FileSpreadsheet, FileDown, Trash2, Play, Clock, Users, DollarSign,
  Calendar, TrendingUp, GraduationCap, Package, UserPlus, Eye, Plus
} from "lucide-react";
import { toast } from "sonner";
import ReportPreview from "@/components/reports/ReportPreview";
import ReportFilters from "@/components/reports/ReportFilters";
import SavedReportsList from "@/components/reports/SavedReportsList";

const MODULE_CONFIG = {
  employees: {
    label: "Employee Demographics",
    icon: Users,
    entity: "Employee",
    fields: [
      { key: "employee_id", label: "Employee ID" },
      { key: "first_name", label: "First Name" },
      { key: "last_name", label: "Last Name" },
      { key: "email", label: "Email" },
      { key: "department", label: "Department" },
      { key: "job_title", label: "Job Title" },
      { key: "employment_type", label: "Employment Type" },
      { key: "hire_date", label: "Hire Date" },
      { key: "status", label: "Status" },
      { key: "nationality", label: "Nationality" },
      { key: "gender", label: "Gender" },
      { key: "salary", label: "Salary" },
      { key: "phone", label: "Phone" },
      { key: "manager_id", label: "Manager" }
    ],
    filterFields: ["status", "department", "employment_type", "gender", "nationality"]
  },
  payroll: {
    label: "Payroll Summary",
    icon: DollarSign,
    entity: "Payroll",
    fields: [
      { key: "employee_id", label: "Employee ID" },
      { key: "period_month", label: "Month" },
      { key: "period_year", label: "Year" },
      { key: "basic_salary", label: "Basic Salary" },
      { key: "housing_allowance", label: "Housing Allowance" },
      { key: "transport_allowance", label: "Transport Allowance" },
      { key: "other_allowances", label: "Other Allowances" },
      { key: "gross_salary", label: "Gross Salary" },
      { key: "gosi_employee", label: "GOSI (Employee)" },
      { key: "gosi_employer", label: "GOSI (Employer)" },
      { key: "total_deductions", label: "Total Deductions" },
      { key: "net_salary", label: "Net Salary" },
      { key: "status", label: "Status" },
      { key: "payment_date", label: "Payment Date" }
    ],
    filterFields: ["status", "period_month", "period_year"]
  },
  attendance: {
    label: "Time & Attendance",
    icon: Clock,
    entity: "Attendance",
    fields: [
      { key: "employee_id", label: "Employee ID" },
      { key: "date", label: "Date" },
      { key: "clock_in", label: "Clock In" },
      { key: "clock_out", label: "Clock Out" },
      { key: "total_hours", label: "Total Hours" },
      { key: "overtime_hours", label: "Overtime Hours" },
      { key: "status", label: "Status" },
      { key: "late_minutes", label: "Late (mins)" },
      { key: "early_leave_minutes", label: "Early Leave (mins)" }
    ],
    filterFields: ["status", "date"]
  },
  leave: {
    label: "Leave Balances & Requests",
    icon: Calendar,
    entity: "LeaveRequest",
    fields: [
      { key: "employee_id", label: "Employee ID" },
      { key: "leave_type", label: "Leave Type" },
      { key: "start_date", label: "Start Date" },
      { key: "end_date", label: "End Date" },
      { key: "total_days", label: "Total Days" },
      { key: "status", label: "Status" },
      { key: "reason", label: "Reason" },
      { key: "approved_by", label: "Approved By" },
      { key: "created_date", label: "Request Date" }
    ],
    filterFields: ["status", "leave_type"]
  },
  performance: {
    label: "Performance Metrics",
    icon: TrendingUp,
    entity: "PerformanceReview",
    fields: [
      { key: "employee_id", label: "Employee ID" },
      { key: "review_period", label: "Review Period" },
      { key: "reviewer_id", label: "Reviewer" },
      { key: "overall_rating", label: "Overall Rating" },
      { key: "goals_achieved", label: "Goals Achieved" },
      { key: "strengths", label: "Strengths" },
      { key: "areas_for_improvement", label: "Areas for Improvement" },
      { key: "status", label: "Status" },
      { key: "review_date", label: "Review Date" }
    ],
    filterFields: ["status", "review_period"]
  },
  training: {
    label: "Training Records",
    icon: GraduationCap,
    entity: "TrainingEnrollment",
    fields: [
      { key: "employee_id", label: "Employee ID" },
      { key: "program_id", label: "Program" },
      { key: "enrollment_date", label: "Enrollment Date" },
      { key: "status", label: "Status" },
      { key: "completion_date", label: "Completion Date" },
      { key: "score", label: "Score" },
      { key: "passed", label: "Passed" },
      { key: "feedback_rating", label: "Feedback Rating" }
    ],
    filterFields: ["status"]
  },
  assets: {
    label: "Asset Inventory",
    icon: Package,
    entity: "Asset",
    fields: [
      { key: "asset_code", label: "Asset Code" },
      { key: "asset_name", label: "Asset Name" },
      { key: "category", label: "Category" },
      { key: "purchase_date", label: "Purchase Date" },
      { key: "purchase_cost", label: "Purchase Cost" },
      { key: "current_value", label: "Current Value" },
      { key: "condition", label: "Condition" },
      { key: "status", label: "Status" },
      { key: "location", label: "Location" },
      { key: "assigned_to", label: "Assigned To" }
    ],
    filterFields: ["status", "category", "condition"]
  },
  recruitment: {
    label: "Recruitment Pipeline",
    icon: UserPlus,
    entity: "Candidate",
    fields: [
      { key: "first_name", label: "First Name" },
      { key: "last_name", label: "Last Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "requisition_id", label: "Job Requisition" },
      { key: "stage", label: "Stage" },
      { key: "status", label: "Status" },
      { key: "source", label: "Source" },
      { key: "application_date", label: "Application Date" },
      { key: "overall_rating", label: "Rating" }
    ],
    filterFields: ["status", "stage", "source"]
  }
};

export default function ReportBuilder() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("builder");
  const [selectedModule, setSelectedModule] = useState("employees");
  const [selectedFields, setSelectedFields] = useState([]);
  const [filters, setFilters] = useState({});
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [reportName, setReportName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const { data: savedTemplates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['report-templates'],
    queryFn: () => base44.entities.ReportTemplate.list('-created_date')
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-for-reports'],
    queryFn: () => base44.entities.Employee.list()
  });

  const saveTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.ReportTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['report-templates']);
      setShowSaveDialog(false);
      toast.success('Report template saved');
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.ReportTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['report-templates']);
      toast.success('Template deleted');
    }
  });

  const moduleConfig = MODULE_CONFIG[selectedModule];

  const handleFieldToggle = (fieldKey) => {
    setSelectedFields(prev => 
      prev.includes(fieldKey) 
        ? prev.filter(f => f !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const handleSelectAllFields = () => {
    if (selectedFields.length === moduleConfig.fields.length) {
      setSelectedFields([]);
    } else {
      setSelectedFields(moduleConfig.fields.map(f => f.key));
    }
  };

  const handleModuleChange = (module) => {
    setSelectedModule(module);
    setSelectedFields([]);
    setFilters({});
    setSortField("");
    setPreviewData(null);
  };

  const handleLoadTemplate = (template) => {
    setSelectedTemplate(template);
    setSelectedModule(template.module);
    setSelectedFields(template.selected_fields || []);
    setFilters(template.filters ? JSON.parse(template.filters) : {});
    setSortField(template.sort_field || "");
    setSortDirection(template.sort_direction || "asc");
    setReportName(template.report_name);
    toast.success(`Loaded template: ${template.report_name}`);
  };

  const handleSaveTemplate = () => {
    if (!reportName.trim()) {
      toast.error('Please enter a report name');
      return;
    }
    if (selectedFields.length === 0) {
      toast.error('Please select at least one field');
      return;
    }

    saveTemplateMutation.mutate({
      report_name: reportName,
      module: selectedModule,
      selected_fields: selectedFields,
      filters: JSON.stringify(filters),
      sort_field: sortField,
      sort_direction: sortDirection,
      default_format: 'csv'
    });
  };

  const generatePreview = async () => {
    if (selectedFields.length === 0) {
      toast.error('Please select at least one field');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke('generateReport', {
        module: selectedModule,
        fields: selectedFields,
        filters,
        sortField,
        sortDirection,
        limit: 50
      });
      setPreviewData(response.data);
    } catch (error) {
      toast.error('Failed to generate preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportReport = async (format) => {
    if (selectedFields.length === 0) {
      toast.error('Please select at least one field');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke('exportReport', {
        module: selectedModule,
        fields: selectedFields,
        filters,
        sortField,
        sortDirection,
        format,
        reportName: reportName || `${moduleConfig.label} Report`
      });

      if (format === 'csv') {
        const blob = new Blob([response.data.content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.data.filename;
        a.click();
        window.URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportName || moduleConfig.label}_Report.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {language === 'ar' ? 'منشئ التقارير' : 'Report Builder'}
          </h1>
          <p className="text-slate-600">
            {language === 'ar' 
              ? 'إنشاء تقارير مخصصة وتصديرها بتنسيقات متعددة'
              : 'Create custom reports and export them in multiple formats'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setActiveTab("saved")}>
            <FolderOpen className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'التقارير المحفوظة' : 'Saved Reports'}
            {savedTemplates.length > 0 && (
              <Badge className="ml-2 bg-emerald-100 text-emerald-700">{savedTemplates.length}</Badge>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="builder" className="gap-2">
            <Plus className="w-4 h-4" />
            {language === 'ar' ? 'منشئ التقارير' : 'Report Builder'}
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            {language === 'ar' ? 'التقارير المحفوظة' : 'Saved Reports'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Panel - Configuration */}
            <div className="lg:col-span-1 space-y-6">
              {/* Module Selection */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-white">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    {language === 'ar' ? 'مصدر البيانات' : 'Data Source'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(MODULE_CONFIG).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => handleModuleChange(key)}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          selectedModule === key
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <config.icon className={`w-5 h-5 mb-1 ${
                          selectedModule === key ? 'text-emerald-600' : 'text-slate-500'
                        }`} />
                        <p className={`text-xs font-medium ${
                          selectedModule === key ? 'text-emerald-700' : 'text-slate-700'
                        }`}>
                          {config.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Field Selection */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                      {language === 'ar' ? 'الحقول' : 'Fields'}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={handleSelectAllFields}>
                      {selectedFields.length === moduleConfig.fields.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 max-h-80 overflow-y-auto">
                  <div className="space-y-2">
                    {moduleConfig.fields.map((field) => (
                      <label
                        key={field.key}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedFields.includes(field.key)}
                          onCheckedChange={() => handleFieldToggle(field.key)}
                        />
                        <span className="text-sm text-slate-700">{field.label}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Filters */}
              <ReportFilters
                module={selectedModule}
                moduleConfig={moduleConfig}
                filters={filters}
                setFilters={setFilters}
                employees={employees}
              />

              {/* Sort Options */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-white">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowUpDown className="w-5 h-5 text-purple-600" />
                    {language === 'ar' ? 'الترتيب' : 'Sort Order'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label>{language === 'ar' ? 'ترتيب حسب' : 'Sort By'}</Label>
                    <Select value={sortField} onValueChange={setSortField}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {moduleConfig.fields.map((field) => (
                          <SelectItem key={field.key} value={field.key}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'الاتجاه' : 'Direction'}</Label>
                    <Select value={sortDirection} onValueChange={setSortDirection}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">{language === 'ar' ? 'تصاعدي' : 'Ascending'}</SelectItem>
                        <SelectItem value="desc">{language === 'ar' ? 'تنازلي' : 'Descending'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Preview & Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Actions Bar */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-emerald-700 border-emerald-200">
                        {selectedFields.length} fields selected
                      </Badge>
                      {Object.keys(filters).length > 0 && (
                        <Badge variant="outline" className="text-blue-700 border-blue-200">
                          {Object.keys(filters).length} filters
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        onClick={generatePreview}
                        disabled={isGenerating || selectedFields.length === 0}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'معاينة' : 'Preview'}
                      </Button>
                      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Save className="w-4 h-4 mr-2" />
                            {language === 'ar' ? 'حفظ القالب' : 'Save Template'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {language === 'ar' ? 'حفظ قالب التقرير' : 'Save Report Template'}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label>{language === 'ar' ? 'اسم التقرير' : 'Report Name'}</Label>
                              <Input
                                value={reportName}
                                onChange={(e) => setReportName(e.target.value)}
                                placeholder="e.g., Monthly Employee Report"
                              />
                            </div>
                            <Button 
                              onClick={handleSaveTemplate} 
                              className="w-full bg-emerald-600 hover:bg-emerald-700"
                              disabled={saveTemplateMutation.isPending}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              {language === 'ar' ? 'حفظ' : 'Save Template'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="outline"
                        onClick={() => exportReport('csv')}
                        disabled={isGenerating || selectedFields.length === 0}
                      >
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        CSV
                      </Button>
                      <Button 
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => exportReport('pdf')}
                        disabled={isGenerating || selectedFields.length === 0}
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preview */}
              <ReportPreview
                data={previewData}
                fields={selectedFields}
                moduleConfig={moduleConfig}
                isLoading={isGenerating}
                employees={employees}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          <SavedReportsList
            templates={savedTemplates}
            isLoading={loadingTemplates}
            onLoad={handleLoadTemplate}
            onDelete={(id) => deleteTemplateMutation.mutate(id)}
            onExport={async (template, format) => {
              handleLoadTemplate(template);
              setTimeout(() => exportReport(format), 500);
            }}
            moduleConfig={MODULE_CONFIG}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}