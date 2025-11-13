import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, ChevronDown, ChevronRight, Users } from "lucide-react";
import { useTranslation } from '@/components/TranslationContext';

export default function PositionHierarchyChart({ positions, employees, onPositionClick }) {
  const { language } = useTranslation();
  const isRTL = language === 'ar';
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  const toggleNode = (positionId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(positionId)) {
      newExpanded.delete(positionId);
    } else {
      newExpanded.add(positionId);
    }
    setExpandedNodes(newExpanded);
  };

  const getSubordinatePositions = (positionId) => {
    return positions.filter(p => p.reports_to_position_id === positionId);
  };

  const getEmployeesInPosition = (positionId) => {
    return employees.filter(e => e.position_id === positionId);
  };

  const renderPositionNode = (position, level = 0) => {
    const subordinates = getSubordinatePositions(position.id);
    const positionEmployees = getEmployeesInPosition(position.id);
    const isExpanded = expandedNodes.has(position.id);
    const hasChildren = subordinates.length > 0;

    const levelColors = {
      1: 'from-purple-500 to-purple-600',
      2: 'from-blue-500 to-blue-600',
      3: 'from-emerald-500 to-emerald-600',
      4: 'from-teal-500 to-teal-600',
      5: 'from-cyan-500 to-cyan-600',
      6: 'from-slate-500 to-slate-600',
      7: 'from-gray-500 to-gray-600'
    };

    return (
      <div key={position.id} className="relative">
        <div className={`flex items-start gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ marginLeft: isRTL ? 0 : `${level * 30}px`, marginRight: isRTL ? `${level * 30}px` : 0 }}>
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleNode(position.id)}
              className="p-1 h-8 w-8"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          )}
          
          <Card 
            className="flex-1 border-2 border-slate-200 hover:shadow-lg transition-all cursor-pointer hover:border-emerald-400"
            onClick={() => onPositionClick(position)}
          >
            <CardContent className="p-4">
              <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${levelColors[position.level] || levelColors[6]} flex items-center justify-center shadow-lg`}>
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                  <h4 className="font-bold text-slate-900">{position.position_title}</h4>
                  {position.position_title_ar && (
                    <p className="text-sm text-slate-600">{position.position_title_ar}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{position.department}</Badge>
                    <Badge variant="outline" className="text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      {positionEmployees.length}/{position.headcount_allocated}
                    </Badge>
                    {position.is_managerial && (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                        Managerial
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {subordinates.map(subPos => renderPositionNode(subPos, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootPositions = positions.filter(p => !p.reports_to_position_id || !positions.find(pos => pos.id === p.reports_to_position_id));

  return (
    <div className="space-y-4">
      {rootPositions.map(pos => renderPositionNode(pos, 0))}
    </div>
  );
}