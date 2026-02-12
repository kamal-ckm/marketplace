# Dashboard Analytics Requirements

## 1. Objective
Build a business-grade analytics dashboard for Healthi Marketplace that serves:
- Employer-funded program performance tracking
- Wallet/rewards utilization monitoring
- Marketplace conversion and revenue insight
- Operational decision-making (adoption, spend, compliance, growth)

This document is frontend-first and integration-ready. Values can be mocked initially and wired to backend later.

## 2. Core Business Questions
1. Are employer-funded programs being utilized effectively?
2. Which employers/programs drive highest wallet-covered spend?
3. How much of spend is wallet vs rewards vs employee cash?
4. Are users adopting eligible benefits or skipping them?
5. Which categories and products perform best within program constraints?

## 3. KPI Framework (Industry Standard)

### A. Utilization KPIs
1. Global Healthi Usage (%)
- Definition: Used eligible spend across all active employer programs / total allocated budget across same scope.
- Formula: `sum(eligible_spend_used) / sum(program_budget_allocated) * 100`

2. Employer Usage (%)
- Same formula, scoped by employer.

3. Program Usage (%)
- Same formula, scoped by program (e.g., Annual Check, Nutrition, Diagnostics).

4. Wallet Adoption (%)
- Definition: Employees with >=1 wallet-covered transaction / eligible employees.

5. Rewards Redemption Rate (%)
- Definition: Rewards points redeemed / rewards points available (or issued).

### B. Financial KPIs
1. Total GMV
2. Wallet-funded GMV
3. Rewards-funded GMV
4. Employee Cash GMV
5. Average Order Value (AOV)
6. Eligible Spend Leakage
- Definition: Value of non-wallet purchases in wallet-eligible categories where wallet had balance but was not used.

### C. Conversion & Experience KPIs
1. Checkout Conversion Rate
2. Cart Abandonment Rate
3. Benefit Application Rate
- Definition: Orders where wallet/rewards applied / total checkout attempts.
4. Time to Checkout (median)

### D. Operational KPIs
1. Active Programs
2. Active Employers
3. Active Employees (MAU/WAU)
4. Stock-out Impact on Eligible Orders

## 4. Dashboard Information Architecture

## 4.1 Executive Row (Top)
- Total GMV
- Wallet-funded GMV
- Global Healthi Usage
- Active Employers

## 4.2 Benefit Insights Card
- Wallet Adoption
- Rewards Redemption
- Global Healthi Usage
- Top Performing Program (name + volume + usage %)

## 4.3 Drilldown Panels
1. Employer-Level Usage Table
- Employer name
- Eligible employees
- Budget allocated
- Budget used
- Usage %
- Wallet adoption %
- Trend vs prior period

2. Program-Level Usage Table
- Program name
- Employer
- Budget allocated
- Budget used
- Usage %
- Eligible category coverage
- Expiry/reset window

## 4.4 Trend Charts
- Usage % trend (global/employer/program)
- Spend mix trend (wallet/rewards/cash)
- Conversion funnel trend

## 4.5 Commerce Performance
- Top categories by wallet spend
- Top products by wallet-covered orders
- Discount vs utilization correlation

## 5. Required Filters (Global)
1. Time range: Today, 7D, 30D, Quarter, Year, Custom
2. Employer: All + specific employer
3. Program: All + specific program
4. Category: All + specific category
5. Region (optional)

Filter behavior:
- All widgets respond to global filters.
- Scope label always visible (e.g., "All Employers | Last 30 Days").

## 6. Metric Semantics & Rules
1. Usage numerator and denominator must share the same scope and period.
2. Exclude inactive/expired programs unless explicitly selected.
3. Currency default: INR.
4. Display precision:
- Percentage: 1 decimal (`45.3%`)
- Currency: compact for large values (`₹4.2L`, `₹1.1Cr`)
5. Trend comparison default: previous equivalent period.

## 7. UX Standards (Frontend)
1. Every widget must support:
- Loading
- Empty
- Error
- Success
2. Tooltips for each KPI with definition and formula.
3. Accessibility:
- Color contrast >= WCAG AA
- Keyboard navigation for filters and tables
- Semantic headings and landmarks
4. Responsive behavior:
- Desktop: full KPI grid + side-by-side charts
- Mobile: stacked cards + horizontal scroll for dense tables

## 8. Data Contract (Frontend Integration Ready)

## 8.1 Endpoint Shape (Recommended)
`GET /api/admin/analytics/overview?from=&to=&employerId=&programId=&category=`

Response:
```json
{
  "scope": {
    "from": "2026-01-01",
    "to": "2026-01-31",
    "employerId": null,
    "programId": null,
    "category": null
  },
  "summary": {
    "totalGmv": 12850000,
    "walletGmv": 7450000,
    "rewardsGmv": 850000,
    "cashGmv": 4400000,
    "globalHealthiUsagePct": 45.3,
    "activeEmployers": 27
  },
  "benefitInsights": {
    "walletAdoptionPct": 84.0,
    "rewardsRedemptionPct": 62.0,
    "globalHealthiUsagePct": 45.3,
    "topProgram": {
      "programId": "PGM_2026_WELLNESS",
      "name": "Corporate Wellness 2026",
      "usedAmount": 420000,
      "usagePct": 68.2
    }
  },
  "employerUsage": [],
  "programUsage": [],
  "trends": {
    "usagePct": [],
    "spendMix": [],
    "conversion": []
  }
}
```

## 8.2 Frontend Service Interface
Use service abstraction:
- `getAnalyticsOverview(filters)`
- `getEmployerUsage(filters)`
- `getProgramUsage(filters)`

Mock and real implementations must share identical return types.

## 9. Frontend Implementation Guidelines
1. Keep all fetch/mocks in `src/lib/services/analytics/`.
2. Keep all contracts in `src/types/analytics.ts`.
3. Keep dashboard widgets reusable in `src/components/admin/analytics/`.
4. No direct API call inside presentational components.
5. Add `NEXT_PUBLIC_USE_MOCKS=true` support for design-only mode.

## 10. Data Quality & Governance
1. Audit timestamps on all analytics payloads.
2. Return `dataFreshness` metadata (e.g., last calculated at).
3. Support idempotent calculations and period consistency.
4. If external Healthi service unavailable:
- Surface warning badge in dashboard
- Show last successful snapshot if available

## 11. Security & Access
1. Admin-only endpoints.
2. No PII in aggregated widgets.
3. Employer-level drilldown restricted by role/tenant scope.

## 12. Handoff Checklist (Designer to Developer)
1. KPI labels finalized and approved
2. Tooltip copy finalized (definitions/formulas)
3. All states designed (loading/empty/error)
4. Data contract reviewed with backend
5. Filter behavior specified and tested
6. Responsive and accessibility checks completed

