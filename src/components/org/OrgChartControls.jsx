import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, ZoomIn, ZoomOut, Maximize, Grid, List, Users,
  Download, RefreshCw
} from "lucide-react";

export default function OrgChartControls({ 
  searchTerm, 
  onSearchChange, 
  viewMode,
  onViewModeChange,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onRefresh,
  onExport
}) {
  return (
    <Card className="border-0 shadow-lg mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange('chart')}
                className={viewMode === 'chart' ? 'bg-emerald-50 text-emerald-600' : ''}
              >
                <Grid className="w-4 h-4 mr-2" />
                Chart
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange('list')}
                className={viewMode === 'list' ? 'bg-emerald-50 text-emerald-600' : ''}
              >
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
            </div>

            {/* Zoom Controls */}
            {viewMode === 'chart' && (
              <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onZoomOut}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onZoomIn}
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onFitToScreen}
                  title="Fit to Screen"
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              title="Export Org Chart"
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