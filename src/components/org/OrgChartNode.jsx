import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Users, Mail, Phone, Briefcase } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function OrgChartNode({ 
  employee, 
  subordinates, 
  onNodeClick, 
  onToggle, 
  isExpanded,
  level = 0 
}) {
  const hasSubordinates = subordinates && subordinates.length > 0;
  
  // Different styling based on hierarchy level
  const levelStyles = {
    0: 'from-purple-600 to-purple-700 shadow-2xl scale-110', // CEO/Top level
    1: 'from-blue-600 to-blue-700 shadow-xl', // Senior management
    2: 'from-emerald-600 to-emerald-700 shadow-lg', // Middle management
    3: 'from-slate-600 to-slate-700 shadow-md' // Staff
  };

  const cardStyle = level <= 3 ? levelStyles[level] : levelStyles[3];

  return (
    <div className="relative">
      <Card 
        className={`
          relative overflow-hidden border-0 shadow-xl hover:shadow-2xl 
          transition-all duration-300 cursor-pointer group
          ${level === 0 ? 'w-80' : 'w-72'}
        `}
        onClick={() => onNodeClick(employee)}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br opacity-5 pointer-events-none">
          <div className={`absolute inset-0 bg-gradient-to-br ${cardStyle}`}></div>
        </div>

        {/* Top colored bar */}
        <div className={`h-2 bg-gradient-to-r ${cardStyle}`}></div>

        <CardContent className="p-5 relative">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar className={`${level === 0 ? 'w-20 h-20' : 'w-16 h-16'} border-4 border-white shadow-lg ring-2 ring-slate-100`}>
                <AvatarImage src={employee.profile_picture} />
                <AvatarFallback className={`bg-gradient-to-br ${cardStyle} text-white font-bold text-lg`}>
                  {employee.first_name?.[0]}{employee.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              
              {/* Subordinate count badge */}
              {hasSubordinates && (
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white">
                  {subordinates.length}
                </div>
              )}
            </div>

            {/* Employee info */}
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-slate-900 mb-1 ${level === 0 ? 'text-xl' : 'text-base'} truncate group-hover:text-emerald-600 transition-colors`}>
                {employee.first_name} {employee.last_name}
              </h3>
              
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <p className="text-sm font-medium text-slate-600 truncate">
                  {employee.job_title}
                </p>
              </div>

              <Badge 
                variant="outline" 
                className="text-xs border-emerald-200 bg-emerald-50 text-emerald-700 mb-2"
              >
                {employee.department || 'No Department'}
              </Badge>

              {/* Contact info - shown on hover */}
              <div className="space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {employee.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="w-3 h-3" />
                    <span>{employee.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Employee stats */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {hasSubordinates ? `${subordinates.length} Report${subordinates.length === 1 ? '' : 's'}` : 'No Reports'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Badge 
                className={
                  employee.status === 'active' ? 'bg-emerald-100 text-emerald-700 text-xs' :
                  employee.status === 'on_leave' ? 'bg-amber-100 text-amber-700 text-xs' :
                  'bg-slate-100 text-slate-700 text-xs'
                }
              >
                {employee.status}
              </Badge>
            </div>
          </div>

          {/* Expand/Collapse button */}
          {hasSubordinates && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(employee.id);
              }}
              variant="ghost"
              size="sm"
              className="w-full mt-3 bg-slate-50 hover:bg-slate-100 border border-slate-200"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Hide {subordinates.length} Report{subordinates.length === 1 ? '' : 's'}
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show {subordinates.length} Report{subordinates.length === 1 ? '' : 's'}
                </>
              )}
            </Button>
          )}
        </CardContent>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 border-2 border-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none"></div>
      </Card>
    </div>
  );
}