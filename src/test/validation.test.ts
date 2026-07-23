import { describe, it, expect } from 'vitest';
import {
  ItemSchema,
  IssuanceSchema,
  TransferSchema,
  ReceivedSchema,
  DEPARTMENTS,
} from '../lib/validation';

describe('Validation Schemas', () => {
  describe('ItemSchema', () => {
    it('validates a correct item object', () => {
      const validItem = {
        name: 'Red Wine (House)',
        category: 'Beverages',
        unit_of_measure: 'bottle',
        department: 'Bar',
        low_stock_threshold: 10,
        unit_cost: 15,
      };

      const result = ItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('rejects empty item name', () => {
      const invalidItem = {
        name: '',
        category: 'Beverages',
        unit_of_measure: 'bottle',
      };

      const result = ItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });
  });

  describe('IssuanceSchema', () => {
    it('validates correct issuance entry', () => {
      const validIssuance = {
        date: '2026-07-23',
        recipient_group: 'Housekeeping',
        item_id: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 5,
        issued_by: 'Manager',
        department: 'Retail',
      };

      const result = IssuanceSchema.safeParse(validIssuance);
      expect(result.success).toBe(true);
    });

    it('rejects zero or negative quantity', () => {
      const invalidIssuance = {
        date: '2026-07-23',
        recipient_group: 'Bar',
        item_id: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 0,
        issued_by: 'Admin',
      };

      const result = IssuanceSchema.safeParse(invalidIssuance);
      expect(result.success).toBe(false);
    });
  });

  describe('TransferSchema', () => {
    it('validates correct transfer entry', () => {
      const validTransfer = {
        date: '2026-07-23',
        destination: 'Kitchen (Nox)',
        item_id: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 10,
        reason: 'Shift restock',
      };

      const result = TransferSchema.safeParse(validTransfer);
      expect(result.success).toBe(true);
    });
  });

  describe('ReceivedSchema', () => {
    it('validates correct received entry', () => {
      const validReceived = {
        date: '2026-07-23',
        supplier: 'Premium Imports',
        item_id: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 50,
        invoice_number: 'INV-99201',
      };

      const result = ReceivedSchema.safeParse(validReceived);
      expect(result.success).toBe(true);
    });
  });

  describe('Departments Enum', () => {
    it('contains all 6 expected department options', () => {
      expect(DEPARTMENTS).toEqual([
        'Retail',
        'Cube',
        'Bar',
        'Nox',
        'Housekeeping',
        'Kitchen (Nox)',
      ]);
    });
  });
});
