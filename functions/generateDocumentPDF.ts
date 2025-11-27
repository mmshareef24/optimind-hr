import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, companyId, employeeName, documentType } = await req.json();

    if (!content) {
      return Response.json({ error: 'Document content is required' }, { status: 400 });
    }

    // Fetch company data for logo
    let company = null;
    if (companyId) {
      const companies = await base44.entities.Company.filter({ id: companyId });
      company = companies[0];
    }

    // Create PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Add company logo if available
    if (company?.logo_url) {
      try {
        const logoResponse = await fetch(company.logo_url);
        if (logoResponse.ok) {
          const logoBuffer = await logoResponse.arrayBuffer();
          const logoBase64 = btoa(String.fromCharCode(...new Uint8Array(logoBuffer)));
          const logoType = company.logo_url.toLowerCase().includes('.png') ? 'PNG' : 'JPEG';
          
          // Add logo centered at top
          const logoWidth = 40;
          const logoHeight = 20;
          const logoX = (pageWidth - logoWidth) / 2;
          doc.addImage(`data:image/${logoType.toLowerCase()};base64,${logoBase64}`, logoType, logoX, yPosition, logoWidth, logoHeight);
          yPosition += logoHeight + 10;
        }
      } catch (logoError) {
        console.error('Error loading logo:', logoError);
        // Continue without logo
      }
    }

    // Add company header
    if (company) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(company.name_en || 'Company', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 6;

      if (company.name_ar) {
        doc.setFontSize(12);
        doc.text(company.name_ar, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 6;
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      if (company.address) {
        doc.text(company.address, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 5;
      }
      if (company.phone || company.email) {
        const contactInfo = [company.phone, company.email].filter(Boolean).join(' | ');
        doc.text(contactInfo, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 5;
      }
      if (company.cr_number) {
        doc.text(`CR: ${company.cr_number}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 5;
      }

      // Add separator line
      yPosition += 5;
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
    }

    // Process content - convert markdown to plain text for PDF
    const cleanContent = content
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold markers
      .replace(/\*(.*?)\*/g, '$1')       // Remove italic markers
      .replace(/#{1,6}\s/g, '')          // Remove heading markers
      .replace(/```[\s\S]*?```/g, '')    // Remove code blocks
      .replace(/`(.*?)`/g, '$1')         // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Convert links to text
      .replace(/^\s*[-*+]\s/gm, '• ')    // Convert list items
      .replace(/^\s*\d+\.\s/gm, '')      // Remove numbered list markers
      .replace(/_{3,}/g, '_________________');  // Signature lines

    // Split content into lines
    const lines = cleanContent.split('\n');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      // Detect bold text (titles, headings)
      const isBold = /^[A-Z][A-Z\s&:]+$/.test(trimmedLine) || 
                     trimmedLine.startsWith('Article') ||
                     trimmedLine.includes(':') && trimmedLine.length < 50;

      if (isBold && trimmedLine.length > 0) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }

      // Handle empty lines
      if (trimmedLine === '') {
        yPosition += 4;
        continue;
      }

      // Split long lines
      const splitLines = doc.splitTextToSize(trimmedLine, contentWidth);
      
      for (const splitLine of splitLines) {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(splitLine, margin, yPosition);
        yPosition += 6;
      }
    }

    // Add footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text(
        `Generated on ${new Date().toLocaleDateString('en-GB')}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: 'right' }
      );
      doc.setTextColor(0, 0, 0);
    }

    // Generate PDF output
    const pdfOutput = doc.output('arraybuffer');

    // Create filename
    const sanitizedName = (employeeName || 'document').replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedType = (documentType || 'document').replace(/_/g, '-');
    const filename = `${sanitizedType}_${sanitizedName}_${new Date().toISOString().split('T')[0]}.pdf`;

    return new Response(pdfOutput, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});