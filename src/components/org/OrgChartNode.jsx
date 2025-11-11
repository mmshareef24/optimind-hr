import React from 'react';
import { Users, Mail, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function OrgChartNode({ employee, subordinates, onNodeClick, onToggle, isExpanded, level = 0 }) {
  const hasSubordinates = subordinates && subordinates.length > 0;
  
  const getColorByLevel = (level) => {
    const colors = [
      'from-purple-500 to-purple-600',
      'from-blue-500 to-blue-600',
      'from-emerald-500 to-emerald-600',
      'from-amber-500 to-amber-600',
      'from-pink-500 to-pink-600'
    ];
    return colors[level % colors.length];
  };

  const getBorderColor = (level) => {
    const colors = [
      'border-purple-200',
      'border-blue-200',
      'border-emerald-200',
      'border-amber-200',
      'border-pink-200'
    ];
    return colors[level % colors.length];
  };

  return (
    <div className="flex flex-col items-center">
      <Card 
        className={`w-64 border-2 ${getBorderColor(level)} hover:shadow-xl transition-all duration-300 cursor-pointer group relative`}
        onClick={() => onNodeClick(employee)}
      >
        <CardContent className="p-4">
          {/* Avatar and Basic Info */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="w-14 h-14 border-2 border-white shadow-lg">
              <AvatarFallback className={`bg-gradient-to-br ${getColorByLevel(level)} text-white font-bold text-lg`}>
                {employee.first_name?.[0]}{employee.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-emerald-600 transition-colors">
                {employee.first_name} {employee.last_name}
              </h3>
              <p className="text-xs text-slate-600 truncate">{employee.job_title}</p>
              <Badge variant="outline" className="text-xs mt-1">
                {employee.department || 'No Dept'}
              </Badge>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-1 text-xs">
            {employee.email && (
              <div className="flex items-center gap-2 text-slate-600 truncate">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{employee.email}</span>
              </div>
            )}
            {employee.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span>{employee.phone}</span>
              </div>
            )}
          </div>

          {/* Subordinates Count */}
          {hasSubordinates && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Users className="w-3 h-3" />
                  <span>{subordinates.length} Direct Report{subordinates.length !== 1 ? 's' : ''}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(employee.id);
                  }}
                  className="p-1 hover:bg-slate-100 rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              </div>
            </div>
          )}
        </CardContent>

        {/* Level Indicator */}
        <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br ${getColorByLevel(level)} flex items-center justify-center shadow-lg`}>
          <span className="text-white font-bold text-xs">L{level + 1}</span>
        </div>
      </Card>

      {/* Connection Line to Subordinates */}
      {hasSubordinates && isExpanded && (
        <div className="w-0.5 h-8 bg-gradient-to-b from-slate-300 to-slate-200" />
      )}
    </div>
  );
}