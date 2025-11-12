import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, CheckCircle, Clock, XCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import GOSIReportExporter from "./GOSIReportExporter";

export default function GOSIReportHistory({ reports, isLoading, onViewReport, onDownloadReport }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted':
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'generated':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'approved':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'generated':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
        <CardTitle>GOSI Report History</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No GOSI reports generated yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className="border border-slate-200 hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(report.status)}
                        <h3 className="font-semibold text-slate-900">
                          {report.report_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                        {report.payment_status && (
                          <Badge className={getPaymentStatusColor(report.payment_status)}>
                            Payment: {report.payment_status}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-slate-500">Month:</span>
                          <span className="ml-2 font-semibold">{report.report_month}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Employees:</span>
                          <span className="ml-2 font-semibold">{report.total_employees}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Total Amount:</span>
                          <span className="ml-2 font-semibold text-emerald-600">
                            {report.total_contribution?.toLocaleString()} SAR
                          </span>
                        </div>
                        {report.submission_date && (
                          <div>
                            <span className="text-slate-500">Submitted:</span>
                            <span className="ml-2 font-semibold">
                              {format(new Date(report.submission_date), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>

                      {report.submission_reference && (
                        <div className="mt-2 text-xs text-slate-600">
                          <span className="font-medium">Reference:</span> {report.submission_reference}
                        </div>
                      )}

                      {report.due_date && (
                        <div className="mt-2 text-xs">
                          <span className="text-slate-500">Due Date:</span>
                          <span className={`ml-2 font-semibold ${
                            new Date(report.due_date) < new Date() && report.status !== 'submitted' 
                              ? 'text-red-600' 
                              : 'text-slate-700'
                          }`}>
                            {format(new Date(report.due_date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <GOSIReportExporter month={report.report_month} companyId={report.company_id} />
                      {report.uploaded_file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(report.uploaded_file_url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Receipt
                        </Button>
                      )}
                    </div>
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