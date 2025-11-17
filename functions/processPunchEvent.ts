import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { punch_type, location, notes } = await req.json();

    // Get employee record
    const employees = await base44.entities.Employee.filter({ email: user.email });
    if (!employees.length) {
      return Response.json({ error: 'Employee record not found' }, { status: 404 });
    }
    const employee = employees[0];

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS

    // Get today's shift assignment
    const shiftAssignments = await base44.entities.ShiftAssignment.filter({
      employee_id: employee.id,
      status: 'active'
    });

    let assignedShift = null;
    for (const assignment of shiftAssignments) {
      const startDate = new Date(assignment.start_date);
      const endDate = assignment.end_date ? new Date(assignment.end_date) : null;
      const todayDate = new Date(today);
      
      if (todayDate >= startDate && (!endDate || todayDate <= endDate)) {
        const shifts = await base44.entities.Shift.filter({ id: assignment.shift_id });
        if (shifts.length) {
          assignedShift = shifts[0];
          break;
        }
      }
    }

    if (!assignedShift) {
      return Response.json({ 
        error: 'No active shift assigned for today',
        canPunch: false 
      }, { status: 400 });
    }

    // Validate punch time is within shift hours
    const shiftStart = assignedShift.start_time; // HH:MM format
    const shiftEnd = assignedShift.end_time;
    const gracePeriodIn = assignedShift.grace_period_in || 15; // minutes
    const gracePeriodOut = assignedShift.grace_period_out || 15;

    // Convert to minutes for comparison
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const currentMinutes = timeToMinutes(currentTime);
    const shiftStartMinutes = timeToMinutes(shiftStart);
    const shiftEndMinutes = timeToMinutes(shiftEnd);

    // Allow punching from (shift_start - grace_in) to (shift_end + grace_out)
    const allowedStartMinutes = shiftStartMinutes - gracePeriodIn;
    const allowedEndMinutes = shiftEndMinutes + gracePeriodOut;

    if (currentMinutes < allowedStartMinutes || currentMinutes > allowedEndMinutes) {
      return Response.json({ 
        error: `Punch time must be between ${assignedShift.start_time} and ${assignedShift.end_time} (with grace period)`,
        canPunch: false,
        shift: {
          name: assignedShift.shift_name,
          start_time: assignedShift.start_time,
          end_time: assignedShift.end_time
        }
      }, { status: 400 });
    }

    // Get today's punch events
    const todayPunches = await base44.entities.PunchEvent.filter({
      employee_id: employee.id,
      date: today
    });

    // Validate punch sequence (can't clock out without clock in, etc.)
    const lastPunch = todayPunches.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    )[0];

    if (punch_type === 'clock_in' && lastPunch?.punch_type === 'clock_in') {
      return Response.json({ error: 'Already clocked in. Clock out first.' }, { status: 400 });
    }
    if (punch_type === 'clock_out' && lastPunch?.punch_type !== 'clock_in') {
      return Response.json({ error: 'Must clock in before clocking out.' }, { status: 400 });
    }
    if (punch_type === 'break_start' && lastPunch?.punch_type !== 'clock_in') {
      return Response.json({ error: 'Must be clocked in to start break.' }, { status: 400 });
    }
    if (punch_type === 'break_end' && lastPunch?.punch_type !== 'break_start') {
      return Response.json({ error: 'Must start break before ending it.' }, { status: 400 });
    }

    // Create punch event
    const punchEvent = await base44.entities.PunchEvent.create({
      employee_id: employee.id,
      date: today,
      timestamp: now.toISOString(),
      punch_type,
      shift_id: assignedShift.id,
      location: location || null,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      notes: notes || null
    });

    // Update or create attendance record
    let attendance = await base44.entities.Attendance.filter({
      employee_id: employee.id,
      date: today
    });

    if (attendance.length === 0) {
      // Create new attendance record
      await base44.asServiceRole.entities.Attendance.create({
        employee_id: employee.id,
        shift_id: assignedShift.id,
        date: today,
        clock_in: punch_type === 'clock_in' ? currentTime : null,
        scheduled_hours: assignedShift.working_hours || 8,
        status: 'present'
      });
    } else {
      // Update existing attendance
      const attendanceRecord = attendance[0];
      const updates = {};

      if (punch_type === 'clock_in' && !attendanceRecord.clock_in) {
        updates.clock_in = currentTime;
      }
      if (punch_type === 'clock_out') {
        updates.clock_out = currentTime;
        
        // Calculate actual hours
        if (attendanceRecord.clock_in) {
          const clockInMinutes = timeToMinutes(attendanceRecord.clock_in);
          const clockOutMinutes = timeToMinutes(currentTime);
          const workedMinutes = clockOutMinutes - clockInMinutes;
          updates.actual_hours = (workedMinutes / 60).toFixed(2);
        }
      }

      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.Attendance.update(attendanceRecord.id, updates);
      }
    }

    return Response.json({ 
      success: true, 
      punchEvent,
      shift: {
        name: assignedShift.shift_name,
        start_time: assignedShift.start_time,
        end_time: assignedShift.end_time
      }
    });

  } catch (error) {
    console.error('Punch event error:', error);
    return Response.json({ 
      error: error.message || 'Failed to process punch event' 
    }, { status: 500 });
  }
});