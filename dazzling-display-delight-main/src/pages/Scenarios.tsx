import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScenarioChatbot } from "@/components/scenarios/ScenarioChatbot";
import {
  GitBranch,
  Fuel,
  Zap,
  Leaf,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import { cn } from "@/lib/utils";

// Base scenario values
const baseScenario = {
  petrolPrice: 105,
  electricityRate: 8,
  gridCO2Factor: 700, // gCO2/kWh
  evSubsidy: 150000,
  chargingCost: 15, // per kWh at public chargers
  evPriceReduction: 0, // percentage
};

const calculateScenarioImpact = (
  petrolPrice: number,
  electricityRate: number,
  gridCO2: number,
  evSubsidy: number,
  chargingCost: number,
  evPriceReduction: number
) => {
  const dailyKm = 40;
  const annualKm = dailyKm * 365;
  const years = 7;
  const totalKm = annualKm * years;

  // Base EV costs
  const baseEvPrice = 1800000;
  const evPrice = baseEvPrice * (1 - evPriceReduction / 100);
  const evEfficiency = 7; // km/kWh
  
  // Mix of home (70%) and public (30%) charging
  const avgElectricityCost = electricityRate * 0.7 + chargingCost * 0.3;
  const evFuelCost = (totalKm / evEfficiency) * avgElectricityCost;
  const evMaintenance = 8000 * years;
  const evTCO = evPrice + evFuelCost + evMaintenance - evSubsidy;
  const evCostPerKm = evFuelCost / totalKm;
  const evCO2 = (gridCO2 / evEfficiency) / 1000; // kg per km

  // ICE costs
  const icePrice = 1200000;
  const iceEfficiency = 15; // km/L
  const iceFuelCost = (totalKm / iceEfficiency) * petrolPrice;
  const iceMaintenance = 20000 * years;
  const iceTCO = icePrice + iceFuelCost + iceMaintenance;
  const iceCostPerKm = iceFuelCost / totalKm;
  const iceCO2 = 0.12; // kg per km (120g)

  // Break-even
  const annualEvCost = (evFuelCost + evMaintenance) / years;
  const annualIceCost = (iceFuelCost + iceMaintenance) / years;
  const priceDiff = evPrice - icePrice - evSubsidy;
  const annualSavings = annualIceCost - annualEvCost;
  const breakEven = annualSavings > 0 ? priceDiff / annualSavings : 99;

  // Yearly data
  const yearlyData = [];
  for (let year = 0; year <= years; year++) {
    const yearKm = annualKm * year;
    const evYearTCO =
      evPrice +
      (yearKm / evEfficiency) * avgElectricityCost +
      8000 * year -
      evSubsidy;
    const iceYearTCO =
      icePrice +
      (yearKm / iceEfficiency) * petrolPrice +
      20000 * year;
    yearlyData.push({
      year,
      ev: Math.round(evYearTCO / 100000),
      ice: Math.round(iceYearTCO / 100000),
    });
  }

  return {
    evTCO: Math.round(evTCO),
    iceTCO: Math.round(iceTCO),
    savings: Math.round(iceTCO - evTCO),
    evCostPerKm: evCostPerKm.toFixed(2),
    iceCostPerKm: iceCostPerKm.toFixed(2),
    evCO2: (evCO2 * 1000).toFixed(0),
    iceCO2: (iceCO2 * 1000).toFixed(0),
    co2Savings: Math.round((iceCO2 - evCO2) * totalKm),
    breakEven: breakEven < 15 ? breakEven.toFixed(1) : "15+",
    evRecommended: evTCO < iceTCO,
    yearlyData,
  };
};

const Scenarios = () => {
  const [petrolPrice, setPetrolPrice] = useState(baseScenario.petrolPrice);
  const [electricityRate, setElectricityRate] = useState(baseScenario.electricityRate);
  const [gridCO2Factor, setGridCO2Factor] = useState(baseScenario.gridCO2Factor);
  const [evSubsidy, setEvSubsidy] = useState(baseScenario.evSubsidy);
  const [chargingCost, setChargingCost] = useState(baseScenario.chargingCost);
  const [evPriceReduction, setEvPriceReduction] = useState(baseScenario.evPriceReduction);
  const [showGreenGrid, setShowGreenGrid] = useState(false);

  // Calculate base and current scenarios
  const baseResult = useMemo(
    () =>
      calculateScenarioImpact(
        baseScenario.petrolPrice,
        baseScenario.electricityRate,
        baseScenario.gridCO2Factor,
        baseScenario.evSubsidy,
        baseScenario.chargingCost,
        baseScenario.evPriceReduction
      ),
    []
  );

  const currentResult = useMemo(
    () =>
      calculateScenarioImpact(
        petrolPrice,
        electricityRate,
        showGreenGrid ? 50 : gridCO2Factor,
        evSubsidy,
        chargingCost,
        evPriceReduction
      ),
    [petrolPrice, electricityRate, gridCO2Factor, evSubsidy, chargingCost, evPriceReduction, showGreenGrid]
  );

  // Sensitivity analysis data
  const sensitivityData = useMemo(() => {
    const data = [];
    for (let price = 80; price <= 150; price += 10) {
      const result = calculateScenarioImpact(
        price,
        electricityRate,
        showGreenGrid ? 50 : gridCO2Factor,
        evSubsidy,
        chargingCost,
        evPriceReduction
      );
      data.push({
        petrolPrice: price,
        savings: result.savings / 100000,
        breakEven: parseFloat(result.breakEven) || 15,
      });
    }
    return data;
  }, [electricityRate, gridCO2Factor, evSubsidy, chargingCost, evPriceReduction, showGreenGrid]);

  const getChangeIndicator = (current: number, base: number, inverse = false) => {
    const change = ((current - base) / base) * 100;
    const isPositive = inverse ? change < 0 : change > 0;
    if (Math.abs(change) < 1) return null;
    return (
      <span className={cn("text-xs flex items-center gap-0.5", isPositive ? "text-ev" : "text-destructive")}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(change).toFixed(0)}%
      </span>
    );
  };

  return (
    <MainLayout>
      <PageHeader
        title="What-If Scenarios"
        description="Explore how different factors affect EV vs ICE economics"
      >
        <Badge variant="outline" className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          Scenario Modeling
        </Badge>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Controls Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              Scenario Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Petrol Price */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-ice" />
                  Petrol Price
                </Label>
                <span className="text-sm font-medium">₹{petrolPrice}/L</span>
              </div>
              <Slider
                value={[petrolPrice]}
                onValueChange={(v) => setPetrolPrice(v[0])}
                min={80}
                max={180}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Base: ₹{baseScenario.petrolPrice}/L
              </p>
            </div>

            {/* Electricity Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-ev" />
                  Electricity Rate
                </Label>
                <span className="text-sm font-medium">₹{electricityRate}/kWh</span>
              </div>
              <Slider
                value={[electricityRate]}
                onValueChange={(v) => setElectricityRate(v[0])}
                min={4}
                max={18}
                step={0.5}
              />
              <p className="text-xs text-muted-foreground">
                Base: ₹{baseScenario.electricityRate}/kWh
              </p>
            </div>

            {/* Public Charging Cost */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Public Charging Cost</Label>
                <span className="text-sm font-medium">₹{chargingCost}/kWh</span>
              </div>
              <Slider
                value={[chargingCost]}
                onValueChange={(v) => setChargingCost(v[0])}
                min={8}
                max={25}
                step={1}
              />
            </div>

            {/* Grid CO2 Factor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-ev" />
                  Grid CO₂ Factor
                </Label>
                <span className="text-sm font-medium">
                  {showGreenGrid ? 50 : gridCO2Factor} g/kWh
                </span>
              </div>
              <Slider
                value={[gridCO2Factor]}
                onValueChange={(v) => setGridCO2Factor(v[0])}
                min={200}
                max={1000}
                step={50}
                disabled={showGreenGrid}
              />
              <div className="flex items-center justify-between">
                <Label className="text-xs">100% Green Energy</Label>
                <Switch checked={showGreenGrid} onCheckedChange={setShowGreenGrid} />
              </div>
            </div>

            {/* EV Subsidy */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Government Subsidy</Label>
                <span className="text-sm font-medium">₹{(evSubsidy / 1000).toFixed(0)}K</span>
              </div>
              <Slider
                value={[evSubsidy]}
                onValueChange={(v) => setEvSubsidy(v[0])}
                min={0}
                max={500000}
                step={25000}
              />
            </div>

            {/* EV Price Reduction */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>EV Price Reduction</Label>
                <span className="text-sm font-medium">{evPriceReduction}%</span>
              </div>
              <Slider
                value={[evPriceReduction]}
                onValueChange={(v) => setEvPriceReduction(v[0])}
                min={0}
                max={40}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Simulates battery cost reduction
              </p>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                setPetrolPrice(baseScenario.petrolPrice);
                setElectricityRate(baseScenario.electricityRate);
                setGridCO2Factor(baseScenario.gridCO2Factor);
                setEvSubsidy(baseScenario.evSubsidy);
                setChargingCost(baseScenario.chargingCost);
                setEvPriceReduction(baseScenario.evPriceReduction);
                setShowGreenGrid(false);
              }}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Reset to Base Scenario
            </button>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Impact Summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className={cn(currentResult.savings > 0 ? "border-ev/30" : "border-ice/30")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Total Savings</span>
                  {getChangeIndicator(currentResult.savings, baseResult.savings)}
                </div>
                <p className={cn("text-2xl font-bold", currentResult.savings > 0 ? "text-ev" : "text-ice")}>
                  ₹{(currentResult.savings / 100000).toFixed(1)}L
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Break-even</span>
                  {getChangeIndicator(parseFloat(currentResult.breakEven), parseFloat(baseResult.breakEven), true)}
                </div>
                <p className="text-2xl font-bold">{currentResult.breakEven} yrs</p>
              </CardContent>
            </Card>

            <Card className="border-ev/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">CO₂ Saved</span>
                  {getChangeIndicator(currentResult.co2Savings, baseResult.co2Savings)}
                </div>
                <p className="text-2xl font-bold text-ev">{currentResult.co2Savings} kg</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Recommendation</span>
                </div>
                <div className="flex items-center gap-2">
                  {currentResult.evRecommended ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-ev" />
                      <span className="font-bold text-ev">EV</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-ice" />
                      <span className="font-bold text-ice">ICE</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TCO Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>TCO Projection (₹ Lakhs)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={currentResult.yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="year" label={{ value: "Years", position: "bottom" }} />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="ev"
                    name="EV"
                    stroke="hsl(142, 71%, 45%)"
                    fill="hsl(142, 71%, 45%)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="ice"
                    name="ICE"
                    stroke="hsl(25, 95%, 53%)"
                    fill="hsl(25, 95%, 53%)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sensitivity Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Sensitivity: Petrol Price Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sensitivityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="petrolPrice" label={{ value: "Petrol Price (₹/L)", position: "bottom" }} />
                  <YAxis yAxisId="left" label={{ value: "Savings (₹L)", angle: -90, position: "left" }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: "Break-even (yrs)", angle: 90, position: "right" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar yAxisId="left" dataKey="savings" name="Savings (₹L)" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="breakEven" name="Break-even (yrs)" stroke="hsl(217, 91%, 60%)" strokeWidth={2} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Scenario Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentResult.savings > baseResult.savings && (
                <div className="flex items-start gap-3 rounded-lg bg-background/50 p-3">
                  <CheckCircle className="h-5 w-5 text-ev mt-0.5" />
                  <p className="text-sm">
                    This scenario improves EV economics by{" "}
                    <span className="font-medium text-ev">
                      ₹{((currentResult.savings - baseResult.savings) / 100000).toFixed(1)}L
                    </span>{" "}
                    compared to the base case.
                  </p>
                </div>
              )}
              {showGreenGrid && (
                <div className="flex items-start gap-3 rounded-lg bg-background/50 p-3">
                  <Leaf className="h-5 w-5 text-ev mt-0.5" />
                  <p className="text-sm">
                    With 100% green energy, EV emissions drop to near-zero, making them truly
                    carbon-neutral transportation.
                  </p>
                </div>
              )}
              {petrolPrice > 120 && (
                <div className="flex items-start gap-3 rounded-lg bg-background/50 p-3">
                  <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                  <p className="text-sm">
                    At ₹{petrolPrice}/L, fuel costs significantly favor EVs with savings of{" "}
                    <span className="font-medium">₹{currentResult.evCostPerKm}/km</span> vs{" "}
                    <span className="font-medium">₹{currentResult.iceCostPerKm}/km</span>.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Chatbot */}
      <ScenarioChatbot
        scenarioContext={{
          petrolPrice,
          electricityRate,
          chargingCost,
          gridCO2Factor,
          evSubsidy,
          evPriceReduction,
          showGreenGrid,
          evTCO: currentResult.evTCO,
          iceTCO: currentResult.iceTCO,
          savings: currentResult.savings,
          breakEven: currentResult.breakEven,
          co2Savings: currentResult.co2Savings,
          evRecommended: currentResult.evRecommended,
        }}
      />
    </MainLayout>
  );
};

export default Scenarios;
