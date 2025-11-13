import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileText, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Documents() {
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list('-created_date'),
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Documents</h1>
          <p className="text-slate-600">Manage employee documents and company policies</p>
        </div>
        <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg">
          <Upload className="w-4 h-4 mr-2" /> Upload Document
        </Button>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-emerald-50/30">
          <CardTitle>All Documents</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{doc.document_name}</h3>
                      <p className="text-sm text-slate-500">{doc.document_type}</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}