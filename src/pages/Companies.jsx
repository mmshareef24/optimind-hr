import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Building2, Plus, Search, MoreVertical, Edit, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function Companies() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name_en: "", name_ar: "", cr_number: "", tax_number: "", gosi_number: "",
    establishment_date: "", industry: "technology", address: "", city: "",
    phone: "", email: "", status: "active"
  });

  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Company.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Company.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
      setShowDialog(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setFormData({
      name_en: "", name_ar: "", cr_number: "", tax_number: "", gosi_number: "",
      establishment_date: "", industry: "technology", address: "", city: "",
      phone: "", email: "", status: "active"
    });
    setEditingCompany(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData(company);
    setShowDialog(true);
  };

  const filteredCompanies = companies.filter(c =>
    c.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cr_number?.includes(searchTerm)
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Companies</h1>
          <p className="text-slate-600">Manage your organization's companies</p>
        </div>
        <Button
          onClick={() => { resetForm(); setShowDialog(true); }}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Company
        </Button>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or CR number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No companies found</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company) => (
                <Card key={company.id} className="border border-slate-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <Badge className={company.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                        {company.status}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-1">{company.name_en}</h3>
                    {company.name_ar && <p className="text-sm text-slate-500 mb-3">{company.name_ar}</p>}
                    <div className="space-y-2 text-sm mb-4">
                      <p className="text-slate-600"><span className="font-medium">CR:</span> {company.cr_number}</p>
                      <p className="text-slate-600"><span className="font-medium">Industry:</span> {company.industry}</p>
                      <p className="text-slate-600"><span className="font-medium">City:</span> {company.city || 'N/A'}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(company)}
                      className="w-full"
                    >
                      <Edit className="w-4 h-4 mr-2" /> Edit Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCompany ? 'Edit Company' : 'Add New Company'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Company Name (English) *</Label>
                <Input value={formData.name_en} onChange={(e) => setFormData({...formData, name_en: e.target.value})} required />
              </div>
              <div>
                <Label>Company Name (Arabic)</Label>
                <Input value={formData.name_ar} onChange={(e) => setFormData({...formData, name_ar: e.target.value})} />
              </div>
              <div>
                <Label>CR Number *</Label>
                <Input value={formData.cr_number} onChange={(e) => setFormData({...formData, cr_number: e.target.value})} required />
              </div>
              <div>
                <Label>Tax Number</Label>
                <Input value={formData.tax_number} onChange={(e) => setFormData({...formData, tax_number: e.target.value})} />
              </div>
              <div>
                <Label>GOSI Number</Label>
                <Input value={formData.gosi_number} onChange={(e) => setFormData({...formData, gosi_number: e.target.value})} />
              </div>
              <div>
                <Label>Establishment Date</Label>
                <Input type="date" value={formData.establishment_date} onChange={(e) => setFormData({...formData, establishment_date: e.target.value})} />
              </div>
              <div>
                <Label>Industry</Label>
                <Select value={formData.industry} onValueChange={(val) => setFormData({...formData, industry: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>City</Label>
                <Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                {editingCompany ? 'Update' : 'Create'} Company
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}