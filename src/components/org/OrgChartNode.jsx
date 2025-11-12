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
    0: { gradient: 'from-purple-600 to-purple-700', shadow: 'shadow-2xl', scale: 'scale-110', ring: 'ring-4 ring-purple-200' }, // CEO/Top level
    1: { gradient: 'from-blue-600 to-blue-700', shadow: 'shadow-xl', scale: '', ring: 'ring-2 ring-blue-200' }, // Senior management
    2: { gradient: 'from-emerald-600 to-emerald-700', shadow: 'shadow-lg', scale: '', ring: 'ring-2 ring-emerald-200' }, // Middle management
    3: { gradient: 'from-slate-600 to-slate-700', shadow: 'shadow-md', scale: '', ring: 'ring-1 ring-slate-200' } // Staff
  };

  const cardStyle = level <= 3 ? levelStyles[level] : levelStyles[3];
  const gradientClass = cardStyle.gradient;

  return (
    <div className="relative">
      <Card 
        className={`
          relative overflow-hidden border-0 hover:shadow-2xl 
          transition-all duration-300 cursor-pointer group
          ${cardStyle.shadow} ${cardStyle.scale} ${cardStyle.ring}
          ${level === 0 ? 'w-80' : level === 1 ? 'w-76' : 'w-72'}
        `}
        onClick={() => onNodeClick(employee)}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br opacity-5 pointer-events-none">
          <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass}`}></div>
        </div>

        {/* Top colored bar with pattern */}
        <div className={`h-3 bg-gradient-to-r ${gradientClass} relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-20 bg-white" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)'
          }}></div>
        </div>

        <CardContent className="p-5 relative">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar className={`${level === 0 ? 'w-20 h-20' : 'w-16 h-16'} border-4 border-white shadow-xl ring-2 ring-${level === 0 ? 'purple' : level === 1 ? 'blue' : level === 2 ? 'emerald' : 'slate'}-100`}>
                <AvatarImage src={employee.profile_picture} />
                <AvatarFallback className={`bg-gradient-to-br ${gradientClass} text-white font-bold ${level === 0 ? 'text-2xl' : 'text-lg'}`}>
                  {employee.first_name?.[0]}{employee.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              
              {/* Level indicator badge (top-left) */}
              {level === 0 && (
                <div className="absolute -top-1 -left-1 bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white">
                  👑
                </div>
              )}
              
              {/* Subordinate count badge */}
              {hasSubordinates && (
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-full w-9 h-9 flex items-center justify-center text-xs font-bold shadow-lg border-3 border-white">
                  {subordinates.length}
                </div>
              )}
            </div>

            {/* Employee info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-bold text-slate-900 ${level === 0 ? 'text-xl' : 'text-base'} truncate group-hover:text-emerald-600 transition-colors flex-1`}>
                  {employee.first_name} {employee.last_name}
                </h3>
                {level <= 1 && (
                  <div className={`px-2 py-0.5 rounded text-xs font-bold ${
                    level === 0 ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    L{level + 1}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <p className={`${level === 0 ? 'text-base' : 'text-sm'} font-medium text-slate-700 truncate`}>
                  {employee.job_title}
                </p>
              </div>

              <Badge 
                variant="outline" 
                className={`text-xs mb-2 ${
                  level === 0 ? 'border-purple-200 bg-purple-50 text-purple-700' :
                  level === 1 ? 'border-blue-200 bg-blue-50 text-blue-700' :
                  level === 2 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                  'border-slate-200 bg-slate-50 text-slate-700'
                }`}
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
              className={`w-full mt-3 border-2 transition-all ${
                isExpanded 
                  ? `bg-${level === 0 ? 'purple' : level === 1 ? 'blue' : 'emerald'}-50 border-${level === 0 ? 'purple' : level === 1 ? 'blue' : 'emerald'}-200 hover:bg-${level === 0 ? 'purple' : level === 1 ? 'blue' : 'emerald'}-100`
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
              }`}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Collapse ({subordinates.length})
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Expand {subordinates.length} Report{subordinates.length === 1 ? '' : 's'}
                </>
              )}
            </Button>
          )}
        </CardContent>

        {/* Hover effect overlay */}
        <div className={`absolute inset-0 border-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none ${
          level === 0 ? 'border-purple-500' :
          level === 1 ? 'border-blue-500' :
          level === 2 ? 'border-emerald-500' :
          'border-slate-500'
        }`}></div>
      </Card>
    </div>
  );
}