# QuantLib → PyTorch Migration Dashboard

A dependency graph and migration dashboard to visualize the porting of QuantLib (C++) to PyTorch (Python).

## Features
- **Visual Graph**: Toggle between Include DAG and Numeric Cone migration order.
- **Node Classification**: Identify nodes as `pure_math`, `date_logic`, `infrastructure`, or `solver`.
- **Migration Status Tracking**: Color-coded progress (todo, mapped, translated, tested, failed, skipped).
- **Detail Panel**: View node metadata, oracle test results, and update status.

## Data
- The graph is seeded with a demo subset of QuantLib nodes, centered on the Black-Scholes numeric cone path.

## Tech Stack
- Frontend: React + Tailwind CSS + D3.js (for visualization)
- No Backend: Fully client-side state management.
