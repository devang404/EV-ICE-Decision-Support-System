import { useState, useEffect } from 'react';
import {
  EVICERecord,
  MLDataRecord,
  CityClusterRecord,
  parseFeatureEngineeredCSV,
  parseMLCSV,
  parseCityClusterCSV,
} from '@/lib/evDataUtils';

export function useEVData() {
  const [featureData, setFeatureData] = useState<EVICERecord[]>([]);
  const [mlData, setMlData] = useState<MLDataRecord[]>([]);
  const [clusterData, setClusterData] = useState<CityClusterRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load all CSV files in parallel
        const [featureResponse, mlResponse, clusterResponse] = await Promise.all([
          fetch('/data/EV_ICE_FEATURE_ENGINEERED.csv'),
          fetch('/data/EV_ICE_ML_READY.csv'),
          fetch('/data/CITY_CLUSTERS.csv'),
        ]);

        if (!featureResponse.ok || !mlResponse.ok) {
          throw new Error('Failed to load data files');
        }

        const [featureText, mlText] = await Promise.all([
          featureResponse.text(),
          mlResponse.text(),
        ]);

        const parsedFeatureData = parseFeatureEngineeredCSV(featureText);
        const parsedMlData = parseMLCSV(mlText);

        setFeatureData(parsedFeatureData);
        setMlData(parsedMlData);

        // Load cluster data if available
        if (clusterResponse.ok) {
          const clusterText = await clusterResponse.text();
          const parsedClusterData = parseCityClusterCSV(clusterText);
          setClusterData(parsedClusterData);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error loading EV data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return { featureData, mlData, clusterData, isLoading, error };
}
