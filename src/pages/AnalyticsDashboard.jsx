import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTranslation } from '@/components/TranslationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Save, LayoutDashboard, Share2, Eye } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import DashboardWidget from '@/components/analytics/DashboardWidget';
import WidgetSelector from '@/components/analytics/WidgetSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function AnalyticsDashboard() {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';
  const queryClient = useQueryClient();
  const [widgets, setWidgets] = useState([]);
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [dashboardName, setDashboardName] = useState('');
  const [dashboardDescription, setDashboardDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: dashboards = [], isLoading } = useQuery({
    queryKey: ['custom-dashboards'],
    queryFn: () => base44.entities.CustomDashboard.list('-created_date')
  });

  const saveDashboardMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomDashboard.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['custom-dashboards']);
      setShowSaveDialog(false);
      toast.success('Dashboard saved successfully');
    }
  });

  const updateDashboardMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CustomDashboard.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['custom-dashboards']);
      toast.success('Dashboard updated');
    }
  });

  const deleteDashboardMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomDashboard.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['custom-dashboards']);
      setSelectedDashboard(null);
      setWidgets([]);
      toast.success('Dashboard deleted');
    }
  });

  const myDashboards = dashboards.filter(d => d.owner_email === user?.email);
  const publicDashboards = dashboards.filter(d => d.is_public && d.owner_email !== user?.email);

  const handleAddWidget = (widgetTemplate) => {
    const newWidget = {
      id: `widget-${Date.now()}`,
      ...widgetTemplate
    };
    setWidgets([...widgets, newWidget]);
  };

  const handleRemoveWidget = (widgetId) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setWidgets(items);
  };

  const handleSaveDashboard = () => {
    if (!dashboardName.trim()) {
      toast.error('Please enter a dashboard name');
      return;
    }

    if (selectedDashboard) {
      updateDashboardMutation.mutate({
        id: selectedDashboard.id,
        data: {
          dashboard_name: dashboardName,
          description: dashboardDescription,
          is_public: isPublic,
          widgets: JSON.stringify(widgets)
        }
      });
    } else {
      saveDashboardMutation.mutate({
        dashboard_name: dashboardName,
        description: dashboardDescription,
        owner_email: user?.email,
        is_public: isPublic,
        widgets: JSON.stringify(widgets)
      });
    }
  };

  const handleLoadDashboard = (dashboard) => {
    setSelectedDashboard(dashboard);
    setDashboardName(dashboard.dashboard_name);
    setDashboardDescription(dashboard.description || '');
    setIsPublic(dashboard.is_public);
    setWidgets(dashboard.widgets ? JSON.parse(dashboard.widgets) : []);
    toast.success(`Loaded: ${dashboard.dashboard_name}`);
  };

  const handleNewDashboard = () => {
    setSelectedDashboard(null);
    setWidgets([]);
    setDashboardName('');
    setDashboardDescription('');
    setIsPublic(false);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Analytics Dashboard</h1>
          <p className="text-slate-600">Create custom dashboards with drag-and-drop widgets</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleNewDashboard}>
            <LayoutDashboard className="w-4 h-4 mr-2" />
            New Dashboard
          </Button>
          <Button variant="outline" onClick={() => setShowSaveDialog(true)} disabled={widgets.length === 0}>
            <Save className="w-4 h-4 mr-2" />
            Save Dashboard
          </Button>
          <Button 
            onClick={() => setShowWidgetSelector(true)}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Widget
          </Button>
        </div>
      </div>

      {/* Current Dashboard Info */}
      {selectedDashboard && (
        <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">{selectedDashboard.dashboard_name}</h3>
              <p className="text-sm text-slate-600">{selectedDashboard.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {selectedDashboard.is_public && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Public</span>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => deleteDashboardMutation.mutate(selectedDashboard.id)}
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="builder" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="builder">Dashboard Builder</TabsTrigger>
          <TabsTrigger value="saved">Saved Dashboards ({myDashboards.length})</TabsTrigger>
          <TabsTrigger value="public">Public Dashboards ({publicDashboards.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          {widgets.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-300">
              <CardContent className="p-12 text-center">
                <LayoutDashboard className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Widgets Added</h3>
                <p className="text-slate-500 mb-4">Start building your dashboard by adding widgets</p>
                <Button onClick={() => setShowWidgetSelector(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Widget
                </Button>
              </CardContent>
            </Card>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="widgets">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                  >
                    {widgets.map((widget, index) => (
                      <Draggable key={widget.id} draggableId={widget.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <DashboardWidget
                              widget={widget}
                              onRemove={() => handleRemoveWidget(widget.id)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </TabsContent>

        <TabsContent value="saved">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : myDashboards.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-300">
              <CardContent className="p-12 text-center">
                <LayoutDashboard className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Saved Dashboards</h3>
                <p className="text-slate-500">Create and save your first custom dashboard</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myDashboards.map(dashboard => (
                <Card key={dashboard.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleLoadDashboard(dashboard)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-slate-900">{dashboard.dashboard_name}</h3>
                      {dashboard.is_public && <Share2 className="w-4 h-4 text-blue-500" />}
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{dashboard.description || 'No description'}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{dashboard.widgets ? JSON.parse(dashboard.widgets).length : 0} widgets</span>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-3 h-3 mr-1" />
                        Load
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="public">
          {publicDashboards.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-300">
              <CardContent className="p-12 text-center">
                <Share2 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Public Dashboards</h3>
                <p className="text-slate-500">No dashboards have been shared publicly yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicDashboards.map(dashboard => (
                <Card key={dashboard.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleLoadDashboard(dashboard)}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-2">{dashboard.dashboard_name}</h3>
                    <p className="text-sm text-slate-600 mb-3">{dashboard.description || 'No description'}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>By: {dashboard.owner_email}</span>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Widget Selector */}
      <WidgetSelector
        open={showWidgetSelector}
        onOpenChange={setShowWidgetSelector}
        onSelect={handleAddWidget}
      />

      {/* Save Dashboard Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDashboard ? 'Update Dashboard' : 'Save Dashboard'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Dashboard Name</Label>
              <Input
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                placeholder="e.g., Executive Overview"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={dashboardDescription}
                onChange={(e) => setDashboardDescription(e.target.value)}
                placeholder="Brief description of this dashboard"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Make Public</Label>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
            <Button 
              onClick={handleSaveDashboard} 
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={saveDashboardMutation.isPending || updateDashboardMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {selectedDashboard ? 'Update' : 'Save'} Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}