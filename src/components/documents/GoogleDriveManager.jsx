import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { 
  Upload, Search, FileText, Image, File, Trash2, ExternalLink, 
  Loader2, FolderOpen, Download, Eye, HardDrive, RefreshCw, LogOut
} from "lucide-react";
import { toast } from "sonner";

const DOCUMENT_CATEGORIES = [
  { value: 'policies', label: 'Company Policies' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'certificates', label: 'Certificates' },
  { value: 'reports', label: 'Reports' },
  { value: 'templates', label: 'Templates' },
  { value: 'other', label: 'Other' }
];

const getFileIcon = (mimeType) => {
  if (mimeType?.startsWith('image/')) return <Image className="w-8 h-8 text-blue-500" />;
  if (mimeType?.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
  if (mimeType?.includes('document') || mimeType?.includes('word')) return <FileText className="w-8 h-8 text-blue-600" />;
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return <FileText className="w-8 h-8 text-green-600" />;
  return <File className="w-8 h-8 text-slate-500" />;
};

const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

export default function GoogleDriveManager() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('other');
  const [isUploading, setIsUploading] = useState(false);

  // Fetch files from Google Drive
  const { data: driveData, isLoading, refetch } = useQuery({
    queryKey: ['google-drive-files', searchQuery],
    queryFn: async () => {
      const response = await base44.functions.invoke('googleDriveList', {
        folderName: 'HRMS Documents',
        searchQuery: searchQuery || undefined
      });
      return response.data;
    }
  });

  const files = driveData?.files || [];

  // Upload mutation
  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('folderName', 'HRMS Documents');
      formData.append('documentType', uploadCategory);

      const response = await fetch('/api/functions/googleDriveUpload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        toast.success('File uploaded to Google Drive successfully');
        setShowUploadDialog(false);
        setUploadFile(null);
        refetch();
      } else {
        toast.error(result.error || 'Failed to upload file');
      }
    } catch (error) {
      toast.error('Failed to upload file: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId) => {
      const response = await base44.functions.invoke('googleDriveDelete', { fileId });
      return response.data;
    },
    onSuccess: () => {
      toast.success('File deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error('Failed to delete file');
    }
  });

  const handleDelete = (file) => {
    if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      deleteMutation.mutate(file.id);
    }
  };

  const handleSearch = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
            <HardDrive className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Google Drive Documents</h2>
            <p className="text-sm text-slate-500">Manage company documents stored in Google Drive</p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => window.location.href = '/api/connectors/googledrive/authorize?force=true'}
          className="border-slate-300"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Change Account
        </Button>

        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload to Drive
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document to Google Drive</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Category</Label>
                <Select value={uploadCategory} onValueChange={setUploadCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>File</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0])}
                    className="cursor-pointer"
                  />
                </div>
                {uploadFile && (
                  <p className="text-sm text-slate-500 mt-2">
                    Selected: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                  </p>
                )}
              </div>

              <Button 
                onClick={handleUpload} 
                disabled={!uploadFile || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload to Google Drive
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Files Grid */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Documents ({files.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-4">No documents found in Google Drive</p>
              <Button onClick={() => setShowUploadDialog(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload First Document
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <Card key={file.id} className="border hover:shadow-md transition-shadow group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {getFileIcon(file.mimeType)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 truncate" title={file.name}>
                          {file.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatFileSize(file.size)} • {new Date(file.createdTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      {file.webViewLink && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(file.webViewLink, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      )}
                      {file.webContentLink && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(file.webContentLink, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                        onClick={() => handleDelete(file)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}