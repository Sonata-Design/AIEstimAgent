import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CostBreakdownChart } from "./cost-breakdown-chart";
import { ProgressPhotos } from "./progress-photos";
import { ReportGeneratorComponent } from "./report-generator";
import { 
  BarChart, 
  FileText, 
  TrendingUp, 
  Camera,
  Download,
  Eye,
  Calendar,
  DollarSign,
  CheckCircle
} from "lucide-react";
import type { Project, Takeoff, Drawing, SavedAnalysis } from "@shared/schema";

interface ReportsDashboardProps {
  project: Project;
  takeoffs: Takeoff[];
  drawings: Drawing[];
  analyses?: SavedAnalysis[];
}

export function ReportsDashboard({ 
  project, 
  takeoffs, 
  drawings, 
  analyses = [] 
}: ReportsDashboardProps) {
  const [selectedChartType, setSelectedChartType] = useState<'pie' | 'doughnut' | 'bar'>('doughnut');
  
  // Calculate key metrics
  const totalCost = takeoffs.reduce((sum, t) => sum + (t.totalCost || 0), 0);
  const materialCost = totalCost * 0.6; // Estimated material cost
  const laborCost = totalCost * 0.4; // Estimated labor cost
  const verifiedItems = takeoffs.filter(t => t.verified).length;
  const aiDetectedItems = takeoffs.filter(t => t.detectedByAi).length;
  const manuallyEditedItems = takeoffs.filter(t => t.manuallyEdited).length;

  // Group by element type for analysis
  const elementTypeBreakdown = takeoffs.reduce((acc, takeoff) => {
    const type = takeoff.elementType;
    if (!acc[type]) {
      acc[type] = { count: 0, cost: 0 };
    }
    acc[type].count += 1;
    acc[type].cost += takeoff.totalCost || 0;
    return acc;
  }, {} as Record<string, { count: number; cost: number }>);

  return (
    <div className="space-y-6">
      {/* Header with Report Generation */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Project Reports & Analytics</h3>
          <p className="text-sm text-slate-600">
            Generate professional reports and analyze project metrics
          </p>
        </div>
        <ReportGeneratorComponent
          project={project}
          takeoffs={takeoffs}
          drawings={drawings}
          analyses={analyses}
        />
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <div className="text-2xl font-bold text-slate-900">${totalCost.toLocaleString()}</div>
            <div className="text-sm text-slate-600">Total Project Cost</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-slate-900">
              {takeoffs.length > 0 ? Math.round((verifiedItems / takeoffs.length) * 100) : 0}%
            </div>
            <div className="text-sm text-slate-600">Verified Items</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <div className="text-2xl font-bold text-slate-900">{Object.keys(elementTypeBreakdown).length}</div>
            <div className="text-sm text-slate-600">Element Types</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto text-orange-600 mb-2" />
            <div className="text-2xl font-bold text-slate-900">{aiDetectedItems}</div>
            <div className="text-sm text-slate-600">AI Detected</div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Cost Breakdown by Element Type
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant={selectedChartType === 'doughnut' ? 'default' : 'outline'}
                  onClick={() => setSelectedChartType('doughnut')}
                >
                  Donut
                </Button>
                <Button
                  size="sm"
                  variant={selectedChartType === 'pie' ? 'default' : 'outline'}
                  onClick={() => setSelectedChartType('pie')}
                >
                  Pie
                </Button>
                <Button
                  size="sm"
                  variant={selectedChartType === 'bar' ? 'default' : 'outline'}
                  onClick={() => setSelectedChartType('bar')}
                >
                  Bar
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CostBreakdownChart 
              takeoffs={takeoffs} 
              chartType={selectedChartType}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Material vs Labor Cost Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Material Costs (60%)</span>
                <span className="text-sm font-bold">${materialCost.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Labor Costs (40%)</span>
                <span className="text-sm font-bold">${laborCost.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-slate-600 space-y-1">
                <div>• Material costs typically range 50-70% of total</div>
                <div>• Labor costs typically range 30-50% of total</div>
                <div>• Ratios may vary by project complexity</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Element Type Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Element Type Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Element Type</th>
                  <th className="text-right p-2">Item Count</th>
                  <th className="text-right p-2">Total Cost</th>
                  <th className="text-right p-2">Average Cost/Item</th>
                  <th className="text-right p-2">% of Project</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(elementTypeBreakdown).map(([type, data]) => (
                  <tr key={type} className="border-b hover:bg-slate-50">
                    <td className="p-2 font-medium capitalize">{type}</td>
                    <td className="p-2 text-right">{data.count}</td>
                    <td className="p-2 text-right font-medium">${data.cost.toLocaleString()}</td>
                    <td className="p-2 text-right">${Math.round(data.cost / data.count).toLocaleString()}</td>
                    <td className="p-2 text-right">
                      {totalCost > 0 ? ((data.cost / totalCost) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Project Quality Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Project Quality & Accuracy Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {takeoffs.length > 0 ? Math.round((verifiedItems / takeoffs.length) * 100) : 0}%
              </div>
              <div className="text-sm font-medium mb-1">Verification Rate</div>
              <div className="text-xs text-slate-500">
                {verifiedItems} of {takeoffs.length} items verified
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {takeoffs.length > 0 ? Math.round((aiDetectedItems / takeoffs.length) * 100) : 0}%
              </div>
              <div className="text-sm font-medium mb-1">AI Detection Rate</div>
              <div className="text-xs text-slate-500">
                {aiDetectedItems} of {takeoffs.length} AI-detected
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {takeoffs.length > 0 ? Math.round((manuallyEditedItems / takeoffs.length) * 100) : 0}%
              </div>
              <div className="text-sm font-medium mb-1">Manual Edit Rate</div>
              <div className="text-xs text-slate-500">
                {manuallyEditedItems} of {takeoffs.length} manually edited
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Progress Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressPhotos
            projectId={project.id}
            photos={[]} // In real implementation, load from database
            onPhotosUpdate={(photos) => {
              // In real implementation, save to database
              console.log('Updated photos:', photos);
            }}
          />
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="w-5 h-5 mr-2" />
            Export Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <div className="text-center">
                <div className="font-medium">Executive Summary</div>
                <div className="text-xs text-slate-500">High-level overview for stakeholders</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <BarChart className="w-6 h-6 text-green-600" />
              <div className="text-center">
                <div className="font-medium">Detailed Analysis</div>
                <div className="text-xs text-slate-500">Complete cost breakdown</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              <div className="text-center">
                <div className="font-medium">Progress Report</div>
                <div className="text-xs text-slate-500">Timeline and milestones</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}