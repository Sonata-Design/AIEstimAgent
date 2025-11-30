/**
 * PDF Processing Types
 */

export interface PDFProcessResult {
  upload_id?: string;
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
