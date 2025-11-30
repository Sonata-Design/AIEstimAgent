import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";
import { PageGallery } from "./page-gallery";
import { createApiUrl } from "@/config/api";
import type { PDFProcessResult } from "@/types/pdf";

interface FileUploadDialogProps {
  onFileUpload: (file: File) => Promise<void> | void;
  isUploading?: boolean;
  onPDFPageSelected?: (pageData: any) => void;
}

export default function FileUploadDialog({ onFileUpload, isUploading, onPDFPageSelected }: FileUploadDialogProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [internalUploading, setInternalUploading] = useState(false);
  const [isPDFProcessing, setIsPDFProcessing] = useState(false);
  const [pdfData, setPDFData] = useState<PDFProcessResult | null>(null);
  const [selectedPageNumber, setSelectedPageNumber] = useState<number | null>(null);
  const { toast } = useToast();


  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const isValidType = file.type.includes('pdf') || 
                         file.type.includes('image') ||
                         file.name.toLowerCase().endsWith('.pdf') ||
                         file.name.toLowerCase().endsWith('.png') ||
                         file.name.toLowerCase().endsWith('.jpg') ||
                         file.name.toLowerCase().endsWith('.jpeg');
      
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported format. Please upload PDF, PNG, or JPG files.`,
          variant: "destructive",
        });
        return false;
      }
      
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 50MB limit.`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length > 0) {
      const firstFile = validFiles[0];
      
      // Check if it's a PDF
      if (firstFile.type === 'application/pdf' || firstFile.name.toLowerCase().endsWith('.pdf')) {
        await handlePDFUpload(firstFile);
      } else {
        // Auto-upload image files immediately
        await handleImageUpload(firstFile);
      }
    }
  };

  const handleImageUpload = async (file: File) => {
    setInternalUploading(true);
    try {
      await onFileUpload(file);
    } catch (error) {
      console.error('Image upload failed:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setInternalUploading(false);
    }
  };

  const handlePDFUpload = async (file: File) => {
    setIsPDFProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use our backend API proxy endpoint
      const uploadUrl = createApiUrl('/api/upload-pdf');

      console.log('[PDF Upload] Starting upload...');
      console.log('[PDF Upload] File:', file.name, file.size, 'bytes');
      console.log('[PDF Upload] Endpoint:', uploadUrl);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      console.log('[PDF Upload] Response status:', response.status);
      console.log('[PDF Upload] Response OK:', response.ok);

      if (!response.ok) {
        const error = await response.json();
        console.error('[PDF Upload] Error response:', error);
        throw new Error(error.detail || error.error || 'Failed to process PDF');
      }

      const result = await response.json();
      console.log('[PDF Upload] Success! Result:', result);

      if (result.success) {
        toast({
          title: 'PDF processed successfully',
          description: `Found ${result.data.total_pages} pages`,
        });
        setPDFData(result.data);
        // Notify parent component about PDF data so it can show the gallery
        console.log('[PDF Upload] Calling onPDFPageSelected with:', result.data);
        if (onPDFPageSelected) {
          onPDFPageSelected(result.data);
        } else {
          console.warn('[PDF Upload] onPDFPageSelected callback not provided');
        }
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('[PDF Upload] ERROR:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to process PDF',
        variant: 'destructive',
      });
      setPDFData(null);
    } finally {
      setIsPDFProcessing(false);
    }
  };


  const handleBackFromPDF = () => {
    setPDFData(null);
    setSelectedPageNumber(null);
  };

  // Notify parent when page is selected
  useEffect(() => {
    if (pdfData && selectedPageNumber !== null && onPDFPageSelected) {
      const selectedPage = pdfData.pages.find(p => p.page_number === selectedPageNumber);
      if (selectedPage) {
        onPDFPageSelected(selectedPage);
      }
    }
  }, [selectedPageNumber, pdfData, onPDFPageSelected]);

  // NOTE: PDF gallery is now handled by PDFGallerySidebar component in dashboard
  // This component only handles file uploads

  // Show PDF processing state
  if (isPDFProcessing) {
    return (
      <div className="flex-1 bg-muted/30 flex items-center justify-center p-8">
        <div className="max-w-lg w-full text-center">
          <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Processing PDF...
          </h3>
          <p className="text-sm text-muted-foreground">
            Extracting and classifying pages...
          </p>
        </div>
      </div>
    );
  }

  // Show uploading state
  if (internalUploading) {
    return (
      <div className="flex-1 bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Uploading...
          </h3>
          <p className="text-sm text-muted-foreground">
            Please wait while your file is being uploaded
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-muted/30 flex items-center justify-center p-4 sm:p-8 w-full">
      <div className="w-full max-w-2xl">
        <div
          className={`border-2 border-dashed rounded-lg p-8 sm:p-12 text-center transition-colors ${
            isDragOver 
              ? 'border-primary bg-primary/10' 
              : 'border-border bg-card hover:border-muted-foreground'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="mb-6">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              Drop files here to upload
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload blueprint PDFs or images for AI analysis
            </p>
            <p className="text-xs text-muted-foreground">
              Supports PDF, PNG, JPG files up to 50MB
            </p>
          </div>

          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button asChild className="cursor-pointer">
              <span>Choose Files</span>
            </Button>
          </label>
        </div>
      </div>
    </div>
  );
}