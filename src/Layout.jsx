import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Building2, Users, Clock, Calendar, UserPlus,
  FolderKanban, DollarSign, Gift, Plane, MessageSquare, Package,
  Shield, FileText, User, UserCheck, Network, Clock3, Menu, X, ChevronDown, Sparkles, TrendingUp, CheckCircle2
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader,
  SidebarFooter, SidebarProvider, SidebarTrigger
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const navigationSections = [
  {
    title: "Main",
    items: [
      { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
      { title: "AI Assistant", url: createPageUrl("AIAssistant"), icon: Sparkles }
    ]
  },
  {
    title: "Organization",
    items: [
      { title: "Companies", url: createPageUrl("Companies"), icon: Building2 },
      { title: "Org Structure", url: createPageUrl("OrgStructure"), icon: Network },
      { title: "Departments", url: createPageUrl("Employees"), icon: Users }
    ]
  },
  {
    title: "Employee Lifecycle",
    items: [
      { title: "Employee Management", url: createPageUrl("Employees"), icon: Users },
      { title: "Onboarding", url: createPageUrl("Onboarding"), icon: UserPlus },
      { title: "Documents", url: createPageUrl("Documents"), icon: FileText }
    ]
  },
  {
    title: "Time & Attendance",
    items: [
      { title: "Time Management", url: createPageUrl("TimeManagement"), icon: Clock },
      { title: "Shift Management", url: createPageUrl("Shifts"), icon: Clock3 },
      { title: "Leave Management", url: createPageUrl("LeaveManagement"), icon: Calendar }
    ]
  },
  {
    title: "Compensation",
    items: [
      { title: "Payroll Management", url: createPageUrl("PayrollManagement"), icon: DollarSign },
      { title: "GOSI Reporting", url: createPageUrl("GOSIReporting"), icon: Shield },
      { title: "Benefits & Rewards", url: createPageUrl("Benefits"), icon: Gift }
    ]
  },
  {
    title: "Performance & Projects",
    items: [
      { title: "Performance", url: createPageUrl("PerformanceManagement"), icon: TrendingUp },
      { title: "Project Management", url: createPageUrl("Projects"), icon: FolderKanban }
    ]
  },
  {
    title: "Employee Services",
    items: [
      { title: "ESS Portal", url: createPageUrl("ESS"), icon: User },
      { title: "Manager Portal", url: createPageUrl("MSS"), icon: UserCheck },
      { title: "Approvals", url: createPageUrl("Approvals"), icon: CheckCircle2 },
      { title: "Travel & Expense", url: createPageUrl("TravelExpense"), icon: Plane }
    ]
  },
  {
    title: "Resources",
    items: [
      { title: "Assets & Facilities", url: createPageUrl("Assets"), icon: Package },
      { title: "Health & Safety", url: createPageUrl("HealthSafety"), icon: Shield },
      { title: "Employee Relations", url: createPageUrl("EmployeeRelations"), icon: MessageSquare }
    ]
  },
  {
    title: "Administration",
    items: [
      { title: "User Management", url: createPageUrl("UserManagement"), icon: Shield }
    ]
  }
];

export default function Layout({ children }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50">
        <Sidebar className="border-r border-emerald-100/50 bg-white/80 backdrop-blur-xl">
          <SidebarHeader className="border-b border-emerald-100/50 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-900">HRMS</h2>
                <p className="text-xs text-emerald-700 font-medium">Saudi Arabia</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3 overflow-y-auto">
            {navigationSections.map((section, sectionIndex) => (
              <Collapsible
                key={section.title}
                defaultOpen={sectionIndex === 0 || sectionIndex === 1}
                className="mb-2"
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-emerald-700 transition-colors group">
                  <span>{section.title}</span>
                  <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
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
                              <Link to={item.url} className="flex items-center gap-3">
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
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-transparent">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-semibold text-sm">HR</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">HR Admin</p>
                <p className="text-xs text-slate-500 truncate">admin@company.sa</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="bg-white/80 backdrop-blur-xl border-b border-emerald-100/50 px-6 py-4 lg:hidden sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-emerald-50 p-2 rounded-lg transition-colors" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold text-slate-900">HRMS</h1>
              </div>
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