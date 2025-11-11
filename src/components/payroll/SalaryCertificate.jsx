import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Printer } from "lucide-react";
import { format } from "date-fns";

export default function SalaryCertificate({ employee, payroll, company }) {
  const generatePDF = () => {
    const content = document.getElementById('salary-certificate-content');
    
    // Create a print window
    const printWindow = window.open('', '', 'height=800,width=800');
    printWindow.document.write('<html><head><title>Salary Certificate</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
      .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #059669; padding-bottom: 20px; }
      .company-name { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 10px; }
      .certificate-title { font-size: 20px; font-weight: bold; margin: 30px 0; }
      .content { margin: 20px 0; }
      .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      .details-table td { padding: 10px; border: 1px solid #ddd; }
      .details-table td:first-child { font-weight: bold; background: #f9f9f9; width: 40%; }
      .salary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      .salary-table th, .salary-table td { padding: 12px; border: 1px solid #ddd; text-align: left; }
      .salary-table th { background: #059669; color: white; }
      .total-row { font-weight: bold; background: #f0fdf4; }
      .footer { margin-top: 60px; }
      .signature { margin-top: 80px; }
      .signature-line { border-top: 2px solid #000; width: 200px; margin-top: 10px; }
      @media print { body { padding: 20px; } }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(content.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const certificateDate = new Date();
  const monthYear = payroll?.month ? format(new Date(payroll.month + '-01'), 'MMMM yyyy') : '';

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={generatePDF}>
          <Printer className="w-4 h-4 mr-2" /> Print
        </Button>
        <Button variant="outline" onClick={generatePDF}>
          <Download className="w-4 h-4 mr-2" /> Download PDF
        </Button>
      </div>

      <Card className="border-2 border-emerald-200">
        <CardContent className="p-8" id="salary-certificate-content">
          {/* Header */}
          <div className="text-center mb-8 pb-6 border-b-4 border-emerald-600">
            <div className="company-name text-3xl font-bold text-emerald-600 mb-2">
              {company?.name_en || 'Company Name'}
            </div>
            {company?.name_ar && (
              <div className="text-xl text-slate-600 mb-2">{company.name_ar}</div>
            )}
            <div className="text-sm text-slate-500">
              {company?.address && <div>{company.address}</div>}
              {company?.city && <span>{company.city}, </span>}
              {company?.country || 'Saudi Arabia'}
            </div>
            {company?.cr_number && (
              <div className="text-xs text-slate-500 mt-2">CR: {company.cr_number}</div>
            )}
          </div>

          {/* Certificate Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">SALARY CERTIFICATE</h2>
            <h3 className="text-xl font-bold text-slate-700 mb-2">شهادة راتب</h3>
            <div className="text-sm text-slate-500">
              Date: {format(certificateDate, 'dd MMMM yyyy')}
            </div>
          </div>

          {/* Content */}
          <div className="mb-6 text-slate-700">
            <p className="mb-4">To Whom It May Concern,</p>
            <p className="mb-6">
              This is to certify that <strong>{employee?.first_name} {employee?.last_name}</strong> is 
              employed with our organization in the capacity of <strong>{employee?.job_title}</strong> in 
              the <strong>{employee?.department}</strong> department.
            </p>
          </div>

          {/* Employee Details */}
          <table className="w-full border-collapse mb-6">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-3 font-semibold bg-slate-50 w-2/5">
                  Employee ID
                </td>
                <td className="border border-slate-300 p-3">{employee?.employee_id}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-3 font-semibold bg-slate-50">
                  National ID / Iqama
                </td>
                <td className="border border-slate-300 p-3">{employee?.national_id}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-3 font-semibold bg-slate-50">
                  Nationality
                </td>
                <td className="border border-slate-300 p-3">{employee?.nationality}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-3 font-semibold bg-slate-50">
                  Date of Joining
                </td>
                <td className="border border-slate-300 p-3">
                  {employee?.hire_date && format(new Date(employee.hire_date), 'dd MMMM yyyy')}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Salary Details */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              Monthly Salary Breakdown ({monthYear})
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-slate-300 p-3 bg-emerald-600 text-white text-left">
                    Component
                  </th>
                  <th className="border border-slate-300 p-3 bg-emerald-600 text-white text-right">
                    Amount (SAR)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-3">Basic Salary</td>
                  <td className="border border-slate-300 p-3 text-right">
                    {payroll?.basic_salary?.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-3">Housing Allowance</td>
                  <td className="border border-slate-300 p-3 text-right">
                    {payroll?.housing_allowance?.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-3">Transportation Allowance</td>
                  <td className="border border-slate-300 p-3 text-right">
                    {payroll?.transport_allowance?.toLocaleString()}
                  </td>
                </tr>
                {(payroll?.food_allowance > 0) && (
                  <tr>
                    <td className="border border-slate-300 p-3">Food Allowance</td>
                    <td className="border border-slate-300 p-3 text-right">
                      {payroll?.food_allowance?.toLocaleString()}
                    </td>
                  </tr>
                )}
                {(payroll?.mobile_allowance > 0) && (
                  <tr>
                    <td className="border border-slate-300 p-3">Mobile Allowance</td>
                    <td className="border border-slate-300 p-3 text-right">
                      {payroll?.mobile_allowance?.toLocaleString()}
                    </td>
                  </tr>
                )}
                {(payroll?.other_fixed_allowances > 0) && (
                  <tr>
                    <td className="border border-slate-300 p-3">Other Allowances</td>
                    <td className="border border-slate-300 p-3 text-right">
                      {payroll?.other_fixed_allowances?.toLocaleString()}
                    </td>
                  </tr>
                )}
                <tr className="font-bold bg-emerald-50">
                  <td className="border border-slate-300 p-3">Total Monthly Salary</td>
                  <td className="border border-slate-300 p-3 text-right">
                    {payroll?.gross_salary?.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Text */}
          <div className="mb-8 text-slate-700">
            <p className="mb-4">
              This certificate is issued upon the request of the employee for official purposes.
            </p>
            <p className="text-sm text-slate-600">
              This is a computer-generated certificate and does not require a signature.
            </p>
          </div>

          {/* Signature Section */}
          <div className="mt-16 pt-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="mb-2 font-semibold">HR Department</div>
                <div className="border-t-2 border-slate-900 w-48 pt-2 mt-12">
                  <div className="text-sm text-slate-600">Authorized Signature</div>
                </div>
              </div>
              <div>
                <div className="mb-2 font-semibold">Company Stamp</div>
                <div className="border-2 border-slate-300 w-48 h-24 mt-2 rounded-lg bg-slate-50"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}