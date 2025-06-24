import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UploadInstructions } from "@/components/bulk-upload/UploadInstructions";
import { TemplateDownload } from "@/components/bulk-upload/TemplateDownload";
import { FileUploadArea } from "@/components/bulk-upload/FileUploadArea";
import { FieldMappingStep } from "@/components/bulk-upload/FieldMappingStep";
import { UploadProgress } from "@/components/bulk-upload/UploadProgress";
import { UploadResults } from "@/components/bulk-upload/UploadResults";
import { useBulkUpload } from "@/hooks/useBulkUpload";
import { parseCSV } from "@/utils/csvUtils";
import { ArrowLeft, Upload, ArrowRight } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BulkUploadModal = ({ open, onOpenChange }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'mapping' | 'processing' | 'results'>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [selectedOrganization, setSelectedOrganization] = useState<string>('admin');
  const { uploading, results, uploadProgress, handleFileUpload, resetResults } = useBulkUpload();

  const resetModal = () => {
    setFile(null);
    setStep('upload');
    setCsvHeaders([]);
    setFieldMapping({});
    setSelectedOrganization('admin');
    resetResults();
  };

  const handleClose = (open: boolean) => {
    if (!open) resetModal();
    onOpenChange(open);
  };

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    try {
      const text = await selectedFile.text();
      const parsedData = parseCSV(text);
      if (parsedData.length > 0) {
        const headers = Object.keys(parsedData[0]);
        setCsvHeaders(headers);
        setStep('mapping');
        
        // Auto-map common field names
        const autoMapping: Record<string, string> = {};
        const emailCount = { count: 0 };
        const phoneCount = { count: 0 };
        
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase().trim();
          
          // First Name mapping (handle all variations)
          if (lowerHeader === 'first name' || lowerHeader === 'firstname' || lowerHeader === 'fname' || lowerHeader === 'first') {
            autoMapping['firstName'] = header;
          }
          // Last Name mapping (handle all variations)  
          else if (lowerHeader === 'last name' || lowerHeader === 'lastname' || lowerHeader === 'lname' || lowerHeader === 'surname' || lowerHeader === 'last') {
            autoMapping['lastName'] = header;
          }
          // Full name fallback
          else if (lowerHeader === 'name' || lowerHeader === 'full name' || lowerHeader === 'client name') {
            if (!autoMapping['firstName'] && !autoMapping['lastName']) {
              autoMapping['firstName'] = header;
            }
          }
          // Email mapping
          else if (lowerHeader === 'email' || lowerHeader === 'e-mail' || lowerHeader === 'email address') {
            autoMapping['email1'] = header;
          }
          else if (lowerHeader === 'email1' || lowerHeader === 'email 1' || lowerHeader === 'primary email') {
            autoMapping['email1'] = header;
          }
          else if (lowerHeader === 'email2' || lowerHeader === 'email 2' || lowerHeader === 'secondary email') {
            autoMapping['email2'] = header;
          }
          else if (lowerHeader === 'email3' || lowerHeader === 'email 3') {
            autoMapping['email3'] = header;
          }
          // Phone mapping
          else if (lowerHeader === 'phone' || lowerHeader === 'phone number' || lowerHeader === 'tel' || lowerHeader === 'mobile') {
            autoMapping['phone1'] = header;
          }
          else if (lowerHeader === 'phone1' || lowerHeader === 'phone 1' || lowerHeader === 'primary phone') {
            autoMapping['phone1'] = header;
          }
          else if (lowerHeader === 'phone2' || lowerHeader === 'phone 2' || lowerHeader === 'secondary phone') {
            autoMapping['phone2'] = header;
          }
          else if (lowerHeader === 'phone3' || lowerHeader === 'phone 3') {
            autoMapping['phone3'] = header;
          }
          // Other field mappings
          else if (lowerHeader === 'address' || lowerHeader === 'location') {
            autoMapping['address'] = header;
          }
          else if (lowerHeader === 'company' || lowerHeader === 'organization') {
            autoMapping['company'] = header;
          }
          else if (lowerHeader === 'tags' || lowerHeader === 'tag' || lowerHeader === 'category') {
            autoMapping['tags'] = header;
          }
          else if (lowerHeader === 'source' || lowerHeader === 'lead source') {
            autoMapping['source'] = header;
          }
          else if (lowerHeader === 'notes' || lowerHeader === 'note' || lowerHeader === 'comments') {
            autoMapping['notes'] = header;
          }
        });
        
        console.log('CSV Headers:', headers);
        console.log('Auto Mapping Result:', autoMapping);
        console.log('Headers with exact matches:');
        headers.forEach(header => {
          console.log(`"${header}" -> "${header.toLowerCase().trim()}"`);
        });
        setFieldMapping(autoMapping);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
    }
  };

  const onUpload = async () => {
    if (file && isRequiredFieldsMapped()) {
      setStep('processing');
      await handleFileUpload(file, fieldMapping, selectedOrganization);
      setStep('results');
    }
  };

  const isRequiredFieldsMapped = () => {
    const hasName = fieldMapping['firstName'] || fieldMapping['lastName'];
    const hasEmail = fieldMapping['email1'];
    const hasPhone = fieldMapping['phone1'];
    const isValid = hasName && hasEmail && hasPhone;
    
    console.log('Field mapping validation:', {
      fieldMapping,
      hasName,
      hasEmail,
      hasPhone,
      isValid
    });
    
    return isValid;
  };

  const canUpload = file && isRequiredFieldsMapped() && !uploading && !results;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Bulk Import Clients</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Import multiple clients at once using a CSV file
              </p>
              {/* Success indicator */}
              <p className="text-xs text-green-600 mt-1">
                ✅ Version: 996a7a3 - Admin bulk upload fixed & working
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8">
          {step === 'upload' && (
            <>
              <UploadInstructions />
              <TemplateDownload />
              <FileUploadArea file={file} onFileChange={handleFileSelected} />
            </>
          )}

          {step === 'mapping' && csvHeaders.length > 0 && (
            <FieldMappingStep
              csvHeaders={csvHeaders}
              fieldMapping={fieldMapping}
              onMappingChange={setFieldMapping}
              selectedOrganization={selectedOrganization}
              onOrganizationChange={setSelectedOrganization}
            />
          )}

          {(step === 'processing' || uploading) && (
            <UploadProgress 
              progress={uploadProgress.progress} 
              status={uploadProgress.status} 
            />
          )}
          
          {(step === 'results' || results) && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-green-600">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm font-medium">Upload Complete</span>
              </div>
              <UploadResults results={results} />
            </div>
          )}

          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              {step === 'mapping' && (
                <Button 
                  variant="ghost" 
                  onClick={() => setStep('upload')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Upload
                </Button>
              )}
              {results && (
                <Button 
                  variant="ghost" 
                  onClick={resetModal}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Upload Another File
                </Button>
              )}
            </div>

            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => handleClose(false)}
                className="hover:bg-gray-50"
              >
                {results ? 'Close' : 'Cancel'}
              </Button>
              
              {step === 'mapping' && isRequiredFieldsMapped() && (
                <Button 
                  onClick={onUpload} 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Clients
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
