import React, { useState, useEffect, useRef } from 'react';
import OrgChartNode from './OrgChartNode';
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";

export default function OrgChart({ employees, onNodeClick }) {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [organizationTree, setOrganizationTree] = useState([]);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    buildOrganizationTree();
  }, [employees]);

  const buildOrganizationTree = () => {
    if (!employees || employees.length === 0) return;

    // Find root employees (those without managers or whose manager doesn't exist)
    const employeeIds = new Set(employees.map(e => e.id));
    const roots = employees.filter(emp => 
      !emp.manager_id || !employeeIds.has(emp.manager_id)
    );

    // Auto-expand first two levels
    const firstLevelIds = new Set(roots.map(r => r.id));
    roots.forEach(root => {
      const subordinates = employees.filter(emp => emp.manager_id === root.id);
      subordinates.forEach(sub => firstLevelIds.add(sub.id));
    });
    
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
        // Collapse: remove this node and all its descendants
        const removeDescendants = (id) => {
          newSet.delete(id);
          const children = getSubordinates(id);
          children.forEach(child => removeDescendants(child.id));
        };
        removeDescendants(nodeId);
      } else {
        // Expand: add this node
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    if (expandedNodes.size > 0) {
      setExpandedNodes(new Set());
    } else {
      const allIds = new Set(employees.map(e => e.id));
      setExpandedNodes(allIds);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.3));
  };

  const handleResetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ 
        x: e.clientX - position.x, 
        y: e.clientY - position.y 
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
          <div className="relative mt-12">
            {/* Horizontal connector line */}
            {subordinates.length > 1 && (
              <div 
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-300 to-transparent transform -translate-y-12" 
                style={{
                  width: `${(subordinates.length - 1) * 288}px`,
                  left: '50%',
                  transform: 'translateX(-50%) translateY(-48px)'
                }}
              />
            )}

            {/* Subordinates */}
            <div className="flex gap-8 items-start">
              {subordinates.map(sub => (
                <div key={sub.id} className="relative">
                  {/* Vertical connector from horizontal line to card */}
                  <div className="absolute w-1 h-12 bg-gradient-to-b from-emerald-300 to-emerald-400 left-1/2 transform -translate-x-1/2 -top-12 rounded-full" />
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
    <div className="relative w-full h-full">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2 border border-slate-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          title="Zoom In"
          disabled={scale >= 2}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          title="Zoom Out"
          disabled={scale <= 0.3}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetView}
          title="Reset View"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
        <div className="border-t border-slate-200 my-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAll}
          title={expandedNodes.size > 0 ? "Collapse All" : "Expand All"}
        >
          <Minimize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Scale indicator */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg px-3 py-2 border border-slate-200">
        <span className="text-sm font-medium text-slate-700">{(scale * 100).toFixed(0)}%</span>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-4 py-2 border border-slate-200">
        <p className="text-xs text-slate-600 flex items-center gap-4">
          <span>🖱️ Click to view details</span>
          <span>•</span>
          <span>📂 Toggle to expand/collapse</span>
          <span>•</span>
          <span>✋ Drag to pan</span>
        </p>
      </div>

      {/* Chart Container */}
      <div
        ref={containerRef}
        className={`w-full overflow-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ height: '800px' }}
      >
        <div
          ref={contentRef}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'top center',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            padding: '40px',
            minWidth: 'max-content'
          }}
        >
          <div className="inline-flex flex-col items-center gap-12">
            {organizationTree.map(root => renderTree(root, 0))}
          </div>
        </div>
      </div>
    </div>
  );
}