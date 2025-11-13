
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { Calendar, Plus, RefreshCw, Star, Globe, BookOpen, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import StatCard from "../components/hrms/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, isToday, isFuture, isPast } from "date-fns";

export default function PublicHolidays() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  
  const [showInitDialog, setShowInitDialog] = useState(false);
  const [showHolidayDialog, setShowHolidayDialog] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [holidayFormData, setHolidayFormData] = useState({
    holiday_name: '',
    holiday_name_ar: '',
    date: '',
    year: new Date().getFullYear(),
    holiday_type: 'national',
    is_recurring: true,
    is_islamic_calendar: false,
    duration_days: 1,
    is_paid: true,
    description: '',
    is_active: true
  });

  const queryClient = useQueryClient();

  // Fetch holidays
  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['public-holidays', selectedYear],
    queryFn: () => base44.entities.PublicHoliday.filter({ year: selectedYear }),
  });

  // Initialize holidays mutation
  const initHolidaysMutation = useMutation({
    mutationFn: async ({ year, force }) => {
      const response = await base44.functions.invoke('initializeSaudiHolidays', {
        year,
        force_recreate: force
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['public-holidays']);
      setShowInitDialog(false);
      toast.success(`${data.holidays_created} ${t('holidays_initialized_for')} ${data.year}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('failed_to_initialize_holidays'));
    }
  });

  // Create/Update holiday mutations
  const createHolidayMutation = useMutation({
    mutationFn: (data) => base44.entities.PublicHoliday.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['public-holidays']);
      setShowHolidayDialog(false);
      resetForm();
      toast.success(t('holiday_created_successfully'));
    },
    onError: () => toast.error(t('failed_to_create_holiday'))
  });

  const updateHolidayMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PublicHoliday.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['public-holidays']);
      setShowHolidayDialog(false);
      setEditingHoliday(null);
      resetForm();
      toast.success(t('holiday_updated_successfully'));
    },
    onError: () => toast.error(t('failed_to_update_holiday'))
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: (id) => base44.entities.PublicHoliday.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['public-holidays']);
      toast.success(t('holiday_deleted'));
    },
    onError: () => toast.error(t('failed_to_delete_holiday'))
  });

  const resetForm = () => {
    setHolidayFormData({
      holiday_name: '',
      holiday_name_ar: '',
      date: '',
      year: selectedYear,
      holiday_type: 'national',
      is_recurring: true,
      is_islamic_calendar: false,
      duration_days: 1,
      is_paid: true,
      description: '',
      is_active: true
    });
  };

  const handleInitHolidays = () => {
    initHolidaysMutation.mutate({ year: selectedYear, force: false });
  };

  const handleSaveHoliday = () => {
    if (editingHoliday) {
      updateHolidayMutation.mutate({ id: editingHoliday.id, data: holidayFormData });
    } else {
      createHolidayMutation.mutate(holidayFormData);
    }
  };

  const handleEditHoliday = (holiday) => {
    setEditingHoliday(holiday);
    setHolidayFormData(holiday);
    setShowHolidayDialog(true);
  };

  // Filter and categorize holidays
  const nationalHolidays = holidays.filter(h => h.holiday_type === 'national');
  const islamicHolidays = holidays.filter(h => h.holiday_type === 'islamic');
  const upcomingHolidays = holidays.filter(h => isFuture(new Date(h.date))).sort((a, b) => new Date(a.date) - new Date(b.date));
  const todayHoliday = holidays.find(h => isToday(new Date(h.date)));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('public_holidays')}</h1>
          <p className="text-slate-600">{t('public_holidays_desc')}</p>
        </div>
        <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {holidays.length === 0 && (
            <Button onClick={() => setShowInitDialog(true)} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              {t('initialize_year')} {selectedYear}
            </Button>
          )}
          <Button onClick={() => { setEditingHoliday(null); setShowHolidayDialog(true); }} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <Plus className="w-4 h-4" />
            {t('add_holiday')}
          </Button>
        </div>
      </div>

      {/* Today's Holiday Alert */}
      {todayHoliday && (
        <Alert className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
          <Star className="h-5 w-5 text-emerald-600" />
          <AlertDescription className={`text-emerald-900 ${isRTL ? 'text-right' : ''}`}>
            <strong className="text-lg">🎉 {t('today_is')} {todayHoliday.holiday_name}!</strong>
            <p className="text-sm mt-1">{holiday.holiday_name_ar ? holiday.holiday_name_ar : holiday.holiday_name} • {todayHoliday.description}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatCard
          title={t('total_holidays')}
          value={holidays.length}
          icon={Calendar}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title={t('national_days')}
          value={nationalHolidays.length}
          icon={Globe}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title={t('islamic_holidays')}
          value={islamicHolidays.length}
          icon={Star}
          bgColor="from-purple-500 to-purple-600"
        />
        <StatCard
          title={t('upcoming')}
          value={upcomingHolidays.length}
          icon={BookOpen}
          bgColor="from-amber-500 to-amber-600"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-white border-2 border-slate-200 p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            {t('all_holidays')} ({holidays.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            {t('upcoming')} ({upcomingHolidays.length})
          </TabsTrigger>
          <TabsTrigger value="national" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            {t('national')} ({nationalHolidays.length})
          </TabsTrigger>
          <TabsTrigger value="islamic" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            {t('islamic')} ({islamicHolidays.length})
          </TabsTrigger>
        </TabsList>

        {/* All Holidays */}
        <TabsContent value="all">
          <HolidayList 
            holidays={holidays} 
            isLoading={isLoading}
            onEdit={handleEditHoliday}
            onDelete={(id) => deleteHolidayMutation.mutate(id)}
          />
        </TabsContent>

        {/* Upcoming Holidays */}
        <TabsContent value="upcoming">
          <HolidayList 
            holidays={upcomingHolidays} 
            isLoading={isLoading}
            onEdit={handleEditHoliday}
            onDelete={(id) => deleteHolidayMutation.mutate(id)}
          />
        </TabsContent>

        {/* National Holidays */}
        <TabsContent value="national">
          <HolidayList 
            holidays={nationalHolidays} 
            isLoading={isLoading}
            onEdit={handleEditHoliday}
            onDelete={(id) => deleteHolidayMutation.mutate(id)}
          />
        </TabsContent>

        {/* Islamic Holidays */}
        <TabsContent value="islamic">
          <HolidayList 
            holidays={islamicHolidays} 
            isLoading={isLoading}
            onEdit={handleEditHoliday}
            onDelete={(id) => deleteHolidayMutation.mutate(id)}
          />
        </TabsContent>
      </Tabs>

      {/* Initialize Dialog */}
      <Dialog open={showInitDialog} onOpenChange={setShowInitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('initialize_holidays_for')} {selectedYear}</DialogTitle>
          </DialogHeader>
          <Alert className="border-blue-200 bg-blue-50">
            <Calendar className="h-4 w-4 text-blue-600" />
            <AlertDescription className={`text-blue-900 text-sm ${isRTL ? 'text-right' : ''}`}>
              {t('initialize_holidays_desc')}
              <ul className="list-disc ml-4 mt-2 space-y-1">
                <li>{t('national_day')}</li>
                <li>{t('foundation_day')}</li>
                <li>{t('eid_al_fitr')}</li>
                <li>{t('arafat_eid_al_adha')}</li>
              </ul>
              <p className="mt-2 text-xs">{t('islamic_holiday_dates_note')}</p>
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInitDialog(false)}>{t('cancel')}</Button>
            <Button 
              onClick={handleInitHolidays}
              disabled={initHolidaysMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {initHolidaysMutation.isPending ? t('initializing') : t('initialize_holidays')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Holiday Form Dialog */}
      <Dialog open={showHolidayDialog} onOpenChange={setShowHolidayDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className={isRTL ? 'text-right' : ''}>
              {editingHoliday ? t('edit') : t('add')} {t('holiday')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className={isRTL ? 'text-right block' : ''}>{t('holiday_name_en')} *</Label>
                <Input
                  value={holidayFormData.holiday_name}
                  onChange={(e) => setHolidayFormData({...holidayFormData, holiday_name: e.target.value})}
                  placeholder="e.g., National Day"
                />
              </div>
              <div>
                <Label className={isRTL ? 'text-right block' : ''}>{t('holiday_name_ar')}</Label>
                <Input
                  value={holidayFormData.holiday_name_ar}
                  onChange={(e) => setHolidayFormData({...holidayFormData, holiday_name_ar: e.target.value})}
                  placeholder="e.g., اليوم الوطني"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className={isRTL ? 'text-right block' : ''}>{t('date')} *</Label>
                <Input
                  type="date"
                  value={holidayFormData.date}
                  onChange={(e) => {
                    const date = e.target.value;
                    const year = new Date(date).getFullYear();
                    setHolidayFormData({...holidayFormData, date, year});
                  }}
                />
              </div>
              <div>
                <Label className={isRTL ? 'text-right block' : ''}>{t('holiday_type')} *</Label>
                <Select
                  value={holidayFormData.holiday_type}
                  onValueChange={(val) => setHolidayFormData({...holidayFormData, holiday_type: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national">{t('national')}</SelectItem>
                    <SelectItem value="islamic">{t('islamic')}</SelectItem>
                    <SelectItem value="other">{t('other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className={isRTL ? 'text-right block' : ''}>{t('description')}</Label>
              <Input
                value={holidayFormData.description}
                onChange={(e) => setHolidayFormData({...holidayFormData, description: e.target.value})}
                placeholder={t('holiday_description_placeholder')}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Label>{t('recurring_annually')}</Label>
                <Switch
                  checked={holidayFormData.is_recurring}
                  onCheckedChange={(checked) => setHolidayFormData({...holidayFormData, is_recurring: checked})}
                />
              </div>
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Label>{t('islamic_calendar')}</Label>
                <Switch
                  checked={holidayFormData.is_islamic_calendar}
                  onCheckedChange={(checked) => setHolidayFormData({...holidayFormData, is_islamic_calendar: checked})}
                />
              </div>
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Label>{t('paid_holiday')}</Label>
                <Switch
                  checked={holidayFormData.is_paid}
                  onCheckedChange={(checked) => setHolidayFormData({...holidayFormData, is_paid: checked})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowHolidayDialog(false); resetForm(); }}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSaveHoliday}
              disabled={createHolidayMutation.isPending || updateHolidayMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {editingHoliday ? t('update_holiday') : t('create_holiday')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HolidayList({ holidays, isLoading, onEdit, onDelete }) {
  const { t } = useTranslation();
  
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
      </div>
    );
  }

  if (holidays.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">{t('no_holidays_found')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {holidays.map((holiday) => (
        <HolidayCard
          key={holiday.id}
          holiday={holiday}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function HolidayCard({ holiday, onEdit, onDelete }) {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  
  const holidayDate = new Date(holiday.date);
  const isUpcoming = isFuture(holidayDate);
  const isPassed = isPast(holidayDate) && !isToday(holidayDate);
  const isTodayHoliday = isToday(holidayDate);

  const typeColors = {
    national: 'from-blue-500 to-blue-600',
    islamic: 'from-purple-500 to-purple-600',
    other: 'from-slate-500 to-slate-600'
  };

  const typeIcons = {
    national: '🇸🇦',
    islamic: '🌙',
    other: '📅'
  };

  return (
    <Card className={`border-2 ${isTodayHoliday ? 'border-emerald-400 shadow-xl' : 'border-slate-200'} hover:shadow-lg transition-all`}>
      <CardContent className="p-6">
        <div className={`flex justify-between items-start mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${typeColors[holiday.holiday_type]} flex items-center justify-center shadow-lg text-2xl`}>
            {typeIcons[holiday.holiday_type]}
          </div>
          <div className="flex gap-2">
            {isTodayHoliday && <Badge className="bg-emerald-500 text-white">{t('today')}!</Badge>}
            {isUpcoming && !isTodayHoliday && <Badge className="bg-blue-100 text-blue-700">{t('upcoming')}</Badge>}
            {isPassed && <Badge className="bg-slate-100 text-slate-600">{t('past')}</Badge>}
          </div>
        </div>

        <h3 className={`font-bold text-slate-900 text-lg mb-1 ${isRTL ? 'text-right' : ''}`}>{holiday.holiday_name}</h3>
        {holiday.holiday_name_ar && (
          <p className="text-sm text-slate-600 mb-3 text-right" dir="rtl">{holiday.holiday_name_ar}</p>
        )}

        <div className="p-3 bg-slate-50 rounded-lg mb-3">
          <p className="text-2xl font-bold text-slate-900 mb-1">
            {format(holidayDate, 'MMM dd, yyyy')}
          </p>
          <p className="text-xs text-slate-500">{format(holidayDate, 'EEEE')}</p>
        </div>

        {holiday.description && (
          <p className={`text-xs text-slate-600 mb-3 p-2 bg-blue-50 rounded ${isRTL ? 'text-right border-r-2 border-l-0' : 'border-l-2'} border-blue-400`}>
            {holiday.description}
          </p>
        )}

        <div className="flex gap-2 text-xs mb-3">
          <Badge variant="outline" className="capitalize">{t(holiday.holiday_type)}</Badge>
          {holiday.is_paid && <Badge className="bg-emerald-100 text-emerald-700">{t('paid')}</Badge>}
          {holiday.is_islamic_calendar && <Badge className="bg-purple-100 text-purple-700">{t('hijri')}</Badge>}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(holiday)} className="flex-1">
            <Edit className="w-3 h-3 mr-1" />
            {t('edit')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(holiday.id)} className="text-red-600 hover:bg-red-50">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
