import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, Users, Mail, Phone, Crown } from "lucide-react";
import { motion } from "framer-motion";

export default function OrgChartNode({ 
  employee, 
  subordinates, 
  onNodeClick, 
  onToggle, 
  isExpanded, 
  level = 0 
}) {
  const hasSubordinates = subordinates && subordinates.length > 0;
  
  // Color schemes based on level
  const levelColors = [
    { bg: 'from-purple-600 to-purple-700', light: 'from-purple-50 to-purple-100', text: 'text-purple-700' },
    { bg: 'from-blue-600 to-blue-700', light: 'from-blue-50 to-blue-100', text: 'text-blue-700' },
    { bg: 'from-emerald-600 to-emerald-700', light: 'from-emerald-50 to-emerald-100', text: 'text-emerald-700' },
    { bg: 'from-amber-600 to-amber-700', light: 'from-amber-50 to-amber-100', text: 'text-amber-700' },
  ];
  
  const colorScheme = levelColors[Math.min(level, levelColors.length - 1)];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <Card 
        className={`
          w-72 border-2 cursor-pointer transition-all duration-300
          hover:shadow-2xl hover:scale-105 hover:border-emerald-400
          ${level === 0 ? 'border-purple-300 shadow-xl' : 'border-slate-200 shadow-lg'}
        `}
        onClick={() => onNodeClick(employee)}
      >
        <CardContent className={`p-5 bg-gradient-to-br ${colorScheme.light}`}>
          {/* Level Indicator */}
          {level === 0 && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg">
                <Crown className="w-3 h-3 mr-1" />
                Top Level
              </Badge>
            </div>
          )}

          {/* Employee Info */}
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
              <AvatarFallback className={`bg-gradient-to-br ${colorScheme.bg} text-white font-bold text-lg`}>
                {employee.first_name?.[0]}{employee.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 text-base leading-tight mb-1">
                {employee.first_name} {employee.last_name}
              </h3>
              <p className={`text-sm font-semibold ${colorScheme.text} mb-1`}>
                {employee.job_title}
              </p>
              <Badge variant="outline" className="text-xs">
                {employee.department || 'No Department'}
              </Badge>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2 mb-4">
            {employee.email && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{employee.email}</span>
              </div>
            )}
            {employee.phone && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span>{employee.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-medium">ID:</span>
              <span>{employee.employee_id}</span>
            </div>
          </div>

          {/* Subordinates Count & Toggle */}
          {hasSubordinates && (
            <div className="pt-3 border-t border-slate-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(employee.id);
                }}
                className={`
                  w-full flex items-center justify-between p-2 rounded-lg
                  transition-all duration-200 hover:bg-white/70
                  ${isExpanded ? 'bg-white/50' : 'bg-transparent'}
                `}
              >
                <div className="flex items-center gap-2">
                  <Users className={`w-4 h-4 ${colorScheme.text}`} />
                  <span className="text-sm font-semibold text-slate-700">
                    {subordinates.length} Direct Report{subordinates.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-slate-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-500" />
                )}
              </button>
            </div>
          )}

          {/* Click to view details hint */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-slate-400 italic">Click for details</span>
          </div>
        </CardContent>
      </Card>

      {/* Connection Indicator */}
      {level > 0 && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-slate-300 to-slate-400" />
      )}
    </motion.div>
  );
}