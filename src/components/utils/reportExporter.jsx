/**
 * Enhanced Report Export Utilities
 * Handles exporting data to various formats (CSV, TXT, JSON)
 */

/**
 * Format cell value for CSV
 */
function formatCsvCell(value) {
  if (value === null || value === undefined) {
    return '';
  }
  
  let stringValue = String(value);
  
  if (value instanceof Date) {
    stringValue = value.toISOString().split('T')[0];
  }
  
  if (typeof value === 'object' && !(value instanceof Date)) {
    stringValue = JSON.stringify(value);
  }
  
  const needsQuoting = 
    stringValue.includes(',') || 
    stringValue.includes('\n') || 
    stringValue.includes('\r') ||
    stringValue.includes('"');
  
  if (needsQuoting) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Download file helper
 */
function downloadFile(content, filename, extension, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = `${filename}.${extension}`;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data, filename, options = {}) {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }
  
  const { columns = null, headers = null, includeHeaders = true } = options;
  
  const cols = columns || Object.keys(data[0]);
  const headerLabels = headers || cols;
  
  let csv = '';
  
  if (includeHeaders) {
    csv += headerLabels.map(h => formatCsvCell(h)).join(',') + '\n';
  }
  
  csv += data.map(row => {
    return cols.map(col => formatCsvCell(row[col])).join(',');
  }).join('\n');
  
  downloadFile(csv, filename, 'csv', 'text/csv;charset=utf-8;');
}

/**
 * Center text
 */
function centerText(text, width) {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text + ' '.repeat(width - padding - text.length);
}

/**
 * Format data as table
 */
function formatTable(data, cols, headers, columnWidths) {
  let table = '';
  
  table += headers.map((h, idx) => 
    String(h).padEnd(columnWidths[cols[idx]])
  ).join(' | ') + '\n';
  
  table += headers.map((_, idx) => 
    '─'.repeat(columnWidths[cols[idx]])
  ).join('─┼─') + '\n';
  
  data.forEach(row => {
    table += cols.map(col => {
      let value = row[col];
      
      if (value === null || value === undefined) {
        value = '';
      } else if (value instanceof Date) {
        value = value.toISOString().split('T')[0];
      } else if (typeof value === 'number') {
        value = value.toLocaleString();
      } else if (typeof value === 'boolean') {
        value = value ? 'Yes' : 'No';
      } else {
        value = String(value);
      }
      
      if (value.length > columnWidths[col]) {
        value = value.substring(0, columnWidths[col] - 3) + '...';
      }
      
      return value.padEnd(columnWidths[col]);
    }).join(' | ') + '\n';
  });
  
  return table;
}

/**
 * Export data to formatted text report
 */
export function exportToFormattedText(data, filename, options = {}) {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }
  
  const {
    title = 'Report',
    subtitle = '',
    columns = null,
    headers = null,
    summary = null,
    groupBy = null,
    columnWidth = 40
  } = options;
  
  const cols = columns || Object.keys(data[0]);
  const headerLabels = headers || cols;
  
  const columnWidths = cols.reduce((acc, col, idx) => {
    const maxDataWidth = Math.max(
      headerLabels[idx]?.length || 0,
      ...data.map(row => String(row[col] || '').length)
    );
    acc[col] = Math.min(maxDataWidth + 2, columnWidth);
    return acc;
  }, {});
  
  let report = '';
  const headerWidth = 100;
  
  report += '═'.repeat(headerWidth) + '\n';
  report += centerText(title.toUpperCase(), headerWidth) + '\n';
  if (subtitle) {
    report += centerText(subtitle, headerWidth) + '\n';
  }
  report += '═'.repeat(headerWidth) + '\n\n';
  
  report += `Generated: ${new Date().toLocaleString()}\n`;
  report += `Total Records: ${data.length.toLocaleString()}\n`;
  report += '─'.repeat(headerWidth) + '\n\n';
  
  if (summary && Object.keys(summary).length > 0) {
    report += 'SUMMARY\n';
    report += '─'.repeat(headerWidth) + '\n';
    Object.entries(summary).forEach(([key, value]) => {
      report += `${key.padEnd(35)}: ${value}\n`;
    });
    report += '\n';
  }
  
  if (groupBy && data[0][groupBy]) {
    const grouped = data.reduce((acc, row) => {
      const key = row[groupBy] || 'Uncategorized';
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});
    
    Object.entries(grouped).forEach(([group, rows]) => {
      report += `\n${group.toUpperCase()} (${rows.length})\n`;
      report += '─'.repeat(headerWidth) + '\n';
      report += formatTable(rows, cols, headerLabels, columnWidths);
      report += '\n';
    });
  } else {
    report += 'DATA\n';
    report += '─'.repeat(headerWidth) + '\n';
    report += formatTable(data, cols, headerLabels, columnWidths);
  }
  
  report += '\n' + '═'.repeat(headerWidth) + '\n';
  report += centerText('END OF REPORT', headerWidth) + '\n';
  report += '═'.repeat(headerWidth) + '\n';
  
  downloadFile(report, filename, 'txt', 'text/plain;charset=utf-8;');
}

/**
 * Export data to JSON format
 */
export function exportToJSON(data, filename, options = {}) {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }
  
  const { pretty = true, includeMetadata = false } = options;
  
  let exportData = data;
  
  if (includeMetadata) {
    exportData = {
      metadata: {
        generated: new Date().toISOString(),
        recordCount: data.length
      },
      data: data
    };
  }
  
  const json = pretty 
    ? JSON.stringify(exportData, null, 2)
    : JSON.stringify(exportData);
  
  downloadFile(json, filename, 'json', 'application/json');
}

export default {
  exportToCSV,
  exportToFormattedText,
  exportToJSON
};