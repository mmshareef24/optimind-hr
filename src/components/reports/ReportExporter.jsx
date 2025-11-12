import React, { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Download, Mail, FileText, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export default function ReportExporter({ reportType, filters = {}, buttonText = "Export Report", buttonVariant = "outline" }) {
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');

  const exportReportMutation = useMutation({
    mutationFn: async ({ send_email = false, email_to = null }) => {
      const response = await base44.functions.invoke('generatePDFReport', {
        report_type: reportType,
        filters: filters,
        send_email,
        email_to
      });
      return { data: response.data, send_email };
    },
    onSuccess: (result) => {
      if (result.send_email) {
        toast.success('Report sent via email');
        setShowEmailDialog(false);
        setEmailAddress('');
      } else {
        const blob = new Blob([result.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success('Report downloaded');
      }
    },
    onError: () => {
      toast.error('Failed to generate report');
    }
  });

  const handleDownload = () => {
    exportReportMutation.mutate({ send_email: false });
  };

  const handleEmailSubmit = () => {
    if (!emailAddress) {
      toast.error('Please enter an email address');
      return;
    }
    exportReportMutation.mutate({ send_email: true, email_to: emailAddress });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={buttonVariant} disabled={exportReportMutation.isPending}>
            <FileText className="w-4 h-4 mr-2" />
            {exportReportMutation.isPending ? 'Generating...' : buttonText}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowEmailDialog(true)}>
            <Mail className="w-4 h-4 mr-2" />
            Send via Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Report</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Enter the email address where you want to send the report.
            </p>
            
            <div>
              <Label>Email Address *</Label>
              <Input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="recipient@example.com"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEmailSubmit}
              disabled={exportReportMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}