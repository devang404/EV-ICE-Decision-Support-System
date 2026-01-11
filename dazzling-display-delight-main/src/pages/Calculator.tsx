import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/ui/page-header";
import { ComparisonCard } from "@/components/ui/comparison-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Calculator as CalcIcon,
  Leaf,
  TrendingDown,
  IndianRupee,
  Lightbulb,
  Loader2,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import { useEVData } from "@/hooks/useEVData";
import {
  getUniqueStates,
  getCitiesForState,
  getVehicleClassData,
} from "@/lib/evDataUtils";

const Calculator = () => {
  const { featureData, isLoading, error } = useEVData();
  
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [vehicleClass, setVehicleClass] = useState<"2W" | "3W" | "4W">("4W");
  const [dailyKm, setDailyKm] = useState(40);
  const [ownershipYears, setOwnershipYears] = useState(7);

  // Get unique states from data
  const states = useMemo(() => {
    if (featureData.length === 0) return [];
    return getUniqueStates(featureData);
  }, [featureData]);

  // Set default state when data loads
  useMemo(() => {
    if (states.length > 0 && !selectedState) {
      const defaultState = states.includes("Maharashtra") ? "Maharashtra" : states[0];
      setSelectedState(defaultState);
    }
  }, [states, selectedState]);

  // Get cities for selected state
  const cities = useMemo(() => {
    if (!selectedState || featureData.length === 0) return [];
    return getCitiesForState(featureData, selectedState);
  }, [featureData, selectedState]);

  // Set default city when state changes
  useMemo(() => {
    if (cities.length > 0 && (!selectedCity || !cities.includes(selectedCity))) {
      const defaultCity = cities.includes("Mumbai") ? "Mumbai" : cities[0];
      setSelectedCity(defaultCity);
    }
  }, [cities, selectedCity]);

  // Get vehicle class data for selected location
  const vehicleData = useMemo(() => {
    if (!selectedState || !selectedCity || featureData.length === 0) return [];
    return getVehicleClassData(featureData, selectedState, selectedCity);
  }, [featureData, selectedState, selectedCity]);

  // Get current vehicle class data
  const currentVehicleData = useMemo(() => {
    return vehicleData.find(v => v.vehicleClass === vehicleClass);
  }, [vehicleData, vehicleClass]);

  // Calculate comparison metrics
  const comparison = useMemo(() => {
    if (!currentVehicleData) return null;

    const annualKm = dailyKm * 365;
    const totalKm = annualKm * ownershipYears;

    // Get base prices based on vehicle class
    const basePrices = {
      '2W': { ev: 150000, ice: 80000 },
      '3W': { ev: 350000, ice: 200000 },
      '4W': { ev: 1500000, ice: 1000000 },
    };

    const prices = basePrices[vehicleClass];

    // EV Calculations
    const evFuelCost = currentVehicleData.evCostPerKm * totalKm;
    const evMaintenanceCost = currentVehicleData.evMaintenanceCost * totalKm;
    const evTCO = prices.ev + evFuelCost + evMaintenanceCost;
    
    // ICE Calculations
    const iceFuelCost = currentVehicleData.iceCostPerKm * totalKm;
    const iceMaintenanceCost = currentVehicleData.iceMaintenanceCost * totalKm;
    const iceTCO = prices.ice + iceFuelCost + iceMaintenanceCost;

    // Break-even calculation
    const annualEvCost = (evFuelCost + evMaintenanceCost) / ownershipYears;
    const annualIceCost = (iceFuelCost + iceMaintenanceCost) / ownershipYears;
    const priceDiff = prices.ev - prices.ice;
    const annualSavings = annualIceCost - annualEvCost;
    const breakEvenYears = annualSavings > 0 ? priceDiff / annualSavings : 99;

    // TCO over time for chart
    const tcoOverTime = [];
    for (let year = 0; year <= ownershipYears; year++) {
      const yearKm = annualKm * year;
      const evYearTCO = prices.ev + 
        currentVehicleData.evCostPerKm * yearKm + 
        currentVehicleData.evMaintenanceCost * yearKm;
      const iceYearTCO = prices.ice + 
        currentVehicleData.iceCostPerKm * yearKm + 
        currentVehicleData.iceMaintenanceCost * yearKm;
      tcoOverTime.push({
        year,
        ev: Math.round(evYearTCO),
        ice: Math.round(iceYearTCO),
      });
    }

    // Cost breakdown data
    const costBreakdownData = [
      {
        category: "Purchase",
        ev: prices.ev / 100000,
        ice: prices.ice / 100000,
      },
      {
        category: "Fuel/Energy",
        ev: evFuelCost / 100000,
        ice: iceFuelCost / 100000,
      },
      {
        category: "Maintenance",
        ev: evMaintenanceCost / 100000,
        ice: iceMaintenanceCost / 100000,
      },
    ];

    return {
      ev: {
        purchasePrice: prices.ev,
        fuelCost: Math.round(evFuelCost),
        maintenanceCost: Math.round(evMaintenanceCost),
        tco: Math.round(evTCO),
        costPerKm: currentVehicleData.evCostPerKm.toFixed(2),
        co2: Math.round(currentVehicleData.evCo2PerKm * 1000),
      },
      ice: {
        purchasePrice: prices.ice,
        fuelCost: Math.round(iceFuelCost),
        maintenanceCost: Math.round(iceMaintenanceCost),
        tco: Math.round(iceTCO),
        costPerKm: currentVehicleData.iceCostPerKm.toFixed(2),
        co2: Math.round(currentVehicleData.iceCo2PerKm * 1000),
      },
      savings: Math.round(iceTCO - evTCO),
      breakEvenYears: breakEvenYears < 15 ? breakEvenYears.toFixed(1) : "15+",
      co2Savings: Math.round((currentVehicleData.iceCo2PerKm - currentVehicleData.evCo2PerKm) * totalKm),
      tcoOverTime,
      costBreakdownData,
      evRecommended: evTCO < iceTCO,
      costAdvantage: currentVehicleData.costAdvantage,
    };
  }, [currentVehicleData, dailyKm, ownershipYears, vehicleClass]);

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
        title="EV vs ICE Calculator"
        description="Compare Total Cost of Ownership and environmental impact between Electric and ICE vehicles"
      >
        <Badge variant="outline" className="flex items-center gap-1">
          <Lightbulb className="h-3 w-3" />
          Powered by Real Data
        </Badge>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalcIcon className="h-5 w-5 text-primary" />
              Input Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* State Selection */}
            <div className="space-y-2">
              <Label>State</Label>
              <Select value={selectedState} onValueChange={(v) => {
                setSelectedState(v);
                setSelectedCity("");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City Selection */}
            <div className="space-y-2">
              <Label>City</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle Class */}
            <div className="space-y-2">
              <Label>Vehicle Class</Label>
              <Select value={vehicleClass} onValueChange={(v) => setVehicleClass(v as "2W" | "3W" | "4W")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2W">Two Wheeler (2W)</SelectItem>
                  <SelectItem value="3W">Three Wheeler (3W)</SelectItem>
                  <SelectItem value="4W">Four Wheeler (4W)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Daily Distance */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Daily Distance</Label>
                <span className="text-sm font-medium">{dailyKm} km</span>
              </div>
              <Slider
                value={[dailyKm]}
                onValueChange={(v) => setDailyKm(v[0])}
                min={10}
                max={150}
                step={5}
              />
            </div>

            {/* Ownership Period */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Ownership Period</Label>
                <span className="text-sm font-medium">{ownershipYears} years</span>
              </div>
              <Slider
                value={[ownershipYears]}
                onValueChange={(v) => setOwnershipYears(v[0])}
                min={3}
                max={12}
                step={1}
              />
            </div>

            {/* Cost Advantage Indicator */}
            {comparison && (
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Cost Advantage (EV)</span>
                  <Badge className={comparison.costAdvantage > 0 ? "gradient-ev text-white" : "gradient-ice text-white"}>
                    ₹{comparison.costAdvantage.toFixed(2)}/km
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {comparison.costAdvantage > 0 
                    ? "EV is more economical in this location"
                    : "ICE is currently more economical here"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {comparison && (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-ev/30 bg-gradient-to-br from-ev/5 to-transparent">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg gradient-ev p-2">
                        <IndianRupee className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Savings</p>
                        <p className={`text-xl font-bold ${comparison.savings > 0 ? 'text-ev' : 'text-ice'}`}>
                          ₹{(Math.abs(comparison.savings) / 100000).toFixed(1)}L
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg gradient-primary p-2">
                        <TrendingDown className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Break-even</p>
                        <p className="text-xl font-bold">{comparison.breakEvenYears} years</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-ev/30 bg-gradient-to-br from-ev/5 to-transparent">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg gradient-ev p-2">
                        <Leaf className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">CO₂ Saved</p>
                        <p className="text-xl font-bold text-ev">{comparison.co2Savings} kg</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Comparison Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <ComparisonCard
                  type="ev"
                  title={`Electric Vehicle (${vehicleClass})`}
                  recommended={comparison.evRecommended}
                  metrics={[
                    {
                      label: "Purchase Price",
                      value: `₹${(comparison.ev.purchasePrice / 100000).toFixed(1)}L`,
                    },
                    {
                      label: "Running Cost",
                      value: `₹${comparison.ev.costPerKm}/km`,
                    },
                    {
                      label: "Total Cost of Ownership",
                      value: `₹${(comparison.ev.tco / 100000).toFixed(1)}L`,
                    },
                    {
                      label: "CO₂ Emissions",
                      value: `${comparison.ev.co2} g/km`,
                    },
                  ]}
                />
                <ComparisonCard
                  type="ice"
                  title={`ICE Vehicle (${vehicleClass})`}
                  recommended={!comparison.evRecommended}
                  metrics={[
                    {
                      label: "Purchase Price",
                      value: `₹${(comparison.ice.purchasePrice / 100000).toFixed(1)}L`,
                    },
                    {
                      label: "Running Cost",
                      value: `₹${comparison.ice.costPerKm}/km`,
                    },
                    {
                      label: "Total Cost of Ownership",
                      value: `₹${(comparison.ice.tco / 100000).toFixed(1)}L`,
                    },
                    {
                      label: "CO₂ Emissions",
                      value: `${comparison.ice.co2} g/km`,
                    },
                  ]}
                />
              </div>

              {/* Charts */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* TCO Over Time */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">TCO Over Ownership Period</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={comparison.tcoOverTime}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                        <Tooltip
                          formatter={(value: number) => [`₹${(value / 100000).toFixed(1)}L`]}
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
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Cost Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cost Breakdown (₹ Lakhs)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={comparison.costBreakdownData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number) => [`₹${value.toFixed(1)}L`]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="ev" name="EV" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="ice" name="ICE" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* AI Insights */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Data Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Based on real data from {selectedCity}, {selectedState}:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-ev">•</span>
                      <span>
                        {comparison.evRecommended 
                          ? `EV offers ₹${(comparison.savings / 100000).toFixed(1)}L savings over ${ownershipYears} years`
                          : `ICE is currently more economical by ₹${(Math.abs(comparison.savings) / 100000).toFixed(1)}L`}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        Break-even point: {comparison.breakEvenYears} years of ownership
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-ev">•</span>
                      <span>
                        Environmental impact: {comparison.co2Savings}kg CO₂ saved over {ownershipYears} years
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>
                        Running cost difference: ₹{Math.abs(parseFloat(comparison.ev.costPerKm) - parseFloat(comparison.ice.costPerKm)).toFixed(2)}/km
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Calculator;
