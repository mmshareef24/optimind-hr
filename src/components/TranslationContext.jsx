import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Common
    welcome: "Welcome",
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    search: "Search",
    filter: "Filter",
    export: "Export",
    submit: "Submit",
    close: "Close",
    
    // App Name & Tagline
    app_name: "OptiMindHR",
    app_tagline: "Connecting Minds Through Smart Intelligence",
    
    // Navigation
    nav_main: "Main",
    nav_dashboard: "Dashboard",
    nav_ai_assistant: "AI Assistant",
    nav_organization: "Organization",
    nav_companies: "Companies",
    nav_org_structure: "Org Structure",
    nav_departments: "Departments",
    nav_employee_lifecycle: "Employee Lifecycle",
    nav_employee_management: "Employee Management",
    nav_onboarding: "Onboarding",
    nav_documents: "Documents",
    nav_time_attendance: "Time & Attendance",
    nav_time_management: "Time Management",
    nav_shift_management: "Shift Management",
    nav_leave_management: "Leave Management",
    nav_leave_accrual: "Leave Accrual",
    nav_compensation: "Compensation",
    nav_payroll_management: "Payroll Management",
    nav_gosi_reporting: "GOSI Reporting",
    nav_benefits_rewards: "Benefits & Rewards",
    nav_performance_projects: "Performance & Projects",
    nav_performance: "Performance",
    nav_project_management: "Project Management",
    nav_employee_services: "Employee Services",
    nav_ess_portal: "ESS Portal",
    nav_manager_portal: "Manager Portal",
    nav_approvals: "Approvals",
    nav_travel_expense: "Travel & Expense",
    nav_resources: "Resources",
    nav_assets_facilities: "Assets & Facilities",
    nav_health_safety: "Health & Safety",
    nav_employee_relations: "Employee Relations",
    nav_administration: "Administration",
    nav_user_management: "User Management",
    nav_master_data: "Master Data",
    nav_public_holidays: "Public Holidays",
    
    // Clock In/Out
    attendance_clock: "Attendance Clock",
    clock_in: "Clock In",
    clock_out: "Clock Out",
    start_break: "Start Break",
    end_break: "End Break",
    getting_location: "Getting Location...",
    location_required: "Location Required",
    location_required_desc: "Your location will be recorded when you punch in/out for security and attendance tracking purposes.",
    location_denied: "Location access denied. Please enable location permissions to punch in/out.",
    location_unavailable: "Location information unavailable. Please check your device settings.",
    location_timeout: "Location request timed out. Please try again.",
    location_error: "An unknown error occurred while fetching location.",
    location_help: "Please enable location permissions in your browser settings and try again.",
    today_shift: "Today's Shift",
    attendance_recorded: "Attendance Recorded",
    clocked_out_today: "You have clocked out for today",
    break_started: "Break Started",
    break_ended: "Break Ended",
    
    // Messages
    clocked_in_success: "Clocked in successfully!",
    clocked_out_success: "Clocked out successfully!",
    break_started_success: "Break started",
    break_ended_success: "Break ended",
    clock_in_failed: "Failed to clock in",
    clock_out_failed: "Failed to clock out",
  },
  ar: {
    // Common
    welcome: "مرحباً",
    loading: "جاري التحميل...",
    save: "حفظ",
    cancel: "إلغاء",
    edit: "تعديل",
    delete: "حذف",
    search: "بحث",
    filter: "تصفية",
    export: "تصدير",
    submit: "إرسال",
    close: "إغلاق",
    
    // App Name & Tagline
    app_name: "أوبتي مايند",
    app_tagline: "ربط العقول من خلال الذكاء الذكي",
    
    // Navigation
    nav_main: "الرئيسية",
    nav_dashboard: "لوحة القيادة",
    nav_ai_assistant: "المساعد الذكي",
    nav_organization: "المؤسسة",
    nav_companies: "الشركات",
    nav_org_structure: "الهيكل التنظيمي",
    nav_departments: "الأقسام",
    nav_employee_lifecycle: "دورة حياة الموظف",
    nav_employee_management: "إدارة الموظفين",
    nav_onboarding: "التوظيف",
    nav_documents: "المستندات",
    nav_time_attendance: "الوقت والحضور",
    nav_time_management: "إدارة الوقت",
    nav_shift_management: "إدارة الورديات",
    nav_leave_management: "إدارة الإجازات",
    nav_leave_accrual: "استحقاق الإجازات",
    nav_compensation: "التعويضات",
    nav_payroll_management: "إدارة الرواتب",
    nav_gosi_reporting: "تقارير التأمينات",
    nav_benefits_rewards: "المزايا والمكافآت",
    nav_performance_projects: "الأداء والمشاريع",
    nav_performance: "الأداء",
    nav_project_management: "إدارة المشاريع",
    nav_employee_services: "خدمات الموظفين",
    nav_ess_portal: "بوابة الخدمة الذاتية",
    nav_manager_portal: "بوابة المدير",
    nav_approvals: "الموافقات",
    nav_travel_expense: "السفر والمصروفات",
    nav_resources: "الموارد",
    nav_assets_facilities: "الأصول والمرافق",
    nav_health_safety: "الصحة والسلامة",
    nav_employee_relations: "علاقات الموظفين",
    nav_administration: "الإدارة",
    nav_user_management: "إدارة المستخدمين",
    nav_master_data: "البيانات الرئيسية",
    nav_public_holidays: "العطلات الرسمية",
    
    // Clock In/Out
    attendance_clock: "ساعة الحضور",
    clock_in: "تسجيل الحضور",
    clock_out: "تسجيل المغادرة",
    start_break: "بدء الاستراحة",
    end_break: "إنهاء الاستراحة",
    getting_location: "جاري تحديد الموقع...",
    location_required: "الموقع مطلوب",
    location_required_desc: "سيتم تسجيل موقعك عند تسجيل الحضور/المغادرة لأغراض الأمان وتتبع الحضور.",
    location_denied: "تم رفض الوصول إلى الموقع. يرجى تمكين أذونات الموقع لتسجيل الحضور/المغادرة.",
    location_unavailable: "معلومات الموقع غير متوفرة. يرجى التحقق من إعدادات جهازك.",
    location_timeout: "انتهت مهلة طلب الموقع. يرجى المحاولة مرة أخرى.",
    location_error: "حدث خطأ غير معروف أثناء جلب الموقع.",
    location_help: "يرجى تمكين أذونات الموقع في إعدادات المتصفح والمحاولة مرة أخرى.",
    today_shift: "وردية اليوم",
    attendance_recorded: "تم تسجيل الحضور",
    clocked_out_today: "لقد سجلت مغادرتك لليوم",
    break_started: "بدأت الاستراحة",
    break_ended: "انتهت الاستراحة",
    
    // Messages
    clocked_in_success: "تم تسجيل الحضور بنجاح!",
    clocked_out_success: "تم تسجيل المغادرة بنجاح!",
    break_started_success: "بدأت الاستراحة",
    break_ended_success: "انتهت الاستراحة",
    clock_in_failed: "فشل تسجيل الحضور",
    clock_out_failed: "فشل تسجيل المغادرة",
  }
};

const TranslationContext = createContext();

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    // Set document direction and language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <TranslationContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
}