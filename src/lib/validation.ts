import { z } from 'zod';

export const DEPARTMENTS = [
  'Retail',
  'Cube',
  'Bar',
  'Nox',
  'Housekeeping',
  'Kitchen (Nox)',
] as const;

export type DepartmentType = typeof DEPARTMENTS[number];

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date (YYYY-MM-DD)');
const uuid = z.string().uuid('Invalid ID');
const qty = z.coerce.number().finite().min(0, 'Must be >= 0').max(9_999_999, 'Too large');
const shortText = (max = 100) => z.string().trim().min(1, 'Required').max(max);
const optText = (max = 500) => z.string().trim().max(max).optional().or(z.literal('').transform(() => undefined));

export const ItemSchema = z.object({
  name: shortText(100),
  category: shortText(50),
  unit_of_measure: shortText(20),
  department: z.string().default('Retail'),
  low_stock_threshold: qty.default(0),
  unit_cost: qty.default(0),
});

export const IssuanceSchema = z.object({
  date: dateStr,
  recipient_group: z.string().min(1, 'Required'),
  item_id: uuid,
  quantity: qty.refine((v) => v > 0, 'Quantity must be > 0'),
  issued_by: shortText(100),
  department: z.string().optional(),
});

export const TransferSchema = z.object({
  date: dateStr,
  destination: shortText(100),
  item_id: uuid,
  quantity: qty.refine((v) => v > 0, 'Quantity must be > 0'),
  reason: optText(500),
  department: z.string().optional(),
});

export const ReceivedSchema = z.object({
  date: dateStr,
  supplier: shortText(100),
  item_id: uuid,
  quantity: qty.refine((v) => v > 0, 'Quantity must be > 0'),
  invoice_number: optText(100),
  department: z.string().optional(),
});

export function firstError(err: unknown): string {
  if (err && typeof err === 'object' && 'issues' in err) {
    const issues = (err as any).issues as Array<{ message: string }>;
    return issues[0]?.message ?? 'Invalid input';
  }
  return err instanceof Error ? err.message : 'Invalid input';
}
