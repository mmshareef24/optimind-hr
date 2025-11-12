import React, { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Download, Mail, FileText, Send } from "lucide-react";
import { toast } from "sonner";

export default function GOSIReportExporter({ month, companyId = null }) {
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateGOSIReport', {
        month,
        company_id: companyId
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Download the text report
      const blob = new Blob([data.report_text], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GOSI-Report-${month}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('GOSI report downloaded');
    },
    onError: () => {
      toast.error('Failed to generate GOSI report');
    }
  });

  const generatePDFMutation = useMutation({
    mutationFn: async ({ send_email = false }) => {
      const response = await base44.functions.invoke('generatePDFReport', {
        report_type: 'gosi',
        filters: { month, company_id: companyId },
        send_email,
        email_to: emailAddress
      });
      return { data: response.data, send_email };
    },
    onSuccess: (result) => {
      if (result.send_email) {
        toast.success('GOSI report sent via email');
        setShowEmailDialog(false);
        setEmailAddress('');
      } else {
        const blob = new Blob([result.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GOSI-Report-${month}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success('GOSI PDF report downloaded');
      }
    },
    onError: () => {
      toast.error('Failed to generate PDF report');
    }
  });

  const handleEmailSubmit = () => {
    if (!emailAddress) {
      toast.error('Please enter an email address');
      return;
    }
    generatePDFMutation.mutate({ send_email: true });
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => generateReportMutation.mutate()}
        disabled={generateReportMutation.isPending}
        variant="outline"
      >
        <FileText className="w-4 h-4 mr-2" />
        {generateReportMutation.isPending ? 'Generating...' : 'Text Report'}
      </Button>
      
      <Button
        onClick={() => generatePDFMutation.mutate({ send_email: false })}
        disabled={generatePDFMutation.isPending}
        variant="outline"
      >
        <Download className="w-4 h-4 mr-2" />
        {generatePDFMutation.isPending ? 'Generating...' : 'PDF Report'}
      </Button>

      <Button
        onClick={() => setShowEmailDialog(true)}
        variant="outline"
      >
        <Mail className="w-4 h-4 mr-2" />
        Email Report
      </Button>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email GOSI Report</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              The GOSI report for <strong>{month}</strong> will be sent as a PDF attachment.
            </p>
            
            <div>
              <Label>Recipient Email Address *</Label>
              <Input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="finance@company.sa"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEmailSubmit}
              disabled={generatePDFMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}