import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function DocumentUploadForm({ open, onOpenChange, onSuccess, employees }) {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    document_type: "other",
    document_name: "",
    notes: "",
    issue_date: "",
    expiry_date: ""
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setSelectedFile(file);
      if (!formData.document_name) {
        setFormData(prev => ({ ...prev, document_name: file.name }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!formData.document_name) {
      toast.error("Please enter a document name");
      return;
    }

    setUploading(true);

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });

      // Create document record
      await base44.entities.Document.create({
        ...formData,
        file_url,
        status: "active"
      });

      toast.success("Document uploaded successfully");
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        employee_id: "",
        document_type: "other",
        document_name: "",
        notes: "",
        issue_date: "",
        expiry_date: ""
      });
      setSelectedFile(null);
    } catch (error) {
      toast.error("Failed to upload document");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Employee (Optional)</Label>
            <Select 
              value={formData.employee_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee or leave blank for company document" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Company Document (No Employee)</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} - {emp.employee_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Document Type *</Label>
            <Select 
              value={formData.document_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, document_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="id_copy">ID Copy</SelectItem>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="certificate">Certificate</SelectItem>
                <SelectItem value="visa">Visa</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="policy">Policy</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Document Name *</Label>
            <Input
              value={formData.document_name}
              onChange={(e) => setFormData(prev => ({ ...prev, document_name: e.target.value }))}
              placeholder="e.g., Employment Contract 2024"
              required
            />
          </div>

          <div>
            <Label>File * (PDF, JPG, PNG - Max 5MB)</Label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              required
            />
            {selectedFile && (
              <p className="text-sm text-emerald-600 mt-1">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Issue Date</Label>
              <Input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional information..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={uploading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}