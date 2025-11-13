import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { TranslationProvider, useTranslation } from '@/components/TranslationContext';
import { AccessControlProvider, useAccessControl } from '@/components/AccessControlContext';
import CompanySelector from '@/components/CompanySelector';
import {
  LayoutDashboard, Building2, Users, Clock, Calendar, UserPlus,
  FolderKanban, DollarSign, Gift, Plane, MessageSquare, Package,
  Shield, FileText, User, UserCheck, Network, Clock3, Menu, X, ChevronDown, Sparkles, TrendingUp, CheckCircle2
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function LayoutContent({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t, language } = useTranslation();
  const { hasModuleAccess, userData, isLoading, isAdmin } = useAccessControl();
  const isRTL = language === 'ar';

  const navigationSections = [
    {
      title: t('nav_main'),
      items: [
        { title: t('nav_dashboard'), url: createPageUrl("Dashboard"), icon: LayoutDashboard, module: 'Dashboard' },
        { title: t('nav_ai_assistant'), url: createPageUrl("AIAssistant"), icon: Sparkles, module: 'AIAssistant' }
      ]
    },
    {
      title: t('nav_organization'),
      items: [
        { title: t('nav_companies'), url: createPageUrl("Companies"), icon: Building2, module: 'Companies' },
        { title: t('nav_org_structure'), url: createPageUrl("OrgStructure"), icon: Network, module: 'OrgStructure' },
        { title: t('nav_departments'), url: createPageUrl("Departments"), icon: Users, module: 'Departments' }
      ]
    },
    {
      title: t('nav_employee_lifecycle'),
      items: [
        { title: t('nav_employee_management'), url: createPageUrl("Employees"), icon: Users, module: 'Employees' },
        { title: t('nav_onboarding'), url: createPageUrl("Onboarding"), icon: UserPlus, module: 'Onboarding' },
        { title: t('nav_documents'), url: createPageUrl("Documents"), icon: FileText, module: 'Documents' }
      ]
    },
    {
      title: t('nav_time_attendance'),
      items: [
        { title: t('nav_time_management'), url: createPageUrl("TimeManagement"), icon: Clock, module: 'TimeManagement' },
        { title: t('nav_shift_management'), url: createPageUrl("Shifts"), icon: Clock3, module: 'Shifts' },
        { title: t('nav_leave_management'), url: createPageUrl("LeaveManagement"), icon: Calendar, module: 'LeaveManagement' },
        { title: t('nav_leave_accrual'), url: createPageUrl("LeaveAccrualManagement"), icon: TrendingUp, module: 'LeaveAccrualManagement' }
      ]
    },
    {
      title: t('nav_compensation'),
      items: [
        { title: t('nav_payroll_management'), url: createPageUrl("PayrollManagement"), icon: DollarSign, module: 'PayrollManagement' },
        { title: t('nav_gosi_reporting'), url: createPageUrl("GOSIReporting"), icon: Shield, module: 'GOSIReporting' },
        { title: t('nav_benefits_rewards'), url: createPageUrl("Benefits"), icon: Gift, module: 'Benefits' }
      ]
    },
    {
      title: t('nav_performance_projects'),
      items: [
        { title: t('nav_performance'), url: createPageUrl("PerformanceManagement"), icon: TrendingUp, module: 'PerformanceManagement' },
        { title: t('nav_project_management'), url: createPageUrl("Projects"), icon: FolderKanban, module: 'Projects' }
      ]
    },
    {
      title: t('nav_employee_services'),
      items: [
        { title: t('nav_ess_portal'), url: createPageUrl("ESS"), icon: User, module: 'ESS' },
        { title: t('nav_manager_portal'), url: createPageUrl("MSS"), icon: UserCheck, module: 'MSS' },
        { title: t('nav_approvals'), url: createPageUrl("Approvals"), icon: CheckCircle2, module: 'Approvals' },
        { title: t('nav_travel_expense'), url: createPageUrl("TravelExpense"), icon: Plane, module: 'TravelExpense' }
      ]
    },
    {
      title: t('nav_resources'),
      items: [
        { title: t('nav_assets_facilities'), url: createPageUrl("Assets"), icon: Package, module: 'Assets' },
        { title: t('nav_health_safety'), url: createPageUrl("HealthSafety"), icon: Shield, module: 'HealthSafety' },
        { title: t('nav_employee_relations'), url: createPageUrl("EmployeeRelations"), icon: MessageSquare, module: 'EmployeeRelations' }
      ]
    },
    {
      title: t('nav_administration'),
      items: [
        { title: t('nav_user_management'), url: createPageUrl("UserManagement"), icon: Shield, module: 'UserManagement', adminOnly: true },
        { title: t('nav_master_data'), url: createPageUrl("MasterData"), icon: FileText, module: 'MasterData', adminOnly: true },
        { title: t('nav_public_holidays'), url: createPageUrl("PublicHolidays"), icon: Calendar, module: 'PublicHolidays' }
      ]
    }
  ];

  // Filter navigation items based on access
  const filteredSections = navigationSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.adminOnly && !isAdmin) return false;
      return hasModuleAccess(item.module);
    })
  })).filter(section => section.items.length > 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 h-full w-72 bg-white/80 backdrop-blur-xl shadow-xl z-40
          transition-transform duration-300 ease-in-out
          border-emerald-100/50
          ${isRTL ? 'right-0 border-l' : 'left-0 border-r'}
          ${sidebarOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')}
          lg:translate-x-0
        `}
        style={{
          [isRTL ? 'right' : 'left']: 0
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b border-emerald-100/50 p-6">
            <div className="flex items-center justify-between gap-3">
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className={isRTL ? 'text-right' : ''}>
                  <h2 className="font-bold text-lg text-slate-900">{t('app_name')}</h2>
                  <p className="text-xs text-emerald-700 font-medium">{t('app_tagline')}</p>
                </div>
              </div>
              <LanguageSwitcher />
            </div>
          </div>
          
          {/* User Role Badge */}
          {userData?.custom_roles && userData.custom_roles.length > 0 && (
            <div className="px-4 py-2 border-b border-emerald-100/50">
              <div className="flex flex-wrap gap-1">
                {userData.custom_roles.slice(0, 3).map(role => (
                  <Badge key={role} variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    {role.replace(/_/g, ' ')}
                  </Badge>
                ))}
                {userData.custom_roles.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{userData.custom_roles.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-3">
            {filteredSections.map((section, sectionIndex) => (
              <Collapsible
                key={section.title}
                defaultOpen={sectionIndex === 0 || sectionIndex === 1}
                className="mb-2"
              >
                <CollapsibleTrigger className={`flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-emerald-700 transition-colors group ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span>{section.title}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform group-data-[state=open]:rotate-180 ${isRTL ? 'rotate-180 group-data-[state=open]:rotate-0' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-1 mt-1">
                    {section.items.map((item) => (
                      <Link
                        key={item.title}
                        to={item.url}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
                          ${isRTL ? 'flex-row-reverse' : ''}
                          ${location.pathname === item.url 
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/30 font-medium' 
                            : 'hover:bg-emerald-50 text-slate-700 hover:text-emerald-700'
                          }
                        `}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-emerald-100/50 p-4">
            <div className={`flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-transparent ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center shadow-md shrink-0">
                <span className="text-white font-semibold text-sm">
                  {userData?.custom_roles?.includes('super_admin') ? 'SA' : isAdmin ? 'A' : 'U'}
                </span>
              </div>
              <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
                <p className="font-semibold text-slate-900 text-sm truncate">
                  {isAdmin ? 'Administrator' : userData?.custom_roles?.[0]?.replace(/_/g, ' ') || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">{userData?.email || 'user@company.com'}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-w-0 ${isRTL ? 'lg:mr-72' : 'lg:ml-72'}`}>
        {/* Mobile Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-emerald-100/50 px-6 py-4 lg:hidden sticky top-0 z-10">
          <div className={`flex items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hover:bg-emerald-50 p-2 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div className={isRTL ? 'text-right' : ''}>
                  <h1 className="text-lg font-bold text-slate-900">{t('app_name')}</h1>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CompanySelector />
            </div>
          </div>
        </header>

        {/* Desktop Company Selector */}
        <div className="hidden lg:block bg-white/80 backdrop-blur-xl border-b border-emerald-100/50 px-6 py-3">
          <div className={`flex items-center justify-end ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CompanySelector />
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <TranslationProvider>
      <AccessControlProvider>
        <LayoutContent>{children}</LayoutContent>
      </AccessControlProvider>
    </TranslationProvider>
  );
}