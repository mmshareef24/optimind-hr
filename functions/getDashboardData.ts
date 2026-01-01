import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { widget_type, filters = {} } = await req.json();

    // Fetch data based on widget type
    let data = {};

    switch (widget_type) {
      case 'employee_count':
        const employees = await base44.asServiceRole.entities.Employee.list();
        data = {
          total: employees.length,
          active: employees.filter(e => e.status === 'active').length,
          inactive: employees.filter(e => e.status === 'inactive').length
        };
        break;

      case 'department_distribution':
        const empsByDept = await base44.asServiceRole.entities.Employee.list();
        const deptCounts = {};
        empsByDept.forEach(emp => {
          const dept = emp.department || 'Unassigned';
          deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });
        data = Object.entries(deptCounts).map(([name, value]) => ({ name, value }));
        break;

      case 'leave_statistics':
        const leaveRequests = await base44.asServiceRole.entities.LeaveRequest.list();
        const currentYear = new Date().getFullYear();
        const yearLeaves = leaveRequests.filter(l => 
          new Date(l.created_date).getFullYear() === currentYear
        );
        data = {
          total: yearLeaves.length,
          approved: yearLeaves.filter(l => l.status === 'approved').length,
          pending: yearLeaves.filter(l => l.status === 'pending').length,
          rejected: yearLeaves.filter(l => l.status === 'rejected').length
        };
        break;

      case 'payroll_summary':
        const payrolls = await base44.asServiceRole.entities.Payroll.list();
        const currentMonth = new Date().getMonth() + 1;
        const currentMonthPayrolls = payrolls.filter(p => 
          p.period_month === currentMonth && p.period_year === new Date().getFullYear()
        );
        const totalGross = currentMonthPayrolls.reduce((sum, p) => sum + (p.gross_salary || 0), 0);
        const totalNet = currentMonthPayrolls.reduce((sum, p) => sum + (p.net_salary || 0), 0);
        data = {
          total_gross: totalGross,
          total_net: totalNet,
          employee_count: currentMonthPayrolls.length
        };
        break;

      case 'attendance_rate':
        const attendance = await base44.asServiceRole.entities.Attendance.list();
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = attendance.filter(a => a.date === today);
        const allEmployees = await base44.asServiceRole.entities.Employee.filter({ status: 'active' });
        data = {
          present: todayAttendance.filter(a => a.status === 'present').length,
          total: allEmployees.length,
          rate: allEmployees.length > 0 ? 
            (todayAttendance.filter(a => a.status === 'present').length / allEmployees.length * 100).toFixed(1) : 0
        };
        break;

      case 'recruitment_pipeline':
        const candidates = await base44.asServiceRole.entities.Candidate.list();
        const stageCounts = {};
        candidates.forEach(c => {
          const stage = c.stage || 'applied';
          stageCounts[stage] = (stageCounts[stage] || 0) + 1;
        });
        data = Object.entries(stageCounts).map(([name, value]) => ({ name, value }));
        break;

      case 'training_completion':
        const enrollments = await base44.asServiceRole.entities.TrainingEnrollment.list();
        data = {
          total: enrollments.length,
          completed: enrollments.filter(e => e.status === 'completed').length,
          in_progress: enrollments.filter(e => e.status === 'in_progress').length,
          enrolled: enrollments.filter(e => e.status === 'enrolled').length
        };
        break;

      case 'monthly_trends':
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const empTrends = await base44.asServiceRole.entities.Employee.list();
        const monthlyData = months.map((month, idx) => {
          const count = empTrends.filter(e => {
            const hireDate = new Date(e.hire_date);
            return hireDate.getMonth() === idx && hireDate.getFullYear() === new Date().getFullYear();
          }).length;
          return { month, hires: count };
        });
        data = monthlyData;
        break;

      case 'expense_summary':
        const expenses = await base44.asServiceRole.entities.ExpenseClaim.list();
        const currentYearExpenses = expenses.filter(e => 
          new Date(e.created_date).getFullYear() === new Date().getFullYear()
        );
        const totalAmount = currentYearExpenses.reduce((sum, e) => sum + (e.total_amount || 0), 0);
        data = {
          total_claims: currentYearExpenses.length,
          total_amount: totalAmount,
          approved: currentYearExpenses.filter(e => e.status === 'approved').length,
          pending: currentYearExpenses.filter(e => e.status === 'pending').length
        };
        break;

      default:
        data = { error: 'Unknown widget type' };
    }

    return Response.json({ success: true, data });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});