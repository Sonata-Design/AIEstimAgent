import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createApiUrl } from '@/config/api';
import { apiRequest } from '@/lib/queryClient';
import { compressImage, formatFileSize } from '@/utils/imageOptimizer';
import type { Drawing, Project } from '@shared/schema';
import type { PDFProcessResult } from '@/types/pdf';
import type { DocumentModel } from '@/types/document';
import { createImageDocument, createPDFPageDocument } from '@/types/document';

interface UseDocumentUploadOptions {
  currentProject: Project | null;
  onProjectCreate?: (project: Project) => void;
  onDocumentReady?: (document: DocumentModel) => void;
  selectedScale?: string;
}

/**
 * Centralized hook for handling both image and PDF uploads
 * Replaces scattered upload logic across components
 */
export function useDocumentUpload(options: UseDocumentUploadOptions) {
  const { currentProject, onProjectCreate, onDocumentReady, selectedScale = "1/4\" = 1'" } = options;
  const { toast } = useToast();
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [isPDFProcessing, setIsPDFProcessing] = useState(false);

  /**
   * Create a new project if one doesn't exist
   */
  const createProject = async (fileName: string): Promise<Project> => {
    const projectData = {
      name: `Project - ${fileName}`,
      description: `Auto-generated project for ${fileName}`,
      status: "active"
    };
    
    const project = await apiRequest(createApiUrl("/api/projects"), "POST", projectData);
    onProjectCreate?.(project);
    return project;
  };

  /**
   * Upload an image file
   */
  const uploadImage = async (file: File): Promise<DocumentModel> => {
    setIsUploading(true);
    setUploadProgress('');

    try {
      // Optimize image
      const originalSize = formatFileSize(file.size);
      const optimizedFile = await compressImage(file, {
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 0.85,
        maxSizeMB: 5
      });
      const newSize = formatFileSize(optimizedFile.size);
      console.log(`[Upload] Image optimized: ${originalSize} → ${newSize}`);

      // Upload file
      const uploadFormData = new FormData();
      uploadFormData.append('file', optimizedFile);
      const uploadResult = await apiRequest(createApiUrl('/api/upload'), 'POST', uploadFormData, true);

      if (!uploadResult || !uploadResult.filename || !uploadResult.file_url) {
        throw new Error('Invalid upload response');
      }

      // Get or create project
      const projectToUse = currentProject || await createProject(file.name);

      // Create drawing entry
      const drawingData = {
        project_id: projectToUse.id,
        name: file.name,
        filename: uploadResult.filename,
        file_url: uploadResult.file_url,
        file_type: file.type,
        status: "complete",
        scale: selectedScale,
        ai_processed: false
      };

      const savedDrawing: Drawing = await apiRequest(
        createApiUrl(`/api/projects/${projectToUse.id}/drawings`),
        "POST",
        drawingData
      );

      // Convert to unified document model
      const document = createImageDocument(savedDrawing);
      onDocumentReady?.(document);

      toast({
        title: "Upload Successful",
        description: "Image uploaded successfully. Ready for AI analysis.",
      });

      return document;
    } catch (error) {
      console.error('[Upload] Image upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  /**
   * Upload and process a PDF file
   */
  const uploadPDF = async (file: File): Promise<PDFProcessResult> => {
    setIsPDFProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadUrl = createApiUrl('/api/upload-pdf');
      console.log('[Upload] Uploading PDF to:', uploadUrl);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || error.error || 'Failed to process PDF');
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'PDF Processed Successfully',
          description: `Found ${result.data.total_pages} pages`,
        });
        return result.data;
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('[Upload] PDF upload failed:', error);
      toast({
        title: 'PDF Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to process PDF',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsPDFProcessing(false);
    }
  };

  /**
   * Select a specific page from PDF data
   */
  const selectPDFPage = (pdfData: PDFProcessResult, pageNumber: number, filename?: string): DocumentModel => {
    const document = createPDFPageDocument(pdfData, pageNumber, filename);
    onDocumentReady?.(document);
    return document;
  };

  /**
   * Auto-detect file type and upload accordingly
   */
  const uploadFile = async (file: File): Promise<DocumentModel | PDFProcessResult> => {
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    
    if (isPDF) {
      return await uploadPDF(file);
    } else {
      return await uploadImage(file);
    }
  };

  return {
    // State
    isUploading,
    uploadProgress,
    isPDFProcessing,
    
    // Methods
    uploadImage,
    uploadPDF,
    uploadFile,
    selectPDFPage,
  };
}
