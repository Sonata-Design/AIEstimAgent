import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Download, 
  TrendingUp,
  DollarSign,
  Building,
  Calendar,
  FileText,
  PieChart
} from "lucide-react";
import type { Project } from "@shared/schema";

export default function Reports() {
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Mock report data - in real app this would come from API
  const reportData = {
    totalProjects: projects.length,
    completedTakeoffs: 18,
    totalEstimatedValue: 2847500,
    avgProjectValue: projects.length > 0 ? 2847500 / projects.length : 0,
    monthlyTrend: [
      { month: "Jan", value: 425000 },
      { month: "Feb", value: 320000 },
      { month: "Mar", value: 587000 },
      { month: "Apr", value: 412000 },
      { month: "May", value: 695000 },
      { month: "Jun", value: 408500 }
    ],
    categoryBreakdown: [
      { category: "Residential", count: 8, value: 1200000 },
      { category: "Commercial", count: 4, value: 950000 },
      { category: "Industrial", count: 2, value: 697500 }
    ],
    recentReports: [
      { id: 1, name: "Downtown Office Complex - Final Takeoff", date: "2024-01-26", type: "takeoff", value: 247000 },
      { id: 2, name: "Residential Development Phase 1", date: "2024-01-25", type: "estimate", value: 185000 },
      { id: 3, name: "Warehouse Expansion Project", date: "2024-01-24", type: "takeoff", value: 95000 },
      { id: 4, name: "Medical Center Renovation", date: "2024-01-23", type: "cost-analysis", value: 320000 }
    ]
  };

  return (
    <Layout>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
            <p className="text-slate-600 mt-1">Track your estimating performance and project insights</p>
          </div>
          
          <div className="flex space-x-3">
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Last 30 Days
            </Button>
            <Button className="bg-blueprint-600 hover:bg-blueprint-700">
              <Download className="w-4 h-4 mr-2" />
              Export Reports
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Projects</p>
                  <p className="text-2xl font-bold text-slate-900">{reportData.totalProjects}</p>
                </div>
                <div className="w-8 h-8 bg-blueprint-100 rounded-lg flex items-center justify-center">
                  <Building className="w-4 h-4 text-blueprint-600" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Completed Takeoffs</p>
                  <p className="text-2xl font-bold text-slate-900">{reportData.completedTakeoffs}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+8% accuracy improvement</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Estimated Value</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ${reportData.totalEstimatedValue.toLocaleString()}
                  </p>
                </div>
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+23% from last quarter</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg Project Value</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ${Math.round(reportData.avgProjectValue).toLocaleString()}
                  </p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <PieChart className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+5% from last period</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 text-blueprint-600 mr-2" />
                Monthly Estimating Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.monthlyTrend.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">{item.month}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-blueprint-600 h-2 rounded-full" 
                          style={{ width: `${(item.value / 700000) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-slate-900 w-16 text-right">
                        ${Math.round(item.value / 1000)}K
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 text-blueprint-600 mr-2" />
                Project Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.categoryBreakdown.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{category.category}</p>
                      <p className="text-sm text-slate-600">{category.count} projects</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">
                        ${category.value.toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-600">
                        {Math.round((category.value / reportData.totalEstimatedValue) * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-blueprint-600 mr-2" />
                Recent Reports
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blueprint-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blueprint-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{report.name}</p>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-sm text-slate-600">{report.date}</span>
                        <Badge variant="outline" className="text-xs">
                          {report.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-bold text-slate-900">
                        ${report.value.toLocaleString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}