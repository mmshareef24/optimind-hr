import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();

    // Get all documents
    const documents = await base44.asServiceRole.entities.Document.list();
    const employees = await base44.asServiceRole.entities.Employee.list();
    const companies = await base44.asServiceRole.entities.Company.list();

    // Create a searchable context with document details
    const documentContext = documents.map(doc => {
      const employee = employees.find(e => e.id === doc.employee_id);
      const company = companies.find(c => c.id === doc.company_id);
      
      return {
        id: doc.id,
        name: doc.document_name,
        type: doc.document_type,
        employee_name: employee ? `${employee.first_name} ${employee.last_name}` : null,
        company_name: company ? company.name_en : null,
        issue_date: doc.issue_date,
        expiry_date: doc.expiry_date,
        status: doc.status,
        tags: doc.ai_tags || '',
        description: doc.ai_description || '',
        notes: doc.notes || ''
      };
    });

    // Use AI to interpret the natural language query and find relevant documents
    const searchPrompt = `You are a document search assistant. The user is searching for documents with this query: "${query}"

Available documents:
${JSON.stringify(documentContext, null, 2)}

Analyze the user's query and return the IDs of documents that match, ranked by relevance.
Consider:
- Document names
- Document types
- Employee/company names
- Tags and descriptions
- Dates and status
- Natural language understanding (e.g., "expiring soon", "employee contracts", "insurance documents")

Return ONLY a JSON object with this structure:
{
  "matched_document_ids": ["id1", "id2", ...],
  "search_explanation": "Brief explanation of what was searched for and why these documents matched"
}`;

    const searchResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: searchPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          matched_document_ids: { type: "array", items: { type: "string" } },
          search_explanation: { type: "string" }
        }
      }
    });

    // Filter documents to only matched ones
    const matchedDocuments = documents.filter(doc => 
      searchResult.matched_document_ids.includes(doc.id)
    );

    return Response.json({
      success: true,
      documents: matchedDocuments,
      explanation: searchResult.search_explanation,
      total_matches: matchedDocuments.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});