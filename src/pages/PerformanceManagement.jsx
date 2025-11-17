
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from '@/components/TranslationContext';
import { Target, Star, TrendingUp, CheckCircle, FileText, Plus, Filter, X, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import StatCard from "../components/hrms/StatCard";
import GoalCard from "../components/performance/GoalCard";
import GoalForm from "../components/performance/GoalForm";
import ReviewForm from "../components/performance/ReviewForm";
import ProgressTracker from "../components/performance/ProgressTracker";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";

export default function PerformanceManagement() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter states for goals
  const [goalFilters, setGoalFilters] = useState({
    status: 'all',
    employee: 'all',
    priority: 'all',
    category: 'all'
  });

  // Filter states for reviews
  const [reviewFilters, setReviewFilters] = useState({
    status: 'all',
    employee: 'all',
    reviewPeriod: 'all',
    reviewType: 'all'
  });

  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      setUserRole(userData.role || 'user');
      const employees = await base44.entities.Employee.list();
      const employee = employees.find(e => e.email === userData.email);
      setCurrentUser(employee);
      return employee;
    }
  });

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: goals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ['performance-goals'],
    queryFn: () => base44.entities.PerformanceGoal.list('-created_date'),
  });

  const { data: reviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: ['performance-reviews'],
    queryFn: () => base44.entities.PerformanceReview.list('-created_date'),
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.PerformanceGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['performance-goals']);
      setShowGoalForm(false);
      setEditingGoal(null);
      toast.success(t('goal_created_successfully'));
    },
    onError: () => {
      toast.error(t('failed_to_create_goal'));
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PerformanceGoal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['performance-goals']);
      setShowGoalForm(false);
      setEditingGoal(null);
      toast.success(t('goal_updated_successfully'));
    },
    onError: () => {
      toast.error(t('failed_to_update_goal'));
    }
  });

  const createReviewMutation = useMutation({
    mutationFn: (data) => base44.entities.PerformanceReview.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['performance-reviews']);
      setShowReviewForm(false);
      setSelectedEmployee(null);
      toast.success(t('review_submitted_successfully'));
    },
    onError: () => {
      toast.error(t('failed_to_submit_review'));
    }
  });

  const handleSubmitGoal = (data) => {
    if (editingGoal) {
      updateGoalMutation.mutate({ id: editingGoal.id, data });
    } else {
      createGoalMutation.mutate(data);
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setShowGoalForm(true);
  };

  const handleUpdateProgress = (goalId, updateData) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const completedDate = updateData.status === 'completed' ? new Date().toISOString().split('T')[0] : null;
      updateGoalMutation.mutate({
        id: goalId,
        data: {
          ...goal,
          ...updateData,
          completed_date: completedDate,
          completion_notes: updateData.notes
        }
      });
    }
  };

  const handleStartReview = (employee) => {
    setSelectedEmployee(employee);
    setShowReviewForm(true);
  };

  const handleSubmitReview = (data) => {
    createReviewMutation.mutate({
      ...data,
      employee_id: selectedEmployee.id,
      reviewer_id: currentUser?.id
    });
  };

  // Get unique values for filters
  const reviewPeriods = [...new Set(reviews.map(r => r.review_period).filter(Boolean))];

  // Apply goal filters
  const filteredGoals = goals.filter(goal => {
    const employee = employees.find(e => e.id === goal.employee_id);
    const employeeName = employee ? `${employee.first_name} ${employee.last_name}`.toLowerCase() : '';

    const matchesSearch =
      goal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      goal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employeeName.includes(searchTerm.toLowerCase());

    const matchesStatus = goalFilters.status === 'all' || goal.status === goalFilters.status;
    const matchesEmployee = goalFilters.employee === 'all' || goal.employee_id === goalFilters.employee;
    const matchesPriority = goalFilters.priority === 'all' || goal.priority === goalFilters.priority;
    const matchesCategory = goalFilters.category === 'all' || goal.category === goalFilters.category;

    return matchesSearch && matchesStatus && matchesEmployee && matchesPriority && matchesCategory;
  });

  // Apply review filters
  const filteredReviews = reviews.filter(review => {
    const employee = employees.find(e => e.id === review.employee_id);
    const employeeName = employee ? `${employee.first_name} ${employee.last_name}`.toLowerCase() : '';

    const matchesSearch =
      employeeName.includes(searchTerm.toLowerCase()) ||
      review.review_period?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = reviewFilters.status === 'all' || review.status === reviewFilters.status;
    const matchesEmployee = reviewFilters.employee === 'all' || review.employee_id === reviewFilters.employee;
    const matchesPeriod = reviewFilters.reviewPeriod === 'all' || review.review_period === reviewFilters.reviewPeriod;
    const matchesType = reviewFilters.reviewType === 'all' || review.review_type === reviewFilters.reviewType;

    return matchesSearch && matchesStatus && matchesEmployee && matchesPeriod && matchesType;
  });

  // Clear filters
  const clearGoalFilters = () => {
    setGoalFilters({
      status: 'all',
      employee: 'all',
      priority: 'all',
      category: 'all'
    });
    setSearchTerm(''); // Clear search when clearing filters
  };

  const clearReviewFilters = () => {
    setReviewFilters({
      status: 'all',
      employee: 'all',
      reviewPeriod: 'all',
      reviewType: 'all'
    });
    setSearchTerm(''); // Clear search when clearing filters
  };

  const hasActiveGoalFilters = Object.values(goalFilters).some(f => f !== 'all') || searchTerm !== '';
  const hasActiveReviewFilters = Object.values(reviewFilters).some(f => f !== 'all') || searchTerm !== '';

  // Filter data based on role
  const myGoals = currentUser ? filteredGoals.filter(g => g.employee_id === currentUser.id) : [];
  const myReviews = currentUser ? filteredReviews.filter(r => r.employee_id === currentUser.id) : [];
  const allGoals = userRole === 'admin' ? filteredGoals : myGoals;
  const allReviews = userRole === 'admin' ? filteredReviews : myReviews;

  // Calculate statistics
  const totalGoals = myGoals.length;
  const completedGoals = myGoals.filter(g => g.status === 'completed').length;
  const inProgressGoals = myGoals.filter(g => g.status === 'in_progress').length;
  const avgProgress = myGoals.length > 0 ? (myGoals.reduce((sum, g) => sum + g.progress, 0) / myGoals.length).toFixed(0) : 0;
  const lastReview = myReviews.length > 0 ? myReviews[0] : null;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('performance_management')}</h1>
          <p className="text-slate-600">{t('performance_desc')}</p>
        </div>
        {userRole === 'admin' && (
          <Button
            onClick={() => { setEditingGoal(null); setShowGoalForm(true); }}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" /> {t('set_new_goal')}
          </Button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('total_goals')}
          value={totalGoals}
          icon={Target}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title={t('completed_goals')}
          value={completedGoals}
          icon={CheckCircle}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title={t('in_progress')}
          value={inProgressGoals}
          icon={TrendingUp}
          bgColor="from-amber-500 to-amber-600"
        />
        <StatCard
          title={t('avg_progress')}
          value={`${avgProgress}%`}
          icon={Star}
          bgColor="from-purple-500 to-purple-600"
        />
      </div>

      {/* Last Review Summary */}
      {lastReview && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className={isRTL ? 'text-right' : ''}>
                  <h3 className="text-lg font-bold text-slate-900">{t('last_performance_review')}</h3>
                  <p className="text-sm text-slate-600">
                    {lastReview.review_period} • {format(new Date(lastReview.review_date), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              <div className={isRTL ? 'text-left' : 'text-right'}>
                <p className="text-sm text-slate-600 mb-1">{t('overall_rating')}</p>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-3xl font-bold text-blue-600">{lastReview.overall_rating}</span>
                  <span className="text-slate-600">/ 5.0</span>
                  <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue={userRole === 'admin' ? 'all-goals' : 'my-goals'} className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger
            value="my-goals"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <Target className="w-4 h-4 mr-2" />
            {t('my_goals')}
          </TabsTrigger>
          {userRole === 'admin' && (
            <TabsTrigger
              value="all-goals"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <Target className="w-4 h-4 mr-2" />
              {t('all_goals')}
            </TabsTrigger>
          )}
          <TabsTrigger
            value="reviews"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            {t('reviews')}
          </TabsTrigger>
          {userRole === 'admin' && (
            <TabsTrigger
              value="conduct-review"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <Star className="w-4 h-4 mr-2" />
              {t('conduct_review')}
            </TabsTrigger>
          )}
        </TabsList>

        {/* My Goals Tab */}
        <TabsContent value="my-goals">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              {loadingGoals ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64" />)}
                </div>
              ) : myGoals.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 mb-4">{t('no_goals_set')}</p>
                  <p className="text-sm text-slate-400">{t('manager_will_assign')}</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {myGoals.map((goal) => (
                    <div key={goal.id} className="space-y-2">
                      <GoalCard
                        goal={goal}
                        employee={currentUser}
                        onEdit={handleEditGoal}
                        isManager={false}
                      />
                      <ProgressTracker
                        goal={goal}
                        onUpdate={handleUpdateProgress}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Goals Tab (Admin) - WITH FILTERS */}
        {userRole === 'admin' && (
          <TabsContent value="all-goals">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 space-y-4">
                {/* Search and Filters */}
                <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="relative flex-1">
                    <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400`} />
                    <Input
                      placeholder={t('search_goals_placeholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={isRTL ? 'pr-10' : 'pl-10'}
                    />
                  </div>
                  <Popover open={showFilters} onOpenChange={setShowFilters}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="relative">
                        <Filter className="w-4 h-4 mr-2" />
                        {t('filters')}
                        {Object.values(goalFilters).some(f => f !== 'all') && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-600 rounded-full" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-slate-900">{t('filter_goals')}</h3>
                          {hasActiveGoalFilters && (
                            <Button variant="ghost" size="sm" onClick={clearGoalFilters}>
                              <X className="w-4 h-4 mr-1" />
                              {t('clear')}
                            </Button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">{t('status')}</label>
                            <Select
                              value={goalFilters.status}
                              onValueChange={(val) => setGoalFilters({ ...goalFilters, status: val })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t('all_status')}</SelectItem>
                                <SelectItem value="not_started">{t('not_started')}</SelectItem>
                                <SelectItem value="in_progress">{t('in_progress')}</SelectItem>
                                <SelectItem value="completed">{t('completed')}</SelectItem>
                                <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                                <SelectItem value="overdue">{t('overdue')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">{t('employee')}</label>
                            <Select
                              value={goalFilters.employee}
                              onValueChange={(val) => setGoalFilters({ ...goalFilters, employee: val })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t('all_employees')}</SelectItem>
                                {employees.map(emp => (
                                  <SelectItem key={emp.id} value={emp.id}>
                                    {emp.first_name} {emp.last_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">{t('priority')}</label>
                            <Select
                              value={goalFilters.priority}
                              onValueChange={(val) => setGoalFilters({ ...goalFilters, priority: val })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t('all_priorities')}</SelectItem>
                                <SelectItem value="low">{t('low')}</SelectItem>
                                <SelectItem value="medium">{t('medium')}</SelectItem>
                                <SelectItem value="high">{t('high')}</SelectItem>
                                <SelectItem value="critical">{t('critical')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">{t('category')}</label>
                            <Select
                              value={goalFilters.category}
                              onValueChange={(val) => setGoalFilters({ ...goalFilters, category: val })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t('all_categories')}</SelectItem>
                                <SelectItem value="individual">{t('individual')}</SelectItem>
                                <SelectItem value="team">{t('team')}</SelectItem>
                                <SelectItem value="organizational">{t('organizational')}</SelectItem>
                                <SelectItem value="development">{t('development')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Active Filters Display */}
                {hasActiveGoalFilters && (
                  <div className="flex flex-wrap gap-2 items-center">
                    {searchTerm && (
                      <Badge variant="secondary" className="gap-1">
                        {t('search')}: {searchTerm}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => setSearchTerm('')}
                        />
                      </Badge>
                    )}
                    {Object.entries(goalFilters).map(([key, value]) => {
                      if (value === 'all') return null;
                      const employee = key === 'employee' ? employees.find(e => e.id === value) : null;
                      const displayValue = employee ? `${employee.first_name} ${employee.last_name}` : t(value);
                      return (
                        <Badge key={key} variant="secondary" className="gap-1 capitalize">
                          {t(key)}: {displayValue}
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => setGoalFilters({ ...goalFilters, [key]: 'all' })}
                          />
                        </Badge>
                      );
                    })}
                    {(Object.values(goalFilters).some(f => f !== 'all') || searchTerm !== '') && (
                      <Button variant="ghost" size="sm" onClick={clearGoalFilters} className="h-auto px-2 py-1 text-xs">
                        {t('clear_all')}
                      </Button>
                    )}
                  </div>
                )}

                <p className="text-sm text-slate-600">
                  {t('showing')} <strong>{filteredGoals.length}</strong> {t('of')} <strong>{goals.length}</strong> {t('goals_plural')}
                </p>

                {loadingGoals ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64" />)}
                  </div>
                ) : filteredGoals.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500 mb-4">
                      {hasActiveGoalFilters ? t('no_goals_match_filters') : t('no_goals_set')}
                    </p>
                    {hasActiveGoalFilters ? (
                      <Button variant="outline" onClick={clearGoalFilters}>
                        {t('clear_all_filters')}
                      </Button>
                    ) : (
                      <Button onClick={() => setShowGoalForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('set_first_goal')}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {filteredGoals.map((goal) => {
                      const employee = employees.find(e => e.id === goal.employee_id);
                      return (
                        <div key={goal.id}>
                          <div className="mb-2 flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {employee?.first_name} {employee?.last_name}
                            </Badge>
                          </div>
                          <GoalCard
                            goal={goal}
                            employee={employee}
                            onEdit={handleEditGoal}
                            isManager={true}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Reviews Tab - WITH FILTERS */}
        <TabsContent value="reviews">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 space-y-4">
              {/* Search and Filters */}
              <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="relative flex-1">
                  <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400`} />
                  <Input
                    placeholder={t('search_reviews_placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={isRTL ? 'pr-10' : 'pl-10'}
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="relative">
                      <Filter className="w-4 h-4 mr-2" />
                      {t('filters')}
                      {Object.values(reviewFilters).some(f => f !== 'all') && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-600 rounded-full" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">{t('filter_reviews')}</h3>
                        {hasActiveReviewFilters && (
                          <Button variant="ghost" size="sm" onClick={clearReviewFilters}>
                            <X className="w-4 h-4 mr-1" />
                            {t('clear')}
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-slate-700 mb-1 block">{t('status')}</label>
                          <Select
                            value={reviewFilters.status}
                            onValueChange={(val) => setReviewFilters({ ...reviewFilters, status: val })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">{t('all_status')}</SelectItem>
                              <SelectItem value="draft">{t('draft')}</SelectItem>
                              <SelectItem value="self_assessment_pending">{t('self_assessment_pending')}</SelectItem>
                              <SelectItem value="manager_review_pending">{t('manager_review_pending')}</SelectItem>
                              <SelectItem value="completed">{t('completed')}</SelectItem>
                              <SelectItem value="acknowledged">{t('acknowledged')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {userRole === 'admin' && (
                          <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">{t('employee')}</label>
                            <Select
                              value={reviewFilters.employee}
                              onValueChange={(val) => setReviewFilters({ ...reviewFilters, employee: val })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t('all_employees')}</SelectItem>
                                {employees.map(emp => (
                                  <SelectItem key={emp.id} value={emp.id}>
                                    {emp.first_name} {emp.last_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div>
                          <label className="text-sm font-medium text-slate-700 mb-1 block">{t('review_period')}</label>
                          <Select
                            value={reviewFilters.reviewPeriod}
                            onValueChange={(val) => setReviewFilters({ ...reviewFilters, reviewPeriod: val })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">{t('all_periods')}</SelectItem>
                              {reviewPeriods.map(period => (
                                <SelectItem key={period} value={period}>{period}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-700 mb-1 block">{t('review_type')}</label>
                          <Select
                            value={reviewFilters.reviewType}
                            onValueChange={(val) => setReviewFilters({ ...reviewFilters, reviewType: val })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">{t('all_types')}</SelectItem>
                              <SelectItem value="quarterly">{t('quarterly')}</SelectItem>
                              <SelectItem value="mid_year">{t('mid_year')}</SelectItem>
                              <SelectItem value="annual">{t('annual')}</SelectItem>
                              <SelectItem value="probation">{t('probation')}</SelectItem>
                              <SelectItem value="project_based">{t('project_based')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Active Filters Display */}
              {hasActiveReviewFilters && (
                <div className="flex flex-wrap gap-2 items-center">
                  {searchTerm && (
                    <Badge variant="secondary" className="gap-1">
                      {t('search')}: {searchTerm}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setSearchTerm('')}
                      />
                    </Badge>
                  )}
                  {Object.entries(reviewFilters).map(([key, value]) => {
                    if (value === 'all') return null;
                    const employee = key === 'employee' ? employees.find(e => e.id === value) : null;
                    const displayValue = employee ? `${employee.first_name} ${employee.last_name}` : t(value);
                    return (
                      <Badge key={key} variant="secondary" className="gap-1 capitalize">
                        {t(key)}: {displayValue}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => setReviewFilters({ ...reviewFilters, [key]: 'all' })}
                        />
                      </Badge>
                    );
                  })}
                  {(Object.values(reviewFilters).some(f => f !== 'all') || searchTerm !== '') && (
                    <Button variant="ghost" size="sm" onClick={clearReviewFilters} className="h-auto px-2 py-1 text-xs">
                      {t('clear_all')}
                    </Button>
                  )}
                </div>
              )}

              <p className="text-sm text-slate-600">
                {t('showing')} <strong>{filteredReviews.length}</strong> {t('of')} <strong>{reviews.length}</strong> {t('reviews_plural')}
              </p>

              {loadingReviews ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
                </div>
              ) : filteredReviews.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 mb-4">
                    {hasActiveReviewFilters ? t('no_reviews_match_filters') : t('no_performance_reviews_yet')}
                  </p>
                  {hasActiveReviewFilters && (
                    <Button variant="outline" onClick={clearReviewFilters}>
                      {t('clear_all_filters')}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => {
                    const employee = employees.find(e => e.id === review.employee_id);
                    const reviewer = employees.find(e => e.id === review.reviewer_id);
                    return (
                      <Card key={review.id} className="border border-slate-200">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-slate-900">
                                  {employee?.first_name} {employee?.last_name}
                                </h4>
                                <Badge className={
                                  review.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                  review.status === 'manager_review_pending' ? 'bg-amber-100 text-amber-700' :
                                  'bg-blue-100 text-blue-700'
                                }>
                                  {t(review.status)}
                                </Badge>
                              </div>
                              <div className="grid md:grid-cols-4 gap-3 text-sm text-slate-600">
                                <p><strong>{t('period')}:</strong> {review.review_period}</p>
                                <p><strong>{t('type')}:</strong> {t(review.review_type)}</p>
                                <p><strong>{t('date')}:</strong> {format(new Date(review.review_date), 'MMM dd, yyyy')}</p>
                                <p><strong>{t('rating')}:</strong> {review.overall_rating}/5.0</p>
                              </div>
                              {reviewer && (
                                <p className="text-xs text-slate-500 mt-2">
                                  {t('reviewed_by')}: {reviewer.first_name} {reviewer.last_name}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="text-sm text-slate-500">{t('overall')}</p>
                                <div className="flex items-center gap-1">
                                  <span className="text-2xl font-bold text-blue-600">{review.overall_rating}</span>
                                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conduct Review Tab (Admin) */}
        {userRole === 'admin' && (
          <TabsContent value="conduct-review">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('select_employee_to_review')}</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employees.filter(e => e.status === 'active').map((employee) => {
                    const employeeGoals = goals.filter(g => g.employee_id === employee.id);
                    const completedGoals = employeeGoals.filter(g => g.status === 'completed').length;

                    return (
                      <Card key={employee.id} className="border border-slate-200 hover:shadow-md transition-all">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-slate-900 mb-1">
                            {employee.first_name} {employee.last_name}
                          </h4>
                          <p className="text-sm text-slate-600 mb-3">{employee.job_title}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                            <div className="bg-blue-50 p-2 rounded">
                              <p className="text-blue-600">{t('goals')}</p>
                              <p className="font-semibold">{employeeGoals.length}</p>
                            </div>
                            <div className="bg-emerald-50 p-2 rounded">
                              <p className="text-emerald-600">{t('completed')}</p>
                              <p className="font-semibold">{completedGoals}</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleStartReview(employee)}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            size="sm"
                          >
                            <Star className="w-4 h-4 mr-2" />
                            {t('start_review')}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Goal Form Dialog */}
      <Dialog open={showGoalForm} onOpenChange={setShowGoalForm}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGoal ? t('edit_goal') : t('set_new_goal')}</DialogTitle>
          </DialogHeader>
          <GoalForm
            goal={editingGoal}
            employees={employees.filter(e => e.status === 'active')}
            onSubmit={handleSubmitGoal}
            onCancel={() => {
              setShowGoalForm(false);
              setEditingGoal(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Review Form Dialog */}
      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('performance_review')}</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <ReviewForm
              employee={selectedEmployee}
              goals={goals.filter(g => g.employee_id === selectedEmployee.id)}
              onSubmit={handleSubmitReview}
              onCancel={() => {
                setShowReviewForm(false);
                setSelectedEmployee(null);
              }}
              isSelfAssessment={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
