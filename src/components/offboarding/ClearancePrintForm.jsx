import React from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { format } from "date-fns";

export default function ClearancePrintForm({ process, employee, clearanceItems, company }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <Button onClick={handlePrint} className="bg-slate-600 hover:bg-slate-700">
          <Printer className="w-4 h-4 mr-2" />
          Print Clearance Forms
        </Button>
      </div>

      <div className="print:block">
        {clearanceItems.map((item, index) => (
          <div key={item.id} className="page-break bg-white p-8 mb-8 print:mb-0" style={{ pageBreakAfter: 'always' }}>
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">EMPLOYEE CLEARANCE FORM</h1>
                  <p className="text-sm text-slate-600 mt-1">{company?.name_en || 'Company Name'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Form No: OFF-{process?.id?.slice(-6).toUpperCase()}-{index + 1}</p>
                  <p className="text-xs text-slate-500">Date: {format(new Date(), 'dd/MM/yyyy')}</p>
                </div>
              </div>
            </div>

            {/* Employee Information */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-300 pb-2">EMPLOYEE INFORMATION</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Employee Name</p>
                  <p className="font-semibold text-slate-900">{employee?.first_name} {employee?.last_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Employee ID</p>
                  <p className="font-semibold text-slate-900">{employee?.employee_id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Department</p>
                  <p className="font-semibold text-slate-900">{employee?.department}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Position</p>
                  <p className="font-semibold text-slate-900">{employee?.job_title}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last Working Day</p>
                  <p className="font-semibold text-slate-900">
                    {process?.last_working_day ? format(new Date(process.last_working_day), 'dd/MM/yyyy') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Termination Type</p>
                  <p className="font-semibold text-slate-900 uppercase">{process?.termination_type?.replace(/_/g, ' ')}</p>
                </div>
              </div>
            </div>

            {/* Clearance Details */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-300 pb-2">
                CLEARANCE DEPARTMENT: {item.department.replace(/_/g, ' ').toUpperCase()}
              </h2>
              
              <div className="mb-4">
                <h3 className="font-bold text-slate-900 mb-2">{item.clearance_type}</h3>
                <p className="text-sm text-slate-700">{item.description}</p>
              </div>

              {/* Checklist */}
              <div className="border border-slate-300 rounded p-4 mb-4">
                <h4 className="font-semibold text-slate-900 mb-3">CLEARANCE CHECKLIST</h4>
                <div className="space-y-2">
                  {item.department === 'warehouse' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-400"></div>
                        <span className="text-sm">All company tools returned</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-400"></div>
                        <span className="text-sm">Equipment checked and verified</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-400"></div>
                        <span className="text-sm">Assets condition documented</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-400"></div>
                        <span className="text-sm">Handover form signed</span>
                      </div>
                    </>
                  )}
                  {item.department === 'finance_loans' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-400"></div>
                        <span className="text-sm">Outstanding loans verified</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-400"></div>
                        <span className="text-sm">Salary advances checked</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-400"></div>
                        <span className="text-sm">Final settlement calculated</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-400"></div>
                        <span className="text-sm">Payment schedule confirmed</span>
                      </div>
                    </>
                  )}
                  {item.department === 'finance_customer_balances' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-400"></div>
                        <span className="text-sm">Customer accounts reviewed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-400"></div>
                        <span className="text-sm">Outstanding balances settled</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-400"></div>
                        <span className="text-sm">Accounts transferred to new representative</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-400"></div>
                        <span className="text-sm">Financial records verified</span>
                      </div>
                    </>
                  )}
                  {item.department === 'hr_manager' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-400"></div>
                        <span className="text-sm">All department clearances reviewed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-400"></div>
                        <span className="text-sm">Exit interview completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-400"></div>
                        <span className="text-sm">Documentation verified</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-400"></div>
                        <span className="text-sm">Final approval granted</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Outstanding Amount */}
              {(item.department.includes('finance')) && (
                <div className="border border-slate-300 rounded p-4 mb-4">
                  <h4 className="font-semibold text-slate-900 mb-2">FINANCIAL SUMMARY</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Outstanding Amount:</span>
                    <span className="text-lg font-bold">_______________ SAR</span>
                  </div>
                </div>
              )}

              {/* Notes Section */}
              <div className="border border-slate-300 rounded p-4 mb-4">
                <h4 className="font-semibold text-slate-900 mb-2">NOTES / REMARKS</h4>
                <div className="h-20 border-b border-slate-200"></div>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-8 pt-6 border-t-2 border-slate-900">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-8">EMPLOYEE SIGNATURE</p>
                  <div className="border-t border-slate-400 pt-2">
                    <p className="text-xs text-slate-500">Signature</p>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-slate-500">Date: _______________</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-8">DEPARTMENT HEAD SIGNATURE</p>
                  <div className="border-t border-slate-400 pt-2">
                    <p className="text-xs text-slate-500">Name & Signature</p>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-slate-500">Date: _______________</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-xs text-slate-500">
              <p>This form must be completed and signed before final settlement</p>
              <p className="mt-1">For HR Use Only - File Reference: {process?.id}</p>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .page-break {
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
}