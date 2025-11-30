import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ReportGenerator } from "@/lib/reportGenerator";
import { 
  FileText, 
  Download, 
  Building, 
  TrendingUp, 
  Users, 
  Settings,
  Loader2
} from "lucide-react";
import type { Project, Takeoff, Drawing, SavedAnalysis } from "@shared/schema";

interface ReportGeneratorProps {
  project: Project;
  takeoffs: Takeoff[];
  drawings: Drawing[];
  analyses?: SavedAnalysis[];
}

interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
}

export function ReportGeneratorComponent({ project, takeoffs, drawings, analyses }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: "EstimAgent Construction Services",
    address: "123 Business St, Suite 100, City, State 12345",
    phone: "(555) 123-4567",
    email: "contact@estimagent.com"
  });
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>("");
  
  const { toast } = useToast();
  const reportGen = new ReportGenerator();

  const handleGenerateReport = async (reportType: 'executive' | 'detailed' | 'comparison') => {
    setIsGenerating(true);
    try {
      let blob: Blob;
      let filename: string;

      const reportData = {
        project,
        takeoffs,
        drawings,
        analyses
      };

      switch (reportType) {
        case 'executive':
          blob = await reportGen.generateExecutiveSummary(reportData, companySettings);
          filename = `${project.name}-executive-summary.pdf`;
          break;
        
        case 'detailed':
          blob = await reportGen.generateDetailedCostReport(reportData, companySettings);
          filename = `${project.name}-detailed-cost-report.pdf`;
          break;
        
        case 'comparison':
          // For now, compare current state with itself - in real implementation,
          // this would compare with a saved analysis or previous version
          blob = await reportGen.generateComparisonReport(reportData, reportData, companySettings);
          filename = `${project.name}-comparison-report.pdf`;
          break;
        
        default:
          throw new Error('Unknown report type');
      }

      // Download the generated PDF
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Report Generated",
        description: `${reportType === 'executive' ? 'Executive Summary' : reportType === 'detailed' ? 'Detailed Cost Report' : 'Comparison Report'} has been downloaded successfully.`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Report Generation Failed",
        description: "There was an error generating the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const reportStats = {
    totalItems: takeoffs.length,
    totalCost: takeoffs.reduce((sum, t) => sum + (t.total_cost || 0), 0),
    verifiedItems: takeoffs.filter(t => t.is_verified).length,
    elementTypes: new Set(takeoffs.map(t => t.element_type)).size
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <FileText className="w-4 h-4 mr-2" />
          Generate Reports
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Professional Report Generator</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reports">Generate Reports</TabsTrigger>
            <TabsTrigger value="settings">Company Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            {/* Report Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{reportStats.total_items}</div>
                  <div className="text-sm text-slate-600">Total Items</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">${reportStats.total_cost.toLocaleString()}</div>
                  <div className="text-sm text-slate-600">Total Cost</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{reportStats.is_verifiedItems}</div>
                  <div className="text-sm text-slate-600">Verified</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{reportStats.element_types}</div>
                  <div className="text-sm text-slate-600">Element Types</div>
                </CardContent>
              </Card>
            </div>

            {/* Report Types */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Executive Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    Executive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600">
                    High-level overview with project metrics, cost summary, and key insights for stakeholders and executives.
                  </p>
                  <ul className="text-xs text-slate-500 space-y-1">
                    <li>• Project overview and timeline</li>
                    <li>• Cost summary by category</li>
                    <li>• Key performance metrics</li>
                    <li>• Professional branding</li>
                  </ul>
                  <Button 
                    onClick={() => handleGenerateReport('executive')}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Generate Executive Report
                  </Button>
                </CardContent>
              </Card>

              {/* Detailed Cost Report */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="w-5 h-5 mr-2 text-green-600" />
                    Detailed Cost Report
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Comprehensive breakdown of all materials, labor costs, and quantities organized by element type.
                  </p>
                  <ul className="text-xs text-slate-500 space-y-1">
                    <li>• Item-by-item cost breakdown</li>
                    <li>• Material vs labor separation</li>
                    <li>• Quantity and unit details</li>
                    <li>• Verification status tracking</li>
                  </ul>
                  <Button 
                    onClick={() => handleGenerateReport('detailed')}
                    disabled={isGenerating}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Generate Detailed Report
                  </Button>
                </CardContent>
              </Card>

              {/* Comparison Report */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                    Comparison Report
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Compare original estimates with revised versions to track changes and scope modifications.
                  </p>
                  
                  {analyses && analyses.length > 0 && (
                    <div>
                      <Label htmlFor="analysis-select" className="text-xs">Compare Against:</Label>
                      <Select value={selectedAnalysis} onValueChange={setSelectedAnalysis}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select saved analysis" />
                        </SelectTrigger>
                        <SelectContent>
                          {analyses.map((analysis) => (
                            <SelectItem key={analysis.id} value={analysis.id}>
                              {analysis.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <ul className="text-xs text-slate-500 space-y-1">
                    <li>• Side-by-side cost comparison</li>
                    <li>• Change percentage analysis</li>
                    <li>• Item-level differences</li>
                    <li>• Impact assessment</li>
                  </ul>
                  <Button 
                    onClick={() => handleGenerateReport('comparison')}
                    disabled={isGenerating}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Generate Comparison Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      value={companySettings.name}
                      onChange={(e) => setCompanySettings({
                        ...companySettings,
                        name: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-phone">Phone Number</Label>
                    <Input
                      id="company-phone"
                      value={companySettings.phone}
                      onChange={(e) => setCompanySettings({
                        ...companySettings,
                        phone: e.target.value
                      })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="company-email">Email Address</Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings({
                      ...companySettings,
                      email: e.target.value
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="company-address">Business Address</Label>
                  <Textarea
                    id="company-address"
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings({
                      ...companySettings,
                      address: e.target.value
                    })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}