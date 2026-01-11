# EV-DSS Machine Learning Training

## Overview

This directory contains the machine learning training components for the EV vs ICE Decision Support System.

## System Architecture

The EV-DSS follows a 3-layer architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    EV-DSS Architecture                      │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Deterministic Core (Truth Layer)                   │
│   - Cost per km calculations                                │
│   - CO2 per km calculations                                 │
│   - TCO (Total Cost of Ownership)                          │
│   - Break-even analysis                                     │
│   - Uses explicit formulas, NO ML                          │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: ML Intelligence Layer (Pattern Discovery)         │
│   - PCA for dimension reduction                            │
│   - K-Means clustering for city grouping                   │
│   - Creates Economic & Environmental indices               │
│   - THIS DIRECTORY                                         │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: AI Explanation Layer (Human Interface)            │
│   - Natural language explanations                          │
│   - Scenario-based recommendations                         │
│   - Powered by LLM                                         │
└─────────────────────────────────────────────────────────────┘
```

## Files

- `EV_ICE_ML_Training.ipynb` - Main Jupyter notebook for training
- `requirements.txt` - Python dependencies
- `README.md` - This file

### Generated Files (after running notebook)
- `ev_dss_model.pkl` - Trained model (scaler, PCA, K-Means)
- `model_config.json` - Model configuration
- `../public/data/CITY_CLUSTERS.csv` - City cluster assignments
- `../public/data/CLUSTER_SUMMARY.csv` - Cluster statistics

## Quick Start

### 1. Setup Environment

```bash
# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Run Training

```bash
# Start Jupyter
jupyter notebook

# Open EV_ICE_ML_Training.ipynb and run all cells
```

### 3. Output

The notebook generates:
- **CITY_CLUSTERS.csv**: Each city with cluster assignment (EV-Ready, Moderate, Low-Infra)
- **CLUSTER_SUMMARY.csv**: Aggregate statistics per cluster
- **Visualizations**: PNG files for documentation

## ML Pipeline

### Input Data
- `EV_ICE_ML_READY.csv`: Contains per-city, per-vehicle-class metrics
  - Cost_Advantage (₹/km)
  - CO2_Advantage (kg/km)
  - Charging_Density
  - Maintenance_Cost (₹/km)

### Processing Steps

1. **Data Aggregation**: Aggregate vehicle-class data to city level
2. **Standardization**: Scale features using StandardScaler
3. **PCA**: Reduce dimensions, create composite indices
4. **K-Means**: Cluster cities into 3 groups
5. **Label Assignment**: Map clusters to meaningful names

### Output Clusters

| Cluster | Description | Characteristics |
|---------|-------------|-----------------|
| EV-Ready | Best for EVs | High charging density, high cost advantage |
| Moderate | Growing potential | Medium infrastructure, moderate savings |
| Low-Infra | Needs development | Limited charging, lower immediate benefits |

## Integration with Frontend

The generated `CITY_CLUSTERS.csv` is automatically used by the React frontend:
- City Analysis page reads the CSV
- Displays clusters with color coding
- Shows Economic/Environmental indices in charts

## Updating the Model

1. Update `EV_ICE_ML_READY.csv` with new data
2. Re-run the Jupyter notebook
3. New `CITY_CLUSTERS.csv` will be generated
4. Frontend automatically picks up new data

## Technical Details

### PCA Components
- **PC1 (Economic Index)**: Captures cost-related variance
- **PC2 (Environmental Index)**: Captures CO2-related variance

### Cluster Validation
- Silhouette Score used for cluster quality
- Elbow method for optimal K selection
- Manual validation of cluster characteristics

## Notes

- The model is designed for pattern discovery, not prediction
- Clustering helps identify cities with similar EV readiness
- All deterministic calculations happen in Layer 1 (frontend)
- ML only adds value through pattern recognition
