export const parseCSV = (text: string): any[] => {
  const lines = text.trim().split('\n');
  
  if (lines.length === 0) {
    return [];
  }

  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : ',';
  
  const allHeaders = firstLine.split(delimiter).map(h => h.trim().replace(/"/g, ''));
  const headers = allHeaders.filter(h => h.length > 0);
  
  console.log('Filtered CSV Headers:', headers);
  console.log('Using delimiter:', delimiter === '\t' ? 'tab' : 'comma');

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) { 
      const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        // Use the original index from allHeaders to get the correct value
        const originalIndex = allHeaders.indexOf(header);
        if (originalIndex !== -1) {
          row[header] = values[originalIndex] || '';
        }
      });
      rows.push(row);
    }
  }

  console.log('Parsed CSV rows:', rows);
  return rows;
};

export const downloadTemplate = () => {
  const csvContent = `First name,Last name,Phone,Email,Address,Source
John,Doe,+1-555-0123,john@example.com,"123 Main St, City, State",Website
Jane,Smith,+1-555-0124,jane@example.com,"456 Oak Ave, City, State",Referral
Michael,Johnson,+1-555-0125,michael@example.com,"789 Pine Rd, City, State",Cold Call`;
  
  const blob = new Blob([csvContent], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'client_upload_template.csv';
  link.click();
  window.URL.revokeObjectURL(url);
};
