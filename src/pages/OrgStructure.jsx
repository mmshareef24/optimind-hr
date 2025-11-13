
import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { Network, Users, TrendingUp, Layers, Building2, Crown, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrgChart from "../components/org/OrgChart";
import OrgListView from "../components/org/OrgListView";
import OrgChartControls from "../components/org/OrgChartControls";
import EmployeeDetailsModal from "../components/org/EmployeeDetailsModal";
import ManageReportingModal from "../components/org/ManageReportingModal";
import StatCard from "../components/hrms/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function OrgStructure() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReportingModal, setShowReportingModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('chart');
  const [zoomLevel, setZoomLevel] = useState(1);
  const chartRef = useRef(null);
  const [allExpanded, setAllExpanded] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [viewType, setViewType] = useState('unified'); // 'unified' or 'by-company'

  const queryClient = useQueryClient();

  const { data: employees = [], isLoading, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      setShowReportingModal(false);
      toast.success('Reporting relationship updated successfully');
    },
    onError: () => {
      toast.error('Failed to update reporting relationship');
    }
  });

  // Filter employees by company
  const companyFilteredEmployees = selectedCompany === 'all' 
    ? employees 
    : employees.filter(e => e.company_id === selectedCompany);

  // Get unique departments
  const departments = [...new Set(companyFilteredEmployees.map(e => e.department).filter(Boolean))];

  // Filter employees based on search
  const filteredEmployees = companyFilteredEmployees.filter(emp => {
    const searchLower = searchTerm.toLowerCase();
    return (
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchLower) ||
      emp.job_title?.toLowerCase().includes(searchLower) ||
      emp.department?.toLowerCase().includes(searchLower) ||
      emp.email?.toLowerCase().includes(searchLower)
    );
  });

  // Get CEO (employee with no manager)
  const ceo = employees.find(e => !e.manager_id || !employees.find(emp => emp.id === e.manager_id));
  
  // Get company structure
  const getCompanyStructure = (companyId) => {
    const companyEmployees = employees.filter(e => e.company_id === companyId);
    const companyHead = companyEmployees.find(e => e.manager_id === ceo?.id);
    return { companyHead, employeeCount: companyEmployees.length };
  };

  // Get employee's manager
  const getManager = (employee) => {
    return employees.find(e => e.id === employee?.manager_id);
  };

  // Get employee's subordinates
  const getSubordinates = (employeeId) => {
    return employees.filter(e => e.manager_id === employeeId);
  };

  // Handle node click
  const handleNodeClick = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);
  };

  // Handle manage reporting
  const handleManageReporting = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(false);
    setShowReportingModal(true);
  };

  // Save reporting relationship
  const handleSaveReporting = (employeeId, managerId) => {
    const employee = employees.find(e => e.id === employeeId);
    updateEmployeeMutation.mutate({
      id: employeeId,
      data: {
        ...employee,
        manager_id: managerId
      }
    });
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleFitToScreen = () => {
    setZoomLevel(1);
  };

  // Expand/Collapse all
  const handleExpandAll = () => {
    setAllExpanded(true);
    // Trigger re-render of org chart
    setTimeout(() => setAllExpanded(false), 100);
  };

  const handleCollapseAll = () => {
    setAllExpanded(false);
    // Trigger re-render of org chart
    refetch();
  };

  // Export org chart
  const handleExport = () => {
    const generateTextChart = (employee, level = 0) => {
      const indent = '  '.repeat(level);
      const subordinates = getSubordinates(employee.id);
      let text = `${indent}├─ ${employee.first_name} ${employee.last_name} - ${employee.job_title} (${employee.department || 'No Dept'})\n`;
      subordinates.forEach((sub, idx) => {
        const isLast = idx === subordinates.length - 1;
        const prefix = isLast ? '└─' : '├─';
        text += generateTextChart(sub, level + 1);
      });
      return text;
    };

    const roots = employees.filter(emp => !emp.manager_id || !employees.find(e => e.id === emp.manager_id));
    let chartText = '═══════════════════════════════════════\n';
    chartText += '     ORGANIZATIONAL STRUCTURE\n';
    chartText += '═══════════════════════════════════════\n\n';
    
    roots.forEach(root => {
      chartText += `${root.first_name} ${root.last_name} - ${root.job_title}\n`;
      chartText += `${root.department || 'No Department'}\n`;
      chartText += '─'.repeat(40) + '\n';
      const subordinates = getSubordinates(root.id);
      subordinates.forEach(sub => {
        chartText += generateTextChart(sub, 0);
      });
      chartText += '\n';
    });

    chartText += '\n═══════════════════════════════════════\n';
    chartText += `Total Employees: ${employees.length}\n`;
    chartText += `Departments: ${departments.length}\n`;
    chartText += `Generated: ${new Date().toLocaleString()}\n`;
    chartText += '═══════════════════════════════════════\n';

    const blob = new Blob([chartText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `org-structure-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Organization structure exported successfully');
  };

  // Calculate statistics
  const totalEmployees = companyFilteredEmployees.length;
  const managers = new Set(companyFilteredEmployees.map(e => e.manager_id).filter(Boolean)).size;
  const topLevel = companyFilteredEmployees.filter(e => !e.manager_id || !employees.find(emp => emp.id === e.manager_id)).length;
  const avgTeamSize = managers > 0 ? (totalEmployees / managers).toFixed(1) : 0;
  
  // Count by hierarchy level
  const countByLevel = () => {
    const levels = { executives: 0, seniorManagers: 0, managers: 0, staff: 0 };
    companyFilteredEmployees.forEach(emp => {
      const subordinates = getSubordinates(emp.id);
      if (!emp.manager_id || !employees.find(e => e.id === emp.manager_id)) {
        levels.executives++;
      } else if (subordinates.length > 5) {
        levels.seniorManagers++;
      } else if (subordinates.length > 0) {
        levels.managers++;
      } else {
        levels.staff++;
      }
    });
    return levels;
  };
  
  const hierarchyLevels = countByLevel();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('organization_structure')}</h1>
          <p className="text-slate-600">
            {selectedCompany === 'all' 
              ? `${t('org_desc')} • ${companies.length} ${t('companies')}, ${employees.length} ${t('employees')}`
              : `${companies.find(c => c.id === selectedCompany)?.name_en || t('companies')} ${t('organization_structure')}`
            }
          </p>
        </div>
        
        {/* View Type Toggle */}
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => setViewType('unified')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewType === 'unified' 
                  ? 'bg-emerald-600 text-white' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Crown className="w-4 h-4 inline mr-2" />
              {t('unified_view')}
            </button>
            <button
              onClick={() => setViewType('by-company')}
              className={`px-4 py-2 text-sm font-medium border-l transition-colors ${
                viewType === 'by-company' 
                  ? 'bg-emerald-600 text-white' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              {t('by_company')}
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('total_employees')}
          value={totalEmployees}
          icon={Users}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title={t('managers')}
          value={managers}
          icon={TrendingUp}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title={t('departments')}
          value={departments.length}
          icon={Layers}
          bgColor="from-purple-500 to-purple-600"
        />
        <StatCard
          title={t('companies')}
          value={selectedCompany === 'all' ? companies.length : 1}
          icon={Building2}
          bgColor="from-amber-500 to-amber-600"
        />
      </div>

      {/* Hierarchy Level Stats */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-white">
        <CardContent className="p-6">
          <h3 className={`text-lg font-bold text-slate-900 mb-4 ${isRTL ? 'text-right' : ''}`}>{t('hierarchy_distribution')}</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
              <Crown className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-purple-900">{hierarchyLevels.executives}</p>
              <p className="text-sm text-purple-700">{t('executive_level')}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-900">{hierarchyLevels.seniorManagers}</p>
              <p className="text-sm text-blue-700">{t('senior_managers')}</p>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
              <Briefcase className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
              <p className="text-2xl font-bold text-emerald-900">{hierarchyLevels.managers}</p>
              <p className="text-sm text-emerald-700">{t('managers')}</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
              <Users className="w-6 h-6 mx-auto mb-2 text-slate-600" />
              <p className="text-2xl font-bold text-slate-900">{hierarchyLevels.staff}</p>
              <p className="text-sm text-slate-700">{t('staff')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <OrgChartControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToScreen={handleFitToScreen}
        onRefresh={refetch}
        onExport={handleExport}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        departments={departments}
        companies={companies}
        selectedCompany={selectedCompany}
        onCompanyChange={setSelectedCompany}
      />

      {/* Main Content */}
      {viewType === 'unified' ? (
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 space-y-4">
                <Skeleton className="h-32 w-full" />
                <div className="flex gap-4 justify-center">
                  <Skeleton className="h-32 w-64" />
                  <Skeleton className="h-32 w-64" />
                  <Skeleton className="h-32 w-64" />
                </div>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-12">
                <Network className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">
                  {searchTerm ? t('no_employees_found_search') : t('no_employees_display')}
                </p>
              </div>
            ) : viewMode === 'chart' ? (
              <div
                ref={chartRef}
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.3s ease'
                }}
              >
                <OrgChart
                  employees={filteredEmployees}
                  onNodeClick={handleNodeClick}
                  companies={companies}
                />
              </div>
            ) : (
              <div className="p-6">
                <OrgListView
                  employees={filteredEmployees}
                  onEmployeeClick={handleNodeClick}
                  onManageReporting={handleManageReporting}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={companies[0]?.id || 'all'} className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1 flex-wrap h-auto">
            {companies.map((company) => {
              const structure = getCompanyStructure(company.id);
              return (
                <TabsTrigger
                  key={company.id}
                  value={company.id}
                  className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  {company.name_en}
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                    {structure.employeeCount}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {companies.map((company) => {
            const companyEmployees = employees.filter(e => e.company_id === company.id);
            return (
              <TabsContent key={company.id} value={company.id}>
                <Card className="border-0 shadow-xl overflow-hidden">
                  <CardContent className="p-0">
                    {viewMode === 'chart' ? (
                      <div
                        style={{
                          transform: `scale(${zoomLevel})`,
                          transformOrigin: 'top center',
                          transition: 'transform 0.3s ease'
                        }}
                      >
                        <OrgChart
                          employees={companyEmployees}
                          onNodeClick={handleNodeClick}
                          companyName={company.name_en}
                          companies={companies}
                        />
                      </div>
                    ) : (
                      <div className="p-6">
                        <OrgListView
                          employees={companyEmployees}
                          onEmployeeClick={handleNodeClick}
                          onManageReporting={handleManageReporting}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      {/* Employee Details Modal */}
      <EmployeeDetailsModal
        employee={selectedEmployee}
        manager={getManager(selectedEmployee)}
        subordinates={getSubordinates(selectedEmployee?.id)}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onEdit={handleManageReporting}
      />

      {/* Manage Reporting Modal */}
      <ManageReportingModal
        employee={selectedEmployee}
        employees={employees}
        isOpen={showReportingModal}
        onClose={() => setShowReportingModal(false)}
        onSave={handleSaveReporting}
      />
    </div>
  );
}
