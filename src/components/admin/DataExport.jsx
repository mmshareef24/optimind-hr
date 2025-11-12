import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Download, FileSpreadsheet, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DataExport() {
  const [selectedEntity, setSelectedEntity] = useState('Employee');
  const [exporting, setExporting] = useState(false);

  const entities = [
    { name: 'Employee', label: 'Employees' },
    { name: 'Company', label: 'Companies' },
    { name: 'LeaveRequest', label: 'Leave Requests' },
    { name: 'Attendance', label: 'Attendance Records' },
    { name: 'Payroll', label: 'Payroll Records' },
    { name: 'Asset', label: 'Assets' },
    { name: 'Benefit', label: 'Benefits' },
    { name: 'BenefitEnrollment', label: 'Benefit Enrollments' },
    { name: 'TravelRequest', label: 'Travel Requests' },
    { name: 'ExpenseClaim', label: 'Expense Claims' },
    { name: 'LoanRequest', label: 'Loan Requests' },
    { name: 'Project', label: 'Projects' },
    { name: 'PerformanceReview', label: 'Performance Reviews' },
    { name: 'OnboardingTask', label: 'Onboarding Tasks' }
  ];

  const handleExport = async () => {
    if (!selectedEntity) {
      toast.error('Please select an entity to export');
      return;
    }

    setExporting(true);
    try {
      const records = await base44.entities[selectedEntity].list();
      
      if (records.length === 0) {
        toast.error('No records found to export');
        setExporting(false);
        return;
      }

      // Convert to CSV
      const headers = Object.keys(records[0]);
      let csv = headers.join(',') + '\n';
      
      records.forEach(record => {
        const values = headers.map(header => {
          const value = record[header];
          // Handle arrays and objects
          if (Array.isArray(value)) {
            return `"${value.join(';')}"`;
          } else if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          // Escape quotes and wrap in quotes if contains comma
          const escaped = String(value || '').replace(/"/g, '""');
          return escaped.includes(',') ? `"${escaped}"` : escaped;
        });
        csv += values.join(',') + '\n';
      });

      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedEntity}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success(`Exported ${records.length} records`);
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-white">
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5 text-emerald-600" />
          Data Export
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <Alert className="border-emerald-200 bg-emerald-50">
          <AlertCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-900 text-sm">
            <strong>Export data to CSV files.</strong> Select an entity type and download all records in CSV format for backup or analysis.
          </AlertDescription>
        </Alert>

        <div>
          <Label className="mb-2 block">Select Entity Type</Label>
          <Select value={selectedEntity} onValueChange={setSelectedEntity}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {entities.map(entity => (
                <SelectItem key={entity.name} value={entity.name}>
                  {entity.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleExport}
          disabled={exporting || !selectedEntity}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          size="lg"
        >
          {exporting ? (
            'Exporting...'
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              Export {selectedEntity} to CSV
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}