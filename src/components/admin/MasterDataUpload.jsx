import React, { useState } from 'react';
import { useMutation, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, FileText } from "lucide-react";
import { toast } from "sonner";

export default function MasterDataUpload() {
  const [selectedEntity, setSelectedEntity] = useState('Employee');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const entities = [
    { name: 'Employee', label: 'Employees', icon: '👥' },
    { name: 'Company', label: 'Companies', icon: '🏢' },
    { name: 'Shift', label: 'Shifts', icon: '⏰' },
    { name: 'LeaveBalance', label: 'Leave Balances', icon: '📅' },
    { name: 'Asset', label: 'Assets', icon: '📦' },
    { name: 'Benefit', label: 'Benefits', icon: '🎁' },
    { name: 'Project', label: 'Projects', icon: '📋' }
  ];

  const { data: entitySchema } = useQuery({
    queryKey: ['entity-schema', selectedEntity],
    queryFn: async () => {
      const schema = await base44.entities[selectedEntity].schema();
      return schema;
    },
    enabled: !!selectedEntity
  });

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf'
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV, Excel, or PDF file');
      return;
    }

    setUploadedFile(file);
    setExtractedData(null);
    setUploading(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedFileUrl(file_url);
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleExtractData = async () => {
    if (!uploadedFileUrl || !entitySchema) return;

    setProcessing(true);
    try {
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: uploadedFileUrl,
        json_schema: {
          type: "object",
          properties: {
            records: {
              type: "array",
              items: entitySchema
            }
          }
        }
      });

      if (result.status === 'error') {
        toast.error(result.details || 'Failed to extract data from file');
        setExtractedData(null);
      } else {
        const records = result.output?.records || [];
        setExtractedData(records);
        toast.success(`Extracted ${records.length} records from file`);
      }
    } catch (error) {
      toast.error('Failed to extract data');
      setExtractedData(null);
    } finally {
      setProcessing(false);
    }
  };

  const importDataMutation = useMutation({
    mutationFn: async (records) => {
      const created = await base44.entities[selectedEntity].bulkCreate(records);
      return created;
    },
    onSuccess: (data) => {
      toast.success(`Successfully imported ${data.length} records`);
      setUploadedFile(null);
      setUploadedFileUrl(null);
      setExtractedData(null);
    },
    onError: (error) => {
      toast.error('Failed to import data: ' + error.message);
    }
  });

  const handleImport = () => {
    if (!extractedData || extractedData.length === 0) {
      toast.error('No data to import');
      return;
    }

    if (window.confirm(`Import ${extractedData.length} ${selectedEntity} records?`)) {
      importDataMutation.mutate(extractedData);
    }
  };

  const downloadTemplate = () => {
    if (!entitySchema) {
      toast.error('Schema not loaded yet. Please wait...');
      return;
    }

    const properties = entitySchema.properties || {};
    const headers = Object.keys(properties).filter(key => 
      !['id', 'created_date', 'updated_date', 'created_by'].includes(key)
    );

    if (headers.length === 0) {
      toast.error('No fields available for this entity');
      return;
    }

    let csv = headers.join(',') + '\n';
    
    // Add sample row with field descriptions
    const sampleRow = headers.map(header => {
      const prop = properties[header];
      if (prop.enum) {
        return prop.enum[0];
      } else if (prop.type === 'number') {
        return '0';
      } else if (prop.type === 'boolean') {
        return 'false';
      } else if (prop.format === 'date') {
        return '2025-01-01';
      } else {
        return `sample_${header}`;
      }
    });
    csv += sampleRow.join(',') + '\n';

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedEntity}_template.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    toast.success(`Template downloaded: ${selectedEntity}_template.csv`);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600" />
          Master Data Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 text-sm">
            <strong>Upload bulk data via CSV or Excel files.</strong> Select an entity type, download the template to see required fields, fill it with your data, and upload it for processing.
          </AlertDescription>
        </Alert>

        {/* Step 1: Select Entity */}
        <div>
          <Label className="mb-2 block">Step 1: Select Entity Type</Label>
          <Select value={selectedEntity} onValueChange={setSelectedEntity}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {entities.map(entity => (
                <SelectItem key={entity.name} value={entity.name}>
                  {entity.icon} {entity.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Step 2: Download Template */}
        <div>
          <Label className="mb-2 block">Step 2: Download Template</Label>
          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="w-full"
            disabled={!entitySchema}
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV Template for {selectedEntity}
          </Button>
          {entitySchema && (
            <p className="text-xs text-slate-500 mt-2">
              Template includes all required fields for {selectedEntity}
            </p>
          )}
        </div>

        {/* Step 3: Upload File */}
        <div>
          <Label className="mb-2 block">Step 3: Upload Filled Template</Label>
          {uploadedFile ? (
            <div className="p-4 border rounded-lg bg-emerald-50 border-emerald-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                  <div>
                    <p className="font-medium text-emerald-900">{uploadedFile.name}</p>
                    <p className="text-sm text-emerald-700">
                      {(uploadedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUploadedFile(null);
                    setUploadedFileUrl(null);
                    setExtractedData(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
              <Upload className="w-12 h-12 text-slate-400 mb-3" />
              <p className="text-sm font-medium text-slate-700 mb-1">
                {uploading ? 'Uploading...' : 'Click to upload file'}
              </p>
              <p className="text-xs text-slate-500">CSV, Excel, or PDF (max 10MB)</p>
              <input
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls,.pdf"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {/* Step 4: Extract Data */}
        {uploadedFileUrl && !extractedData && (
          <div>
            <Label className="mb-2 block">Step 4: Extract Data from File</Label>
            <Button
              onClick={handleExtractData}
              disabled={processing}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {processing ? 'Extracting Data...' : 'Extract Data'}
            </Button>
          </div>
        )}

        {/* Step 5: Preview & Import */}
        {extractedData && (
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Step 5: Preview & Import Data</Label>
              <Alert className="border-emerald-200 bg-emerald-50">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-900 text-sm">
                  <strong>{extractedData.length} records</strong> extracted and ready to import
                </AlertDescription>
              </Alert>
            </div>

            {/* Preview first 3 records */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-slate-100 p-3 border-b">
                <p className="text-sm font-semibold text-slate-700">
                  Preview (showing first 3 records)
                </p>
              </div>
              <div className="p-4 bg-slate-50 overflow-x-auto">
                <pre className="text-xs text-slate-700">
                  {JSON.stringify(extractedData.slice(0, 3), null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setUploadedFile(null);
                  setUploadedFileUrl(null);
                  setExtractedData(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={importDataMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {importDataMutation.isPending ? (
                  'Importing...'
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Import {extractedData.length} Records
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Import Success */}
        {importDataMutation.isSuccess && (
          <Alert className="border-emerald-200 bg-emerald-50">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-900 text-sm">
              <strong>Import successful!</strong> All records have been added to the database.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}