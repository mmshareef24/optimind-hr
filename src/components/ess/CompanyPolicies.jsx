import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Search, Eye, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

export default function CompanyPolicies({ policies, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const categories = {
    hr_policies: { label: 'HR Policies', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    it_policies: { label: 'IT Policies', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    safety_policies: { label: 'Safety Policies', color: 'bg-red-100 text-red-700 border-red-200' },
    code_of_conduct: { label: 'Code of Conduct', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    benefits: { label: 'Benefits', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    leave_policy: { label: 'Leave Policy', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    general: { label: 'General', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    other: { label: 'Other', color: 'bg-pink-100 text-pink-700 border-pink-200' }
  };

  const filteredPolicies = policies.filter(policy =>
    policy.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activePolicies = filteredPolicies.filter(p => p.is_active);

  const handleViewPolicy = (policy) => {
    setSelectedPolicy(policy);
    setShowDetails(true);
  };

  const handleDownloadPolicy = (policy) => {
    if (policy.file_url) {
      window.open(policy.file_url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Company Policies & Documents</h3>
          <p className="text-sm text-slate-600">Access official company policies and procedures</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search policies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : activePolicies.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-2">
              {searchTerm ? 'No policies found matching your search' : 'No policies available'}
            </p>
            <p className="text-sm text-slate-400">Check back later for company policies and documents</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {activePolicies.map((policy) => (
            <Card key={policy.id} className="border border-slate-200 hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 mb-1">{policy.title}</h4>
                    <p className="text-sm text-slate-600 line-clamp-2">{policy.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Badge className={categories[policy.category]?.color || categories.general.color}>
                    {categories[policy.category]?.label || policy.category}
                  </Badge>
                  {policy.version && (
                    <Badge variant="outline" className="text-xs">
                      v{policy.version}
                    </Badge>
                  )}
                  {policy.requires_acknowledgment && (
                    <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700">
                      Requires Acknowledgment
                    </Badge>
                  )}
                </div>

                {policy.effective_date && (
                  <p className="text-xs text-slate-500 mb-4">
                    Effective from: {new Date(policy.effective_date).toLocaleDateString()}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewPolicy(policy)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  {policy.file_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPolicy(policy)}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Policy Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              {selectedPolicy?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedPolicy && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={categories[selectedPolicy.category]?.color || categories.general.color}>
                  {categories[selectedPolicy.category]?.label || selectedPolicy.category}
                </Badge>
                {selectedPolicy.version && (
                  <Badge variant="outline">Version {selectedPolicy.version}</Badge>
                )}
              </div>

              {selectedPolicy.description && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
                  <p className="text-slate-600">{selectedPolicy.description}</p>
                </div>
              )}

              {selectedPolicy.content && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Policy Details</h3>
                  <div className="prose prose-sm max-w-none bg-slate-50 p-4 rounded-lg">
                    <p className="text-slate-700 whitespace-pre-wrap">{selectedPolicy.content}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg text-sm">
                {selectedPolicy.effective_date && (
                  <div>
                    <span className="text-slate-500 block mb-1">Effective Date</span>
                    <span className="font-semibold text-slate-900">
                      {new Date(selectedPolicy.effective_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {selectedPolicy.last_updated && (
                  <div>
                    <span className="text-slate-500 block mb-1">Last Updated</span>
                    <span className="font-semibold text-slate-900">
                      {new Date(selectedPolicy.last_updated).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {selectedPolicy.file_url && (
                <Button
                  onClick={() => handleDownloadPolicy(selectedPolicy)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Full Document
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}