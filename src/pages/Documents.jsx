import React, { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { FileText, Upload, Download, ExternalLink, AlertCircle, Bell, HardDrive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentUploadForm from "../components/documents/DocumentUploadForm";
import GoogleDriveManager from "../components/documents/GoogleDriveManager";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";

export default function Documents() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const [showUploadForm, setShowUploadForm] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list('-created_date'),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const sendAlertsMutation = useMutation({
    mutationFn: () => base44.functions.invoke('documentExpiryAlerts'),
    onSuccess: (response) => {
      toast.success(`Sent ${response.data.alertsSent} expiry alerts`);
    },
    onError: () => toast.error('Failed to send alerts')
  });

  const employeeDocuments = documents.filter(doc => doc.employee_id);
  const companyDocuments = documents.filter(doc => doc.company_id || !doc.employee_id);

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null;
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return { label: 'Expired', color: 'bg-red-100 text-red-700 border-red-200' };
    if (days <= 7) return { label: `Expires in ${days} days`, color: 'bg-red-100 text-red-700 border-red-200' };
    if (days <= 30) return { label: `Expires in ${days} days`, color: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: `Expires in ${days} days`, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  };

  const renderDocumentCard = (doc) => {
    const employee = employees.find(e => e.id === doc.employee_id);
    const company = companies.find(c => c.id === doc.company_id);
    const expiryStatus = getExpiryStatus(doc.expiry_date);
    
    return (
      <div key={doc.id} className={`flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:shadow-md transition-all ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className={isRTL ? 'text-right' : ''}>
            <h3 className="font-semibold text-slate-900">{doc.document_name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {doc.document_type.replace('_', ' ')}
              </Badge>
              {employee && (
                <span className="text-xs text-slate-500">
                  {employee.first_name} {employee.last_name}
                </span>
              )}
              {company && (
                <span className="text-xs text-slate-500">
                  {company.name_en}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              {doc.issue_date && (
                <p className="text-xs text-slate-400">
                  Issued: {format(new Date(doc.issue_date), 'MMM dd, yyyy')}
                </p>
              )}
              {doc.expiry_date && (
                <p className="text-xs text-slate-400">
                  Expires: {format(new Date(doc.expiry_date), 'MMM dd, yyyy')}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {expiryStatus && (
            <Badge className={expiryStatus.color}>
              {expiryStatus.label}
            </Badge>
          )}
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            {doc.status}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(doc.file_url, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('documents')}</h1>
          <p className="text-slate-600">{t('documents_desc')}</p>
        </div>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button 
            onClick={() => sendAlertsMutation.mutate()}
            variant="outline"
            disabled={sendAlertsMutation.isPending}
            className="border-amber-200 text-amber-700 hover:bg-amber-50"
          >
            <Bell className="w-4 h-4 mr-2" /> 
            {sendAlertsMutation.isPending ? 'Sending...' : 'Send Expiry Alerts'}
          </Button>
          <Button 
            onClick={() => setShowUploadForm(true)}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg"
          >
            <Upload className="w-4 h-4 mr-2" /> {t('upload_document')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="company">Company Documents</TabsTrigger>
          <TabsTrigger value="employee">Employee Documents</TabsTrigger>
          <TabsTrigger value="googledrive" className="gap-2">
            <HardDrive className="w-4 h-4" />
            Google Drive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-emerald-50/30">
              <CardTitle className={isRTL ? 'text-right' : ''}>{t('all_documents')}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">{t('no_documents_uploaded')}</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {documents.map(renderDocumentCard)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-blue-50/30">
              <CardTitle className={isRTL ? 'text-right' : ''}>Company Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
                </div>
              ) : companyDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">No company documents uploaded yet</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {companyDocuments.map(renderDocumentCard)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employee">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-emerald-50/30">
              <CardTitle className={isRTL ? 'text-right' : ''}>Employee Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
                </div>
              ) : employeeDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">No employee documents uploaded yet</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {employeeDocuments.map(renderDocumentCard)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="googledrive">
          <GoogleDriveManager />
        </TabsContent>
      </Tabs>

      <DocumentUploadForm
        open={showUploadForm}
        onOpenChange={setShowUploadForm}
        employees={employees}
        companies={companies}
        onSuccess={() => {
          queryClient.invalidateQueries(['documents']);
        }}
      />
    </div>
  );
}