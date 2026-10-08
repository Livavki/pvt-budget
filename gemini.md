 #  SakuraBudget 2027 — Japan Working Holiday Visa (PVT Japon) Budget Planner

**SakuraBudget 2027** is an all-in-one financial health monitor, budget calculator, and countdown tracker specially designed for travelers preparing a **Working Holiday Visa (WHV / PVT) in Japan** targeting departure by **June 2027**.
---
## 🌟 Key Features
1. **Target Savings Goal & June 2027 Countdown**:
   - Fixed target deadline for **June 30, 2027** with live countdown timer.
   - Dynamic calculation of **Required Monthly Savings**: `(Savings Target - Current Savings) / Remaining Months`.
   - Real-time comparison with **Current Net Savings** (`Total Monthly Income - Total Monthly Expenses`).
2. **Smart Alert & Warning Engine**:
   - 🚨 **Critical Overspending Alert**: Triggers when monthly expenses exceed total monthly income (negative cash flow).
   - ⚠️ **June 2027 Savings Pace Deficit Alert**: Warns when your current savings rate falls short of the June 2027 target, showing exact monthly shortfall and projected balance at deadline.
   - 🔴 **Category Budget Exceeded Alerts**: Warns when actual spend exceeds budget limits for categories (e.g. food, leisure, rent).
   - 🌸 **On Track Status**: Celebrates when pace meets or exceeds target trajectory.
3. **9-Month Advance Planning & Full Roadmap (Oct 2026 – Jun 2027)**:
   - Full timeline view allowing advance planning for every individual month leading up to departure.
   - Quick interactive Month Strip switcher to jump between months and inspect planned balances.
   - Pre-departure milestone planning (flights in April 2027, 1-year WHV insurance in May 2027, departure gear in June 2027).
4. **🔁 Fixed / Recurring Expenses Engine**:
   - Input and manage fixed expenses (e.g. Apartment Rent, Utilities, Subscriptions, Salary) once.
   - Updating a fixed item instantly updates all 9 months simultaneously with one click.
   - Option when editing to apply changes to **ALL 9 Months** or **This Month Only**.
   - Dedicated "🔁 Fixed / Recurring" tab displaying all recurring items and their 9-month cumulative cost.
5. **Visual Analytics & Projections**:
   - **Interactive SVG Trajectory Chart**: Plots target path vs projected cumulative savings up to June 2027 with interactive hover tooltips.
   - **Monthly Spending Donut Chart**: Dynamic breakdown of monthly expenses by category (filterable by active month or 9-month total).
6. **Local Persistence & Privacy**:
   - Auto-saves all changes in your browser (`localStorage`).
   - Export to JSON and Import backup options.
   - Dark mode (Tokyo Midnight) and Light mode (Zen Paper).
---
## 🚀 How to Run Locally
1. Open a terminal in this directory:
   ```bash
   python3 -m http.server 4173
   ```
2. Open your browser and navigate to:
   [http://localhost:4173](http://localhost:4173)
---
## 📂 File Structure
- [index.html](file:///Users/user/Projects/PVT%20Budget/index.html): Semantic HTML structure with `<dialog>` modals, accessible tabs, and cards.
- [styles.css](file:///Users/user/Projects/PVT%20Budget/styles.css): Tokyo midnight dark theme with glassmorphism, responsive CSS grid/flexbox, and custom status badges.
- [app.js](file:///Users/user/Projects/PVT%20Budget/app.js): Calculation engine, alert rules, interactive SVG trajectory charts, and local storage state management.
- [assets/japan_banner.jpg](file:///Users/user/Projects/PVT%20Budget/assets/japan_banner.jpg): Custom Mount Fuji & Tokyo twilight skyline illustration.
