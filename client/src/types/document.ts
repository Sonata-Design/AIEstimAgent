import type { Drawing } from "@shared/schema";
import type { PDFProcessResult } from "./pdf";

/**
 * Unified document type that can represent both uploaded images and PDF pages
 */
export interface DocumentModel {
  type: 'image' | 'pdf-page';
  id: string;
  name: string;
  url: string;
  
  // For uploaded images (stored in database)
  drawing?: Drawing;
  
  // For PDF pages (temporary, not stored)
  pdfData?: PDFProcessResult;
  pageNumber?: number;
}

/**
 * Helper to create a document from an uploaded image/drawing
 */
export function createImageDocument(drawing: Drawing): DocumentModel {
  return {
    type: 'image',
    id: drawing.id,
    name: drawing.name,
    url: drawing.file_url,
    drawing,
  };
}

/**
 * Helper to create a document from a PDF page
 */
export function createPDFPageDocument(
  pdfData: PDFProcessResult,
  pageNumber: number,
  filename?: string
): DocumentModel {
  const page = pdfData.pages.find(p => p.page_number === pageNumber);
  if (!page) {
    throw new Error(`Page ${pageNumber} not found in PDF data`);
  }
  
  const pdfName = filename || 'PDF Document';
  
  return {
    type: 'pdf-page',
    id: `pdf-page-${pageNumber}-${Date.now()}`,
    name: `${pdfName} - Page ${pageNumber}`,
    url: page.image_path,
    pdfData,
    pageNumber,
  };
}
