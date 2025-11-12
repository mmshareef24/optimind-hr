import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Calculate Leave Days Excluding Weekends and Public Holidays
 * Smart calculation that considers:
 * - Weekends (Friday & Saturday in Saudi Arabia)
 * - Public holidays
 * - Working days only
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { start_date, end_date } = await req.json();

    if (!start_date || !end_date) {
      return Response.json({
        error: 'start_date and end_date are required'
      }, { status: 400 });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (endDate < startDate) {
      return Response.json({
        error: 'end_date must be after start_date'
      }, { status: 400 });
    }

    // Get public holidays in the date range
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    
    let holidays = [];
    for (let year = startYear; year <= endYear; year++) {
      const yearHolidays = await base44.asServiceRole.entities.PublicHoliday.filter({
        year: year,
        is_active: true
      });
      holidays = [...holidays, ...yearHolidays];
    }

    // Create a set of holiday dates for quick lookup
    const holidayDates = new Set(
      holidays.map(h => h.date)
    );

    // Calculate working days
    let workingDays = 0;
    let weekendDays = 0;
    let holidayDays = 0;
    const detailedDays = [];

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday or Saturday
      const isHoliday = holidayDates.has(dateString);

      let dayType = 'working';
      if (isHoliday) {
        dayType = 'holiday';
        holidayDays++;
      } else if (isWeekend) {
        dayType = 'weekend';
        weekendDays++;
      } else {
        workingDays++;
      }

      detailedDays.push({
        date: dateString,
        day_of_week: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
        type: dayType,
        holiday_name: isHoliday ? holidays.find(h => h.date === dateString)?.holiday_name : null
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get overlapping holidays details
    const overlappingHolidays = holidays.filter(h => {
      const holidayDate = new Date(h.date);
      return holidayDate >= startDate && holidayDate <= endDate;
    });

    return Response.json({
      success: true,
      start_date,
      end_date,
      total_days: detailedDays.length,
      working_days: workingDays,
      weekend_days: weekendDays,
      holiday_days: holidayDays,
      leave_days_to_deduct: workingDays,
      overlapping_holidays: overlappingHolidays.map(h => ({
        date: h.date,
        name: h.holiday_name,
        name_ar: h.holiday_name_ar,
        type: h.holiday_type
      })),
      detailed_breakdown: detailedDays
    });

  } catch (error) {
    console.error('Calculate leave days error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});