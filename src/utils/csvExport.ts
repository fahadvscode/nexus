
import { Client } from "@/types/client";

export const exportClientsToCSV = (clients: Client[], filename: string = 'clients_export.csv') => {
  if (clients.length === 0) {
    console.log('No clients to export');
    return;
  }

  // Define CSV headers
  const headers = [
    'First Name',
    'Last Name', 
    'Phone',
    'Email',
    'Address',
    'Status',
    'Tags',
    'Source',
    'Created Date',
    'Last Contact'
  ];

  // Convert clients to CSV rows
  const csvRows = clients.map(client => {
    const nameParts = client.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    return [
      `"${firstName}"`,
      `"${lastName}"`,
      `"${client.phone}"`,
      `"${client.email}"`,
      `"${client.address}"`,
      `"${client.status}"`,
      `"${client.tags.join(', ')}"`,
      `"${client.source}"`,
      `"${client.createdAt.toLocaleDateString()}"`,
      `"${client.lastContact ? client.lastContact.toLocaleDateString() : ''}"`
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);

  console.log(`Exported ${clients.length} clients to ${filename}`);
};
