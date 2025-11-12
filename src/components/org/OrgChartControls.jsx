import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, ZoomIn, ZoomOut, Maximize, Grid, List, 
  Download, RefreshCw, Expand, Minimize, Building2
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function OrgChartControls({ 
  searchTerm, 
  onSearchChange, 
  viewMode,
  onViewModeChange,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onRefresh,
  onExport,
  onExpandAll,
  onCollapseAll,
  departments = [],
  companies = [],
  selectedCompany = 'all',
  onCompanyChange
}) {
  return (
    <Card className="border-0 shadow-lg mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search and Filter */}
          <div className="flex-1 w-full lg:max-w-3xl flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search employees by name, title, or department..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {companies.length > 0 && (
              <Select value={selectedCompany} onValueChange={onCompanyChange}>
                <SelectTrigger className="w-52">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {selectedCompany === 'all' ? 'All Companies' : companies.find(c => c.id === selectedCompany)?.name_en}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      All Companies
                    </div>
                  </SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {company.name_en}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {departments.length > 0 && (
              <Select onValueChange={(value) => onSearchChange(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange('chart')}
                className={`rounded-none ${viewMode === 'chart' ? 'bg-emerald-50 text-emerald-600' : ''}`}
              >
                <Grid className="w-4 h-4 mr-2" />
                Chart
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange('list')}
                className={`rounded-none border-l ${viewMode === 'list' ? 'bg-emerald-50 text-emerald-600' : ''}`}
              >
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
            </div>

            {/* Chart Controls (only in chart view) */}
            {viewMode === 'chart' && (
              <>
                <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onExpandAll}
                    title="Expand All"
                    className="rounded-none"
                  >
                    <Expand className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCollapseAll}
                    title="Collapse All"
                    className="rounded-none border-l"
                  >
                    <Minimize className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onZoomOut}
                    title="Zoom Out"
                    className="rounded-none"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onZoomIn}
                    title="Zoom In"
                    className="rounded-none border-l"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onFitToScreen}
                    title="Fit to Screen"
                    className="rounded-none border-l"
                  >
                    <Maximize className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              title="Refresh"
              className="border-slate-200"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              title="Export Org Chart"
              className="border-slate-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}