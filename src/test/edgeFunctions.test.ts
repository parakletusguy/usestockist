import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabase } from './setup';


describe('Supabase Edge Functions Invocation Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invokes generate-inventory-report edge function with export format parameters', async () => {
    const { data, error } = await mockSupabase.functions.invoke('generate-inventory-report', {
      body: { format: 'pdf', department: 'Retail', startDate: '2026-08-01', endDate: '2026-08-10' },
    });

    expect(error).toBeNull();
    expect(data?.success).toBe(true);
    expect(data?.url).toBeDefined();
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('generate-inventory-report', {
      body: { format: 'pdf', department: 'Retail', startDate: '2026-08-01', endDate: '2026-08-10' },
    });
  });

  it('invokes inventory-insights edge function with query prompt', async () => {
    const { data, error } = await mockSupabase.functions.invoke('inventory-insights', {
      body: { prompt: 'Which items are low in stock?' },
    });

    expect(error).toBeNull();
    expect(data?.answer).toBeDefined();
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('inventory-insights', {
      body: { prompt: 'Which items are low in stock?' },
    });
  });

  it('invokes mcp edge function for Model Context Protocol interactions', async () => {
    const { data, error } = await mockSupabase.functions.invoke('mcp', {
      body: { method: 'tools/list' },
    });

    expect(error).toBeNull();
    expect(data?.tools).toBeDefined();
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('mcp', {
      body: { method: 'tools/list' },
    });
  });
});
