

# Stockist App - Implementation Plan

## Overview
A responsive inventory management web application for tracking stock across multiple locations, managing daily stock sheets for retail teams, and maintaining ledgers for issuance, transfers, and receiving.

---

## 1. Authentication & User Setup
- **Basic login/signup** using Supabase Auth (email/password)
- All authenticated users have the same access level
- Session management to keep users logged in
- Simple profile display showing logged-in user info

---

## 2. Database Structure (Supabase)

### Master Data
- **items** - Product catalog with name, category, and unit of measure

### Transaction Tables (all with timestamps)
- **daily_stock_sheets** - Daily stock tracking per retail team (Team 1-10)
- **weekly_stock_counts** - Physical counts by location (Main Store, 24hr Store)
- **issuance_ledger** - Items issued to groups (Retail, Housekeeping, Managers, Cube, Bar)
- **transfer_ledger** - Transfers to sister branches/businesses
- **received_ledger** - Items received from suppliers with invoice tracking

---

## 3. Navigation & Layout
- **Collapsible sidebar** on the left with icons and labels
- Menu items: Dashboard, Item Manager, Daily Stock Sheet, Weekly Count, Issuance, Transfers, Received
- Mobile-responsive design with hamburger menu on smaller screens
- Clean header showing app name and user info/logout

---

## 4. Dashboard
A comprehensive overview page featuring:

### Metrics Cards
- Total items in catalog
- Low stock alerts (items below threshold)
- Recent transactions count
- Today's sales summary

### Charts & Analytics
- Stock level trends over time
- Sales patterns by retail team
- Top moving items visualization

### Quick Actions
- Add new issuance
- Record received stock
- Create transfer
- Start daily stock sheet

---

## 5. Item Manager
- **Table view** of all inventory items
- **Add/Edit form** with fields: name, category, unit of measure
- **Search and filter** by category
- **Delete** functionality with confirmation dialog
- Categories: Beverages, Food, Supplies, etc. (customizable)

---

## 6. Daily Stock Sheet
- **Date and Team selector** at the top (Team 1-10)
- **Data grid** with columns:
  - Item (dropdown from items catalog)
  - Opening Qty
  - Qty In
  - Closing Qty
  - **Sales Qty** (auto-calculated: Opening + Qty In - Closing)
  - Reach
  - OS Status
  - Remark
- **Add row** button to add new items to the sheet
- **Save** button to persist all entries
- Manual entry for all values (no carry-forward)

---

## 7. Weekly Stock Count
- **Date and Location selector** (Main Store, 24hr Store)
- **Form to record** physical counts per item
- **Notes field** for observations
- **History table** showing past counts filtered by location

---

## 8. Ledger Pages (Issuance, Transfer, Received)

### Issuance Ledger
- Form: Date, Recipient Group dropdown (Retail, Housekeeping, Managers, Cube, Bar), Item, Quantity, Issued By (auto-filled with logged-in user)
- History table with filtering by date range and recipient

### Transfer Ledger
- Form: Date, Destination (Sister Branch/Business), Item, Quantity, Reason
- History table with filtering

### Received Ledger
- Form: Date, Supplier, Item, Quantity, Invoice Number
- History table with filtering

---

## 9. Export Functionality
- **Export to CSV/Excel** button on each ledger page
- Export filtered data based on current view
- Include all relevant columns with proper formatting
- Date range selection for exports

---

## 10. Design & UX
- Clean, modern dashboard aesthetic
- Shadcn UI components throughout
- Tailwind CSS for styling
- Consistent color scheme and typography
- Loading states and error handling
- Toast notifications for actions (save, delete, etc.)
- Responsive tables with horizontal scroll on mobile

