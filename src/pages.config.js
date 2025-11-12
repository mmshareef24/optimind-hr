import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import Employees from './pages/Employees';
import LeaveManagement from './pages/LeaveManagement';
import Payroll from './pages/Payroll';
import TimeManagement from './pages/TimeManagement';
import OrgStructure from './pages/OrgStructure';
import Shifts from './pages/Shifts';
import Onboarding from './pages/Onboarding';
import Projects from './pages/Projects';
import Benefits from './pages/Benefits';
import TravelExpense from './pages/TravelExpense';
import EmployeeRelations from './pages/EmployeeRelations';
import Assets from './pages/Assets';
import HealthSafety from './pages/HealthSafety';
import Documents from './pages/Documents';
import ESS from './pages/ESS';
import MSS from './pages/MSS';
import GOSIReporting from './pages/GOSIReporting';
import PerformanceManagement from './pages/PerformanceManagement';
import AIAssistant from './pages/AIAssistant';
import TimeTracking from './pages/TimeTracking';
import Reports from './pages/Reports';
import Approvals from './pages/Approvals';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Companies": Companies,
    "Employees": Employees,
    "LeaveManagement": LeaveManagement,
    "Payroll": Payroll,
    "TimeManagement": TimeManagement,
    "OrgStructure": OrgStructure,
    "Shifts": Shifts,
    "Onboarding": Onboarding,
    "Projects": Projects,
    "Benefits": Benefits,
    "TravelExpense": TravelExpense,
    "EmployeeRelations": EmployeeRelations,
    "Assets": Assets,
    "HealthSafety": HealthSafety,
    "Documents": Documents,
    "ESS": ESS,
    "MSS": MSS,
    "GOSIReporting": GOSIReporting,
    "PerformanceManagement": PerformanceManagement,
    "AIAssistant": AIAssistant,
    "TimeTracking": TimeTracking,
    "Reports": Reports,
    "Approvals": Approvals,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};