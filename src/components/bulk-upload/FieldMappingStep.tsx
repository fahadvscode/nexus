import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowRight, CheckCircle, RotateCcw, Building } from "lucide-react";
import { useUserManagement } from "@/hooks/useUserManagement";

interface FieldMappingStepProps {
  csvHeaders: string[];
  fieldMapping: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
  selectedOrganization?: string;
  onOrganizationChange?: (orgId: string) => void;
}

const requiredFields = [
  { key: 'firstName', label: 'First Name', required: false, description: 'Client first name (either First Name or Last Name required)' },
  { key: 'lastName', label: 'Last Name', required: false, description: 'Client last name (either First Name or Last Name required)' },
  { key: 'email1', label: 'Email 1 (Primary)', required: true, description: 'Primary email address' },
  { key: 'phone1', label: 'Phone 1 (Primary)', required: true, description: 'Primary phone number' },
];

const optionalFields = [
  { key: 'email2', label: 'Email 2', required: false, description: 'Secondary email address' },
  { key: 'email3', label: 'Email 3', required: false, description: 'Third email address' },
  { key: 'phone2', label: 'Phone 2', required: false, description: 'Secondary phone number' },
  { key: 'phone3', label: 'Phone 3', required: false, description: 'Third phone number' },
  { key: 'address', label: 'Address', required: false, description: 'Client address' },
  { key: 'company', label: 'Company', required: false, description: 'Client company name' },
  { key: 'tags', label: 'Tags', required: false, description: 'Client tags or categories (comma-separated)' },
  { key: 'source', label: 'Source', required: false, description: 'How the client was acquired' },
  { key: 'notes', label: 'Notes', required: false, description: 'Additional notes about the client' },
];

export const FieldMappingStep: React.FC<FieldMappingStepProps> = ({
  csvHeaders,
  fieldMapping,
  onMappingChange,
  selectedOrganization,
  onOrganizationChange,
}) => {
  const { allOrganizations, allProfiles, isAdmin } = useUserManagement();
  
  // Debug logging to verify deployment
  console.log('🔧 FieldMappingStep loaded - Organization feature active');
  console.log('👑 Is admin user?', isAdmin());
  console.log('🏢 Available organizations:', allOrganizations?.length || 0);
  console.log('📋 Organization change handler available?', !!onOrganizationChange);

  const handleFieldChange = (crmField: string, csvHeader: string) => {
    const newMapping = { ...fieldMapping };
    if (csvHeader === 'none') {
      delete newMapping[crmField];
    } else {
      newMapping[crmField] = csvHeader;
    }
    console.log('Field mapping changed:', { crmField, csvHeader, newMapping });
    onMappingChange(newMapping);
  };

  const getUsedHeaders = () => {
    return Object.values(fieldMapping);
  };

  const isRequiredFieldsMapped = () => {
    const hasName = fieldMapping['firstName'] || fieldMapping['lastName'];
    return hasName && fieldMapping['email1'] && fieldMapping['phone1'];
  };

  const clearAllMappings = () => {
    onMappingChange({});
  };

  const renderFieldRow = (field: { key: string; label: string; required: boolean; description: string }) => {
    const usedHeaders = getUsedHeaders();
    const currentValue = fieldMapping[field.key] || 'none';
    const isMapped = fieldMapping[field.key] && fieldMapping[field.key] !== 'none';
    
    // Special handling for name fields - show as required if neither is mapped
    const isNameField = field.key === 'firstName' || field.key === 'lastName';
    const hasName = fieldMapping['firstName'] || fieldMapping['lastName'];
    const showAsRequired = field.required || (isNameField && !hasName);
    
    return (
      <div key={field.key} className={`flex items-center space-x-4 p-4 border rounded-lg transition-colors ${
        isMapped ? 'border-green-200 bg-green-50' : showAsRequired ? 'border-red-200 bg-red-50' : 'border-gray-200'
      }`}>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{field.label}</span>
            {showAsRequired && <Badge variant="destructive" className="text-xs">
              {isNameField ? "Required (or other name)" : "Required"}
            </Badge>}
            {isMapped && <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Mapped</Badge>}
          </div>
          <p className="text-sm text-gray-600 mt-1">{field.description}</p>
          {isMapped && (
            <p className="text-sm text-green-700 mt-1 font-medium">
              → {fieldMapping[field.key]}
            </p>
          )}
        </div>
        
        <ArrowRight className="h-4 w-4 text-gray-400" />
        
        <div className="flex-1">
          <Select value={currentValue} onValueChange={(value) => handleFieldChange(field.key, value)}>
            <SelectTrigger className={`w-full ${isMapped ? 'border-green-300' : ''}`}>
              <SelectValue placeholder="Select CSV column..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-- Don't map --</SelectItem>
              {csvHeaders.map((header) => (
                <SelectItem 
                  key={header} 
                  value={header}
                  disabled={usedHeaders.includes(header) && fieldMapping[field.key] !== header}
                >
                  {header}
                  {usedHeaders.includes(header) && fieldMapping[field.key] !== header && (
                    <span className="text-gray-400 ml-2">(already used)</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {isMapped && (
          <CheckCircle className="h-5 w-5 text-green-500" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Map Your CSV Fields</h3>
        <p className="text-gray-600 mt-1">
          Match your CSV columns to the CRM fields below. Auto-mapping has been applied, but you can manually adjust any field mappings.
        </p>
        <div className="flex justify-center mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAllMappings}
            className="text-gray-600 hover:text-gray-900"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All Mappings
          </Button>
        </div>
      </div>

      {/* Organization Selection (Admin Only) */}
      {isAdmin() && onOrganizationChange && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Building className="h-4 w-4 mr-2" />
              Organization Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label htmlFor="organization-select">
                Assign imported clients to:
              </Label>
              <Select 
                value={selectedOrganization || 'admin'} 
                onValueChange={onOrganizationChange}
              >
                <SelectTrigger id="organization-select">
                  <SelectValue placeholder="Select organization..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center">
                      <Badge variant="default" className="mr-2 text-xs">Admin</Badge>
                      Admin Pool (Unassigned)
                    </div>
                  </SelectItem>
                  {allOrganizations
                    .filter(org => 
                      allProfiles.some(profile => 
                        profile.user_id === org.owner_id && profile.role === 'subaccount'
                      )
                    )
                    .map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        <div className="flex items-center">
                          <Badge variant="secondary" className="mr-2 text-xs">Subaccount</Badge>
                          {org.name}
                          {org.description && (
                            <span className="text-muted-foreground ml-2">
                              - {org.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600">
                {selectedOrganization === 'admin' || !selectedOrganization
                  ? 'Clients will be assigned to the admin pool and visible only to admin users.'
                  : 'Clients will be assigned to the selected subaccount organization.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Your CSV Columns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {csvHeaders.map((header) => (
                <Badge key={header} variant="outline" className="mr-2">
                  {header}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">CRM Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {requiredFields.map((field) => (
                <Badge key={field.key} variant="destructive" className="mr-2">
                  {field.label} (Required)
                </Badge>
              ))}
              {optionalFields.map((field) => (
                <Badge key={field.key} variant="secondary" className="mr-2">
                  {field.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-red-600">Required Fields</h4>
        {requiredFields.map(renderFieldRow)}
        
        <h4 className="font-medium text-gray-600">Optional Fields</h4>
        {optionalFields.map(renderFieldRow)}
      </div>

      {!isRequiredFieldsMapped() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> Please map all required fields (either First Name or Last Name, Email 1, Phone 1) before proceeding.
          </p>
        </div>
      )}

      {isRequiredFieldsMapped() && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">
            <CheckCircle className="h-4 w-4 inline mr-2" />
            All required fields are mapped. You can now proceed with the import.
          </p>
        </div>
      )}
    </div>
  );
}; 