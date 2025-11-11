import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, CheckCircle, ExternalLink, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";

export default function GOSIUploadInterface({ report, onUploadComplete }) {
  const [submissionRef, setSubmissionRef] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedFile({ name: file.name, url: file_url });
    } catch (err) {
      setError('Failed to upload file: ' + err.message);
    }

    setUploading(false);
  };

  const handleSubmit = () => {
    if (!submissionRef) {
      setError('Please enter GOSI submission reference number');
      return;
    }

    onUploadComplete({
      submission_reference: submissionRef,
      uploaded_file_url: uploadedFile?.url,
      submission_date: new Date().toISOString().split('T')[0],
      status: 'submitted',
      notes
    });
  };

  return (
    <div className="space-y-6">
      {/* GOSI Portal Link */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <ExternalLink className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">GOSI Online Portal</h3>
              <p className="text-sm text-slate-600 mb-3">
                Upload your GOSI report to the official portal and return here to record the submission details.
              </p>
              <Button
                onClick={() => window.open('https://online.gosi.gov.sa', '_blank')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open GOSI Portal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submission Details */}
      <Card className="border-emerald-200">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b">
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-600" />
            Record Submission Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label>GOSI Submission Reference Number *</Label>
              <Input
                value={submissionRef}
                onChange={(e) => setSubmissionRef(e.target.value)}
                placeholder="Enter reference number from GOSI portal"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                This is the reference number provided by GOSI after successful submission
              </p>
            </div>

            <div>
              <Label>Upload Acknowledgment Receipt (Optional)</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-emerald-300 transition-colors">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  id="receipt-upload"
                  disabled={uploading}
                />
                <label htmlFor="receipt-upload" className="cursor-pointer">
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
                      <p className="text-sm text-slate-600">Uploading...</p>
                    </div>
                  ) : uploadedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                      <div className="text-left">
                        <p className="font-semibold text-slate-900">{uploadedFile.name}</p>
                        <p className="text-xs text-slate-500">Click to upload a different file</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm text-slate-600 mb-1">Click to upload acknowledgment receipt</p>
                      <p className="text-xs text-slate-400">PDF, JPG, or PNG</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this submission..."
                rows={3}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submission Checklist</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-emerald-600">1</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">Download the generated GOSI report</p>
                <p className="text-sm text-slate-500">Export the report in the required format</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-emerald-600">2</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">Login to GOSI Online Portal</p>
                <p className="text-sm text-slate-500">Use your establishment credentials</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-emerald-600">3</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">Upload the report to GOSI</p>
                <p className="text-sm text-slate-500">Follow the portal's upload process</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-emerald-600">4</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">Record the submission details here</p>
                <p className="text-sm text-slate-500">Enter the reference number and upload acknowledgment</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!submissionRef}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Confirm Submission
        </Button>
      </div>
    </div>
  );
}