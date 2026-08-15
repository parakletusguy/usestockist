import "@testing-library/jest-dom";
import { vi } from "vitest";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

if (!URL.createObjectURL) {
  URL.createObjectURL = () => "blob:http://localhost/fake-blob";
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = () => {};
}

if (typeof global.DOMMatrix === "undefined") {
  (global as unknown as { DOMMatrix: unknown }).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    multiply() { return this; }
    translate() { return this; }
    scale() { return this; }
    transformPoint(p: unknown) { return p; }
  };
}


const mockItems = [
  {
    id: 'item-1',
    name: 'Medium Popcorn',
    category: 'Concessions',
    department: 'Retail',
    unit_of_measure: 'box',
    low_stock_threshold: 10,
    unit_cost: 1500,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'item-2',
    name: 'Soda Can 330ml',
    category: 'Beverages',
    department: 'Retail',
    unit_of_measure: 'can',
    low_stock_threshold: 25,
    unit_cost: 500,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
  },
];

const mockItemDepartments = [
  { id: 'dept-1', item_id: 'item-1', department: 'Retail', created_at: '2026-08-01T00:00:00Z' },
  { id: 'dept-2', item_id: 'item-1', department: 'Kitchen', created_at: '2026-08-01T00:00:00Z' },
  { id: 'dept-3', item_id: 'item-2', department: 'Retail', created_at: '2026-08-01T00:00:00Z' },
];

const mockReceivedLedger = [
  {
    id: 'rec-1',
    date: '2026-08-05',
    item_id: 'item-1',
    quantity: 50,
    supplier: 'Cinema Supplies Ltd',
    invoice_number: 'INV-1001',
    department: 'Retail',
    created_at: '2026-08-05T10:00:00Z',
    updated_at: '2026-08-05T10:00:00Z',
  },
];

const mockTransferLedger = [
  {
    id: 'trans-1',
    date: '2026-08-06',
    item_id: 'item-1',
    quantity: 10,
    destination: 'VIP Lounge',
    reason: 'Event stocking',
    created_at: '2026-08-06T11:00:00Z',
    updated_at: '2026-08-06T11:00:00Z',
  },
];

const mockIssuanceLedger = [
  {
    id: 'iss-1',
    date: '2026-08-07',
    item_id: 'item-2',
    quantity: 5,
    issued_by: 'Manager Alice',
    recipient_group: 'Staff Counter',
    created_at: '2026-08-07T12:00:00Z',
    updated_at: '2026-08-07T12:00:00Z',
  },
];

const mockDailyStockSheets = [
  {
    id: 'sheet-1',
    date: '2026-08-07',
    item_id: 'item-1',
    open_qty: 100,
    qty_in: 50,
    sales_qty: 30,
    close_qty: 120,
    reach: 120,
    os_status: 'OK',
    remark: 'Verified',
    retail_team_name: 'Team Alpha',
    created_at: '2026-08-07T18:00:00Z',
    updated_at: '2026-08-07T18:00:00Z',
  },
];

const mockPurchaseOrders = [
  {
    id: 'po-1',
    item_id: 'item-1',
    suggested_quantity: 40,
    ordered_quantity: null,
    status: 'pending',
    unit_cost: 1500,
    supplier: 'Cinema Supplies Ltd',
    department: 'Retail',
    days_to_stockout: 3,
    daily_velocity: 13.3,
    reorder_reason: 'Stock level below safety threshold',
    created_at: '2026-08-08T09:00:00Z',
    updated_at: '2026-08-08T09:00:00Z',
  },
];

const mockReachSalesReports = [
  {
    id: 'report-101',
    report_date: '2026-08-10',
    retail_member_name: 'Joy Cashier',
    file_name: 'Reach_Sales_Aug10.pdf',
    total_items_sold: 35,
    total_sales_value: 91500,
    uploaded_at: '2026-08-10T12:00:00Z',
  },
];

function createMockQueryBuilder(data: unknown = []) {
  const builder: Record<string, unknown> = {
    select: vi.fn().mockImplementation(() => builder),
    insert: vi.fn().mockImplementation((val) => {
      builder._inserted = val;
      return builder;
    }),
    update: vi.fn().mockImplementation((val) => {
      builder._updated = val;
      return builder;
    }),
    delete: vi.fn().mockImplementation(() => builder),
    eq: vi.fn().mockImplementation(() => builder),
    neq: vi.fn().mockImplementation(() => builder),
    gte: vi.fn().mockImplementation(() => builder),
    lte: vi.fn().mockImplementation(() => builder),
    lt: vi.fn().mockImplementation(() => builder),
    gt: vi.fn().mockImplementation(() => builder),
    in: vi.fn().mockImplementation(() => builder),
    not: vi.fn().mockImplementation(() => builder),
    order: vi.fn().mockImplementation(() => builder),
    limit: vi.fn().mockImplementation(() => builder),
    single: vi.fn().mockImplementation(() => Promise.resolve({ data: Array.isArray(data) ? data[0] || { id: 'report-101' } : data, error: null })),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve({ data: Array.isArray(data) ? data[0] || null : data, error: null })),
    then: (resolve: (val: unknown) => void) => Promise.resolve({ data, error: null, count: Array.isArray(data) ? data.length : 1 }).then(resolve),
  };
  return builder;
}

const mockBranches = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Main Branch', is_active: true, created_at: '2026-08-01T00:00:00Z' },
  { id: 'branch-2', name: 'Branch 2', is_active: true, created_at: '2026-08-02T00:00:00Z' },
];

const mockUserBranches = [
  { id: 'ub-1', user_id: 'user-1', branch_id: '00000000-0000-0000-0000-000000000001', is_default: true, created_at: '2026-08-01T00:00:00Z' },
];

export const mockSupabase = {
  from: vi.fn().mockImplementation((table: string) => {
    switch (table) {
      case 'branches':
        return createMockQueryBuilder(mockBranches);
      case 'user_branches':
        return createMockQueryBuilder(mockUserBranches);
      case 'items':
        return createMockQueryBuilder(mockItems);
      case 'item_departments':
        return createMockQueryBuilder(mockItemDepartments);
      case 'received_ledger':
        return createMockQueryBuilder(mockReceivedLedger);
      case 'transfer_ledger':
        return createMockQueryBuilder(mockTransferLedger);
      case 'issuance_ledger':
        return createMockQueryBuilder(mockIssuanceLedger);
      case 'daily_stock_sheets':
        return createMockQueryBuilder(mockDailyStockSheets);
      case 'purchase_orders':
        return createMockQueryBuilder(mockPurchaseOrders);
      case 'reach_sales_reports':
        return createMockQueryBuilder(mockReachSalesReports);
      default:
        return createMockQueryBuilder([]);
    }
  }),
  rpc: vi.fn().mockImplementation((fnName: string) => {
    if (fnName === 'calculate_predictive_reorders') {
      return Promise.resolve({
        data: [{ analyzed_items_count: 2, created_count: 1, existing_count: 0 }],
        error: null,
      });
    }
    if (fnName === 'clear_purchase_orders') {
      return Promise.resolve({ data: true, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  }),
  functions: {
    invoke: vi.fn().mockImplementation((functionName: string) => {
      if (functionName === 'generate-inventory-report') {
        return Promise.resolve({ data: { success: true, url: 'https://example.com/report.pdf' }, error: null });
      }
      if (functionName === 'inventory-insights') {
        return Promise.resolve({ data: { answer: 'Stock is healthy across all departments.' }, error: null });
      }
      if (functionName === 'mcp') {
        return Promise.resolve({ data: { tools: ['list_items'] }, error: null });
      }
      return Promise.resolve({ data: {}, error: null });
    }),
  },
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-1', email: 'manager@example.com', app_metadata: { role: 'manager' } },
          access_token: 'fake-jwt-token',
        },
      },
      error: null,
    }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
    signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'user-2' } }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));
