import React, { useState, useEffect } from 'react';
import OrgChartNode from './OrgChartNode';
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

export default function OrgChart({ employees, onNodeClick }) {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [organizationTree, setOrganizationTree] = useState([]);
  const [hoveredConnection, setHoveredConnection] = useState(null);

  useEffect(() => {
    buildOrganizationTree();
  }, [employees]);

  const buildOrganizationTree = () => {
    if (!employees || employees.length === 0) return;

    const employeeIds = new Set(employees.map(e => e.id));
    const roots = employees.filter(emp => 
      !emp.manager_id || !employeeIds.has(emp.manager_id)
    );

    // Auto-expand first two levels
    const firstLevelIds = new Set(roots.map(r => r.id));
    const secondLevelIds = new Set();
    
    roots.forEach(root => {
      const subs = getSubordinates(root.id);
      subs.forEach(sub => secondLevelIds.add(sub.id));
    });

    setExpandedNodes(new Set([...firstLevelIds, ...secondLevelIds]));
    setOrganizationTree(roots);
  };

  const getSubordinates = (managerId) => {
    return employees.filter(emp => emp.manager_id === managerId);
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        // When collapsing, also collapse all descendants
        const collapseDescendants = (id) => {
          newSet.delete(id);
          const subs = getSubordinates(id);
          subs.forEach(sub => collapseDescendants(sub.id));
        };
        collapseDescendants(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const renderTree = (employee, level = 0) => {
    const subordinates = getSubordinates(employee.id);
    const isExpanded = expandedNodes.has(employee.id);
    const nodeId = `node-${employee.id}`;

    return (
      <div key={employee.id} className="flex flex-col items-center" id={nodeId}>
        {/* Employee Node */}
        <div className="relative">
          {/* Vertical line going up to parent */}
          {level > 0 && (
            <div 
              className={`absolute bottom-full left-1/2 w-0.5 h-8 -translate-x-1/2 bg-gradient-to-b from-slate-300 to-slate-400 transition-colors ${
                hoveredConnection === employee.id ? 'from-emerald-400 to-emerald-500' : ''
              }`}
              onMouseEnter={() => setHoveredConnection(employee.id)}
              onMouseLeave={() => setHoveredConnection(null)}
            />
          )}

          <OrgChartNode
            employee={employee}
            subordinates={subordinates}
            onNodeClick={onNodeClick}
            onToggle={toggleNode}
            isExpanded={isExpanded}
            level={level}
          />

          {/* Vertical line going down to children */}
          {subordinates.length > 0 && isExpanded && (
            <div className="absolute top-full left-1/2 w-0.5 h-8 -translate-x-1/2 bg-gradient-to-b from-slate-400 to-slate-300" />
          )}
        </div>

        {/* Subordinates */}
        {subordinates.length > 0 && isExpanded && (
          <div className="relative mt-8">
            {/* Horizontal connector line */}
            {subordinates.length > 1 && (
              <div 
                className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-300 to-transparent transform -translate-y-8" 
                style={{
                  width: `${(subordinates.length - 1) * (level === 0 ? 320 : level === 1 ? 300 : 280)}px`,
                  left: '50%',
                  transform: 'translateX(-50%) translateY(-32px)'
                }}
              />
            )}

            {/* Subordinates Grid */}
            <div 
              className="flex gap-8 items-start"
              style={{
                justifyContent: subordinates.length === 1 ? 'center' : 'flex-start'
              }}
            >
              {subordinates.map((sub, idx) => (
                <div key={sub.id} className="relative">
                  {/* Vertical connector from horizontal line to card */}
                  <div 
                    className={`absolute w-0.5 h-8 bg-gradient-to-b from-slate-300 to-slate-400 left-1/2 transform -translate-x-1/2 -top-8 transition-colors ${
                      hoveredConnection === sub.id ? 'from-emerald-400 to-emerald-500' : ''
                    }`}
                    onMouseEnter={() => setHoveredConnection(sub.id)}
                    onMouseLeave={() => setHoveredConnection(null)}
                  />
                  
                  {renderTree(sub, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!employees || employees.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No employees to display</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto p-8 bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Organizational Hierarchy Info */}
      <div className="mb-8 flex items-center justify-center gap-6 p-4 bg-white rounded-xl shadow-md border border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-600 to-purple-700"></div>
          <span className="text-sm text-slate-600">Executive Level</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-600 to-blue-700"></div>
          <span className="text-sm text-slate-600">Senior Management</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-600 to-emerald-700"></div>
          <span className="text-sm text-slate-600">Middle Management</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-slate-600 to-slate-700"></div>
          <span className="text-sm text-slate-600">Staff</span>
        </div>
      </div>

      {/* Org Chart */}
      <div className="inline-flex flex-col items-center gap-8 min-w-max">
        {organizationTree.map(root => renderTree(root, 0))}
      </div>

      {/* Helper text */}
      <div className="mt-12 text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
        <p className="text-sm text-blue-700">
          💡 <strong>Tip:</strong> Click on any employee card to view detailed information. 
          Use the expand/collapse buttons to navigate through different levels of the organization.
        </p>
      </div>
    </div>
  );
}