
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Package, Plus, Search, Filter, X, Laptop, Phone, Printer, Car, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
import AssetCard from "../components/assets/AssetCard";
import AssetForm from "../components/assets/AssetForm";
import AssetDetailsModal from "../components/assets/AssetDetailsModal";
import AssignAssetModal from "../components/assets/AssignAssetModal";
import MaintenanceSchedule from "../components/assets/MaintenanceSchedule";
import { toast } from "sonner";
import { useTranslation } from "react-i18next"; // Added import

export default function Assets() {
  const { t, i18n } = useTranslation(); // Destructure i18n to get language
  const language = i18n.language; // Get current language
  const isRTL = language === 'ar';

  const [searchTerm, setSearchTerm] = useState("");
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    condition: 'all',
    department: 'all'
  });

  const queryClient = useQueryClient();

  // Fetch data
  const { data: assets = [], isLoading: loadingAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list('-created_date'),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['asset-assignments'],
    queryFn: () => base44.entities.AssetAssignment.list('-assigned_date'),
  });

  const { data: maintenanceRecords = [] } = useQuery({
    queryKey: ['maintenance-records'],
    queryFn: () => base44.entities.MaintenanceRecord.list('-maintenance_date'),
  });

  // Mutations
  const createAssetMutation = useMutation({
    mutationFn: (data) => base44.entities.Asset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      setShowAssetForm(false);
      setEditingAsset(null);
      toast.success(t('asset_created_successfully'));
    },
    onError: () => toast.error(t('failed_to_create_asset'))
  });

  const updateAssetMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Asset.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      setShowAssetForm(false);
      setShowDetailsModal(false);
      setEditingAsset(null);
      toast.success(t('asset_updated_successfully'));
    },
    onError: () => toast.error(t('failed_to_update_asset'))
  });

  const assignAssetMutation = useMutation({
    mutationFn: async (assignmentData) => {
      // Create assignment record
      await base44.entities.AssetAssignment.create(assignmentData);
      // Update asset status
      const asset = assets.find(a => a.id === assignmentData.asset_id);
      await base44.entities.Asset.update(assignmentData.asset_id, {
        ...asset,
        status: 'assigned',
        assigned_to: assignmentData.employee_id,
        assignment_date: assignmentData.assigned_date
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      queryClient.invalidateQueries(['asset-assignments']);
      setShowAssignModal(false);
      setSelectedAsset(null);
      toast.success(t('asset_assigned_successfully'));
    },
    onError: () => toast.error(t('failed_to_assign_asset'))
  });

  const returnAssetMutation = useMutation({
    mutationFn: async ({ assignmentId, assetId, condition }) => {
      const assignment = assignments.find(a => a.id === assignmentId);
      // Update assignment
      await base44.entities.AssetAssignment.update(assignmentId, {
        ...assignment,
        status: 'returned',
        actual_return_date: new Date().toISOString().split('T')[0],
        condition_at_return: condition
      });
      // Update asset
      const asset = assets.find(a => a.id === assetId);
      await base44.entities.Asset.update(assetId, {
        ...asset,
        status: 'available',
        assigned_to: null,
        condition: condition
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      queryClient.invalidateQueries(['asset-assignments']);
      toast.success(t('asset_returned_successfully'));
    },
    onError: () => toast.error(t('failed_to_return_asset'))
  });

  // Filter and search
  const departments = [...new Set(assets.map(a => a.department).filter(Boolean))];

  const filteredAssets = assets.filter(asset => {
    const matchesSearch =
      asset.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.model?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filters.category === 'all' || asset.category === filters.category;
    const matchesStatus = filters.status === 'all' || asset.status === filters.status;
    const matchesCondition = filters.condition === 'all' || asset.condition === filters.condition;
    const matchesDepartment = filters.department === 'all' || asset.department === filters.department;

    return matchesSearch && matchesCategory && matchesStatus && matchesCondition && matchesDepartment;
  });

  const clearFilters = () => {
    setFilters({
      category: 'all',
      status: 'all',
      condition: 'all',
      department: 'all'
    });
  };

  const hasActiveFilters = Object.values(filters).some(f => f !== 'all');

  // Statistics
  const totalAssets = assets.length;
  const availableAssets = assets.filter(a => a.status === 'available').length;
  const assignedAssets = assets.filter(a => a.status === 'assigned').length;
  const maintenanceNeeded = assets.filter(a => a.status === 'in_maintenance').length;
  const totalValue = assets.reduce((sum, a) => sum + (a.current_value || a.purchase_cost || 0), 0);

  // Upcoming maintenance
  const upcomingMaintenance = maintenanceRecords.filter(m =>
    m.status === 'scheduled' &&
    new Date(m.maintenance_date) > new Date()
  ).slice(0, 5);

  const handleSubmit = (data) => {
    if (editingAsset) {
      updateAssetMutation.mutate({ id: editingAsset.id, data });
    } else {
      createAssetMutation.mutate(data);
    }
  };

  const handleAssignAsset = (asset) => {
    setSelectedAsset(asset);
    setShowAssignModal(true);
  };

  const handleViewDetails = (asset) => {
    setSelectedAsset(asset);
    setShowDetailsModal(true);
  };

  const handleEditAsset = (asset) => {
    setEditingAsset(asset);
    setShowAssetForm(true);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('assets_facilities')}</h1>
          <p className="text-slate-600">{t('assets_desc')}</p>
        </div>
        <Button
          onClick={() => { setEditingAsset(null); setShowAssetForm(true); }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" /> {t('add_asset')}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('total_assets')}
          value={totalAssets}
          icon={Package}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title={t('available')}
          value={availableAssets}
          icon={Laptop}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title={t('assigned')}
          value={assignedAssets}
          icon={Phone}
          bgColor="from-purple-500 to-purple-600"
        />
        <StatCard
          title={t('total_value')}
          value={`${totalValue.toLocaleString()} SAR`}
          icon={Package}
          bgColor="from-amber-500 to-amber-600"
        />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="all-assets" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger
            value="all-assets"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Package className="w-4 h-4 mr-2" />
            {t('all_assets')}
          </TabsTrigger>
          <TabsTrigger
            value="assignments"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <Laptop className="w-4 h-4 mr-2" />
            {t('assignments')}
          </TabsTrigger>
          <TabsTrigger
            value="maintenance"
            className="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
          >
            <Wrench className="w-4 h-4 mr-2" />
            {t('maintenance')}
          </TabsTrigger>
        </TabsList>

        {/* All Assets Tab */}
        <TabsContent value="all-assets">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              {/* Search and Filter */}
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400`} />
                    <Input
                      placeholder={t('search_assets_placeholder')}
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
                        {hasActiveFilters && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96" align="end">
                      <div className="space-y-4">
                        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <h3 className="font-semibold text-slate-900">{t('filter_assets')}</h3>
                          {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                              <X className="w-4 h-4 mr-1" />
                              {t('clear_all')}
                            </Button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">{t('category')}</label>
                            <Select
                              value={filters.category}
                              onValueChange={(val) => setFilters({ ...filters, category: val })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t('all_categories')}</SelectItem>
                                <SelectItem value="computer">{t('category_computer')}</SelectItem>
                                <SelectItem value="laptop">{t('category_laptop')}</SelectItem>
                                <SelectItem value="phone">{t('category_phone')}</SelectItem>
                                <SelectItem value="tablet">{t('category_tablet')}</SelectItem>
                                <SelectItem value="monitor">{t('category_monitor')}</SelectItem>
                                <SelectItem value="printer">{t('category_printer')}</SelectItem>
                                <SelectItem value="furniture">{t('category_furniture')}</SelectItem>
                                <SelectItem value="vehicle">{t('category_vehicle')}</SelectItem>
                                <SelectItem value="equipment">{t('category_equipment')}</SelectItem>
                                <SelectItem value="software">{t('category_software')}</SelectItem>
                                <SelectItem value="other">{t('category_other')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">{t('status')}</label>
                            <Select
                              value={filters.status}
                              onValueChange={(val) => setFilters({ ...filters, status: val })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t('all_status')}</SelectItem>
                                <SelectItem value="available">{t('status_available')}</SelectItem>
                                <SelectItem value="assigned">{t('status_assigned')}</SelectItem>
                                <SelectItem value="in_maintenance">{t('status_in_maintenance')}</SelectItem>
                                <SelectItem value="retired">{t('status_retired')}</SelectItem>
                                <SelectItem value="lost">{t('status_lost')}</SelectItem>
                                <SelectItem value="damaged">{t('status_damaged')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">{t('condition')}</label>
                            <Select
                              value={filters.condition}
                              onValueChange={(val) => setFilters({ ...filters, condition: val })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t('all_conditions')}</SelectItem>
                                <SelectItem value="excellent">{t('condition_excellent')}</SelectItem>
                                <SelectItem value="good">{t('condition_good')}</SelectItem>
                                <SelectItem value="fair">{t('condition_fair')}</SelectItem>
                                <SelectItem value="poor">{t('condition_poor')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {departments.length > 0 && (
                            <div>
                              <label className="text-sm font-medium text-slate-700 mb-1 block">{t('department')}</label>
                              <Select
                                value={filters.department}
                                onValueChange={(val) => setFilters({ ...filters, department: val })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">{t('all_departments')}</SelectItem>
                                  {departments.map(dept => (
                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-2">
                    {filters.category !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        {t('category')}: {filters.category}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => setFilters({ ...filters, category: 'all' })}
                        />
                      </Badge>
                    )}
                    {filters.status !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        {t('status')}: {filters.status}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => setFilters({ ...filters, status: 'all' })}
                        />
                      </Badge>
                    )}
                    {filters.condition !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        {t('condition')}: {filters.condition}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => setFilters({ ...filters, condition: 'all' })}
                        />
                      </Badge>
                    )}
                    {filters.department !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        {t('department')}: {filters.department}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => setFilters({ ...filters, department: 'all' })}
                        />
                      </Badge>
                    )}
                  </div>
                )}

                {/* Results Count */}
                <div className="text-sm text-slate-600">
                  {t('showing')} <strong>{filteredAssets.length}</strong> {t('of')} <strong>{totalAssets}</strong> {t('assets')}
                </div>
              </div>

              {/* Assets Grid */}
              {loadingAssets ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64" />)}
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 mb-2">
                    {hasActiveFilters || searchTerm ? t('no_assets_match') : t('no_assets_found')}
                  </p>
                  {(hasActiveFilters || searchTerm) && (
                    <Button variant="outline" onClick={() => {
                      clearFilters();
                      setSearchTerm('');
                    }}>
                      {t('clear_all_filters')}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAssets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      employees={employees}
                      onViewDetails={handleViewDetails}
                      onEdit={handleEditAsset}
                      onAssign={handleAssignAsset}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              {/* Assignment history and management */}
              <div className="space-y-4">
                {assignments.filter(a => a.status === 'active').map(assignment => {
                  const asset = assets.find(a => a.id === assignment.asset_id);
                  const employee = employees.find(e => e.id === assignment.employee_id);
                  return (
                    <Card key={assignment.id} className="border-l-4 border-l-purple-500">
                      <CardContent className="p-5">
                        <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                            <h4 className="font-semibold text-slate-900 mb-1">
                              {asset?.asset_name}
                            </h4>
                            <p className="text-sm text-slate-600 mb-2">
                              {t('assigned_to')}: {employee?.first_name} {employee?.last_name}
                            </p>
                            <div className="grid md:grid-cols-3 gap-3 text-sm">
                              <div>
                                <span className="text-slate-500">{t('assigned_date')}</span>
                                <p className="font-medium">{assignment.assigned_date}</p>
                              </div>
                              <div>
                                <span className="text-slate-500">{t('condition')}</span>
                                <p className="font-medium capitalize">{assignment.condition_at_assignment}</p>
                              </div>
                              {assignment.expected_return_date && (
                                <div>
                                  <span className="text-slate-500">{t('expected_return')}</span>
                                  <p className="font-medium">{assignment.expected_return_date}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const condition = prompt(t('prompt_return_condition'), 'good');
                              if (condition) {
                                returnAssetMutation.mutate({
                                  assignmentId: assignment.id,
                                  assetId: asset.id,
                                  condition
                                });
                              }
                            }}
                          >
                            {t('mark_returned')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {assignments.filter(a => a.status === 'active').length === 0 && (
                  <div className="text-center py-12">
                    <Laptop className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">{t('no_active_assignments')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <MaintenanceSchedule
            assets={assets}
            maintenanceRecords={maintenanceRecords}
            onScheduleMaintenance={(assetId, data) => {
              // Handle maintenance scheduling
              toast.info(t('maintenance_scheduling_coming_soon'));
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Asset Form Dialog */}
      <Dialog open={showAssetForm} onOpenChange={setShowAssetForm}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAsset ? t('edit_asset') : t('add_new_asset')}
            </DialogTitle>
          </DialogHeader>
          <AssetForm
            asset={editingAsset}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowAssetForm(false);
              setEditingAsset(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Assign Asset Modal */}
      {selectedAsset && (
        <AssignAssetModal
          open={showAssignModal}
          onOpenChange={setShowAssignModal}
          asset={selectedAsset}
          employees={employees}
          onAssign={(assignmentData) => assignAssetMutation.mutate(assignmentData)}
        />
      )}

      {/* Asset Details Modal */}
      {selectedAsset && (
        <AssetDetailsModal
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
          asset={selectedAsset}
          employees={employees}
          assignments={assignments.filter(a => a.asset_id === selectedAsset.id)}
          maintenanceRecords={maintenanceRecords.filter(m => m.asset_id === selectedAsset.id)}
          onEdit={handleEditAsset}
          onAssign={handleAssignAsset}
        />
      )}
    </div>
  );
}
