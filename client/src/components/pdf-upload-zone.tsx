import { useState } from 'react';
import { FileText, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PDFUploadZoneProps {
  onPDFProcessed: (data: PDFProcessResult) => void;
}

export interface PDFProcessResult {
  filename: string | undefined;
  upload_id: string;
  total_pages: number;
  pages: PageData[];
  pdf_path: string;
}

export interface PageData {
  page_number: number;
  type: string;
  confidence: number;
  thumbnail: string;
  image_path: string;
  title: string;
  analyzable: boolean;
  metadata?: Record<string, any>;
}

export function PDFUploadZone({ onPDFProcessed }: PDFUploadZoneProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Please upload a PDF smaller than 50MB',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setProgress('Uploading PDF...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const mlApiUrl = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';
      
      setProgress('Processing pages...');
      
      const response = await fetch(`${mlApiUrl}/upload-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to process PDF');
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'PDF processed successfully',
          description: `Found ${result.data.total_pages} pages`,
        });
        onPDFProcessed(result.data);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('PDF upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to process PDF',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProgress('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      // Trigger file input change
      const input = document.getElementById('pdf-upload') as HTMLInputElement;
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please drop a PDF file',
        variant: 'destructive',
      });
    }
  };

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileUpload}
        className="hidden"
        id="pdf-upload"
        disabled={isProcessing}
      />

      <label htmlFor="pdf-upload" className="cursor-pointer block">
        {isProcessing ? (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
            <div>
              <p className="text-lg font-medium text-gray-900">
                Processing PDF...
              </p>
              <p className="mt-2 text-sm text-gray-500">{progress}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <FileText className="h-12 w-12 text-gray-400" />
            </div>

            <div>
              <p className="text-lg font-medium text-gray-900">
                Upload Construction PDF
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Click to upload or drag and drop
              </p>
              <p className="mt-1 text-xs text-gray-400">PDF up to 50MB</p>
            </div>

            <Button type="button" variant="outline" className="mt-4">
              <Upload className="w-4 h-4 mr-2" />
              Choose PDF File
            </Button>
          </div>
        )}
      </label>

      {!isProcessing && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Supported: Floor plans, elevations, electrical plans, and more
          </p>
        </div>
      )}
    </div>
  );
}
