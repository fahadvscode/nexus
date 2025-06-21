
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle2, FileText, X } from "lucide-react";

interface Props {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export const FileUploadArea = ({ file, onFileChange }: Props) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === "text/csv" || droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.txt'))) {
      onFileChange(droppedFile);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-gray-900">Upload CSV File</Label>
      
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isDragOver
            ? "border-blue-400 bg-blue-50"
            : file
            ? "border-green-300 bg-green-50"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!file ? (
          <>
            <div className="flex flex-col items-center space-y-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                isDragOver ? "bg-blue-100" : "bg-gray-100"
              }`}>
                <Upload className={`h-8 w-8 transition-colors ${
                  isDragOver ? "text-blue-600" : "text-gray-400"
                }`} />
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">
                  {isDragOver ? "Drop your file here" : "Drag & drop your CSV file"}
                </p>
                <p className="text-sm text-gray-500">
                  or click to browse your computer
                </p>
                <p className="text-xs text-gray-400">
                  Supports .csv and .txt files (tab-separated)
                </p>
              </div>
              
              <input
                type="file"
                accept=".csv,.txt"
                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="csv-upload"
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFileChange(null)}
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {!file && (
        <div className="flex justify-center">
          <label htmlFor="csv-upload-button">
            <Button variant="outline" className="cursor-pointer hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
              className="hidden"
              id="csv-upload-button"
            />
          </label>
        </div>
      )}
    </div>
  );
};
