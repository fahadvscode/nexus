import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { parseCSV } from "@/utils/csvUtils";
import { validateClient } from "@/utils/clientValidation";
import { Client } from "@/types/client";
import { clientStore, NewClient } from "@/store/clientStore";
import { supabase } from "@/integrations/supabase/client";

const validateMappedClient = (data: any, rowIndex: number): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.firstName?.trim() && !data.lastName?.trim()) {
    errors.push('Either First Name or Last Name is required');
  }
  if (!data.email1?.trim()) {
    errors.push('Email 1 (Primary) is required');
  }
  if (!data.phone1?.trim()) {
    errors.push('Phone 1 (Primary) is required');
  }
  
  // Validate all email formats
  [data.email1, data.email2, data.email3].forEach((email, index) => {
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      errors.push(`Invalid email format for Email ${index + 1}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

interface UploadProgress {
  progress: number;
  status: string;
}

export const useBulkUpload = () => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ progress: 0, status: "" });
  const [results, setResults] = useState<{
    success: number;
    errors: { row: number; message: string }[];
    uploadedClients: NewClient[];
  } | null>(null);

  const handleFileUpload = async (file: File, fieldMapping?: Record<string, string>, organizationId?: string) => {
    if (!file) return;

    console.log('=== BULK UPLOAD STARTED ===');
    console.log('File:', file.name, 'Size:', file.size);
    console.log('Field mapping received:', fieldMapping);

    setUploading(true);
    setUploadProgress({ progress: 0, status: "Reading file..." });
    
    try {
      const text = await file.text();
      console.log('File text preview (first 200 chars):', text.substring(0, 200));
      
      setUploadProgress({ progress: 20, status: "Parsing CSV data..." });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const rows = parseCSV(text);
      console.log('Parsed CSV rows:', rows.length, 'rows');
      console.log('Sample row:', rows[0]);
      setUploadProgress({ progress: 40, status: "Validating client data..." });
      
      const errors: { row: number; message: string }[] = [];
      const validClients: NewClient[] = [];

      for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        setUploadProgress({ 
          progress: 40 + ((index / rows.length) * 40), 
          status: `Processing client ${index + 1} of ${rows.length}...` 
        });
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Debug logging for first few rows
        if (index < 3) {
          console.log('Processing row:', index + 1, row);
          console.log('Field mapping:', fieldMapping);
          console.log('fieldMapping is:', typeof fieldMapping, fieldMapping);
          console.log('fieldMapping keys:', fieldMapping ? Object.keys(fieldMapping) : 'no fieldMapping');
        }
        
        // Map fields using the provided mapping or fallback to default
        const mappedData = fieldMapping ? {
          firstName: fieldMapping['firstName'] ? row[fieldMapping['firstName']]?.trim() : '',
          lastName: fieldMapping['lastName'] ? row[fieldMapping['lastName']]?.trim() : '',
          name: (() => {
            const firstName = fieldMapping['firstName'] ? row[fieldMapping['firstName']]?.trim() : '';
            const lastName = fieldMapping['lastName'] ? row[fieldMapping['lastName']]?.trim() : '';
            return [firstName, lastName].filter(Boolean).join(' ');
          })(),
          email1: fieldMapping['email1'] ? row[fieldMapping['email1']]?.trim() : '',
          email2: fieldMapping['email2'] ? row[fieldMapping['email2']]?.trim() : '',
          email3: fieldMapping['email3'] ? row[fieldMapping['email3']]?.trim() : '',
          phone1: fieldMapping['phone1'] ? row[fieldMapping['phone1']]?.trim() : '',
          phone2: fieldMapping['phone2'] ? row[fieldMapping['phone2']]?.trim() : '',
          phone3: fieldMapping['phone3'] ? row[fieldMapping['phone3']]?.trim() : '',
          address: fieldMapping['address'] ? row[fieldMapping['address']]?.trim() : '',
          company: fieldMapping['company'] ? row[fieldMapping['company']]?.trim() : '',
          tags: fieldMapping['tags'] ? row[fieldMapping['tags']]?.trim() : '',
          source: fieldMapping['source'] ? row[fieldMapping['source']]?.trim() : 'Import',
          notes: fieldMapping['notes'] ? row[fieldMapping['notes']]?.trim() : '',
        } : {
          firstName: row['First Name']?.trim() || row['First name']?.trim() || row['firstname']?.trim() || '',
          lastName: row['Last Name']?.trim() || row['Last name']?.trim() || row['lastname']?.trim() || '',
          name: [
            row['First Name']?.trim() || row['First name']?.trim() || row['firstname']?.trim() || '', 
            row['Last Name']?.trim() || row['Last name']?.trim() || row['lastname']?.trim() || ''
          ].filter(Boolean).join(' '),
          email1: row['Email 1']?.trim() || row['Email']?.trim() || row['email']?.trim() || '',
          email2: row['Email 2']?.trim() || '',
          email3: row['Email 3']?.trim() || '',
          phone1: row['Phone 1']?.trim() || row['Phone']?.trim() || row['phone']?.trim() || '',
          phone2: row['Phone 2']?.trim() || '',
          phone3: row['Phone 3']?.trim() || '',
          address: row['Address']?.trim() || '',
          company: row['Company']?.trim() || '',
          tags: row['Tags']?.trim() || row['Tag']?.trim() || '',
          source: row['Source']?.trim() || 'Import',
          notes: row['Notes']?.trim() || '',
        };
        
        if (index < 3) {
          console.log('Mapped data:', mappedData);
        }
        
        // Validate the mapped data
        const validation = validateMappedClient(mappedData, index + 2);
        
        if (index < 3) {
          console.log('Validation result for row', index + 1, ':', validation);
          console.log('Validation errors:', validation.errors);
        }
        
        if (!validation.valid) {
          console.log(`Row ${index + 2} failed validation:`, validation.errors.join(', '));
          errors.push({
            row: index + 2,
            message: validation.errors.join(', ')
          });
        } else {
          const newClient: NewClient = {
            name: mappedData.name,
            email: mappedData.email1, // Use primary email for database
            phone: mappedData.phone1, // Use primary phone for database
            address: mappedData.address || '', 
            status: 'lead',
            source: mappedData.source || 'Import',
            tags: mappedData.tags ? mappedData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
            last_contact: null,
          };
          
          console.log('Created valid client:', newClient);
          validClients.push(newClient);
        }
      }

      console.log('FINAL VALIDATION SUMMARY:');
      console.log('Total rows processed:', rows.length);
      console.log('Valid clients:', validClients.length);
      console.log('Validation errors:', errors.length);
      console.log('All errors:', errors);
      
      setUploadProgress({ progress: 80, status: "Saving clients to database..." });
      await new Promise(resolve => setTimeout(resolve, 500));

      // Add all valid clients to the store
      if (validClients.length > 0) {
        console.log('Adding clients to store:', validClients);
        
        // Get current user for user_id
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || 'anonymous';
        
        console.log('🔍 Current user ID:', userId);
        
        // Check if user is admin with comprehensive debugging
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role, is_active')
          .eq('user_id', user?.id)
          .single();

        console.log('🔍 Profile query result:', { profile, profileError });
        console.log('🔍 User role from profile:', profile?.role);
        console.log('🔍 Is admin check result:', profile?.role === 'admin');
        console.log('🔍 Organization ID parameter:', organizationId);

        // Prepare clients for database insertion
        const clientsToInsert: NewClient[] = validClients.map(client => ({
          ...client,
          user_id: userId,
        }));
        
        console.log('🔍 Clients prepared for insertion:', clientsToInsert.length);
        
        // Check admin status and route accordingly
        const isAdminUser = profile?.role === 'admin';
        console.log('🚨 ROUTING DECISION: Is admin user?', isAdminUser);
        
        if (isAdminUser) {
          console.log('🔧 ✅ ADMIN PATH: Using addMultipleClientsAsAdmin method');
          console.log('🎯 Organization ID for assignment:', organizationId || 'admin (unassigned)');
          
          try {
            const result = await clientStore.addMultipleClientsAsAdmin(clientsToInsert, userId, organizationId);
            console.log('✅ Admin bulk upload completed successfully:', result.length, 'clients');
          } catch (adminError) {
            console.error('❌ Admin bulk upload failed:', adminError);
            throw adminError;
          }
        } else {
          console.log('🏢 ✅ SUBACCOUNT PATH: Using regular addMultipleClients method');
          
          try {
            const result = await clientStore.addMultipleClients(clientsToInsert);
            console.log('✅ Subaccount bulk upload completed successfully:', result.length, 'clients');
          } catch (subaccountError) {
            console.error('❌ Subaccount bulk upload failed:', subaccountError);
            throw subaccountError;
          }
        }
      }

      setUploadProgress({ progress: 100, status: "Import complete!" });
      await new Promise(resolve => setTimeout(resolve, 300));

      setResults({ 
        success: validClients.length, 
        errors, 
        uploadedClients: validClients 
      });

      if (errors.length === 0) {
        toast({
          title: "🎉 Import Successful!",
          description: `Successfully imported ${validClients.length} clients to your CRM.`,
        });
      } else if (validClients.length > 0) {
        toast({
          title: "⚠️ Partial Import Complete",
          description: `${validClients.length} clients imported successfully. ${errors.length} rows had errors.`,
        });
      } else {
        toast({
          title: "❌ Import Failed",
          description: "No clients could be imported. Please check the file format and try again.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to process the CSV file. Please check the format and try again.",
        variant: "destructive",
      });
      setResults({ 
        success: 0, 
        errors: [{ row: 0, message: "File processing failed" }],
        uploadedClients: []
      });
    } finally {
      setUploading(false);
    }
  };

  const resetResults = () => {
    setResults(null);
    setUploading(false);
    setUploadProgress({ progress: 0, status: "" });
  };

  return {
    uploading,
    uploadProgress,
    results,
    handleFileUpload,
    resetResults
  };
};
