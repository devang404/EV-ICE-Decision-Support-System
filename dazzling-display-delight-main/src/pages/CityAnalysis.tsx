import { useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Zap,
  Building2,
  Fuel,
  TrendingUp,
  Filter,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { useEVData } from "@/hooks/useEVData";
import { getCityMetrics, mergeCityMetricsWithClusters } from "@/lib/evDataUtils";

const CityAnalysis = () => {
  const { featureData, clusterData, isLoading, error } = useEVData();

  const cityMetrics = useMemo(() => {
    if (featureData.length === 0) return [];
    const baseMetrics = getCityMetrics(featureData);
    // Merge with ML cluster data if available
    if (clusterData.length > 0) {
      return mergeCityMetricsWithClusters(baseMetrics, clusterData);
    }
    return baseMetrics;
  }, [featureData, clusterData]);

  const clusterSummary = useMemo(() => {
    const clusters = {
      'EV-Ready': { count: 0, totalReadiness: 0 },
      'Moderate': { count: 0, totalReadiness: 0 },
      'Low-Infra': { count: 0, totalReadiness: 0 },
    };

    cityMetrics.forEach(city => {
      const readiness = Math.min(100, city.chargingDensity * 20 + 50);
      clusters[city.cluster].count++;
      clusters[city.cluster].totalReadiness += readiness;
    });

    return [
      { name: 'EV-Ready', count: clusters['EV-Ready'].count, avgReadiness: clusters['EV-Ready'].count > 0 ? Math.round(clusters['EV-Ready'].totalReadiness / clusters['EV-Ready'].count) : 0, color: 'hsl(142, 71%, 45%)', description: 'High infrastructure, strong policy support' },
      { name: 'Moderate', count: clusters['Moderate'].count, avgReadiness: clusters['Moderate'].count > 0 ? Math.round(clusters['Moderate'].totalReadiness / clusters['Moderate'].count) : 0, color: 'hsl(217, 91%, 60%)', description: 'Growing infrastructure, developing policies' },
      { name: 'Low-Infra', count: clusters['Low-Infra'].count, avgReadiness: clusters['Low-Infra'].count > 0 ? Math.round(clusters['Low-Infra'].totalReadiness / clusters['Low-Infra'].count) : 0, color: 'hsl(25, 95%, 53%)', description: 'Limited infrastructure, policy development needed' },
    ];
  }, [cityMetrics]);

  const scatterData = useMemo(() => {
    return cityMetrics.map(city => ({
      name: city.city,
      state: city.state,
      cluster: city.cluster,
      // Use ML-derived indices if available, otherwise calculate
      economicIndex: city.economicIndex 
        ? city.economicIndex * 100 
        : Math.min(100, Math.max(40, 70 + city.avgCostAdvantage4W * 3)),
      environmentalIndex: city.environmentalIndex 
        ? city.environmentalIndex * 100 
        : Math.min(80, Math.max(40, 60 + city.avgCo2Advantage * 500)),
      evReadiness: Math.min(100, city.chargingDensity * 20 + 50),
    }));
  }, [cityMetrics]);

  const radarData = [
    { factor: 'Charging Infra', 'EV-Ready': 90, 'Moderate': 65, 'Low-Infra': 35 },
    { factor: 'Policy Support', 'EV-Ready': 85, 'Moderate': 70, 'Low-Infra': 45 },
    { factor: 'Grid Quality', 'EV-Ready': 80, 'Moderate': 72, 'Low-Infra': 60 },
    { factor: 'EV Adoption', 'EV-Ready': 88, 'Moderate': 58, 'Low-Infra': 30 },
    { factor: 'Cost Advantage', 'EV-Ready': 92, 'Moderate': 78, 'Low-Infra': 68 },
  ];

  const getClusterColor = (cluster: string) => {
    switch (cluster) {
      case 'EV-Ready': return 'bg-ev text-ev-foreground';
      case 'Moderate': return 'bg-primary text-primary-foreground';
      default: return 'bg-ice text-ice-foreground';
    }
  };

  const getClusterBorderColor = (cluster: string) => {
    switch (cluster) {
      case 'EV-Ready': return 'border-ev/30';
      case 'Moderate': return 'border-primary/30';
      default: return 'border-ice/30';
    }
  };

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
      <PageHeader title="City Analysis" description="ML-powered clustering of Indian cities based on EV infrastructure and readiness">
        <Badge variant="outline" className="flex items-center gap-1">
          <Filter className="h-3 w-3" />
          K-Means Clustering
        </Badge>
      </PageHeader>

      {/* Cluster Summary */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {clusterSummary.map((cluster) => (
          <Card key={cluster.name} className={cn('transition-all hover:shadow-lg', cluster.name === 'EV-Ready' ? 'border-ev/30 bg-gradient-to-br from-ev/5 to-transparent' : cluster.name === 'Moderate' ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-transparent' : 'border-ice/30 bg-gradient-to-br from-ice/5 to-transparent')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge className={cn(cluster.name === 'EV-Ready' ? 'gradient-ev text-white' : cluster.name === 'Moderate' ? 'gradient-primary text-white' : 'gradient-ice text-white')}>{cluster.name}</Badge>
                <span className="text-2xl font-bold">{cluster.count}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg. Readiness</span>
                  <span className="font-medium">{cluster.avgReadiness}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${cluster.avgReadiness}%`, backgroundColor: cluster.color }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{cluster.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Economic vs Environmental Index
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" dataKey="economicIndex" name="Economic Index" domain={[40, 100]} />
                <YAxis type="number" dataKey="environmentalIndex" name="Environmental Index" domain={[40, 80]} />
                <ZAxis type="number" dataKey="evReadiness" range={[100, 400]} name="EV Readiness" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Scatter name="Cities" data={scatterData}>
                  {scatterData.map((city, index) => (
                    <Cell key={`cell-${index}`} fill={city.cluster === 'EV-Ready' ? 'hsl(142, 71%, 45%)' : city.cluster === 'Moderate' ? 'hsl(217, 91%, 60%)' : 'hsl(25, 95%, 53%)'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-ev" />
              Cluster Factor Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid className="stroke-border" />
                <PolarAngleAxis dataKey="factor" className="text-xs" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="EV-Ready" dataKey="EV-Ready" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.3} />
                <Radar name="Moderate" dataKey="Moderate" stroke="hsl(217, 91%, 60%)" fill="hsl(217, 91%, 60%)" fillOpacity={0.3} />
                <Radar name="Low-Infra" dataKey="Low-Infra" stroke="hsl(25, 95%, 53%)" fill="hsl(25, 95%, 53%)" fillOpacity={0.3} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* City Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            City-wise Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cityMetrics.slice(0, 8).map((city) => (
              <Card key={`${city.state}-${city.city}`} className={cn('transition-all hover:shadow-lg cursor-pointer group', getClusterBorderColor(city.cluster))}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{city.city}</h3>
                      <p className="text-xs text-muted-foreground">{city.state}</p>
                    </div>
                    <Badge className={getClusterColor(city.cluster)} variant="secondary">{city.cluster}</Badge>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">EV Readiness</span>
                        <span className="font-medium">{Math.min(100, Math.round(city.chargingDensity * 20 + 50))}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div className={cn('h-1.5 rounded-full transition-all duration-500', city.cluster === 'EV-Ready' ? 'gradient-ev' : city.cluster === 'Moderate' ? 'gradient-primary' : 'gradient-ice')} style={{ width: `${Math.min(100, city.chargingDensity * 20 + 50)}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-3 w-3 text-ev" />
                        <span>{city.chargingDensity.toFixed(1)} density</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Fuel className="h-3 w-3 text-ice" />
                        <span>₹{city.avgCostAdvantage4W.toFixed(1)}/km</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    View Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default CityAnalysis;
