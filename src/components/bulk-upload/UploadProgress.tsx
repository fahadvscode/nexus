
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface Props {
  progress: number;
  status: string;
}

export const UploadProgress = ({ progress, status }: Props) => {
  return (
    <div className="space-y-4 p-6 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="flex items-center space-x-3">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <div>
          <h4 className="font-medium text-blue-900">Processing Upload</h4>
          <p className="text-sm text-blue-700">{status}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-blue-700">Progress</span>
          <span className="text-blue-900 font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
};
