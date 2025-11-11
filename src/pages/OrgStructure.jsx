import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Network, Users, TrendingUp, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import OrgChart from "../components/org/OrgChart";
import OrgListView from "../components/org/OrgListView";
import OrgChartControls from "../components/org/OrgChartControls";
import EmployeeDetailsModal from "../components/org/EmployeeDetailsModal";
import ManageReportingModal from "../components/org/ManageReportingModal";
import StatCard from "../components/hrms/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function OrgStructure() {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReportingModal, setShowReportingModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('chart');
  const [zoomLevel, setZoomLevel] = useState(1);
  const chartRef = useRef(null);

  const queryClient = useQueryClient();

  const { data: employees = [], isLoading, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      setShowReportingModal(false);
      toast.success('Reporting relationship updated successfully');
    },
    onError: () => {
      toast.error('Failed to update reporting relationship');
    }
  });

  // Filter employees based on search
  const filteredEmployees = employees.filter(emp =>
    `${emp.first_name} ${emp.last_name} ${emp.job_title} ${emp.department}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Get employee's manager
  const getManager = (employee) => {
    return employees.find(e => e.id === employee?.manager_id);
  };

  // Get employee's subordinates
  const getSubordinates = (employeeId) => {
    return employees.filter(e => e.manager_id === employeeId);
  };

  // Handle node click
  const handleNodeClick = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);
  };

  // Handle edit employee
  const handleEditEmployee = (employee) => {
    setShowDetailsModal(false);
    // Navigate to employee edit page or show edit modal
    toast.info('Edit functionality - navigate to employee management');
  };

  // Handle manage reporting
  const handleManageReporting = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(false);
    setShowReportingModal(true);
  };

  // Save reporting relationship
  const handleSaveReporting = (employeeId, managerId) => {
    const employee = employees.find(e => e.id === employeeId);
    updateEmployeeMutation.mutate({
      id: employeeId,
      data: {
        ...employee,
        manager_id: managerId
      }
    });
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleFitToScreen = () => {
    setZoomLevel(1);
  };

  // Export org chart
  const handleExport = () => {
    // Generate a simple text-based org chart
    const generateTextChart = (employee, level = 0) => {
      const indent = '  '.repeat(level);
      const subordinates = getSubordinates(employee.id);
      let text = `${indent}${employee.first_name} ${employee.last_name} - ${employee.job_title}\n`;
      subordinates.forEach(sub => {
        text += generateTextChart(sub, level + 1);
      });
      return text;
    };

    const roots = employees.filter(emp => !emp.manager_id || !employees.find(e => e.id === emp.manager_id));
    let chartText = 'ORGANIZATIONAL CHART\n\n';
    roots.forEach(root => {
      chartText += generateTextChart(root);
    });

    // Download as text file
    const blob = new Blob([chartText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'org-chart.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Org chart exported successfully');
  };

  // Calculate statistics
  const totalEmployees = employees.length;
  const managers = new Set(employees.map(e => e.manager_id).filter(Boolean)).size;
  const departments = new Set(employees.map(e => e.department).filter(Boolean)).size;
  const topLevel = employees.filter(e => !e.manager_id || !employees.find(emp => emp.id === e.manager_id)).length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Organization Structure</h1>
        <p className="text-slate-600">Visualize and manage your company's hierarchy</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={totalEmployees}
          icon={Users}
          bgColor="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Managers"
          value={managers}
          icon={TrendingUp}
          bgColor="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Departments"
          value={departments}
          icon={Layers}
          bgColor="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Top Level"
          value={topLevel}
          icon={Network}
          bgColor="from-amber-500 to-amber-600"
        />
      </div>

      {/* Controls */}
      <OrgChartControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToScreen={handleFitToScreen}
        onRefresh={refetch}
        onExport={handleExport}
      />

      {/* Main Content */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 space-y-4">
              <Skeleton className="h-32 w-full" />
              <div className="flex gap-4 justify-center">
                <Skeleton className="h-32 w-64" />
                <Skeleton className="h-32 w-64" />
                <Skeleton className="h-32 w-64" />
              </div>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Network className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">
                {searchTerm ? 'No employees found matching your search' : 'No employees to display'}
              </p>
            </div>
          ) : viewMode === 'chart' ? (
            <div
              ref={chartRef}
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top center',
                transition: 'transform 0.3s ease'
              }}
            >
              <OrgChart
                employees={filteredEmployees}
                onNodeClick={handleNodeClick}
              />
            </div>
          ) : (
            <div className="p-6">
              <OrgListView
                employees={filteredEmployees}
                onEmployeeClick={handleNodeClick}
                onManageReporting={handleManageReporting}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Details Modal */}
      <EmployeeDetailsModal
        employee={selectedEmployee}
        manager={getManager(selectedEmployee)}
        subordinates={getSubordinates(selectedEmployee?.id)}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onEdit={handleManageReporting}
      />

      {/* Manage Reporting Modal */}
      <ManageReportingModal
        employee={selectedEmployee}
        employees={employees}
        isOpen={showReportingModal}
        onClose={() => setShowReportingModal(false)}
        onSave={handleSaveReporting}
      />
    </div>
  );
}