import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, CheckCircle2, AlertCircle, Clock, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from '@/components/TranslationContext';

export default function SINADSubmissionManager({ record, onSubmitComplete }) {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const statusConfig = {
    draft: { icon: Clock, color: 'bg-slate-100 text-slate-700', label: 'Draft' },
    generated: { icon: FileCheck, color: 'bg-blue-100 text-blue-700', label: 'Generated' },
    submitted: { icon: Send, color: 'bg-purple-100 text-purple-700', label: 'Submitted' },
    approved: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
    rejected: { icon: AlertCircle, color: 'bg-red-100 text-red-700', label: 'Rejected' }
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const response = await base44.functions.invoke('sinadSync', {
        action: 'validate_before_submit',
        submission_month: record.submission_month
      });

      setValidationResult(response.data);
      
      if (response.data.valid) {
        toast.success(`Validation passed! ${response.data.total_employees} employees ready for submission`);
      } else {
        toast.error(`Validation failed with ${response.data.errors.length} errors`);
      }
    } catch (error) {
      toast.error('Error validating wage file');
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async () => {
    if (!validationResult?.valid) {
      toast.error('Please validate the wage file before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const response = await base44.functions.invoke('sinadSync', {
        action: 'submit_to_sinad',
        sinad_record_id: record.id
      });

      if (response.data.success) {
        toast.success(`Submitted successfully! Reference: ${response.data.reference_number}`);
        onSubmitComplete?.();
      } else {
        toast.error(response.data.error || 'Submission failed');
      }
    } catch (error) {
      toast.error('Error submitting to SINAD');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      const response = await base44.functions.invoke('sinadSync', {
        action: 'check_submission_status',
        sinad_record_id: record.id
      });

      if (response.data.success) {
        toast.success(`Status: ${response.data.status}`);
        onSubmitComplete?.();
      } else {
        toast.error(response.data.error || 'Failed to check status');
      }
    } catch (error) {
      toast.error('Error checking status');
    }
  };

  const currentStatus = statusConfig[record.status];
  const StatusIcon = currentStatus.icon;

  return (
    <Card className="border-purple-200">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className="w-5 h-5 text-purple-600" />
            {language === 'ar' ? 'إدارة التقديم' : 'Submission Manager'}
          </CardTitle>
          <Badge className={currentStatus.color}>
            {currentStatus.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Record Summary */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">{language === 'ar' ? 'الشهر' : 'Month'}</p>
            <p className="font-semibold text-slate-900">{record.submission_month}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">{language === 'ar' ? 'الموظفون' : 'Employees'}</p>
            <p className="font-semibold text-slate-900">{record.total_employees}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">{language === 'ar' ? 'إجمالي الأجور' : 'Total Wages'}</p>
            <p className="font-semibold text-slate-900">{record.total_wages?.toLocaleString()} SAR</p>
          </div>
        </div>

        {/* Validation Results */}
        {validationResult && (
          <Alert className={validationResult.valid ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
            <AlertDescription>
              {validationResult.valid ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-800">
                    {language === 'ar' 
                      ? `التحقق نجح! جاهز للتقديم (${validationResult.total_employees} موظف)`
                      : `Validation passed! Ready for submission (${validationResult.total_employees} employees)`}
                  </span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="font-semibold text-red-800">
                      {language === 'ar' 
                        ? `التحقق فشل - ${validationResult.errors.length} خطأ`
                        : `Validation failed - ${validationResult.errors.length} errors`}
                    </span>
                  </div>
                  <ul className="text-sm text-red-700 space-y-1 ml-6">
                    {validationResult.errors.slice(0, 5).map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                    {validationResult.errors.length > 5 && (
                      <li className="text-xs">... and {validationResult.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Rejection Reason */}
        {record.status === 'rejected' && record.rejection_reason && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 mb-1">Rejection Reason:</p>
                  <p className="text-sm text-red-700">{record.rejection_reason}</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Reference Number */}
        {record.file_reference && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 mb-1">{language === 'ar' ? 'رقم المرجع' : 'Reference Number'}</p>
            <p className="font-mono font-semibold text-blue-900">{record.file_reference}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {record.status === 'generated' && (
            <>
              <Button
                onClick={handleValidate}
                disabled={validating}
                variant="outline"
                className="flex-1"
              >
                <FileCheck className={`w-4 h-4 mr-2 ${validating ? 'animate-pulse' : ''}`} />
                {language === 'ar' ? 'التحقق' : 'Validate'}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !validationResult?.valid}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Send className={`w-4 h-4 mr-2 ${submitting ? 'animate-pulse' : ''}`} />
                {language === 'ar' ? 'تقديم إلى سند' : 'Submit to SINAD'}
              </Button>
            </>
          )}

          {(record.status === 'submitted' || record.status === 'approved') && (
            <Button
              onClick={handleCheckStatus}
              variant="outline"
              className="flex-1"
            >
              <Clock className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'تحقق من الحالة' : 'Check Status'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}