# J Expense Track Pro - Premium Multi-Scope Expense Tracker

FinTrack Pro is a state-of-the-art, responsive, single-page application (SPA) designed to help you organize and track your financial transactions. It features three distinct databases: **Office Expenses**, **Home Expenses**, and **Personal Expenses**.

## ✨ Features
1. **Interactive Dashboard**: Get a quick overview of remaining budgets, metrics for each scope, recent transactions, monthly trend lines, and category distribution.
2. **Dedicated CRUD Ledgers**: Individual page ledgers for Office, Home, and Personal tracking. Fully supports creating, editing, and deleting records with zero lag.
3. **Advanced Filtering & Sorting**: Filter transactions dynamically by category, payment method, date range, or description search query. Sort columns in ascending/descending order.
4. **Monthly Budgeting Targets**: Set customized limits for each scope. Visual alerts (Normal, Warning, Critical) indicate warning flags when you spend over 80% or 100% of limits.
5. **Secure Local Data Persistence**: Syncs all transactions, custom settings, themes, and budgets automatically with the client's browser `localStorage`.
6. **Detailed Reports & Exports**: Export customized ledger lists or master reports directly to CSV format. Supports printing invoice receipts.
7. **Premium Glassmorphism Aesthetics**: Stunning dashboard layout matching HSL-tailored colors, deep slate dark mode, clean light mode, and modern typography using the "Outfit" Google Font.

## 🛠️ Technology Stack
* **Structure**: HTML5 Semantic markup
* **Styling**: Vanilla CSS3 (HSL custom properties, dark/light themes, Flexbox/Grid layouts, glassmorphism panels, and transitions)
* **Logic**: Vanilla ES6+ Javascript (state manager, modal handlers, file uploading simulator)
* **Libraries (via CDN)**:
  * [Chart.js](https://www.chartjs.org/) (Interactive analytics visualizer)
  * [Lucide Icons](https://lucide.dev/) (Beautiful design vector glyphs)

## 🚀 How to Run Locally
1. Run a local web server in this directory to serve the static files:
   ```bash
   # Using npx (Node.js required)
   npx -y browser-sync start --server --files "*.*"
   ```
2. Open your web browser to the URL output by your server (usually `http://localhost:3000`).
3. Set your active workspace inside Antigravity to:
   `C:\Users\jagadeesh k\.gemini\antigravity\scratch\premium-expense-tracker`
