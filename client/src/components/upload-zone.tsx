import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { createApiUrl } from "@/config/api";
import { CloudUpload, X, Upload, Check } from "lucide-react";

interface UploadZoneProps {
  projectId: string;
  onUploadComplete: () => void;
  onCancel: () => void;
}

export default function UploadZone({ projectId, onUploadComplete, onCancel }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [drawingName, setDrawingName] = useState("");
  const [scale, setScale] = useState("1/4\" = 1'");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const url = createApiUrl(`/api/projects/${projectId}/drawings/upload`);
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload successful",
        description: "Your drawing has been uploaded and AI processing has started.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "drawings"] });
      onUploadComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, PNG, and JPG files are allowed.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size must be less than 50MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    const name = file.name.replace(/\.[^/.]+$/, "");
    setDrawingName(name);
    
    // Auto-upload the file
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);
    formData.append("scale", scale);
    
    uploadMutation.mutate(formData);
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("name", drawingName);
    formData.append("scale", scale);

    uploadMutation.mutate(formData);
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? "border-blueprint-500 bg-blueprint-50" 
            : "border-slate-300 hover:border-blueprint-400"
        } ${uploadMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploadMutation.isPending && fileInputRef.current?.click()}
      >
        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-8 h-8 border-4 border-blueprint-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-600">Uploading...</p>
          </div>
        ) : selectedFile ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-slate-700">Uploaded: {selectedFile.name}</p>
            </div>
            <p className="text-xs text-slate-500">Processing may take a moment...</p>
          </div>
        ) : (
          <>
            <CloudUpload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600 mb-1">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-slate-500">PDF, PNG, JPG up to 50MB</p>
          </>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
          disabled={uploadMutation.isPending}
        />
      </div>
    </div>
  );
}
