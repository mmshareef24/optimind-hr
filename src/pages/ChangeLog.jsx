import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, Search, Filter, Edit, Trash2, Plus, Shield, Calendar, User
} from "lucide-react";
import { format } from "date-fns";

export default function ChangeLogPage() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEntity, setFilterEntity] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const { data: user } = useQuery({
    queryKey: ['current-user-changelog'],
    queryFn: () => base44.auth.me()
  });

  const { data: changeLogs = [], isLoading } = useQuery({
    queryKey: ['change-logs'],
    queryFn: () => base44.entities.ChangeLog.list('-created_date', 100),
    enabled: user?.role === 'admin'
  });

  const filteredLogs = changeLogs.filter(log => {
    const matchesSearch = searchTerm === "" || 
      log.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.changed_by_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEntity = filterEntity === "all" || log.entity_name === filterEntity;
    const matchesType = filterType === "all" || log.change_type === filterType;
    
    return matchesSearch && matchesEntity && matchesType;
  });

  const uniqueEntities = [...new Set(changeLogs.map(log => log.entity_name))];

  const getChangeTypeColor = (type) => {
    const colors = {
      create: 'bg-emerald-100 text-emerald-700',
      update: 'bg-blue-100 text-blue-700',
      delete: 'bg-red-100 text-red-700'
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  const getChangeTypeIcon = (type) => {
    const icons = {
      create: Plus,
      update: Edit,
      delete: Trash2
    };
    const Icon = icons[type] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6 lg:p-8">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Access Denied
            </h2>
            <p className="text-slate-600">
              Only administrators can view system change logs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            System Change Log
          </h1>
          <p className="text-slate-600">
            Track all changes made across the system for audit and compliance
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <FileText className="w-5 h-5 mr-2" />
          {filteredLogs.length} Records
        </Badge>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400`} />
              <Input
                placeholder="Search changes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${isRTL ? 'pr-10' : 'pl-10'}`}
              />
            </div>
            <Select value={filterEntity} onValueChange={setFilterEntity}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {uniqueEntities.map(entity => (
                  <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Change Logs */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">
                {searchTerm || filterEntity !== "all" || filterType !== "all" 
                  ? "No change logs match your filters" 
                  : "No change logs yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <Card key={log.id} className="border border-slate-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className={`flex items-start justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-start gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center`}>
                          {getChangeTypeIcon(log.change_type)}
                        </div>
                        <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                          <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                            <h3 className="font-semibold text-slate-900">
                              {log.summary}
                            </h3>
                            <Badge className={getChangeTypeColor(log.change_type)}>
                              {log.change_type}
                            </Badge>
                          </div>
                          <div className={`flex items-center gap-4 text-sm text-slate-600 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                            <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <FileText className="w-4 h-4" />
                              <span>{log.entity_name}</span>
                            </div>
                            <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <User className="w-4 h-4" />
                              <span>{log.changed_by_name}</span>
                            </div>
                            <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <Calendar className="w-4 h-4" />
                              <span>{format(new Date(log.created_date), 'MMM d, yyyy h:mm a')}</span>
                            </div>
                          </div>
                          {log.notes && (
                            <p className="text-sm text-slate-500 mt-2">
                              {log.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}