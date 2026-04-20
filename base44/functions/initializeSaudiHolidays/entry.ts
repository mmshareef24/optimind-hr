import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Initialize Saudi Arabian Public Holidays
 * Sets up official national and Islamic holidays for multiple years
 * 
 * Note: Islamic calendar dates vary by 10-11 days each Gregorian year
 * These are approximate dates and should be updated annually based on moon sighting
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin authentication
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { year, force_recreate = false } = await req.json();
    const targetYear = year || new Date().getFullYear();

    // Check if holidays already exist for this year
    const existingHolidays = await base44.asServiceRole.entities.PublicHoliday.filter({
      year: targetYear
    });

    if (existingHolidays.length > 0 && !force_recreate) {
      return Response.json({
        success: false,
        message: `Holidays for ${targetYear} already exist`,
        existing_count: existingHolidays.length,
        holidays: existingHolidays
      }, { status: 400 });
    }

    // Delete existing if force recreate
    if (force_recreate && existingHolidays.length > 0) {
      for (const holiday of existingHolidays) {
        await base44.asServiceRole.entities.PublicHoliday.delete(holiday.id);
      }
    }

    // Saudi Arabia National Holidays (Fixed Gregorian dates)
    const nationalHolidays = [
      {
        holiday_name: 'Saudi National Day',
        holiday_name_ar: 'اليوم الوطني السعودي',
        date: `${targetYear}-09-23`,
        year: targetYear,
        holiday_type: 'national',
        is_recurring: true,
        is_islamic_calendar: false,
        duration_days: 1,
        is_paid: true,
        description: 'Celebrates the unification of the Kingdom of Saudi Arabia',
        is_active: true
      },
      {
        holiday_name: 'Saudi Foundation Day',
        holiday_name_ar: 'يوم التأسيس السعودي',
        date: `${targetYear}-02-22`,
        year: targetYear,
        holiday_type: 'national',
        is_recurring: true,
        is_islamic_calendar: false,
        duration_days: 1,
        is_paid: true,
        description: 'Celebrates the founding of the first Saudi state in 1727',
        is_active: true
      }
    ];

    // Islamic Holidays (Approximate dates - vary by moon sighting)
    // These dates are for 2025 and should be updated annually
    const islamicHolidays2025 = [
      // Eid Al-Fitr (End of Ramadan) - 4 days
      {
        holiday_name: 'Eid Al-Fitr - Day 1',
        holiday_name_ar: 'عيد الفطر - اليوم الأول',
        date: '2025-03-30',
        year: 2025,
        holiday_type: 'islamic',
        is_recurring: false,
        is_islamic_calendar: true,
        duration_days: 1,
        is_paid: true,
        description: 'First day of Eid Al-Fitr (Shawwal 1)',
        is_active: true
      },
      {
        holiday_name: 'Eid Al-Fitr - Day 2',
        holiday_name_ar: 'عيد الفطر - اليوم الثاني',
        date: '2025-03-31',
        year: 2025,
        holiday_type: 'islamic',
        is_recurring: false,
        is_islamic_calendar: true,
        duration_days: 1,
        is_paid: true,
        description: 'Second day of Eid Al-Fitr',
        is_active: true
      },
      {
        holiday_name: 'Eid Al-Fitr - Day 3',
        holiday_name_ar: 'عيد الفطر - اليوم الثالث',
        date: '2025-04-01',
        year: 2025,
        holiday_type: 'islamic',
        is_recurring: false,
        is_islamic_calendar: true,
        duration_days: 1,
        is_paid: true,
        description: 'Third day of Eid Al-Fitr',
        is_active: true
      },
      {
        holiday_name: 'Eid Al-Fitr - Day 4',
        holiday_name_ar: 'عيد الفطر - اليوم الرابع',
        date: '2025-04-02',
        year: 2025,
        holiday_type: 'islamic',
        is_recurring: false,
        is_islamic_calendar: true,
        duration_days: 1,
        is_paid: true,
        description: 'Fourth day of Eid Al-Fitr',
        is_active: true
      },
      // Arafat Day (Day before Eid Al-Adha)
      {
        holiday_name: 'Arafat Day',
        holiday_name_ar: 'يوم عرفة',
        date: '2025-06-05',
        year: 2025,
        holiday_type: 'islamic',
        is_recurring: false,
        is_islamic_calendar: true,
        duration_days: 1,
        is_paid: true,
        description: 'Day of Arafat during Hajj (Dhul Hijjah 9)',
        is_active: true
      },
      // Eid Al-Adha (Feast of Sacrifice) - 4 days
      {
        holiday_name: 'Eid Al-Adha - Day 1',
        holiday_name_ar: 'عيد الأضحى - اليوم الأول',
        date: '2025-06-06',
        year: 2025,
        holiday_type: 'islamic',
        is_recurring: false,
        is_islamic_calendar: true,
        duration_days: 1,
        is_paid: true,
        description: 'First day of Eid Al-Adha (Dhul Hijjah 10)',
        is_active: true
      },
      {
        holiday_name: 'Eid Al-Adha - Day 2',
        holiday_name_ar: 'عيد الأضحى - اليوم الثاني',
        date: '2025-06-07',
        year: 2025,
        holiday_type: 'islamic',
        is_recurring: false,
        is_islamic_calendar: true,
        duration_days: 1,
        is_paid: true,
        description: 'Second day of Eid Al-Adha',
        is_active: true
      },
      {
        holiday_name: 'Eid Al-Adha - Day 3',
        holiday_name_ar: 'عيد الأضحى - اليوم الثالث',
        date: '2025-06-08',
        year: 2025,
        holiday_type: 'islamic',
        is_recurring: false,
        is_islamic_calendar: true,
        duration_days: 1,
        is_paid: true,
        description: 'Third day of Eid Al-Adha',
        is_active: true
      },
      {
        holiday_name: 'Eid Al-Adha - Day 4',
        holiday_name_ar: 'عيد الأضحى - اليوم الرابع',
        date: '2025-06-09',
        year: 2025,
        holiday_type: 'islamic',
        is_recurring: false,
        is_islamic_calendar: true,
        duration_days: 1,
        is_paid: true,
        description: 'Fourth day of Eid Al-Adha',
        is_active: true
      }
    ];

    // Combine holidays
    let allHolidays = [...nationalHolidays];
    
    if (targetYear === 2025) {
      allHolidays = [...allHolidays, ...islamicHolidays2025];
    }

    // Create holidays
    const createdHolidays = [];
    for (const holiday of allHolidays) {
      const created = await base44.asServiceRole.entities.PublicHoliday.create(holiday);
      createdHolidays.push(created);
    }

    return Response.json({
      success: true,
      message: `Successfully initialized ${createdHolidays.length} holidays for ${targetYear}`,
      year: targetYear,
      holidays_created: createdHolidays.length,
      holidays: createdHolidays,
      note: targetYear === 2025 
        ? 'Islamic holiday dates are approximate and based on astronomical calculations. Actual dates may vary by 1-2 days based on moon sighting.'
        : 'Only national holidays created. Islamic holidays need to be added manually for this year.'
    });

  } catch (error) {
    console.error('Holiday initialization error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});