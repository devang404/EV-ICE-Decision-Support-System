// Types for EV/ICE data
export interface EVICERecord {
  state: string;
  city: string;
  vehicleClass: '2W' | '3W' | '4W';
  powertrain: 'EV' | 'ICE';
  energyCharge: number;
  fixedCharge: string;
  tariffYear: string;
  voltageLevel: string;
  fuelType: string;
  fuelPrice: number;
  snapshotDate: string;
  chargingStationsCount: number;
  implementingAgency: string;
  accessType: string;
  gridEmissionFactor: number;
  co2PerKm: number;
  maintenanceCost: number;
  replacementCost: number;
  replacementCycle: number;
  costPerKm: number;
  locationLevel: string;
  distributionCompany: string;
  consumerCategory: string;
  // Computed fields
  costAdvantage: number;
  co2Advantage: number;
  chargingDensity: number;
  chargingReadiness: string;
}

export interface MLDataRecord {
  state: string;
  city: string;
  vehicleClass: '2W' | '3W' | '4W';
  energyCharge: number;
  costPerKm: number;
  co2PerKm: number;
  maintenanceCost: number;
  chargingStationsCount: number;
}

// ML Cluster data from Python training
export interface CityClusterRecord {
  state: string;
  city: string;
  cluster: 'EV-Ready' | 'Moderate' | 'Low-Infra';
  economicIndex: number;
  environmentalIndex: number;
  costAdvantage: number;
  co2Advantage: number;
  chargingDensity: number;
  maintenanceCost: number;
}

export interface CityMetrics {
  city: string;
  state: string;
  chargingDensity: number;
  chargingReadiness: string;
  avgCostAdvantage2W: number;
  avgCostAdvantage3W: number;
  avgCostAdvantage4W: number;
  avgCo2Advantage: number;
  chargingStationsCount: number;
  cluster: 'EV-Ready' | 'Moderate' | 'Low-Infra';
  economicIndex?: number;
  environmentalIndex?: number;
}

export interface VehicleClassData {
  vehicleClass: '2W' | '3W' | '4W';
  evCostPerKm: number;
  iceCostPerKm: number;
  evCo2PerKm: number;
  iceCo2PerKm: number;
  evMaintenanceCost: number;
  iceMaintenanceCost: number;
  evReplacementCost: number;
  iceReplacementCost: number;
  evReplacementCycle: number;
  iceReplacementCycle: number;
  costAdvantage: number;
  co2Advantage: number;
}

// Scenario parameters derived from dataset
export interface ScenarioBaseParams {
  avgPetrolPrice: number;
  avgElectricityRate: number;
  avgChargingDensity: number;
  avgMaintenanceCostEV: number;
  avgMaintenanceCostICE: number;
  avgCostAdvantage: number;
  avgCo2Advantage: number;
}

// Helper to determine charging readiness
function getChargingReadiness(stationsCount: number): string {
  if (stationsCount >= 10) return 'High';
  if (stationsCount >= 3) return 'Medium';
  if (stationsCount > 0) return 'Low';
  return 'None';
}

// Parse CSV data - Updated for new schema
// Columns: State,City,Vehicle Class,Powertrain,Energy Charge (₹/kWh),Fixed Charge,Tariff Year,Voltage Level,Fuel Type,Price (₹/litre),Snapshot Date,Charging Stations Count,Implementing Agency,Access Type,Grid Emission Factor (kg CO2/kWh),CO2_per_km_kg,Maintenance Cost (₹/km),Replacement Cost (₹),Replacement Cycle (Years),Cost_per_km_₹,Location_Level,Distribution Company,Consumer Category
export function parseFeatureEngineeredCSV(csvText: string): EVICERecord[] {
  const lines = csvText.trim().split('\n');
  const records: EVICERecord[] = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < 20) continue;
    
    const chargingStationsCount = parseFloat(values[11]) || 0;
    const costPerKm = parseFloat(values[19]) || 0;
    const co2PerKm = parseFloat(values[15]) || 0;
    
    records.push({
      state: values[0],
      city: values[1],
      vehicleClass: values[2] as '2W' | '3W' | '4W',
      powertrain: values[3] as 'EV' | 'ICE',
      energyCharge: parseFloat(values[4]) || 0,
      fixedCharge: values[5],
      tariffYear: values[6],
      voltageLevel: values[7],
      fuelType: values[8],
      fuelPrice: parseFloat(values[9]) || 0,
      snapshotDate: values[10],
      chargingStationsCount,
      implementingAgency: values[12],
      accessType: values[13],
      gridEmissionFactor: parseFloat(values[14]) || 0,
      co2PerKm,
      maintenanceCost: parseFloat(values[16]) || 0,
      replacementCost: parseFloat(values[17]) || 0,
      replacementCycle: parseFloat(values[18]) || 0,
      costPerKm,
      locationLevel: values[20] || '',
      distributionCompany: values[21] || '',
      consumerCategory: values[22] || '',
      // Computed fields - will be calculated after grouping
      costAdvantage: 0,
      co2Advantage: 0,
      chargingDensity: chargingStationsCount / 10, // Normalized density
      chargingReadiness: getChargingReadiness(chargingStationsCount),
    });
  }
  
  // Calculate cost and CO2 advantages by comparing EV vs ICE for same city/vehicle class
  const groupedByCityVehicle = new Map<string, EVICERecord[]>();
  records.forEach(r => {
    const key = `${r.state}-${r.city}-${r.vehicleClass}`;
    if (!groupedByCityVehicle.has(key)) {
      groupedByCityVehicle.set(key, []);
    }
    groupedByCityVehicle.get(key)!.push(r);
  });
  
  groupedByCityVehicle.forEach((group) => {
    const evRecord = group.find(r => r.powertrain === 'EV');
    const iceRecord = group.find(r => r.powertrain === 'ICE');
    
    if (evRecord && iceRecord) {
      // Cost advantage: how much cheaper EV is per km (ICE cost - EV cost)
      const costAdvantage = iceRecord.costPerKm - evRecord.costPerKm;
      // CO2 advantage: how much less CO2 EV emits (ICE CO2 - EV CO2)
      const co2Advantage = iceRecord.co2PerKm - evRecord.co2PerKm;
      
      // Apply to EV record
      evRecord.costAdvantage = costAdvantage;
      evRecord.co2Advantage = co2Advantage;
    }
  });
  
  return records;
}

// Parse ML Ready CSV - Updated for new schema
// Columns: State,City,Vehicle Class,Energy Charge (₹/kWh),Cost_per_km_₹,CO2_per_km_kg,Maintenance Cost (₹/km),Charging Stations Count
export function parseMLCSV(csvText: string): MLDataRecord[] {
  const lines = csvText.trim().split('\n');
  const records: MLDataRecord[] = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < 8) continue;
    
    records.push({
      state: values[0],
      city: values[1],
      vehicleClass: values[2] as '2W' | '3W' | '4W',
      energyCharge: parseFloat(values[3]) || 0,
      costPerKm: parseFloat(values[4]) || 0,
      co2PerKm: parseFloat(values[5]) || 0,
      maintenanceCost: parseFloat(values[6]) || 0,
      chargingStationsCount: parseFloat(values[7]) || 0,
    });
  }
  
  return records;
}

// Get unique cities with their metrics
export function getCityMetrics(records: EVICERecord[]): CityMetrics[] {
  const cityMap = new Map<string, EVICERecord[]>();
  
  records.forEach(record => {
    const key = `${record.state}-${record.city}`;
    if (!cityMap.has(key)) {
      cityMap.set(key, []);
    }
    cityMap.get(key)!.push(record);
  });
  
  const cityMetrics: CityMetrics[] = [];
  
  cityMap.forEach((cityRecords, key) => {
    const [state, city] = key.split('-');
    const firstRecord = cityRecords[0];
    
    // Calculate averages for each vehicle class
    const evRecords2W = cityRecords.filter(r => r.vehicleClass === '2W' && r.powertrain === 'EV');
    const evRecords3W = cityRecords.filter(r => r.vehicleClass === '3W' && r.powertrain === 'EV');
    const evRecords4W = cityRecords.filter(r => r.vehicleClass === '4W' && r.powertrain === 'EV');
    
    const avgCostAdvantage2W = evRecords2W.length > 0 
      ? evRecords2W[0].costAdvantage 
      : 0;
    const avgCostAdvantage3W = evRecords3W.length > 0 
      ? evRecords3W[0].costAdvantage 
      : 0;
    const avgCostAdvantage4W = evRecords4W.length > 0 
      ? evRecords4W[0].costAdvantage 
      : 0;
    
    // Average CO2 advantage
    const evRecords = cityRecords.filter(r => r.powertrain === 'EV');
    const avgCo2Advantage = evRecords.length > 0
      ? evRecords.reduce((sum, r) => sum + r.co2Advantage, 0) / evRecords.length
      : 0;
    
    // Determine cluster based on charging density and cost advantage
    let cluster: 'EV-Ready' | 'Moderate' | 'Low-Infra' = 'Low-Infra';
    const avgCostAdvantage = (avgCostAdvantage2W + avgCostAdvantage3W + avgCostAdvantage4W) / 3;
    
    if (firstRecord.chargingStationsCount >= 10 && avgCostAdvantage > 0) {
      cluster = 'EV-Ready';
    } else if (firstRecord.chargingStationsCount > 0 || avgCostAdvantage > 0) {
      cluster = 'Moderate';
    }
    
    cityMetrics.push({
      city,
      state,
      chargingDensity: firstRecord.chargingDensity,
      chargingReadiness: firstRecord.chargingReadiness,
      avgCostAdvantage2W,
      avgCostAdvantage3W,
      avgCostAdvantage4W,
      avgCo2Advantage,
      chargingStationsCount: firstRecord.chargingStationsCount,
      cluster,
    });
  });
  
  return cityMetrics;
}

// Get vehicle class data for a specific city
export function getVehicleClassData(records: EVICERecord[], state: string, city: string): VehicleClassData[] {
  const cityRecords = records.filter(r => r.state === state && r.city === city);
  const vehicleClasses: ('2W' | '3W' | '4W')[] = ['2W', '3W', '4W'];
  
  return vehicleClasses.map(vc => {
    const evRecords = cityRecords.filter(r => r.vehicleClass === vc && r.powertrain === 'EV');
    const iceRecords = cityRecords.filter(r => r.vehicleClass === vc && r.powertrain === 'ICE');
    
    const avgEv = evRecords.length > 0 ? {
      costPerKm: evRecords.reduce((sum, r) => sum + r.costPerKm, 0) / evRecords.length,
      co2PerKm: evRecords[0].co2PerKm,
      maintenanceCost: evRecords[0].maintenanceCost,
      replacementCost: evRecords[0].replacementCost,
      replacementCycle: evRecords[0].replacementCycle,
    } : { costPerKm: 0, co2PerKm: 0, maintenanceCost: 0, replacementCost: 0, replacementCycle: 0 };
    
    const avgIce = iceRecords.length > 0 ? {
      costPerKm: iceRecords[0].costPerKm,
      co2PerKm: iceRecords[0].co2PerKm,
      maintenanceCost: iceRecords[0].maintenanceCost,
      replacementCost: iceRecords[0].replacementCost,
      replacementCycle: iceRecords[0].replacementCycle,
    } : { costPerKm: 0, co2PerKm: 0, maintenanceCost: 0, replacementCost: 0, replacementCycle: 0 };
    
    return {
      vehicleClass: vc,
      evCostPerKm: avgEv.costPerKm,
      iceCostPerKm: avgIce.costPerKm,
      evCo2PerKm: avgEv.co2PerKm,
      iceCo2PerKm: avgIce.co2PerKm,
      evMaintenanceCost: avgEv.maintenanceCost,
      iceMaintenanceCost: avgIce.maintenanceCost,
      evReplacementCost: avgEv.replacementCost,
      iceReplacementCost: avgIce.replacementCost,
      evReplacementCycle: avgEv.replacementCycle,
      iceReplacementCycle: avgIce.replacementCycle,
      costAdvantage: evRecords.length > 0 ? evRecords[0].costAdvantage : 0,
      co2Advantage: evRecords.length > 0 ? evRecords[0].co2Advantage : 0,
    };
  });
}

// Get unique states
export function getUniqueStates(records: EVICERecord[]): string[] {
  return [...new Set(records.map(r => r.state))];
}

// Get cities for a state
export function getCitiesForState(records: EVICERecord[], state: string): string[] {
  return [...new Set(records.filter(r => r.state === state).map(r => r.city))];
}

// Calculate dashboard metrics
export function calculateDashboardMetrics(records: EVICERecord[]) {
  const evRecords = records.filter(r => r.powertrain === 'EV');
  const iceRecords = records.filter(r => r.powertrain === 'ICE');
  
  // Average cost advantage across all records (EV savings per km)
  const avgCostAdvantage = evRecords.length > 0
    ? evRecords.reduce((sum, r) => sum + r.costAdvantage, 0) / evRecords.length
    : 0;
  
  // Average CO2 advantage
  const avgCo2Advantage = evRecords.length > 0
    ? evRecords.reduce((sum, r) => sum + r.co2Advantage, 0) / evRecords.length * 1000 // Convert to g/km
    : 0;
  
  // Get unique cities count
  const uniqueCities = new Set(records.map(r => `${r.state}-${r.city}`));
  
  // Calculate average EV and ICE costs for comparison
  const avgEvCostPerKm = evRecords.length > 0
    ? evRecords.reduce((sum, r) => sum + r.costPerKm, 0) / evRecords.length
    : 0;
  
  const avgIceCostPerKm = iceRecords.length > 0
    ? iceRecords.reduce((sum, r) => sum + r.costPerKm, 0) / iceRecords.length
    : 0;
  
  // Cost savings percentage
  const costSavingsPercent = avgIceCostPerKm > 0
    ? ((avgIceCostPerKm - avgEvCostPerKm) / avgIceCostPerKm) * 100
    : 0;
  
  return {
    avgCostAdvantage,
    avgCo2Advantage,
    citiesAnalyzed: uniqueCities.size,
    avgEvCostPerKm,
    avgIceCostPerKm,
    costSavingsPercent,
    totalRecords: records.length,
  };
}

// Get cost comparison data for charts
export function getCostComparisonData(records: EVICERecord[]) {
  const vehicleClasses = ['2W', '3W', '4W'];
  
  return vehicleClasses.map(vc => {
    const evRecords = records.filter(r => r.vehicleClass === vc && r.powertrain === 'EV');
    const iceRecords = records.filter(r => r.vehicleClass === vc && r.powertrain === 'ICE');
    
    const avgEvCost = evRecords.length > 0
      ? evRecords.reduce((sum, r) => sum + r.costPerKm, 0) / evRecords.length
      : 0;
    
    const avgIceCost = iceRecords.length > 0
      ? iceRecords.reduce((sum, r) => sum + r.costPerKm, 0) / iceRecords.length
      : 0;
    
    return {
      name: vc === '2W' ? 'Two Wheeler' : vc === '3W' ? 'Three Wheeler' : 'Four Wheeler',
      ev: parseFloat(avgEvCost.toFixed(2)),
      ice: parseFloat(avgIceCost.toFixed(2)),
    };
  });
}

// Get emissions data for pie chart
export function getEmissionsData(records: EVICERecord[]) {
  const vehicleClasses = ['2W', '3W', '4W'];
  
  return vehicleClasses.flatMap(vc => {
    const evRecords = records.filter(r => r.vehicleClass === vc && r.powertrain === 'EV');
    const iceRecords = records.filter(r => r.vehicleClass === vc && r.powertrain === 'ICE');
    
    const avgEvCo2 = evRecords.length > 0 ? evRecords[0].co2PerKm * 1000 : 0;
    const avgIceCo2 = iceRecords.length > 0 ? iceRecords[0].co2PerKm * 1000 : 0;
    
    return [
      { name: `EV ${vc}`, value: Math.round(avgEvCo2), color: 'hsl(142, 71%, 45%)' },
      { name: `ICE ${vc}`, value: Math.round(avgIceCo2), color: 'hsl(25, 95%, 53%)' },
    ];
  });
}

// Parse City Clusters CSV (from ML training)
export function parseCityClusterCSV(csvText: string): CityClusterRecord[] {
  const lines = csvText.trim().split('\n');
  const records: CityClusterRecord[] = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < 8) continue;
    
    records.push({
      state: values[0],
      city: values[1],
      cluster: values[2] as 'EV-Ready' | 'Moderate' | 'Low-Infra',
      economicIndex: parseFloat(values[3]) || 0,
      environmentalIndex: parseFloat(values[4]) || 0,
      costAdvantage: parseFloat(values[5]) || 0,
      co2Advantage: parseFloat(values[6]) || 0,
      chargingDensity: parseFloat(values[7]) || 0,
      maintenanceCost: parseFloat(values[8]) || 0,
    });
  }
  
  return records;
}

// Merge city clusters with city metrics
export function mergeCityMetricsWithClusters(
  metrics: CityMetrics[],
  clusters: CityClusterRecord[]
): CityMetrics[] {
  const clusterMap = new Map<string, CityClusterRecord>();
  clusters.forEach(c => clusterMap.set(`${c.state}-${c.city}`, c));
  
  return metrics.map(m => {
    const cluster = clusterMap.get(`${m.state}-${m.city}`);
    if (cluster) {
      return {
        ...m,
        cluster: cluster.cluster,
        economicIndex: cluster.economicIndex,
        environmentalIndex: cluster.environmentalIndex,
      };
    }
    return m;
  });
}

// Get scenario base parameters from dataset
export function getScenarioBaseParams(records: EVICERecord[]): ScenarioBaseParams {
  const evRecords = records.filter(r => r.powertrain === 'EV');
  const iceRecords = records.filter(r => r.powertrain === 'ICE');
  
  // Get average petrol price from ICE records
  const fuelPrices = iceRecords.map(r => r.fuelPrice).filter(p => p > 0);
  const avgPetrolPrice = fuelPrices.length > 0
    ? fuelPrices.reduce((a, b) => a + b, 0) / fuelPrices.length
    : 105;
  
  // Get average electricity rate from EV records
  const avgElectricityRate = evRecords.length > 0
    ? evRecords.reduce((sum, r) => sum + r.energyCharge, 0) / evRecords.length
    : 8;
  
  // Average charging density
  const avgChargingDensity = evRecords.length > 0
    ? evRecords.reduce((sum, r) => sum + r.chargingDensity, 0) / evRecords.length
    : 2;
  
  // Average maintenance costs
  const avgMaintenanceCostEV = evRecords.length > 0
    ? evRecords.reduce((sum, r) => sum + r.maintenanceCost, 0) / evRecords.length
    : 0.3;
  
  const avgMaintenanceCostICE = iceRecords.length > 0
    ? iceRecords.reduce((sum, r) => sum + r.maintenanceCost, 0) / iceRecords.length
    : 0.8;
  
  // Average advantages
  const avgCostAdvantage = evRecords.length > 0
    ? evRecords.reduce((sum, r) => sum + r.costAdvantage, 0) / evRecords.length
    : 1.5;
  
  const avgCo2Advantage = evRecords.length > 0
    ? evRecords.reduce((sum, r) => sum + r.co2Advantage, 0) / evRecords.length
    : 0.07;
  
  return {
    avgPetrolPrice: Math.round(avgPetrolPrice * 100) / 100,
    avgElectricityRate: Math.round(avgElectricityRate * 100) / 100,
    avgChargingDensity: Math.round(avgChargingDensity * 100) / 100,
    avgMaintenanceCostEV: Math.round(avgMaintenanceCostEV * 100) / 100,
    avgMaintenanceCostICE: Math.round(avgMaintenanceCostICE * 100) / 100,
    avgCostAdvantage: Math.round(avgCostAdvantage * 100) / 100,
    avgCo2Advantage: Math.round(avgCo2Advantage * 1000) / 1000,
  };
}
