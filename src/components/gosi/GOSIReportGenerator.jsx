import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Calendar, Users, DollarSign, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function GOSIReportGenerator({ employees, payrolls, companies, onGenerate }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedCompany, setSelectedCompany] = useState('');
  const [reportType, setReportType] = useState('monthly_contribution');
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);

  const GOSI_CAP = 45000; // Maximum salary subject to GOSI

  const calculateGOSIContributions = () => {
    setGenerating(true);

    // Filter payrolls for selected month
    const monthPayrolls = payrolls.filter(p => p.month === selectedMonth);
    
    if (monthPayrolls.length === 0) {
      setReportData({ error: 'No payroll data found for selected month' });
      setGenerating(false);
      return;
    }

    let totalWages = 0;
    let totalEmployeeContribution = 0;
    let totalEmployerContribution = 0;
    let occupationalHazards = 0;
    let sanedContribution = 0;
    let saudiCount = 0;
    let nonSaudiCount = 0;

    const employeeDetails = [];

    monthPayrolls.forEach(payroll => {
      const employee = employees.find(e => e.id === payroll.employee_id);
      if (!employee || !employee.gosi_applicable) return;

      const isSaudi = employee.nationality?.toLowerCase() === 'saudi arabia' || 
                      employee.nationality?.toLowerCase() === 'saudi';
      
      // Calculate GOSI base (capped at 45,000)
      const gosiBase = Math.min(payroll.gosi_calculation_base || payroll.gross_salary || 0, GOSI_CAP);
      
      let employeeShare = 0;
      let employerShare = 0;
      let saned = 0;

      if (isSaudi) {
        // Saudi: 22% total (10% employee + 12% employer)
        employeeShare = gosiBase * 0.10;
        employerShare = gosiBase * 0.12;
        // SANED: 2% (1% employee + 1% employer)
        saned = gosiBase * 0.02;
        employeeShare += gosiBase * 0.01;
        employerShare += gosiBase * 0.01;
        saudiCount++;
      } else {
        // Non-Saudi: 2% (employer only)
        employerShare = gosiBase * 0.02;
        nonSaudiCount++;
      }

      // Occupational hazards: 2% (employer)
      const hazards = gosiBase * 0.02;

      totalWages += gosiBase;
      totalEmployeeContribution += employeeShare;
      totalEmployerContribution += employerShare + hazards;
      occupationalHazards += hazards;
      sanedContribution += saned;

      employeeDetails.push({
        employee_id: employee.employee_id,
        name: `${employee.first_name} ${employee.last_name}`,
        national_id: employee.national_id,
        nationality: employee.nationality,
        is_saudi: isSaudi,
        gosi_base: gosiBase,
        employee_contribution: employeeShare,
        employer_contribution: employerShare,
        hazards: hazards,
        saned: saned,
        total: employeeShare + employerShare + hazards
      });
    });

    const report = {
      report_month: selectedMonth,
      company_id: selectedCompany,
      report_type: reportType,
      total_employees: employeeDetails.length,
      saudi_employees: saudiCount,
      non_saudi_employees: nonSaudiCount,
      total_wages: parseFloat(totalWages.toFixed(2)),
      total_employee_contribution: parseFloat(totalEmployeeContribution.toFixed(2)),
      total_employer_contribution: parseFloat(totalEmployerContribution.toFixed(2)),
      total_contribution: parseFloat((totalEmployeeContribution + totalEmployerContribution).toFixed(2)),
      occupational_hazards: parseFloat(occupationalHazards.toFixed(2)),
      saned_contribution: parseFloat(sanedContribution.toFixed(2)),
      employee_details: employeeDetails,
      status: 'generated'
    };

    setReportData(report);
    setGenerating(false);
  };

  const handleGenerate = () => {
    calculateGOSIContributions();
  };

  const handleSave = () => {
    if (reportData) {
      onGenerate(reportData);
    }
  };

  const handleDownloadExcel = () => {
    if (!reportData || !reportData.employee_details) return;

    // Prepare CSV data
    const headers = [
      'Employee ID', 'Name', 'National ID', 'Nationality', 
      'GOSI Base Salary', 'Employee Share', 'Employer Share', 
      'Hazards', 'SANED', 'Total'
    ];

    const rows = reportData.employee_details.map(emp => [
      emp.employee_id,
      emp.name,
      emp.national_id,
      emp.nationality,
      emp.gosi_base.toFixed(2),
      emp.employee_contribution.toFixed(2),
      emp.employer_contribution.toFixed(2),
      emp.hazards.toFixed(2),
      emp.saned.toFixed(2),
      emp.total.toFixed(2)
    ]);

    const csvContent = [
      `GOSI Monthly Contribution Report - ${selectedMonth}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `GOSI_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card className="border-emerald-200">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Generate GOSI Report
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label>Report Month</Label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label>Company</Label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(comp => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly_contribution">Monthly Contribution</SelectItem>
                  <SelectItem value="wage_certificate">Wage Certificate</SelectItem>
                  <SelectItem value="subscriber_additions">Subscriber Additions</SelectItem>
                  <SelectItem value="subscriber_deletions">Subscriber Deletions</SelectItem>
                  <SelectItem value="annual_report">Annual Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {generating ? 'Generating...' : 'Generate Report'}
          </Button>
        </CardContent>
      </Card>

      {/* Report Preview */}
      {reportData && !reportData.error && (
        <Card className="border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
            <CardTitle>Report Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-slate-600">Total Employees</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{reportData.total_employees}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {reportData.saudi_employees} Saudi • {reportData.non_saudi_employees} Non-Saudi
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-slate-600">Total Wages</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {reportData.total_wages.toLocaleString()} SAR
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-slate-600">Employee Share</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {reportData.total_employee_contribution.toLocaleString()} SAR
                </p>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-slate-600">Employer Share</span>
                </div>
                <p className="text-2xl font-bold text-amber-600">
                  {reportData.total_employer_contribution.toLocaleString()} SAR
                </p>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-slate-50 to-white rounded-lg border-2 border-emerald-200 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total GOSI Contribution</p>
                  <p className="text-4xl font-bold text-emerald-600">
                    {reportData.total_contribution.toLocaleString()} SAR
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Occupational Hazards</p>
                  <p className="text-lg font-semibold text-slate-700">
                    {reportData.occupational_hazards.toLocaleString()} SAR
                  </p>
                  <p className="text-xs text-slate-500 mt-2">SANED</p>
                  <p className="text-lg font-semibold text-slate-700">
                    {reportData.saned_contribution.toLocaleString()} SAR
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleDownloadExcel}
                variant="outline"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Excel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                Save Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {reportData && reportData.error && (
        <Alert variant="destructive">
          <AlertDescription>{reportData.error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}