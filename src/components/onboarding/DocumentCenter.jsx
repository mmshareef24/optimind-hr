import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { FileText, Upload, Check, X, Pen, Eye } from "lucide-react";
import { format } from "date-fns";

export default function DocumentCenter({ 
  documents, 
  tasks, 
  currentUser, 
  userRole,
  onUploadDocument, 
  onSignDocument, 
  onApproveDocument, 
  onRejectDocument 
}) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [signatureText, setSignatureText] = useState('');
  const [uploadData, setUploadData] = useState({
    document_name: '',
    document_type: 'other',
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const statusColors = {
    pending: 'bg-slate-100 text-slate-700',
    submitted: 'bg-blue-100 text-blue-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700'
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    await onUploadDocument(selectedFile, {
      ...uploadData,
      employee_id: currentUser.id,
      status: 'submitted'
    });
    
    setShowUploadDialog(false);
    setUploadData({ document_name: '', document_type: 'other', notes: '' });
    setSelectedFile(null);
  };

  const handleSign = () => {
    if (!signatureText.trim()) return;
    onSignDocument(selectedDocument.id, signatureText);
    setShowSignDialog(false);
    setSignatureText('');
    setSelectedDocument(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload Button */}
      {userRole !== 'admin' && (
        <div className="flex justify-end">
          <Button
            onClick={() => setShowUploadDialog(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>
      )}

      {/* Documents List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No documents yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <Card key={doc.id} className="border border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-purple-600" />
                          <h4 className="font-semibold text-slate-900">{doc.document_name}</h4>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge className={statusColors[doc.status]}>
                            {doc.status}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {doc.document_type.replace(/_/g, ' ')}
                          </Badge>
                          {doc.requires_signature && !doc.is_signed && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700">
                              Signature Required
                            </Badge>
                          )}
                          {doc.is_signed && (
                            <Badge className="bg-emerald-100 text-emerald-700">
                              <Check className="w-3 h-3 mr-1" />
                              Signed
                            </Badge>
                          )}
                        </div>

                        {doc.notes && (
                          <p className="text-sm text-slate-600 mb-2">{doc.notes}</p>
                        )}

                        <div className="text-xs text-slate-500">
                          {doc.uploaded_date && `Uploaded: ${format(new Date(doc.uploaded_date), 'MMM dd, yyyy')}`}
                          {doc.reviewed_date && ` • Reviewed: ${format(new Date(doc.reviewed_date), 'MMM dd, yyyy')}`}
                        </div>

                        {doc.status === 'rejected' && doc.rejection_reason && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                            <strong>Rejection reason:</strong> {doc.rejection_reason}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        {doc.file_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(doc.file_url, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {doc.requires_signature && !doc.is_signed && doc.employee_id === currentUser?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setShowSignDialog(true);
                            }}
                          >
                            <Pen className="w-4 h-4 mr-2" />
                            Sign
                          </Button>
                        )}
                        {userRole === 'admin' && doc.status === 'submitted' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => onApproveDocument(doc.id)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const reason = prompt('Rejection reason:');
                                if (reason) onRejectDocument(doc.id, reason);
                              }}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Document Name *</Label>
              <Input
                value={uploadData.document_name}
                onChange={(e) => setUploadData({ ...uploadData, document_name: e.target.value })}
                placeholder="e.g., National ID Copy"
              />
            </div>

            <div>
              <Label>Document Type *</Label>
              <Select
                value={uploadData.document_type}
                onValueChange={(val) => setUploadData({ ...uploadData, document_type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id_proof">ID Proof</SelectItem>
                  <SelectItem value="educational_certificate">Educational Certificate</SelectItem>
                  <SelectItem value="experience_letter">Experience Letter</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="nda">NDA</SelectItem>
                  <SelectItem value="policy_acknowledgment">Policy Acknowledgment</SelectItem>
                  <SelectItem value="bank_details">Bank Details</SelectItem>
                  <SelectItem value="emergency_contact">Emergency Contact</SelectItem>
                  <SelectItem value="medical_certificate">Medical Certificate</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>File *</Label>
              <Input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={uploadData.notes}
                onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                placeholder="Additional notes"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || !uploadData.document_name}>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign Dialog */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>E-Sign Document</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              By typing your full name below, you agree to electronically sign this document.
            </p>

            <div>
              <Label>Type your full name *</Label>
              <Input
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="p-4 border-2 border-dashed rounded-lg text-center">
              <p className="font-handwriting text-2xl text-slate-700">
                {signatureText || 'Your signature will appear here'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSign} disabled={!signatureText.trim()}>
              <Pen className="w-4 h-4 mr-2" />
              Sign Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}