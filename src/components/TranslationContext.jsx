import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Common
    welcome: "Welcome", loading: "Loading...", save: "Save", cancel: "Cancel", edit: "Edit",
    delete: "Delete", search: "Search", filter: "Filter", export: "Export", submit: "Submit",
    close: "Close", choose: "Choose", select: "Select", create: "Create", update: "Update",
    add: "Add", remove: "Remove", view: "View", all: "All", status: "Status", name: "Name",
    description: "Description", date: "Date", time: "Time", actions: "Actions", details: "Details",
    
    // App
    app_name: "OptiMindHR",
    app_tagline: "Connecting Minds Through Smart Intelligence",
    
    // Navigation
    nav_main: "Main", nav_dashboard: "Dashboard", nav_ai_assistant: "AI Assistant",
    nav_organization: "Organization", nav_companies: "Companies", nav_org_structure: "Org Structure",
    nav_departments: "Departments", nav_employee_lifecycle: "Employee Lifecycle",
    nav_employee_management: "Employee Management", nav_onboarding: "Onboarding",
    nav_documents: "Documents", nav_time_attendance: "Time & Attendance",
    nav_time_management: "Time Management", nav_shift_management: "Shift Management",
    nav_leave_management: "Leave Management", nav_leave_accrual: "Leave Accrual",
    nav_compensation: "Compensation", nav_payroll_management: "Payroll Management",
    nav_gosi_reporting: "GOSI Reporting", nav_benefits_rewards: "Benefits & Rewards",
    nav_performance_projects: "Performance & Projects", nav_performance: "Performance",
    nav_project_management: "Project Management", nav_employee_services: "Employee Services",
    nav_ess_portal: "ESS Portal", nav_manager_portal: "Manager Portal",
    nav_approvals: "Approvals", nav_travel_expense: "Travel & Expense",
    nav_resources: "Resources", nav_assets_facilities: "Assets & Facilities",
    nav_health_safety: "Health & Safety", nav_employee_relations: "Employee Relations",
    nav_administration: "Administration", nav_user_management: "User Management",
    nav_master_data: "Master Data", nav_public_holidays: "Public Holidays",
    
    // Dashboard
    dashboard: "Dashboard", welcome_back: "Welcome back, here's your HR overview",
    total_employees: "Total Employees", total_companies: "Total Companies",
    pending_leaves: "Pending Leaves", attendance_today: "Attendance Today",
    recent_leave_requests: "Recent Leave Requests", hr_metrics: "HR Metrics",
    active_status: "Active Status", pending_actions: "Pending Actions",
    payroll_status: "Payroll Status", all_processed: "All Processed",
    shift_coverage: "Shift Coverage", department_distribution: "Department Distribution",
    no_leave_requests_yet: "No leave requests yet", today: "Today",
    export_report: "Export Report", select_company: "Select Company",
    all_companies: "All Companies", leave_approvals: "Leave Approvals",
    
    // Companies
    companies: "Companies", manage_companies: "Manage your organization's companies",
    add_company: "Add Company", edit_company: "Edit Company",
    no_companies_found: "No companies found", company_name_en: "Company Name (English)",
    company_name_ar: "Company Name (Arabic)", cr_number: "CR Number",
    tax_number: "Tax Number", gosi_number: "GOSI Number",
    establishment_date: "Establishment Date", industry: "Industry",
    city: "City", phone: "Phone", email: "Email", address: "Address",
    edit_details: "Edit Details",
    
    // Employees
    employees: "Employees", manage_all_employees: "Manage all employees in the organization",
    view_manage_team: "View and manage your direct reports",
    view_your_info: "View your employee information",
    add_employee: "Add Employee", edit_employee: "Edit Employee",
    total_accessible: "Total Accessible", no_employees_found: "No employees found",
    search_employees: "Search employees by name, ID, email, or department...",
    add_first_employee: "Add First Employee", reports_to_you: "Reports to You",
    full_access: "Full Access", my_team: "My Team", personal_view: "Personal View",
    joined: "Joined", position: "Position",
    
    // ESS Portal
    ess_portal: "ESS Portal", ess_welcome: "Welcome", your_ess_portal: "Your Employee Self-Service Portal",
    employee_id: "Employee ID", current_salary: "Current Salary", leave_balance: "Leave Balance",
    pending_requests_count: "Pending Requests", available_policies: "Available Policies",
    quick_actions: "Quick Actions", recent_requests: "Recent Requests",
    request_leave_action: "Request Leave", request_loan: "Request Loan",
    travel_request: "Travel Request", request_letter: "Request Letter",
    leave_request: "Leave Request", loan_request: "Loan Request",
    no_recent_requests: "No recent requests", my_onboarding: "My Onboarding",
    clock_in_out: "Clock In/Out", my_profile: "My Profile", benefits: "Benefits",
    loans: "Loans", travel: "Travel", letters: "Letters", payslips: "Payslips",
    policies: "Policies", you_have_pending: "You have", pending_request: "pending request",
    pending_requests_plural: "pending requests",
    
    // Time Management
    time_management: "Time Management", time_management_desc: "Track attendance, timesheets, and calculate overtime",
    total_overtime_month: "Total Overtime (Month)", late_arrivals: "Late Arrivals",
    absent_today: "Absent Today", present_today: "Present Today",
    attendance_records: "Attendance Records", timesheets: "Timesheets",
    select_employee: "Select Employee", employee: "Employee", choose_employee: "Choose employee...",
    generate_timesheet: "Generate Timesheet", generated_timesheets: "Generated Timesheets",
    no_attendance_records: "No attendance records yet", no_timesheets_yet: "No timesheets generated yet",
    period: "Period", present: "Present", total_hours: "Total Hours",
    overtime: "Overtime", ot_pay: "OT Pay", clock_in_slash_out: "Clock In/Out",
    timing: "Timing", hours: "Hours", break: "Break", employees: "employees", days: "days",
    
    // Clock In/Out
    attendance_clock: "Attendance Clock", clock_in: "Clock In", clock_out: "Clock Out",
    start_break: "Start Break", end_break: "End Break", getting_location: "Getting Location...",
    location_required: "Location Required",
    location_required_desc: "Your location will be recorded when you punch in/out for security and attendance tracking purposes.",
    today_shift: "Today's Shift", attendance_recorded: "Attendance Recorded",
    clocked_out_today: "You have clocked out for today", break_started: "Break Started",
    break_ended: "Break Ended",
    
    // Shifts
    shift_management: "Shift Management", shift_management_desc: "Create and manage employee work shifts",
    create_shift: "Create Shift", edit_shift: "Edit Shift", total_shifts: "Total Shifts",
    active_shifts: "Active Shifts", assigned_employees: "Assigned Employees",
    departments: "Departments", all_shifts: "All Shifts", no_shifts_created: "No shifts created yet",
    
    // Leave Management  
    leave_management: "Leave Management", leave_management_desc: "Track and manage your leave requests seamlessly",
    request_leave: "Request Leave", export_history: "Export History", upcoming_leave: "Upcoming Leave",
    days_used: "Days Used", days_remaining: "Days Remaining", pending_requests: "Pending Requests",
    approved_this_year: "Approved This Year", my_leave_balances: "My Leave Balances",
    no_leave_balances: "No leave balances found", my_requests: "My Requests",
    approvals: "Approvals", team_calendar: "Team Calendar", my_calendar: "My Calendar",
    leave_policies: "Leave Policies", analytics: "Analytics", my_leave_history: "My Leave History",
    all_status: "All Status", all_types: "All Types", no_leave_requests: "No Leave Requests Yet",
    submit_first_request: "Submit Your First Request", no_requests_match: "No requests match your filters",
    
    // Projects
    project_management: "Project Management", project_management_desc: "Track projects and manage team assignments",
    new_project: "New Project", total_projects: "Total Projects", active_projects: "Active Projects",
    team_members: "Team Members", total_budget: "Total Budget", edit_project: "Edit Project",
    create_new_project: "Create New Project", advanced_filters: "Advanced Filters",
    filter_projects: "Filter Projects", clear_all: "Clear All", priority: "Priority",
    department: "Department", project_manager: "Project Manager", risk_level: "Risk Level",
    all_priorities: "All Priorities", all_departments: "All Departments", all_managers: "All Managers",
    all_risk_levels: "All Risk Levels", no_projects_match: "No projects match the selected filters",
    no_projects_yet: "No projects yet", create_first_project: "Create First Project",
    showing: "Showing", of: "of", projects: "projects",
    
    // Assets
    assets_facilities: "Assets & Facilities", assets_desc: "Track and manage company assets and equipment",
    add_asset: "Add Asset", total_assets: "Total Assets", available: "Available",
    assigned: "Assigned", total_value: "Total Value", all_assets: "All Assets",
    assignments: "Assignments", maintenance: "Maintenance", filter_assets: "Filter Assets",
    category: "Category", condition: "Condition", all_categories: "All Categories",
    all_conditions: "All Conditions", no_assets_match: "No assets match the selected filters",
    no_assets_found: "No assets found", assets: "assets", edit_asset: "Edit Asset",
    add_new_asset: "Add New Asset", no_active_assignments: "No active asset assignments",
    mark_returned: "Mark Returned", assigned_to: "Assigned to", assigned_date: "Assigned Date",
    expected_return: "Expected Return", filters: "Filters",
    
    // Travel & Expense
    travel_expense_management: "Travel & Expense Management",
    travel_expense_desc: "Manage business travel and expense claims",
    new_travel_request: "New Travel Request", new_expense_claim: "New Expense Claim",
    pending_travel: "Pending Travel", approved_travel: "Approved Travel",
    total_expenses: "Total Expenses", pending_claims: "Pending Claims",
    my_travel: "My Travel", my_expenses: "My Expenses", travel_approvals: "Travel Approvals",
    expense_approvals: "Expense Approvals", no_travel_requests: "No travel requests yet",
    submit_first_travel: "Submit Your First Travel Request",
    no_expense_claims: "No expense claims yet", submit_first_expense: "Submit Your First Expense Claim",
    edit_travel_request: "Edit Travel Request", edit_expense_claim: "Edit Expense Claim",
    
    // MSS (Manager)
    manager_self_service: "Manager Self Service", manage_your_team: "Manage your team of",
    member: "member", members: "members", team_size: "Team Size", pending_approvals: "Pending Approvals",
    attendance_rate: "Attendance Rate", active_goals: "Active Goals", overview: "Overview",
    leave: "Leave", profile_changes: "Profile Changes", performance: "Performance",
    attendance: "Attendance", travel_expense: "Travel & Expense", no_employee_record: "No Employee Record Found",
    contact_hr: "Your account is not linked to an employee record. Please contact HR.",
    no_team_members: "No Team Members", no_direct_reports: "You don't have any direct reports assigned yet.",
    once_assigned: "Once employees are assigned to report to you, you'll be able to manage your team here.",
    team_members_tab: "Team Members",
    
    // GOSI Reporting
    gosi_reporting: "GOSI Reporting", gosi_desc: "Manage GOSI contributions and compliance reporting",
    current_month_status: "Current Month Status", total_contributions_ytd: "Total Contributions (YTD)",
    submitted_reports: "Submitted Reports", pending_actions: "Pending Actions",
    generate_report: "Generate Report", report_history: "Report History",
    submit_to_gosi: "Submit to GOSI Portal",
    
    // Messages
    clocked_in_success: "Clocked in successfully!",
    clocked_out_success: "Clocked out successfully!",
    attendance_updated: "Attendance updated",
  },
  ar: {
    // Common
    welcome: "مرحباً", loading: "جاري التحميل...", save: "حفظ", cancel: "إلغاء", edit: "تعديل",
    delete: "حذف", search: "بحث", filter: "تصفية", export: "تصدير", submit: "إرسال",
    close: "إغلاق", choose: "اختر", select: "اختيار", create: "إنشاء", update: "تحديث",
    add: "إضافة", remove: "إزالة", view: "عرض", all: "الكل", status: "الحالة", name: "الاسم",
    description: "الوصف", date: "التاريخ", time: "الوقت", actions: "الإجراءات", details: "التفاصيل",
    
    // App
    app_name: "أوبتي مايند",
    app_tagline: "ربط العقول من خلال الذكاء الذكي",
    
    // Navigation
    nav_main: "الرئيسية", nav_dashboard: "لوحة القيادة", nav_ai_assistant: "المساعد الذكي",
    nav_organization: "المؤسسة", nav_companies: "الشركات", nav_org_structure: "الهيكل التنظيمي",
    nav_departments: "الأقسام", nav_employee_lifecycle: "دورة حياة الموظف",
    nav_employee_management: "إدارة الموظفين", nav_onboarding: "التوظيف",
    nav_documents: "المستندات", nav_time_attendance: "الوقت والحضور",
    nav_time_management: "إدارة الوقت", nav_shift_management: "إدارة الورديات",
    nav_leave_management: "إدارة الإجازات", nav_leave_accrual: "استحقاق الإجازات",
    nav_compensation: "التعويضات", nav_payroll_management: "إدارة الرواتب",
    nav_gosi_reporting: "تقارير التأمينات", nav_benefits_rewards: "المزايا والمكافآت",
    nav_performance_projects: "الأداء والمشاريع", nav_performance: "الأداء",
    nav_project_management: "إدارة المشاريع", nav_employee_services: "خدمات الموظفين",
    nav_ess_portal: "بوابة الخدمة الذاتية", nav_manager_portal: "بوابة المدير",
    nav_approvals: "الموافقات", nav_travel_expense: "السفر والمصروفات",
    nav_resources: "الموارد", nav_assets_facilities: "الأصول والمرافق",
    nav_health_safety: "الصحة والسلامة", nav_employee_relations: "علاقات الموظفين",
    nav_administration: "الإدارة", nav_user_management: "إدارة المستخدمين",
    nav_master_data: "البيانات الرئيسية", nav_public_holidays: "العطلات الرسمية",
    
    // Dashboard - Arabic
    dashboard: "لوحة القيادة", welcome_back: "مرحباً بعودتك، إليك نظرة عامة على الموارد البشرية",
    total_employees: "إجمالي الموظفين", total_companies: "إجمالي الشركات",
    pending_leaves: "إجازات قيد الانتظار", attendance_today: "الحضور اليوم",
    recent_leave_requests: "طلبات الإجازة الأخيرة", hr_metrics: "مقاييس الموارد البشرية",
    active_status: "الحالة النشطة", pending_actions: "إجراءات قيد الانتظار",
    payroll_status: "حالة الرواتب", all_processed: "تمت المعالجة",
    shift_coverage: "تغطية الورديات", department_distribution: "توزيع الأقسام",
    no_leave_requests_yet: "لا توجد طلبات إجازة بعد", today: "اليوم",
    export_report: "تصدير التقرير", select_company: "اختر الشركة",
    all_companies: "جميع الشركات", leave_approvals: "موافقات الإجازات",
    
    // Companies - Arabic
    companies: "الشركات", manage_companies: "إدارة شركات مؤسستك",
    add_company: "إضافة شركة", edit_company: "تعديل الشركة",
    no_companies_found: "لم يتم العثور على شركات", company_name_en: "اسم الشركة (بالإنجليزية)",
    company_name_ar: "اسم الشركة (بالعربية)", cr_number: "رقم السجل التجاري",
    tax_number: "الرقم الضريبي", gosi_number: "رقم التأمينات",
    establishment_date: "تاريخ التأسيس", industry: "الصناعة",
    city: "المدينة", phone: "الهاتف", email: "البريد الإلكتروني", address: "العنوان",
    edit_details: "تعديل التفاصيل",
    
    // Employees - Arabic
    employees: "الموظفون", manage_all_employees: "إدارة جميع الموظفين في المؤسسة",
    view_manage_team: "عرض وإدارة مرؤوسيك المباشرين",
    view_your_info: "عرض معلومات موظفك",
    add_employee: "إضافة موظف", edit_employee: "تعديل الموظف",
    total_accessible: "إجمالي المتاح", no_employees_found: "لم يتم العثور على موظفين",
    search_employees: "البحث عن الموظفين بالاسم أو الرقم أو البريد أو القسم...",
    add_first_employee: "إضافة أول موظف", reports_to_you: "يرفع تقاريره إليك",
    full_access: "وصول كامل", my_team: "فريقي", personal_view: "عرض شخصي",
    joined: "انضم في", position: "المنصب",
    
    // ESS Portal - Arabic
    ess_portal: "بوابة الخدمة الذاتية", ess_welcome: "مرحباً",
    your_ess_portal: "بوابة الخدمة الذاتية للموظفين",
    employee_id: "رقم الموظف", current_salary: "الراتب الحالي", leave_balance: "رصيد الإجازات",
    pending_requests_count: "الطلبات المعلقة", available_policies: "السياسات المتاحة",
    quick_actions: "إجراءات سريعة", recent_requests: "الطلبات الأخيرة",
    request_leave_action: "طلب إجازة", request_loan: "طلب قرض",
    travel_request: "طلب سفر", request_letter: "طلب خطاب",
    leave_request: "طلب إجازة", loan_request: "طلب قرض",
    no_recent_requests: "لا توجد طلبات حديثة", my_onboarding: "توظيفي",
    clock_in_out: "تسجيل الحضور/المغادرة", my_profile: "ملفي الشخصي", benefits: "المزايا",
    loans: "القروض", travel: "السفر", letters: "الخطابات", payslips: "قسائم الرواتب",
    policies: "السياسات", you_have_pending: "لديك", pending_request: "طلب معلق",
    pending_requests_plural: "طلبات معلقة",
    
    // Time Management - Arabic
    time_management: "إدارة الوقت",
    time_management_desc: "تتبع الحضور وجداول العمل وحساب الوقت الإضافي",
    total_overtime_month: "إجمالي الوقت الإضافي (شهري)",
    late_arrivals: "التأخيرات",
    absent_today: "الغائبون اليوم",
    present_today: "الحاضرون اليوم",
    attendance_records: "سجلات الحضور",
    timesheets: "جداول العمل",
    select_employee: "اختر الموظف",
    employee: "الموظف",
    choose_employee: "اختر موظفاً...",
    generate_timesheet: "إنشاء جدول العمل",
    generated_timesheets: "جداول العمل المنشأة",
    no_attendance_records: "لا توجد سجلات حضور بعد",
    no_timesheets_yet: "لم يتم إنشاء جداول عمل بعد",
    period: "الفترة",
    present: "حاضر",
    total_hours: "إجمالي الساعات",
    overtime: "وقت إضافي",
    ot_pay: "أجر الوقت الإضافي",
    clock_in_slash_out: "تسجيل الحضور/المغادرة",
    timing: "التوقيت",
    hours: "ساعات",
    break: "استراحة",
    employees: "موظفين",
    days: "أيام",
    
    // Shifts - Arabic
    shift_management: "إدارة الورديات",
    shift_management_desc: "إنشاء وإدارة ورديات عمل الموظفين",
    create_shift: "إنشاء وردية",
    edit_shift: "تعديل الوردية",
    total_shifts: "إجمالي الورديات",
    active_shifts: "الورديات النشطة",
    assigned_employees: "الموظفون المعينون",
    departments: "الأقسام",
    all_shifts: "جميع الورديات",
    no_shifts_created: "لم يتم إنشاء ورديات بعد",
    
    // Leave Management - Arabic
    leave_management: "إدارة الإجازات",
    leave_management_desc: "تتبع وإدارة طلبات الإجازات بسلاسة",
    request_leave: "طلب إجازة",
    export_history: "تصدير السجل",
    upcoming_leave: "الإجازة القادمة",
    days_used: "أيام مستخدمة",
    days_remaining: "أيام متبقية",
    pending_requests: "طلبات قيد الانتظار",
    approved_this_year: "موافق عليها هذا العام",
    my_leave_balances: "أرصدة إجازاتي",
    no_leave_balances: "لا توجد أرصدة إجازات",
    my_requests: "طلباتي",
    approvals: "الموافقات",
    team_calendar: "تقويم الفريق",
    my_calendar: "تقويمي",
    leave_policies: "سياسات الإجازات",
    analytics: "التحليلات",
    my_leave_history: "سجل إجازاتي",
    all_status: "جميع الحالات",
    all_types: "جميع الأنواع",
    no_leave_requests: "لا توجد طلبات إجازة بعد",
    submit_first_request: "قدم طلبك الأول",
    no_requests_match: "لا توجد طلبات تطابق الفلاتر",
    
    // Projects - Arabic
    project_management: "إدارة المشاريع",
    project_management_desc: "تتبع المشاريع وإدارة تعيينات الفريق",
    new_project: "مشروع جديد",
    total_projects: "إجمالي المشاريع",
    active_projects: "المشاريع النشطة",
    team_members: "أعضاء الفريق",
    total_budget: "إجمالي الميزانية",
    edit_project: "تعديل المشروع",
    create_new_project: "إنشاء مشروع جديد",
    advanced_filters: "فلاتر متقدمة",
    filter_projects: "تصفية المشاريع",
    clear_all: "مسح الكل",
    priority: "الأولوية",
    department: "القسم",
    project_manager: "مدير المشروع",
    risk_level: "مستوى المخاطر",
    all_priorities: "جميع الأولويات",
    all_departments: "جميع الأقسام",
    all_managers: "جميع المدراء",
    all_risk_levels: "جميع مستويات المخاطر",
    no_projects_match: "لا توجد مشاريع تطابق الفلاتر المحددة",
    no_projects_yet: "لا توجد مشاريع بعد",
    create_first_project: "إنشاء أول مشروع",
    showing: "عرض",
    of: "من",
    projects: "مشاريع",
    
    // Assets - Arabic
    assets_facilities: "الأصول والمرافق",
    assets_desc: "تتبع وإدارة أصول ومعدات الشركة",
    add_asset: "إضافة أصل",
    total_assets: "إجمالي الأصول",
    available: "متاح",
    assigned: "معين",
    total_value: "القيمة الإجمالية",
    all_assets: "جميع الأصول",
    assignments: "التعيينات",
    maintenance: "الصيانة",
    filter_assets: "تصفية الأصول",
    category: "الفئة",
    condition: "الحالة",
    all_categories: "جميع الفئات",
    all_conditions: "جميع الحالات",
    no_assets_match: "لا توجد أصول تطابق الفلاتر المحددة",
    no_assets_found: "لم يتم العثور على أصول",
    assets: "أصول",
    edit_asset: "تعديل الأصل",
    add_new_asset: "إضافة أصل جديد",
    no_active_assignments: "لا توجد تعيينات نشطة للأصول",
    mark_returned: "تعليم كمسترجع",
    assigned_to: "معين إلى",
    assigned_date: "تاريخ التعيين",
    expected_return: "الإرجاع المتوقع",
    filters: "الفلاتر",
    
    // Travel & Expense - Arabic
    travel_expense_management: "إدارة السفر والمصروفات",
    travel_expense_desc: "إدارة سفريات العمل ومطالبات المصروفات",
    new_travel_request: "طلب سفر جديد",
    new_expense_claim: "مطالبة مصروفات جديدة",
    pending_travel: "سفر قيد الانتظار",
    approved_travel: "سفر موافق عليه",
    total_expenses: "إجمالي المصروفات",
    pending_claims: "مطالبات قيد الانتظار",
    my_travel: "سفرياتي",
    my_expenses: "مصروفاتي",
    travel_approvals: "موافقات السفر",
    expense_approvals: "موافقات المصروفات",
    no_travel_requests: "لا توجد طلبات سفر بعد",
    submit_first_travel: "قدم طلب السفر الأول",
    no_expense_claims: "لا توجد مطالبات مصروفات بعد",
    submit_first_expense: "قدم مطالبة المصروفات الأولى",
    edit_travel_request: "تعديل طلب السفر",
    edit_expense_claim: "تعديل مطالبة المصروفات",
    
    // MSS - Arabic
    manager_self_service: "خدمة المدير الذاتية",
    manage_your_team: "إدارة فريقك المكون من",
    member: "عضو",
    members: "أعضاء",
    team_size: "حجم الفريق",
    pending_approvals: "موافقات قيد الانتظار",
    attendance_rate: "معدل الحضور",
    active_goals: "أهداف نشطة",
    overview: "نظرة عامة",
    leave: "إجازة",
    profile_changes: "تغييرات الملف الشخصي",
    performance: "الأداء",
    attendance: "الحضور",
    travel_expense: "السفر والمصروفات",
    no_employee_record: "لم يتم العثور على سجل موظف",
    contact_hr: "حسابك غير مرتبط بسجل موظف. يرجى التواصل مع الموارد البشرية.",
    no_team_members: "لا يوجد أعضاء فريق",
    no_direct_reports: "ليس لديك أي مرؤوسين مباشرين معينين بعد.",
    once_assigned: "بمجرد تعيين موظفين للإبلاغ إليك، ستتمكن من إدارة فريقك هنا.",
    team_members_tab: "أعضاء الفريق",
    
    // GOSI Reporting - Arabic
    gosi_reporting: "تقارير التأمينات الاجتماعية",
    gosi_desc: "إدارة مساهمات التأمينات وتقارير الامتثال",
    current_month_status: "حالة الشهر الحالي",
    total_contributions_ytd: "إجمالي المساهمات (منذ بداية العام)",
    submitted_reports: "التقارير المقدمة",
    pending_actions: "إجراءات قيد الانتظار",
    generate_report: "إنشاء تقرير",
    report_history: "سجل التقارير",
    submit_to_gosi: "إرسال إلى بوابة التأمينات",
    
    // Messages - Arabic
    clocked_in_success: "تم تسجيل الحضور بنجاح!",
    clocked_out_success: "تم تسجيل المغادرة بنجاح!",
    attendance_updated: "تم تحديث الحضور",
  }
};

const TranslationContext = createContext();

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
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