# EV-ICE-Decision-Support-System

Decision support system to compare EV vs ICE vehicles using cost, CO₂, and infrastructure analysis.





---



\## Data Description



\### 1. EV\_ICE\_FEATURE\_ENGINEERED\_FINAL.csv

\*\*Purpose\*\*

\- Decision logic

\- UI dashboards

\- Chatbot explanations

\- Reporting



\*\*Contains\*\*

\- EV \& ICE scenarios

\- Cost per km

\- CO₂ per km

\- Cost \& emission advantage

\- Charging infrastructure metrics



---



\### 2. EV\_ICE\_ML\_READY\_FINAL.csv

\*\*Purpose\*\*

\- PCA

\- Clustering

\- Pattern discovery



\*\*Contains\*\*

\- One row per (State, City, Vehicle Class)

\- Only numeric ML-ready features

\- No duplicated EV/ICE rows



---



\## Notebook Responsibilities



| Notebook | Purpose |

|--------|--------|

01\_eda\_decision\_dataset.ipynb | Visual EDA \& decision insights |

02\_eda\_ml\_ready.ipynb | ML-oriented EDA \& sanity checks |

03\_pca\_analysis.ipynb | PCA \& component interpretation |

04\_clustering\_analysis.ipynb | City clustering \& pattern analysis |



Each team member should work \*\*only in their assigned notebook\*\*.



---



\## Backend Logic (`src/core`)



All numerical computations live in `src/core`:

\- Cost scaling

\- CO₂ calculation

\- TCO computation

\- Break-even analysis



Rules:

\- No plotting

\- No UI logic

\- No ML



This ensures consistency and reuse.



---



\## Frontend



The `frontend/` folder contains UI code only.

\- No computations

\- No business logic

\- Communicates with backend via API or mock data



---



\## Team Workflow Rules



\- Do NOT modify CSV files directly

\- All experiments happen in notebooks

\- Core logic goes into `src/core`

\- Commit frequently with clear messages



---



\## Current Project Status

\- Data collection \& preprocessing: ✅ Completed

\- EDA: ✅ Completed

\- PCA \& clustering: ⏳ In progress

\- Frontend \& chatbot: ⏳ Planned



---



\## Disclaimer

This system \*\*explains outcomes based on assumptions\*\* and policy-aligned data.  

It does \*\*not predict adoption or recommend purchases\*\*.



