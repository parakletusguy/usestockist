import { vi } from 'vitest';

export interface MockItem {
  id: string;
  name: string;
  category: string;
  department: string;
  unit_of_measure: string;
  low_stock_threshold: number;
  unit_cost: number;
  created_at: string;
  updated_at: string;
}

export interface MockItemDepartment {
  id: string;
  item_id: string;
  department: string;
  created_at: string;
}

export interface MockReceivedLedger {
  id: string;
  date: string;
  item_id: string;
  quantity: number;
  supplier: string;
  invoice_number: string | null;
  department: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockTransferLedger {
  id: string;
  date: string;
  item_id: string;
  quantity: number;
  destination: string;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockIssuanceLedger {
  id: string;
  date: string;
  item_id: string;
  quantity: number;
  issued_by: string;
  recipient_group: string;
  created_at: string;
  updated_at: string;
}

export interface MockDailyStockSheet {
  id: string;
  date: string;
  item_id: string;
  open_qty: number;
  qty_in: number;
  sales_qty: number;
  close_qty: number;
  reach: number;
  os_status: string | null;
  remark: string | null;
  retail_team_name: string;
  created_at: string;
  updated_at: string;
}

export interface MockPurchaseOrder {
  id: string;
  item_id: string;
  suggested_quantity: number;
  ordered_quantity: number | null;
  status: string;
  unit_cost: number;
  supplier: string | null;
  department: string | null;
  days_to_stockout: number | null;
  daily_velocity: number | null;
  reorder_reason: string | null;
  created_at: string;
  updated_at: string;
}

export const mockItems: MockItem[] = [
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

export const mockItemDepartments: MockItemDepartment[] = [
  { id: 'dept-1', item_id: 'item-1', department: 'Retail', created_at: '2026-08-01T00:00:00Z' },
  { id: 'dept-2', item_id: 'item-1', department: 'Kitchen', created_at: '2026-08-01T00:00:00Z' },
  { id: 'dept-3', item_id: 'item-2', department: 'Retail', created_at: '2026-08-01T00:00:00Z' },
];

export const mockReceivedLedger: MockReceivedLedger[] = [
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

export const mockTransferLedger: MockTransferLedger[] = [
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

export const mockIssuanceLedger: MockIssuanceLedger[] = [
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

export const mockDailyStockSheets: MockDailyStockSheet[] = [
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

export const mockPurchaseOrders: MockPurchaseOrder[] = [
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

export function createMockQueryBuilder(data: any = []) {
  const builder: any = {
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
    order: vi.fn().mockImplementation(() => builder),
    limit: vi.fn().mockImplementation(() => builder),
    single: vi.fn().mockImplementation(() => Promise.resolve({ data: Array.isArray(data) ? data[0] || null : data, error: null })),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve({ data: Array.isArray(data) ? data[0] || null : data, error: null })),
    then: (resolve: any) => Promise.resolve({ data, error: null, count: Array.isArray(data) ? data.length : 1 }).then(resolve),
  };
  return builder;
}

export interface MockBranch {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface MockUserBranch {
  id: string;
  user_id: string;
  branch_id: string;
  is_default: boolean;
  created_at: string;
}

export const mockBranches: MockBranch[] = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Main Branch', is_active: true, created_at: '2026-08-01T00:00:00Z' },
  { id: 'branch-2', name: 'Branch 2', is_active: true, created_at: '2026-08-02T00:00:00Z' },
];

export const mockUserBranches: MockUserBranch[] = [
  { id: 'ub-1', user_id: 'user-1', branch_id: '00000000-0000-0000-0000-000000000001', is_default: true, created_at: '2026-08-01T00:00:00Z' },
];

export function createMockSupabaseClient() {
  const client: any = {
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
        default:
          return createMockQueryBuilder([]);
      }
    }),
    rpc: vi.fn().mockImplementation((fnName: string, args?: any) => {
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
      invoke: vi.fn().mockImplementation((functionName: string, options?: any) => {
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
  return client;
}
