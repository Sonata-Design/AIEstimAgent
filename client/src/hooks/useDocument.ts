import { useState } from 'react';
import type { DocumentModel } from '@/types/document';

/**
 * Hook to manage the current document (image or PDF page)
 * Replaces separate currentDrawing and pdfPageData state
 */
export function useDocument() {
  const [currentDocument, setCurrentDocument] = useState<DocumentModel | null>(null);

  const clearDocument = () => {
    setCurrentDocument(null);
  };

  const isImage = currentDocument?.type === 'image';
  const isPDFPage = currentDocument?.type === 'pdf-page';

  return {
    currentDocument,
    setCurrentDocument,
    clearDocument,
    isImage,
    isPDFPage,
  };
}
