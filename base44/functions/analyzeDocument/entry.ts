import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { document_id, file_url, document_name } = await req.json();

    // Use AI to analyze the document and extract metadata
    const analysisPrompt = `Analyze this document and provide structured information:
    
Document Name: ${document_name}
File URL: ${file_url}

Based on the document name and type, suggest:
1. The most appropriate document_type from these options: contract, id_copy, passport, certificate, visa, insurance, policy, license, cr_certificate, tax_certificate, gosi_certificate, chamber_certificate, trade_license, other
2. Relevant tags (3-5 keywords that describe the document)
3. A brief description of what this document likely contains
4. Whether this document typically has an expiration date and if so, typical validity period
5. Priority level (low, medium, high) based on importance for HR/compliance

Return ONLY a JSON object with this structure:
{
  "suggested_type": "...",
  "tags": ["tag1", "tag2", "tag3"],
  "description": "...",
  "has_expiry": true/false,
  "typical_validity_months": number or null,
  "priority": "low/medium/high",
  "compliance_category": "legal/hr/finance/operational"
}`;

    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          suggested_type: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          description: { type: "string" },
          has_expiry: { type: "boolean" },
          typical_validity_months: { type: ["number", "null"] },
          priority: { type: "string" },
          compliance_category: { type: "string" }
        }
      }
    });

    // Update document with AI-generated metadata if document_id provided
    if (document_id) {
      const doc = await base44.asServiceRole.entities.Document.filter({ id: document_id });
      if (doc.length > 0) {
        await base44.asServiceRole.entities.Document.update(document_id, {
          ai_tags: analysis.tags.join(', '),
          ai_description: analysis.description,
          ai_priority: analysis.priority,
          ai_compliance_category: analysis.compliance_category
        });
      }
    }

    return Response.json({
      success: true,
      analysis
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});