import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { TranslationProvider, useTranslation } from '@/components/TranslationContext';
import {
  LayoutDashboard, Building2, Users, Clock, Calendar, UserPlus,
  FolderKanban, DollarSign, Gift, Plane, MessageSquare, Package,
  Shield, FileText, User, UserCheck, Network, Clock3, Menu, X, ChevronDown, Sparkles, TrendingUp, CheckCircle2
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader,
  SidebarFooter, SidebarProvider, SidebarTrigger
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

function LayoutContent({ children }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

const navigationSections = [
  {
    title: t('nav_main'),
    items: [
      { title: t('nav_dashboard'), url: createPageUrl("Dashboard"), icon: LayoutDashboard },
      { title: t('nav_ai_assistant'), url: createPageUrl("AIAssistant"), icon: Sparkles }
    ]
  },
  {
    title: t('nav_organization'),
    items: [
      { title: t('nav_companies'), url: createPageUrl("Companies"), icon: Building2 },
      { title: t('nav_org_structure'), url: createPageUrl("OrgStructure"), icon: Network },
      { title: t('nav_departments'), url: createPageUrl("Departments"), icon: Users }
    ]
  },
  {
    title: t('nav_employee_lifecycle'),
    items: [
      { title: t('nav_employee_management'), url: createPageUrl("Employees"), icon: Users },
      { title: t('nav_onboarding'), url: createPageUrl("Onboarding"), icon: UserPlus },
      { title: t('nav_documents'), url: createPageUrl("Documents"), icon: FileText }
    ]
  },
  {
    title: t('nav_time_attendance'),
    items: [
      { title: t('nav_time_management'), url: createPageUrl("TimeManagement"), icon: Clock },
      { title: t('nav_shift_management'), url: createPageUrl("Shifts"), icon: Clock3 },
      { title: t('nav_leave_management'), url: createPageUrl("LeaveManagement"), icon: Calendar },
      { title: t('nav_leave_accrual'), url: createPageUrl("LeaveAccrualManagement"), icon: TrendingUp }
    ]
  },
  {
    title: t('nav_compensation'),
    items: [
      { title: t('nav_payroll_management'), url: createPageUrl("PayrollManagement"), icon: DollarSign },
      { title: t('nav_gosi_reporting'), url: createPageUrl("GOSIReporting"), icon: Shield },
      { title: t('nav_benefits_rewards'), url: createPageUrl("Benefits"), icon: Gift }
    ]
  },
  {
    title: t('nav_performance_projects'),
    items: [
      { title: t('nav_performance'), url: createPageUrl("PerformanceManagement"), icon: TrendingUp },
      { title: t('nav_project_management'), url: createPageUrl("Projects"), icon: FolderKanban }
    ]
  },
  {
    title: t('nav_employee_services'),
    items: [
      { title: t('nav_ess_portal'), url: createPageUrl("ESS"), icon: User },
      { title: t('nav_manager_portal'), url: createPageUrl("MSS"), icon: UserCheck },
      { title: t('nav_approvals'), url: createPageUrl("Approvals"), icon: CheckCircle2 },
      { title: t('nav_travel_expense'), url: createPageUrl("TravelExpense"), icon: Plane }
    ]
  },
  {
    title: t('nav_resources'),
    items: [
      { title: t('nav_assets_facilities'), url: createPageUrl("Assets"), icon: Package },
      { title: t('nav_health_safety'), url: createPageUrl("HealthSafety"), icon: Shield },
      { title: t('nav_employee_relations'), url: createPageUrl("EmployeeRelations"), icon: MessageSquare }
    ]
  },
  {
    title: t('nav_administration'),
    items: [
      { title: t('nav_user_management'), url: createPageUrl("UserManagement"), icon: Shield },
      { title: t('nav_master_data'), url: createPageUrl("MasterData"), icon: FileText },
      { title: t('nav_public_holidays'), url: createPageUrl("PublicHolidays"), icon: Calendar }
    ]
  }
];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 rtl:flex-row-reverse">
        <Sidebar className="ltr:border-r rtl:border-l border-emerald-100/50 bg-white/80 backdrop-blur-xl">
          <SidebarHeader className="border-b border-emerald-100/50 p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 rtl:flex-row-reverse">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="rtl:text-right">
                  <h2 className="font-bold text-lg text-slate-900">{t('app_name')}</h2>
                  <p className="text-xs text-emerald-700 font-medium">{t('app_tagline')}</p>
                </div>
              </div>
              <LanguageSwitcher />
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3 overflow-y-auto">
            {navigationSections.map((section, sectionIndex) => (
              <Collapsible
                key={section.title}
                defaultOpen={sectionIndex === 0 || sectionIndex === 1}
                className="mb-2"
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-emerald-700 transition-colors group rtl:flex-row-reverse">
                  <span>{section.title}</span>
                  <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180 rtl:rotate-180 rtl:group-data-[state=open]:rotate-0" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu className="space-y-1 mt-1">
                        {section.items.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton 
                              asChild 
                              className={`
                                transition-all duration-200 rounded-xl px-4 py-2.5
                                ${location.pathname === item.url 
                                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/30 font-medium' 
                                  : 'hover:bg-emerald-50 text-slate-700 hover:text-emerald-700'
                                }
                              `}
                            >
                              <Link to={item.url} className="flex items-center gap-3 rtl:flex-row-reverse rtl:justify-end">
                                <item.icon className="w-4 h-4" />
                                <span className="text-sm">{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </SidebarContent>

          <SidebarFooter className="border-t border-emerald-100/50 p-4">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-transparent rtl:flex-row-reverse">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-semibold text-sm">HR</span>
              </div>
              <div className="flex-1 min-w-0 rtl:text-right">
                <p className="font-semibold text-slate-900 text-sm truncate">HR Admin</p>
                <p className="text-xs text-slate-500 truncate">admin@company.sa</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="bg-white/80 backdrop-blur-xl border-b border-emerald-100/50 px-6 py-4 lg:hidden sticky top-0 z-10">
            <div className="flex items-center justify-between gap-4 rtl:flex-row-reverse">
              <div className="flex items-center gap-4 rtl:flex-row-reverse">
                <SidebarTrigger className="hover:bg-emerald-50 p-2 rounded-lg transition-colors" />
                <div className="flex items-center gap-2 rtl:flex-row-reverse">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="rtl:text-right">
                    <h1 className="text-lg font-bold text-slate-900">{t('app_name')}</h1>
                    <p className="text-xs text-emerald-700">{t('app_tagline')}</p>
                  </div>
                </div>
              </div>
              <LanguageSwitcher />
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

export default function Layout({ children }) {
  return (
    <TranslationProvider>
      <LayoutContent>{children}</LayoutContent>
    </TranslationProvider>
  );
}