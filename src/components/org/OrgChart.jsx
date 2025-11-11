import React, { useState, useEffect } from 'react';
import OrgChartNode from './OrgChartNode';

export default function OrgChart({ employees, onNodeClick }) {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [organizationTree, setOrganizationTree] = useState([]);

  useEffect(() => {
    // Build the organization tree
    buildOrganizationTree();
  }, [employees]);

  const buildOrganizationTree = () => {
    if (!employees || employees.length === 0) return;

    // Find root employees (those without managers or whose manager doesn't exist)
    const employeeIds = new Set(employees.map(e => e.id));
    const roots = employees.filter(emp => 
      !emp.manager_id || !employeeIds.has(emp.manager_id)
    );

    // Auto-expand first level
    const firstLevelIds = new Set(roots.map(r => r.id));
    setExpandedNodes(firstLevelIds);

    setOrganizationTree(roots);
  };

  const getSubordinates = (managerId) => {
    return employees.filter(emp => emp.manager_id === managerId);
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const renderTree = (employee, level = 0) => {
    const subordinates = getSubordinates(employee.id);
    const isExpanded = expandedNodes.has(employee.id);

    return (
      <div key={employee.id} className="flex flex-col items-center">
        <OrgChartNode
          employee={employee}
          subordinates={subordinates}
          onNodeClick={onNodeClick}
          onToggle={toggleNode}
          isExpanded={isExpanded}
          level={level}
        />

        {subordinates.length > 0 && isExpanded && (
          <div className="relative mt-8">
            {/* Horizontal connector line */}
            {subordinates.length > 1 && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-300 to-transparent transform -translate-y-8" 
                   style={{
                     width: `${(subordinates.length - 1) * 280}px`,
                     left: '50%',
                     transform: 'translateX(-50%) translateY(-32px)'
                   }}
              />
            )}

            {/* Subordinates */}
            <div className="flex gap-8 items-start">
              {subordinates.map(sub => (
                <div key={sub.id} className="relative">
                  {/* Vertical connector from horizontal line to card */}
                  <div className="absolute w-0.5 h-8 bg-gradient-to-b from-slate-300 to-slate-200 left-1/2 transform -translate-x-1/2 -top-8" />
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
    <div className="w-full overflow-auto p-8">
      <div className="inline-flex flex-col items-center gap-8">
        {organizationTree.map(root => renderTree(root, 0))}
      </div>
    </div>
  );
}