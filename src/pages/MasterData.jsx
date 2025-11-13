import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, Database, AlertCircle } from "lucide-react";
import MasterDataUpload from "../components/admin/MasterDataUpload";
import DataExport from "../components/admin/DataExport";

export default function MasterData() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user-master-data'],
    queryFn: () => base44.auth.me()
  });

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6 lg:p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600">
              You don't have permission to access master data management. Only administrators can upload and export data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-slate-900">Master Data Management</h1>
        </div>
        <p className="text-slate-600">
          Bulk upload and export data for employees, companies, assets, and other entities
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Data Management Tools</p>
              <ul className="space-y-1 list-disc list-inside text-blue-800">
                <li><strong>Upload:</strong> Bulk import data from CSV or Excel files using AI-powered extraction</li>
                <li><strong>Export:</strong> Download all entity data as CSV files for backup or analysis</li>
                <li><strong>Templates:</strong> Download pre-formatted CSV templates with correct field names</li>
                <li><strong>Validation:</strong> Automatic data validation based on entity schemas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="upload" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Upload className="w-4 h-4 mr-2" />
            Upload Data
          </TabsTrigger>
          <TabsTrigger value="export" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <MasterDataUpload />
        </TabsContent>

        <TabsContent value="export">
          <DataExport />
        </TabsContent>
      </Tabs>

      {/* Usage Guide */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-900 mb-3">📖 Quick Guide</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">Uploading Data</h4>
              <ol className="list-decimal list-inside space-y-1 text-slate-700">
                <li>Select the entity type you want to upload</li>
                <li>Download the CSV template</li>
                <li>Fill the template with your data</li>
                <li>Upload the completed file</li>
                <li>Review extracted data preview</li>
                <li>Click Import to add records to database</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-emerald-600 mb-2">Exporting Data</h4>
              <ol className="list-decimal list-inside space-y-1 text-slate-700">
                <li>Select the entity type to export</li>
                <li>Click Export button</li>
                <li>CSV file will download automatically</li>
                <li>Use for backups, analysis, or migrations</li>
                <li>Can be re-imported after modifications</li>
              </ol>
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-900">
              <strong>⚠️ Important:</strong> Always backup your data before performing bulk imports. 
              Ensure your CSV files match the template structure exactly to avoid import errors.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}