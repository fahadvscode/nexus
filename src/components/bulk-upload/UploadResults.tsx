
import { AlertCircle, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  results: {
    success: number;
    errors: { row: number; message: string }[];
  };
}

export const UploadResults = ({ results }: Props) => {
  const totalProcessed = results.success + results.errors.length;
  const successRate = ((results.success / totalProcessed) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900">{results.success}</p>
              <p className="text-sm text-green-700">Clients Imported</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-900">{results.errors.length}</p>
              <p className="text-sm text-red-700">Import Errors</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{successRate}%</p>
              <p className="text-sm text-blue-700">Success Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {results.success > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900">Import Successful!</h4>
              <p className="text-sm text-green-700">
                {results.success} clients have been successfully added to your CRM. 
                They are now available in your client list with the status "lead".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Details */}
      {results.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start space-x-3 mb-4">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900 mb-1">Import Errors Found</h4>
              <p className="text-sm text-red-700">
                The following rows couldn't be imported. Please fix these issues and try uploading again:
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-red-200 max-h-48 overflow-y-auto">
            <div className="divide-y divide-red-100">
              {results.errors.map((error, index) => (
                <div key={index} className="p-3 flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-red-600">{error.row}</span>
                  </div>
                  <p className="text-sm text-red-700 flex-1">{error.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <Button variant="outline" size="sm" className="text-red-700 border-red-200 hover:bg-red-50">
              Download Error Report
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
