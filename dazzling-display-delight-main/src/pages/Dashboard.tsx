import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ComparisonCard } from "@/components/ui/comparison-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Zap,
  TrendingDown,
  Leaf,
  IndianRupee,
  MapPin,
  Calculator,
  ArrowRight,
  BarChart3,
  Activity,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useEVData } from "@/hooks/useEVData";
import { useMemo } from "react";
import {
  calculateDashboardMetrics,
  getCostComparisonData,
  getEmissionsData,
  getCityMetrics,
  getVehicleClassData,
} from "@/lib/evDataUtils";

const Dashboard = () => {
  const { featureData, isLoading, error } = useEVData();

  const dashboardMetrics = useMemo(() => {
    if (featureData.length === 0) return null;
    return calculateDashboardMetrics(featureData);
  }, [featureData]);

  const costComparisonData = useMemo(() => {
    if (featureData.length === 0) return [];
    return getCostComparisonData(featureData);
  }, [featureData]);

  const emissionsData = useMemo(() => {
    if (featureData.length === 0) return [];
    const emissions = getEmissionsData(featureData);
    // Filter to show only main categories
    return emissions.filter(e => e.name.includes('4W'));
  }, [featureData]);

  const cityMetrics = useMemo(() => {
    if (featureData.length === 0) return [];
    return getCityMetrics(featureData);
  }, [featureData]);

  // Get top cities by charging density
  const topCities = useMemo(() => {
    return cityMetrics
      .sort((a, b) => b.chargingDensity - a.chargingDensity)
      .slice(0, 5)
      .map(city => ({
        city: city.city,
        score: Math.min(100, Math.round(city.chargingDensity * 20 + 50)), // Normalize to 0-100
      }));
  }, [cityMetrics]);

  // Get Mumbai 4W data for comparison cards
  const mumbai4WData = useMemo(() => {
    if (featureData.length === 0) return null;
    const data = getVehicleClassData(featureData, 'Maharashtra', 'Mumbai');
    return data.find(d => d.vehicleClass === '4W');
  }, [featureData]);

  // TCO trend data based on actual costs
  const tcoTrendData = useMemo(() => {
    if (!mumbai4WData) return [];
    const evBasePrice = 1500000;
    const iceBasePrice = 1000000;
    const annualKm = 15000;
    
    return Array.from({ length: 9 }, (_, year) => ({
      year,
      ev: Math.round(evBasePrice + (mumbai4WData.evCostPerKm + mumbai4WData.evMaintenanceCost) * annualKm * year),
      ice: Math.round(iceBasePrice + (mumbai4WData.iceCostPerKm + mumbai4WData.iceMaintenanceCost) * annualKm * year),
    }));
  }, [mumbai4WData]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading data...</span>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-destructive">Error loading data: {error}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title="EV-DSS Dashboard"
        description="Decision Support System for Electric vs Internal Combustion Engine Vehicle Analysis"
      >
        <Link to="/calculator">
          <Button className="gradient-primary text-white">
            <Calculator className="mr-2 h-4 w-4" />
            Start Comparison
          </Button>
        </Link>
      </PageHeader>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Avg. Cost Savings (EV)"
          value={Math.round(dashboardMetrics?.costSavingsPercent || 0)}
          suffix="%"
          icon={TrendingDown}
          variant="ev"
          trend={{ value: 8, isPositive: true }}
          delay={0}
        />
        <StatCard
          title="CO₂ Reduction"
          value={Math.round(dashboardMetrics?.avgCo2Advantage || 0)}
          suffix="g/km"
          icon={Leaf}
          variant="ev"
          trend={{ value: 12, isPositive: true }}
          delay={100}
        />
        <StatCard
          title="Avg. EV Cost"
          value={parseFloat((dashboardMetrics?.avgEvCostPerKm || 0).toFixed(2))}
          prefix="₹"
          suffix="/km"
          icon={IndianRupee}
          variant="primary"
          delay={200}
        />
        <StatCard
          title="Cities Analyzed"
          value={dashboardMetrics?.citiesAnalyzed || 0}
          icon={MapPin}
          variant="default"
          delay={300}
        />
      </div>

      {/* Quick Comparison */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <ComparisonCard
          type="ev"
          title="Electric Vehicle (4W)"
          recommended={true}
          metrics={[
            { 
              label: "Running Cost", 
              value: `₹${(mumbai4WData?.evCostPerKm || 0).toFixed(2)}/km`, 
              subValue: `vs ₹${(mumbai4WData?.iceCostPerKm || 0).toFixed(2)}/km ICE` 
            },
            { 
              label: "CO₂ Emissions", 
              value: `${Math.round((mumbai4WData?.evCo2PerKm || 0) * 1000)} g/km`, 
              subValue: "Grid average" 
            },
            { 
              label: "Maintenance", 
              value: `₹${(mumbai4WData?.evMaintenanceCost || 0).toFixed(2)}/km`, 
              subValue: `${Math.round(((mumbai4WData?.iceMaintenanceCost || 1) - (mumbai4WData?.evMaintenanceCost || 0)) / (mumbai4WData?.iceMaintenanceCost || 1) * 100)}% lower` 
            },
            { 
              label: "Cost Advantage", 
              value: `₹${(mumbai4WData?.costAdvantage || 0).toFixed(2)}/km`, 
              subValue: "Savings vs ICE" 
            },
          ]}
        />
        <ComparisonCard
          type="ice"
          title="ICE Vehicle (4W)"
          metrics={[
            { 
              label: "Running Cost", 
              value: `₹${(mumbai4WData?.iceCostPerKm || 0).toFixed(2)}/km`, 
              subValue: "Petrol @ ₹104/L" 
            },
            { 
              label: "CO₂ Emissions", 
              value: `${Math.round((mumbai4WData?.iceCo2PerKm || 0) * 1000)} g/km`, 
              subValue: "Tailpipe emissions" 
            },
            { 
              label: "Maintenance", 
              value: `₹${(mumbai4WData?.iceMaintenanceCost || 0).toFixed(2)}/km`, 
              subValue: "Regular servicing" 
            },
            { 
              label: "Replacement Cost", 
              value: `₹${((mumbai4WData?.iceReplacementCost || 0) / 1000).toFixed(0)}K`, 
              subValue: `Every ${mumbai4WData?.iceReplacementCycle || 0} years` 
            },
          ]}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Cost Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Cost per Kilometer by Vehicle Class
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costComparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`₹${value.toFixed(2)}/km`]}
                />
                <Bar dataKey="ev" name="EV" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="ice" name="ICE" fill="hsl(25, 95%, 53%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* TCO Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Total Cost of Ownership Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tcoTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="year" label={{ value: "Years", position: "bottom" }} />
                <YAxis
                  tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                  className="text-xs"
                />
                <Tooltip
                  formatter={(value: number) => [`₹${(value / 100000).toFixed(1)}L`, ""]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ev"
                  name="EV"
                  stroke="hsl(142, 71%, 45%)"
                  strokeWidth={3}
                  dot={{ fill: "hsl(142, 71%, 45%)" }}
                />
                <Line
                  type="monotone"
                  dataKey="ice"
                  name="ICE"
                  stroke="hsl(25, 95%, 53%)"
                  strokeWidth={3}
                  dot={{ fill: "hsl(25, 95%, 53%)" }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-ev" />
                <span>Electric Vehicle</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-ice" />
                <span>ICE Vehicle</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Emissions Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-ev" />
              CO₂ Emissions (4W) g/km
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={emissionsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${value}`}
                >
                  {emissionsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1 text-xs">
              {emissionsData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}: {item.value} g/km</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* City Readiness */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Top EV-Ready Cities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCities.length > 0 ? topCities.map((city) => (
              <div key={city.city} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{city.city}</span>
                  <span className="font-medium">{city.score}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full gradient-ev transition-all duration-1000"
                    style={{ width: `${city.score}%` }}
                  />
                </div>
              </div>
            )) : (
              <p className="text-muted-foreground text-sm">No city data available</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/calculator" className="block">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Calculate TCO
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/city-analysis" className="block">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Explore Cities
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/scenarios" className="block">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  What-If Analysis
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/architecture" className="block">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  View Architecture
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
