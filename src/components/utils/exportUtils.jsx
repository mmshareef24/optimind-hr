/**
 * Export utilities for generating CSV and PDF reports
 */

/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file (without extension)
 */
export function exportToCSV(data, fileName = 'report') {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(value).replace(/"/g, '""');
      return escaped.includes(',') ? `"${escaped}"` : escaped;
    });
    csvContent += values.join(',') + '\n';
  });

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data to PDF format (as text-based report)
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file (without extension)
 * @param {string} title - Report title
 */
export function exportToPDF(data, fileName = 'report', title = 'Report') {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  // Create text-based PDF content
  let pdfText = '═'.repeat(80) + '\n';
  pdfText += `  ${title.toUpperCase()}\n`;
  pdfText += '═'.repeat(80) + '\n\n';
  pdfText += `Generated: ${new Date().toLocaleString()}\n`;
  pdfText += `Total Records: ${data.length}\n`;
  pdfText += '─'.repeat(80) + '\n\n';

  // Get headers
  const headers = Object.keys(data[0]);
  
  // Calculate column widths
  const columnWidths = headers.map(header => {
    const maxDataWidth = Math.max(
      ...data.map(row => String(row[header] || '').length),
      header.length
    );
    return Math.min(maxDataWidth + 2, 30); // Max width of 30
  });

  // Create header row
  const headerRow = headers.map((header, i) => 
    header.padEnd(columnWidths[i])
  ).join(' | ');
  pdfText += headerRow + '\n';
  pdfText += '─'.repeat(80) + '\n';

  // Add data rows
  data.forEach(row => {
    const dataRow = headers.map((header, i) => {
      const value = String(row[header] || 'N/A');
      const truncated = value.length > columnWidths[i] - 2 
        ? value.substring(0, columnWidths[i] - 5) + '...' 
        : value;
      return truncated.padEnd(columnWidths[i]);
    }).join(' | ');
    pdfText += dataRow + '\n';
  });

  pdfText += '\n' + '═'.repeat(80) + '\n';
  pdfText += `  END OF REPORT - ${data.length} Records\n`;
  pdfText += '═'.repeat(80) + '\n';

  // Create and trigger download
  const blob = new Blob([pdfText], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.txt`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format number as currency (SAR)
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2
  }).format(amount || 0);
}

/**
 * Format date for reports
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export default {
  exportToCSV,
  exportToPDF,
  formatCurrency,
  formatDate
};