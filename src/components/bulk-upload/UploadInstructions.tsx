
import { CheckCircle, FileText, Users, Tag } from "lucide-react";

export const UploadInstructions = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <FileText className="h-4 w-4 text-blue-600" />
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-blue-900 text-lg mb-2">Quick Upload Guide</h3>
            <p className="text-sm text-blue-700 mb-3">
              Follow these simple steps to import your clients efficiently:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-blue-800">Use tab-separated values (TSV format)</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-blue-800">Include headers: First Name, Last Name, Phone, Email, Tag</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Users className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-blue-800">At least First or Last Name required</span>
              </div>
              <div className="flex items-start space-x-2">
                <Tag className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-blue-800">Tags help categorize your clients</span>
              </div>
            </div>
          </div>

          <div className="bg-white/60 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-600 font-medium">
              💡 Pro Tip: Download our template below to ensure perfect formatting
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
