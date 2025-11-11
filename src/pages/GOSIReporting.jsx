import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Shield, FileText, Upload, TrendingUp, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import StatCard from "../components/hrms/StatCard";
import GOSIReportGenerator from "../components/gosi/GOSIReportGenerator";
import GOSIUploadInterface from "../components/gosi/GOSIUploadInterface";
import GOSIReportHistory from "../components/gosi/GOSIReportHistory";
import GOSIComplianceCheck from "../components/gosi/GOSIComplianceCheck";
import { toast } from "sonner";

export default function GOSIReporting() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: payrolls = [] } = useQuery({
    queryKey: ['payrolls'],
    queryFn: () => base44.entities.Payroll.list('-month'),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['gosi-reports'],
    queryFn: () => base44.entities.GOSIReport.list('-created_date'),
  });

  const createReportMutation = useMutation({
    mutationFn: (data) => base44.entities.GOSIReport.create(data),
    onSuccess: (newReport) => {
      queryClient.invalidateQueries(['gosi-reports']);
      setSelectedReport(newReport);
      setShowUploadDialog(true);
      toast.success('GOSI report generated successfully');
    },
    onError: () => {
      toast.error('Failed to generate GOSI report');
    }
  });

  const updateReportMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GOSIReport.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['gosi-reports']);
      setShowUploadDialog(false);
      setSelectedReport(null);
      toast.success('GOSI report submission recorded successfully');
    },
    onError: () => {
      toast.error('Failed to update GOSI report');
    }
  });

  const handleGenerateReport = (reportData) => {
    // Calculate due date (15th of next month)
    const reportDate = new Date(reportData.report_month + '-01');
    const dueDate = new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 15);

    createReportMutation.mutate({
      ...reportData,
      due_date: dueDate.toISOString().split('T')[0]
    });
  };

  const handleUploadComplete = (uploadData) => {
    if (selectedReport) {
      updateReportMutation.mutate({
        id: selectedReport.id,
        data: {
          ...selectedReport,
          ...uploadData
        }
      });
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    // You could open a detailed view modal here
  };

  const handleDownloadReport = (report) => {
    // Generate and download report file
    toast.info('Downloading GOSI report...');
  };

  // Calculate statistics
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthReport = reports.find(r => r.report_month === currentMonth);
  const totalContributions = reports.reduce((sum, r) => sum + (r.total_contribution || 0), 0);
  const submittedReports = reports.filter(r => r.status === 'submitted' || r.status === 'approved').length;
  const pendingReports = reports.filter(r => 
    r.status === 'generated' || 
    (r.due_date && new Date(r.due_date) < new Date() && r.status !== 'submitted')
  ).length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">GOSI Reporting</h1>
        <p className="text-slate-600">Manage GOSI contributions and compliance reporting</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Current Month Status"
          value={currentMonthReport?.status || 'Pending'}
          icon={Shield}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Total Contributions (YTD)"
          value={`${totalContributions.toLocaleString()} SAR`}
          icon={TrendingUp}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Submitted Reports"
          value={submittedReports}
          icon={FileText}
          bgColor="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Pending Actions"
          value={pendingReports}
          icon={Calendar}
          bgColor="from-amber-500 to-amber-600"
        />
      </div>

      {/* Compliance Check */}
      <GOSIComplianceCheck employees={employees} reports={reports} />

      {/* Main Content */}
      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger 
            value="generate" 
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Report History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <GOSIReportGenerator
            employees={employees}
            payrolls={payrolls}
            companies={companies}
            onGenerate={handleGenerateReport}
          />
        </TabsContent>

        <TabsContent value="history">
          <GOSIReportHistory
            reports={reports}
            isLoading={loadingReports}
            onViewReport={handleViewReport}
            onDownloadReport={handleDownloadReport}
          />
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600" />
              Submit to GOSI Portal
            </DialogTitle>
          </DialogHeader>
          <GOSIUploadInterface
            report={selectedReport}
            onUploadComplete={handleUploadComplete}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}