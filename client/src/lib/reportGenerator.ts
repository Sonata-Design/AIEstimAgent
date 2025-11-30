import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import type { Project, Takeoff, Drawing, SavedAnalysis } from '@shared/schema';

interface ReportData {
  project: Project;
  takeoffs: Takeoff[];
  drawings: Drawing[];
  analyses?: SavedAnalysis[];
}

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
}

export class ReportGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  // Add chart to PDF (for visual reports)
  async addChartToPDF(chartElement: HTMLCanvasElement, yPos: number, title?: string): Promise<number> {
    try {
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 1
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 160; // PDF units
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      if (title) {
        this.doc.setFontSize(14);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(title, this.margin, yPos);
        yPos += 15;
      }
      
      this.doc.addImage(imgData, 'PNG', this.margin, yPos, imgWidth, imgHeight);
      return yPos + imgHeight + 10;
    } catch (error) {
      console.error('Error adding chart to PDF:', error);
      return yPos;
    }
  }

  // Generate Executive Summary Report
  async generateExecutiveSummary(data: ReportData, companyInfo: CompanyInfo): Promise<Blob> {
    this.doc = new jsPDF();
    
    // Header with company branding
    this.addHeader(companyInfo);
    
    // Project title and basic info
    let yPos = 60;
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PROJECT EXECUTIVE SUMMARY', this.margin, yPos);
    
    yPos += 20;
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(data.project.name, this.margin, yPos);
    
    // Project overview section
    yPos = this.addProjectOverview(data.project, yPos + 15);
    
    // Cost summary section
    yPos = this.addCostSummary(data.takeoffs, yPos + 15);
    
    // Key metrics section
    yPos = this.addKeyMetrics(data.takeoffs, yPos + 15);
    
    // Footer
    this.addFooter();
    
    return this.doc.output('blob');
  }

  // Generate Detailed Cost Report
  async generateDetailedCostReport(data: ReportData, companyInfo: CompanyInfo): Promise<Blob> {
    this.doc = new jsPDF();
    
    // Header
    this.addHeader(companyInfo);
    
    let yPos = 60;
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DETAILED COST BREAKDOWN', this.margin, yPos);
    
    yPos += 20;
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Project: ${data.project.name}`, this.margin, yPos);
    this.doc.text(`Date: ${new Date().toLocaleDateString()}`, this.pageWidth - 60, yPos);
    
    // Group takeoffs by element type
    const groupedTakeoffs = this.groupTakeoffsByType(data.takeoffs);
    
    yPos += 20;
    
    // Create detailed tables for each element type
    for (const [elementType, takeoffs] of Object.entries(groupedTakeoffs)) {
      if (yPos > this.pageHeight - 100) {
        this.doc.addPage();
        yPos = this.margin + 10;
      }
      
      // Section header
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(elementType.toUpperCase(), this.margin, yPos);
      yPos += 10;
      
      // Create table data
      const tableData = takeoffs.map(takeoff => [
        takeoff.element_name,
        takeoff.quantity?.toString() || '0',
        takeoff.unit,
        takeoff.area ? takeoff.area.toFixed(1) : '-',
        takeoff.length ? takeoff.length.toFixed(1) : '-',
        `$${(takeoff.cost_per_unit || 0).toFixed(2)}`,
        `$${(takeoff.total_cost || 0).toLocaleString()}`,
        takeoff.is_verified ? '✓' : '-'
      ]);
      
      autoTable(this.doc, {
        startY: yPos,
        head: [['Item', 'Qty', 'Unit', 'Area', 'Length', 'Unit Cost', 'Total', 'Verified']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          6: { halign: 'right' },
          5: { halign: 'right' }
        }
      });
      
      yPos = (this.doc as any).lastAutoTable.finalY + 15;
      
      // Subtotal for this section
      const subtotal = takeoffs.reduce((sum, t) => sum + (t.total_cost || 0), 0);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${elementType} Subtotal: $${subtotal.toLocaleString()}`, this.pageWidth - 80, yPos - 5);
      this.doc.setFont('helvetica', 'normal');
    }
    
    // Add grand total
    this.addGrandTotal(data.takeoffs);
    
    this.addFooter();
    return this.doc.output('blob');
  }

  // Generate Comparison Report
  async generateComparisonReport(
    originalData: ReportData, 
    revisedData: ReportData, 
    companyInfo: CompanyInfo
  ): Promise<Blob> {
    this.doc = new jsPDF();
    
    this.addHeader(companyInfo);
    
    let yPos = 60;
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ESTIMATE COMPARISON REPORT', this.margin, yPos);
    
    yPos += 20;
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Project: ${originalData.project.name}`, this.margin, yPos);
    this.doc.text(`Comparison Date: ${new Date().toLocaleDateString()}`, this.pageWidth - 80, yPos);
    
    // Summary comparison
    const originalTotal = this.calculateTotalCost(originalData.takeoffs);
    const revisedTotal = this.calculateTotalCost(revisedData.takeoffs);
    const difference = revisedTotal - originalTotal;
    const percentageChange = originalTotal > 0 ? (difference / originalTotal) * 100 : 0;
    
    yPos += 30;
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('COST COMPARISON SUMMARY', this.margin, yPos);
    
    yPos += 20;
    const summaryData = [
      ['Original Estimate', `$${originalTotal.toLocaleString()}`],
      ['Revised Estimate', `$${revisedTotal.toLocaleString()}`],
      ['Difference', `$${Math.abs(difference).toLocaleString()} ${difference >= 0 ? 'increase' : 'decrease'}`],
      ['Percentage Change', `${Math.abs(percentageChange).toFixed(1)}% ${percentageChange >= 0 ? 'increase' : 'decrease'}`]
    ];
    
    autoTable(this.doc, {
      startY: yPos,
      head: [['Description', 'Amount']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [52, 73, 94] },
      styles: { fontSize: 12, cellPadding: 5 },
      columnStyles: {
        1: { halign: 'right', fontStyle: 'bold' }
      }
    });
    
    yPos = (this.doc as any).lastAutoTable.finalY + 20;
    
    // Detailed comparison by element type
    this.addDetailedComparison(originalData.takeoffs, revisedData.takeoffs, yPos);
    
    this.addFooter();
    return this.doc.output('blob');
  }

  // Helper methods
  private addHeader(companyInfo: CompanyInfo) {
    // Company logo placeholder (if provided)
    if (companyInfo.logo) {
      // Add logo logic here
    }
    
    // Company info
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(companyInfo.name, this.pageWidth - 80, 20);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.text(companyInfo.address, this.pageWidth - 80, 28);
    this.doc.text(companyInfo.phone, this.pageWidth - 80, 36);
    this.doc.text(companyInfo.email, this.pageWidth - 80, 44);
    
    // Line separator
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, 50, this.pageWidth - this.margin, 50);
  }

  private addProjectOverview(project: Project, yPos: number): number {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PROJECT OVERVIEW', this.margin, yPos);
    
    yPos += 15;
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    
    const overviewData = [
      ['Project Name', project.name],
      ['Location', project.location || 'Not specified'],
      ['Client', project.client || 'Not specified'],
      ['Status', project.status],
      ['Created Date', new Date(project.created_at!).toLocaleDateString()]
    ];
    
    autoTable(this.doc, {
      startY: yPos,
      body: overviewData,
      theme: 'plain',
      styles: { fontSize: 11, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 100 }
      }
    });
    
    return (this.doc as any).lastAutoTable.finalY + 10;
  }

  private addCostSummary(takeoffs: Takeoff[], yPos: number): number {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('COST SUMMARY', this.margin, yPos);
    
    // Group costs by element type
    const groupedCosts = this.groupTakeoffsByType(takeoffs);
    const summaryData = Object.entries(groupedCosts).map(([type, items]) => {
      const total = items.reduce((sum, item) => sum + (item.total_cost || 0), 0);
      const itemCount = items.length;
      return [type.charAt(0).toUpperCase() + type.slice(1), itemCount.toString(), `$${total.toLocaleString()}`];
    });
    
    // Add grand total
    const grandTotal = takeoffs.reduce((sum, t) => sum + (t.total_cost || 0), 0);
    summaryData.push(['TOTAL', takeoffs.length.toString(), `$${grandTotal.toLocaleString()}`]);
    
    yPos += 15;
    autoTable(this.doc, {
      startY: yPos,
      head: [['Element Type', 'Items', 'Cost']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 11, cellPadding: 4 },
      columnStyles: {
        2: { halign: 'right', fontStyle: 'bold' }
      }
    });
    
    return (this.doc as any).lastAutoTable.finalY + 10;
  }

  private addKeyMetrics(takeoffs: Takeoff[], yPos: number): number {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('KEY METRICS', this.margin, yPos);
    
    yPos += 15;
    
    const totalItems = takeoffs.length;
    const verifiedItems = takeoffs.filter(t => t.is_verified).length;
    const aiDetectedItems = takeoffs.filter(t => t.is_detected_by_ai).length;
    const manuallyEditedItems = takeoffs.filter(t => t.is_manually_edited).length;
    
    const metricsData = [
      ['Total Items', totalItems.toString()],
      ['Verified Items', `${verifiedItems} (${((verifiedItems / totalItems) * 100).toFixed(1)}%)`],
      ['AI Detected', `${aiDetectedItems} (${((aiDetectedItems / totalItems) * 100).toFixed(1)}%)`],
      ['Manually Edited', `${manuallyEditedItems} (${((manuallyEditedItems / totalItems) * 100).toFixed(1)}%)`]
    ];
    
    autoTable(this.doc, {
      startY: yPos,
      body: metricsData,
      theme: 'plain',
      styles: { fontSize: 11, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 80 }
      }
    });
    
    return (this.doc as any).lastAutoTable.finalY + 10;
  }

  private addDetailedComparison(originalTakeoffs: Takeoff[], revisedTakeoffs: Takeoff[], yPos: number) {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DETAILED COMPARISON BY ELEMENT TYPE', this.margin, yPos);
    
    yPos += 15;
    
    const originalGrouped = this.groupTakeoffsByType(originalTakeoffs);
    const revisedGrouped = this.groupTakeoffsByType(revisedTakeoffs);
    
    // Get all unique element types
    const allTypes = new Set([...Object.keys(originalGrouped), ...Object.keys(revisedGrouped)]);
    
    const comparisonData = Array.from(allTypes).map(type => {
      const originalCost = this.calculateTypeCost(originalGrouped[type] || []);
      const revisedCost = this.calculateTypeCost(revisedGrouped[type] || []);
      const difference = revisedCost - originalCost;
      
      return [
        type.charAt(0).toUpperCase() + type.slice(1),
        `$${originalCost.toLocaleString()}`,
        `$${revisedCost.toLocaleString()}`,
        `$${Math.abs(difference).toLocaleString()}`,
        difference >= 0 ? 'Increase' : 'Decrease'
      ];
    });
    
    autoTable(this.doc, {
      startY: yPos,
      head: [['Element Type', 'Original', 'Revised', 'Difference', 'Change']],
      body: comparisonData,
      theme: 'striped',
      headStyles: { fillColor: [52, 73, 94] },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'center' }
      }
    });
  }

  private addGrandTotal(takeoffs: Takeoff[]) {
    const total = this.calculateTotalCost(takeoffs);
    
    // Add new page if needed
    if ((this.doc as any).lastAutoTable.finalY > this.pageHeight - 60) {
      this.doc.addPage();
    }
    
    const yPos = (this.doc as any).lastAutoTable.finalY + 20;
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(this.pageWidth - 100, yPos - 5, 80, 15, 'F');
    this.doc.text(`GRAND TOTAL: $${total.toLocaleString()}`, this.pageWidth - 95, yPos + 5);
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`Page ${i} of ${pageCount}`, this.pageWidth - 30, this.pageHeight - 10);
      this.doc.text(`Generated on ${new Date().toLocaleDateString()}`, this.margin, this.pageHeight - 10);
    }
  }

  private groupTakeoffsByType(takeoffs: Takeoff[]): Record<string, Takeoff[]> {
    return takeoffs.reduce((groups, takeoff) => {
      const type = takeoff.element_type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(takeoff);
      return groups;
    }, {} as Record<string, Takeoff[]>);
  }

  private calculateTotalCost(takeoffs: Takeoff[]): number {
    return takeoffs.reduce((sum, t) => sum + (t.total_cost || 0), 0);
  }

  private calculateTypeCost(takeoffs: Takeoff[]): number {
    return takeoffs.reduce((sum, t) => sum + (t.total_cost || 0), 0);
  }
}