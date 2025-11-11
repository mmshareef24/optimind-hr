import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Search, Eye, BookOpen, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import { Filter } from "lucide-react";

export default function CompanyPolicies({ policies, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all'
  });

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

  // Apply filters
  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = 
      policy.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filters.category === 'all' || policy.category === filters.category;
    const matchesStatus = 
      filters.status === 'all' || 
      (filters.status === 'active' && policy.is_active === true) ||
      (filters.status === 'inactive' && policy.is_active === false);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const clearFilters = () => {
    setFilters({
      category: 'all',
      status: 'all'
    });
  };

  const hasActiveFilters = Object.values(filters).some(f => f !== 'all');

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
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Company Policies & Documents</h3>
          <p className="text-sm text-slate-600">Access official company policies and procedures</p>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-600 rounded-full" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Filter Policies</h3>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Category Filter */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Category</label>
                    <Select
                      value={filters.category}
                      onValueChange={(val) => setFilters({ ...filters, category: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {Object.entries(categories).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Status</label>
                    <Select
                      value={filters.status}
                      onValueChange={(val) => setFilters({ ...filters, status: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filters.category !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Category: {categories[filters.category]?.label}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setFilters({ ...filters, category: 'all' })}
                />
              </Badge>
            )}
            {filters.status !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Status: {filters.status === 'active' ? 'Active' : 'Inactive'}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setFilters({ ...filters, status: 'all' })}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="text-sm text-slate-600">
          Showing <strong>{filteredPolicies.length}</strong> of <strong>{policies.length}</strong> policies
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : filteredPolicies.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-2">
              {hasActiveFilters || searchTerm ? 'No policies match the selected filters' : 'No policies available'}
            </p>
            {(hasActiveFilters || searchTerm) && (
              <Button variant="outline" onClick={() => {
                clearFilters();
                setSearchTerm('');
              }}>
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredPolicies.map((policy) => (
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
                  <Badge className={policy.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                    {policy.is_active ? 'Active' : 'Inactive'}
                  </Badge>
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
                <Badge className={selectedPolicy.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                  {selectedPolicy.is_active ? 'Active' : 'Inactive'}
                </Badge>
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