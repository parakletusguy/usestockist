import { z } from 'zod';

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date (YYYY-MM-DD)');
const uuid = z.string().uuid('Invalid ID');
const qty = z.coerce.number().finite().min(0, 'Must be >= 0').max(9_999_999, 'Too large');
const shortText = (max = 100) => z.string().trim().min(1, 'Required').max(max);
const optText = (max = 500) => z.string().trim().max(max).optional().or(z.literal('').transform(() => undefined));

export const ItemSchema = z.object({
  name: shortText(100),
  category: shortText(50),
  unit_of_measure: shortText(20),
});

export const IssuanceSchema = z.object({
  date: dateStr,
  recipient_group: z.enum(['Retail', 'Housekeeping', 'Managers', 'Cube', 'Bar']),
  item_id: uuid,
  quantity: qty.refine((v) => v > 0, 'Quantity must be > 0'),
  issued_by: shortText(100),
});

export const TransferSchema = z.object({
  date: dateStr,
  destination: shortText(100),
  item_id: uuid,
  quantity: qty.refine((v) => v > 0, 'Quantity must be > 0'),
  reason: optText(500),
});

export const ReceivedSchema = z.object({
  date: dateStr,
  supplier: shortText(100),
  item_id: uuid,
  quantity: qty.refine((v) => v > 0, 'Quantity must be > 0'),
  invoice_number: optText(100),
});

export const WeeklyStockCountSchema = z.object({
  date: dateStr,
  location: shortText(50),
  item_id: uuid,
  physical_count: qty,
  notes: optText(500),
});

export const PasswordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password too long')
  .refine((p) => /[a-z]/.test(p), 'Must include a lowercase letter')
  .refine((p) => /[A-Z]/.test(p), 'Must include an uppercase letter')
  .refine((p) => /[0-9]/.test(p), 'Must include a number')
  .refine((p) => /[^A-Za-z0-9]/.test(p), 'Must include a symbol');

export function firstError(err: unknown): string {
  if (err && typeof err === 'object' && 'issues' in err) {
    const issues = (err as any).issues as Array<{ message: string }>;
    return issues[0]?.message ?? 'Invalid input';
  }
  return err instanceof Error ? err.message : 'Invalid input';
}
