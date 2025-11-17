import React, { useState, useMemo } from 'react';
import { useMutation, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, FileText, ArrowRight, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function MasterDataUpload() {
  const [selectedEntity, setSelectedEntity] = useState('Employee');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [showMapping, setShowMapping] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [importProgress, setImportProgress] = useState(0);
  const [batchSize, setBatchSize] = useState(100);

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
    setCsvHeaders([]);
    setColumnMapping({});
    setValidationErrors([]);
    setShowMapping(false);
    setUploading(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedFileUrl(file_url);
      
      // For CSV files, extract headers
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split('\n');
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          setCsvHeaders(headers);
          
          // Auto-map columns that match entity fields
          const autoMapping = {};
          const schemaFields = Object.keys(entitySchema?.properties || {});
          headers.forEach(header => {
            const normalizedHeader = header.toLowerCase().replace(/[_\s]/g, '');
            const matchingField = schemaFields.find(field => 
              field.toLowerCase().replace(/[_\s]/g, '') === normalizedHeader
            );
            if (matchingField) {
              autoMapping[header] = matchingField;
            }
          });
          setColumnMapping(autoMapping);
        }
      }
      
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const validateRecord = (record, rowIndex) => {
    const errors = [];
    const properties = entitySchema?.properties || {};
    
    Object.entries(properties).forEach(([field, schema]) => {
      const value = record[field];
      
      // Check required fields
      if (schema.required || (entitySchema.required || []).includes(field)) {
        if (value === undefined || value === null || value === '') {
          errors.push({
            row: rowIndex,
            field,
            message: `Required field '${field}' is missing`,
            severity: 'error'
          });
        }
      }
      
      // Type validation
      if (value !== undefined && value !== null && value !== '') {
        if (schema.type === 'number' && isNaN(Number(value))) {
          errors.push({
            row: rowIndex,
            field,
            value,
            message: `Field '${field}' must be a number`,
            severity: 'error'
          });
        }
        
        if (schema.type === 'boolean' && typeof value !== 'boolean') {
          const boolStr = String(value).toLowerCase();
          if (!['true', 'false', '1', '0'].includes(boolStr)) {
            errors.push({
              row: rowIndex,
              field,
              value,
              message: `Field '${field}' must be true/false`,
              severity: 'error'
            });
          }
        }
        
        if (schema.enum && !schema.enum.includes(value)) {
          errors.push({
            row: rowIndex,
            field,
            value,
            message: `Field '${field}' must be one of: ${schema.enum.join(', ')}`,
            severity: 'error'
          });
        }
        
        if (schema.format === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push({
            row: rowIndex,
            field,
            value,
            message: `Field '${field}' must be a valid email`,
            severity: 'warning'
          });
        }
      }
    });
    
    return errors;
  };

  const handleExtractData = async () => {
    if (!uploadedFileUrl || !entitySchema) return;

    setProcessing(true);
    setValidationErrors([]);
    
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
        let records = result.output?.records || [];
        
        // Apply column mapping if exists
        if (Object.keys(columnMapping).length > 0) {
          records = records.map(record => {
            const mappedRecord = {};
            Object.entries(columnMapping).forEach(([csvCol, entityField]) => {
              if (record[csvCol] !== undefined) {
                mappedRecord[entityField] = record[csvCol];
              }
            });
            return mappedRecord;
          });
        }
        
        // Validate all records
        const allErrors = [];
        records.forEach((record, index) => {
          const errors = validateRecord(record, index + 1);
          allErrors.push(...errors);
        });
        
        setValidationErrors(allErrors);
        setExtractedData(records);
        
        const errorCount = allErrors.filter(e => e.severity === 'error').length;
        const warningCount = allErrors.filter(e => e.severity === 'warning').length;
        
        if (errorCount > 0) {
          toast.error(`Found ${errorCount} validation errors. Please review before importing.`);
        } else if (warningCount > 0) {
          toast.warning(`Found ${warningCount} warnings. Review recommended.`);
        } else {
          toast.success(`Extracted ${records.length} records - all validation passed!`);
        }
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
      // Batch processing for large files
      const batches = [];
      for (let i = 0; i < records.length; i += batchSize) {
        batches.push(records.slice(i, i + batchSize));
      }
      
      const results = [];
      const errors = [];
      
      for (let i = 0; i < batches.length; i++) {
        try {
          setImportProgress(Math.round(((i + 1) / batches.length) * 100));
          const created = await base44.entities[selectedEntity].bulkCreate(batches[i]);
          results.push(...created);
        } catch (error) {
          errors.push({
            batch: i + 1,
            message: error.message,
            records: batches[i]
          });
        }
      }
      
      return { results, errors };
    },
    onSuccess: (data) => {
      setImportProgress(100);
      if (data.errors.length > 0) {
        toast.error(`Imported ${data.results.length} records, but ${data.errors.length} batches failed`);
      } else {
        toast.success(`Successfully imported ${data.results.length} records`);
      }
      setUploadedFile(null);
      setUploadedFileUrl(null);
      setExtractedData(null);
      setCsvHeaders([]);
      setColumnMapping({});
      setValidationErrors([]);
      setImportProgress(0);
    },
    onError: (error) => {
      toast.error('Failed to import data: ' + error.message);
      setImportProgress(0);
    }
  });

  const handleImport = () => {
    if (!extractedData || extractedData.length === 0) {
      toast.error('No data to import');
      return;
    }
    
    const criticalErrors = validationErrors.filter(e => e.severity === 'error');
    if (criticalErrors.length > 0) {
      if (!window.confirm(`There are ${criticalErrors.length} validation errors. Some records may fail to import. Continue anyway?`)) {
        return;
      }
    }

    if (window.confirm(`Import ${extractedData.length} ${selectedEntity} records in batches of ${batchSize}?`)) {
      importDataMutation.mutate(extractedData);
    }
  };
  
  const downloadErrorReport = () => {
    if (validationErrors.length === 0) return;
    
    let csv = 'Row,Field,Value,Issue,Severity\n';
    validationErrors.forEach(error => {
      csv += `${error.row},"${error.field}","${error.value || ''}","${error.message}",${error.severity}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation_errors_${selectedEntity}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    toast.success('Error report downloaded');
  };
  
  const schemaFields = useMemo(() => {
    return Object.keys(entitySchema?.properties || {}).filter(key => 
      !['id', 'created_date', 'updated_date', 'created_by'].includes(key)
    );
  }, [entitySchema]);

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

        {/* Step 4: Column Mapping (for CSV) */}
        {csvHeaders.length > 0 && !extractedData && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Step 4: Map CSV Columns to Entity Fields</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMapping(!showMapping)}
              >
                {showMapping ? 'Hide Mapping' : 'Show Mapping'}
              </Button>
            </div>
            
            {showMapping && (
              <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
                <p className="text-xs text-slate-600 mb-3">
                  Map your CSV columns to the entity fields. Auto-mapped fields are highlighted.
                </p>
                {csvHeaders.map(header => (
                  <div key={header} className="flex items-center gap-3">
                    <div className="flex-1 p-2 bg-white rounded border">
                      <p className="text-sm font-medium">{header}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <Select
                      value={columnMapping[header] || ''}
                      onValueChange={(value) => {
                        setColumnMapping(prev => ({
                          ...prev,
                          [header]: value
                        }));
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>-- Skip --</SelectItem>
                        {schemaFields.map(field => (
                          <SelectItem key={field} value={field}>
                            {field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Extract & Validate Data */}
        {uploadedFileUrl && !extractedData && (
          <div>
            <Label className="mb-2 block">
              {csvHeaders.length > 0 ? 'Step 5' : 'Step 4'}: Extract & Validate Data
            </Label>
            <Button
              onClick={handleExtractData}
              disabled={processing}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {processing ? 'Extracting & Validating...' : 'Extract & Validate Data'}
            </Button>
          </div>
        )}

        {/* Step 6: Validation Results & Preview */}
        {extractedData && (
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">
                {csvHeaders.length > 0 ? 'Step 6' : 'Step 5'}: Validation Results & Import
              </Label>
              
              {/* Validation Summary */}
              <div className="grid md:grid-cols-3 gap-3 mb-4">
                <Alert className="border-emerald-200 bg-emerald-50">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-900 text-sm">
                    <strong>{extractedData.length}</strong> records extracted
                  </AlertDescription>
                </Alert>
                
                {validationErrors.filter(e => e.severity === 'error').length > 0 && (
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-900 text-sm">
                      <strong>{validationErrors.filter(e => e.severity === 'error').length}</strong> errors found
                    </AlertDescription>
                  </Alert>
                )}
                
                {validationErrors.filter(e => e.severity === 'warning').length > 0 && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-900 text-sm">
                      <strong>{validationErrors.filter(e => e.severity === 'warning').length}</strong> warnings
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Validation Errors Table */}
            {validationErrors.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-slate-100 p-3 border-b flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">
                    Validation Issues ({validationErrors.length})
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={downloadErrorReport}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download Report
                  </Button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead>Severity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validationErrors.slice(0, 50).map((error, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-xs">{error.row}</TableCell>
                          <TableCell className="font-medium text-xs">{error.field}</TableCell>
                          <TableCell className="text-xs truncate max-w-[150px]">
                            {error.value || '-'}
                          </TableCell>
                          <TableCell className="text-xs">{error.message}</TableCell>
                          <TableCell>
                            <Badge className={
                              error.severity === 'error' 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-amber-100 text-amber-700'
                            }>
                              {error.severity}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {validationErrors.length > 50 && (
                    <div className="p-3 bg-slate-50 text-center text-xs text-slate-600">
                      Showing first 50 of {validationErrors.length} issues. Download full report for details.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Preview first 3 records */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-slate-100 p-3 border-b">
                <p className="text-sm font-semibold text-slate-700">
                  Data Preview (first 3 records)
                </p>
              </div>
              <div className="p-4 bg-slate-50 overflow-x-auto">
                <pre className="text-xs text-slate-700">
                  {JSON.stringify(extractedData.slice(0, 3), null, 2)}
                </pre>
              </div>
            </div>

            {/* Batch Size Selection */}
            {extractedData.length > 100 && (
              <div>
                <Label className="mb-2 block text-sm">Batch Processing Size</Label>
                <Select value={String(batchSize)} onValueChange={(v) => setBatchSize(Number(v))}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 records per batch</SelectItem>
                    <SelectItem value="100">100 records per batch</SelectItem>
                    <SelectItem value="250">250 records per batch</SelectItem>
                    <SelectItem value="500">500 records per batch</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">
                  {Math.ceil(extractedData.length / batchSize)} batches will be processed
                </p>
              </div>
            )}

            {/* Import Progress */}
            {importDataMutation.isPending && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Importing records...</span>
                  <span className="text-slate-600">{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setUploadedFile(null);
                  setUploadedFileUrl(null);
                  setExtractedData(null);
                  setCsvHeaders([]);
                  setColumnMapping({});
                  setValidationErrors([]);
                }}
                variant="outline"
                className="flex-1"
                disabled={importDataMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={importDataMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {importDataMutation.isPending ? (
                  `Importing... (${importProgress}%)`
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