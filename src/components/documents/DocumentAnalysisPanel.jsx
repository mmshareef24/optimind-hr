import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Tag, AlertTriangle, Calendar, Shield } from 'lucide-react';

export default function DocumentAnalysisPanel({ analysis }) {
  if (!analysis) return null;

  const priorityColors = {
    low: 'bg-slate-100 text-slate-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700'
  };

  const complianceColors = {
    legal: 'bg-purple-100 text-purple-700',
    hr: 'bg-blue-100 text-blue-700',
    finance: 'bg-emerald-100 text-emerald-700',
    operational: 'bg-slate-100 text-slate-700'
  };

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          AI Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-slate-500 mb-1">Description</p>
          <p className="text-sm text-slate-700">{analysis.description}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs text-slate-500">Tags:</p>
          {analysis.tags.map((tag, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-slate-500 mb-1">Priority</p>
            <Badge className={priorityColors[analysis.priority]}>
              <AlertTriangle className="w-3 h-3 mr-1" />
              {analysis.priority.toUpperCase()}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Category</p>
            <Badge className={complianceColors[analysis.compliance_category]}>
              <Shield className="w-3 h-3 mr-1" />
              {analysis.compliance_category}
            </Badge>
          </div>
        </div>

        {analysis.has_expiry && (
          <div className="pt-2 border-t border-emerald-100">
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-3 h-3 text-amber-600" />
              <span className="text-amber-700 font-medium">
                Typical validity: {analysis.typical_validity_months} months
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}