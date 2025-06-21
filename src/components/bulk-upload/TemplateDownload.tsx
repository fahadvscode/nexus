
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { downloadTemplate } from "@/utils/csvUtils";

export const TemplateDownload = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <FileSpreadsheet className="h-6 w-6 text-green-600" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-gray-900">CSV Template</h4>
            <p className="text-sm text-gray-600">
              Download our pre-formatted template with sample data
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
                Correct Headers
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                Sample Data
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-1"></div>
                Tab-Separated
              </span>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={downloadTemplate} 
          className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>
    </div>
  );
};
