import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { MODULE_STRUCTURE, ACTIONS } from "./PermissionContext";

export default function RoleForm({ role, onSubmit, onCancel, open, onOpenChange }) {
  const [formData, setFormData] = useState({
    role_name: "",
    role_code: "",
    description: "",
    permissions: [],
    status: "active"
  });

  const [expandedModules, setExpandedModules] = useState({});

  useEffect(() => {
    if (role) {
      setFormData(role);
    }
  }, [role]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const toggleModule = (moduleKey) => {
    setExpandedModules(prev => ({ ...prev, [moduleKey]: !prev[moduleKey] }));
  };

  const hasPermission = (module, subModule, tab, action) => {
    return formData.permissions.some(p =>
      p.module === module &&
      p.sub_module === subModule &&
      (!tab || p.tab === tab) &&
      p.actions?.includes(action)
    );
  };

  const togglePermission = (module, subModule, tab, action) => {
    setFormData(prev => {
      const permissions = [...prev.permissions];
      const existingIndex = permissions.findIndex(p =>
        p.module === module && p.sub_module === subModule && p.tab === tab
      );

      if (existingIndex >= 0) {
        const existing = permissions[existingIndex];
        if (existing.actions?.includes(action)) {
          existing.actions = existing.actions.filter(a => a !== action);
          if (existing.actions.length === 0) {
            permissions.splice(existingIndex, 1);
          }
        } else {
          existing.actions = [...(existing.actions || []), action];
        }
      } else {
        permissions.push({ module, sub_module: subModule, tab, actions: [action] });
      }

      return { ...prev, permissions };
    });
  };

  const toggleAllForSubModule = (module, subModule, tabs) => {
    const allChecked = tabs.every(tab =>
      ACTIONS.every(action => hasPermission(module, subModule, tab, action))
    );

    setFormData(prev => {
      let permissions = prev.permissions.filter(p =>
        !(p.module === module && p.sub_module === subModule)
      );

      if (!allChecked) {
        tabs.forEach(tab => {
          permissions.push({ module, sub_module: subModule, tab, actions: [...ACTIONS] });
        });
      }

      return { ...prev, permissions };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? 'Edit Role' : 'Create Role'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Role Name *</Label>
              <Input
                value={formData.role_name}
                onChange={(e) => setFormData(prev => ({ ...prev, role_name: e.target.value }))}
                placeholder="e.g., HR Manager"
                required
              />
            </div>
            <div>
              <Label>Role Code *</Label>
              <Input
                value={formData.role_code}
                onChange={(e) => setFormData(prev => ({ ...prev, role_code: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                placeholder="e.g., hr_manager"
                required
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>

          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Permissions */}
          <div>
            <Label className="text-lg font-semibold mb-4 block">Permissions</Label>
            <div className="border rounded-lg divide-y">
              {Object.entries(MODULE_STRUCTURE).map(([moduleKey, module]) => (
                <Collapsible key={moduleKey} open={expandedModules[moduleKey]}>
                  <CollapsibleTrigger
                    className="flex items-center justify-between w-full p-4 hover:bg-slate-50"
                    onClick={() => toggleModule(moduleKey)}
                  >
                    <span className="font-medium">{module.label}</span>
                    {expandedModules[moduleKey] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-4">
                      {Object.entries(module.subModules).map(([subKey, subModule]) => (
                        <div key={subKey} className="border rounded-lg p-3 bg-slate-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{subModule.label}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleAllForSubModule(moduleKey, subKey, subModule.tabs)}
                            >
                              Toggle All
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {subModule.tabs.map(tab => (
                              <div key={tab} className="flex items-center gap-4 pl-4">
                                <span className="w-32 text-sm text-slate-600 capitalize">{tab.replace('_', ' ')}</span>
                                <div className="flex items-center gap-3">
                                  {ACTIONS.map(action => (
                                    <label key={action} className="flex items-center gap-1 text-xs">
                                      <Checkbox
                                        checked={hasPermission(moduleKey, subKey, tab, action)}
                                        onCheckedChange={() => togglePermission(moduleKey, subKey, tab, action)}
                                      />
                                      <span className="capitalize">{action}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              {role ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}