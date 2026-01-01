import React from 'react';
// Lazy-load pages for better performance and bundle size
const AIAssistant = React.lazy(() => import('./pages/AIAssistant'));
const Approvals = React.lazy(() => import('./pages/Approvals'));
const Assets = React.lazy(() => import('./pages/Assets'));
const Benefits = React.lazy(() => import('./pages/Benefits'));
const BudgetManagement = React.lazy(() => import('./pages/BudgetManagement'));
const ChangeLog = React.lazy(() => import('./pages/ChangeLog'));
const Companies = React.lazy(() => import('./pages/Companies'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Departments = React.lazy(() => import('./pages/Departments'));
const Documents = React.lazy(() => import('./pages/Documents'));
const EOSBManagement = React.lazy(() => import('./pages/EOSBManagement'));
const ESS = React.lazy(() => import('./pages/ESS'));
const EmployeeRelations = React.lazy(() => import('./pages/EmployeeRelations'));
const Employees = React.lazy(() => import('./pages/Employees'));
const GOSIReporting = React.lazy(() => import('./pages/GOSIReporting'));
const HRDocumentGenerator = React.lazy(() => import('./pages/HRDocumentGenerator'));
const HealthSafety = React.lazy(() => import('./pages/HealthSafety'));
const Home = React.lazy(() => import('./pages/Home'));
const LeaveAccrualManagement = React.lazy(() => import('./pages/LeaveAccrualManagement'));
const LeaveManagement = React.lazy(() => import('./pages/LeaveManagement'));
const MSS = React.lazy(() => import('./pages/MSS'));
const MasterData = React.lazy(() => import('./pages/MasterData'));
const Offboarding = React.lazy(() => import('./pages/Offboarding'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const OrgStructure = React.lazy(() => import('./pages/OrgStructure'));
const Payroll = React.lazy(() => import('./pages/Payroll'));
const PayrollManagement = React.lazy(() => import('./pages/PayrollManagement'));
const PerformanceManagement = React.lazy(() => import('./pages/PerformanceManagement'));
const Projects = React.lazy(() => import('./pages/Projects'));
const PublicHolidays = React.lazy(() => import('./pages/PublicHolidays'));
const QIWA = React.lazy(() => import('./pages/QIWA'));
const Recruitment = React.lazy(() => import('./pages/Recruitment'));
const ReportBuilder = React.lazy(() => import('./pages/ReportBuilder'));
const Reports = React.lazy(() => import('./pages/Reports'));
const SINAD = React.lazy(() => import('./pages/SINAD'));
const Shifts = React.lazy(() => import('./pages/Shifts'));
const TimeManagement = React.lazy(() => import('./pages/TimeManagement'));
const TimeTracking = React.lazy(() => import('./pages/TimeTracking'));
const Training = React.lazy(() => import('./pages/Training'));
const TravelExpense = React.lazy(() => import('./pages/TravelExpense'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const AnalyticsDashboard = React.lazy(() => import('./pages/AnalyticsDashboard'));
const SupabaseTest = React.lazy(() => import('./pages/SupabaseTest'));
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistant": AIAssistant,
    "Approvals": Approvals,
    "Assets": Assets,
    "Benefits": Benefits,
    "BudgetManagement": BudgetManagement,
    "ChangeLog": ChangeLog,
    "Companies": Companies,
    "Dashboard": Dashboard,
    "Departments": Departments,
    "Documents": Documents,
    "EOSBManagement": EOSBManagement,
    "ESS": ESS,
    "EmployeeRelations": EmployeeRelations,
    "Employees": Employees,
    "GOSIReporting": GOSIReporting,
    "HRDocumentGenerator": HRDocumentGenerator,
    "HealthSafety": HealthSafety,
    "Home": Home,
    "LeaveAccrualManagement": LeaveAccrualManagement,
    "LeaveManagement": LeaveManagement,
    "MSS": MSS,
    "MasterData": MasterData,
    "Offboarding": Offboarding,
    "Onboarding": Onboarding,
    "OrgStructure": OrgStructure,
    "Payroll": Payroll,
    "PayrollManagement": PayrollManagement,
    "PerformanceManagement": PerformanceManagement,
    "Projects": Projects,
    "PublicHolidays": PublicHolidays,
    "QIWA": QIWA,
    "Recruitment": Recruitment,
    "ReportBuilder": ReportBuilder,
    "Reports": Reports,
    "SINAD": SINAD,
    "Shifts": Shifts,
    "TimeManagement": TimeManagement,
    "TimeTracking": TimeTracking,
    "Training": Training,
    "TravelExpense": TravelExpense,
    "UserManagement": UserManagement,
    "AnalyticsDashboard": AnalyticsDashboard,
    "SupabaseTest": SupabaseTest,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};