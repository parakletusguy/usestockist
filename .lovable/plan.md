

## Plan: Add Edit and Delete to All Ledger Pages

### Current State
| Page | Edit | Delete |
|------|------|--------|
| Daily Stock Sheet | Inline editing + save | Row remove + save |
| Weekly Count | None | Yes (with confirm dialog) |
| Issuance | None | None |
| Received | None | None |
| Transfers | None | None |

### What to Build

**1. Add missing mutation hooks**

- `useLedgers.ts`: Add `useUpdateIssuance`, `useDeleteIssuance`, `useUpdateTransfer`, `useDeleteTransfer`, `useUpdateReceived`, `useDeleteReceived` mutations
- `useWeeklyStockCounts.ts`: Add `useUpdateWeeklyStockCount` mutation

**2. Update each page with Edit and Delete actions**

Add an "Actions" column to the history table on each page with:
- **Edit button** (Pencil icon): Opens a dialog pre-filled with the entry's current values. User edits and saves.
- **Delete button** (Trash icon): Opens an AlertDialog confirmation before deleting.

Pages to update:
- `src/pages/Issuance.tsx` -- add edit dialog + delete confirm
- `src/pages/Received.tsx` -- add edit dialog + delete confirm
- `src/pages/Transfers.tsx` -- add edit dialog + delete confirm
- `src/pages/WeeklyCount.tsx` -- add edit dialog (delete already exists)

**3. UI Pattern**

Each page will use a consistent pattern:
- State for `editingEntry` (the entry being edited, or null)
- A `<Dialog>` component with a form matching the entry fields
- An `<AlertDialog>` wrapping the delete button for confirmation
- Both edit and delete buttons rendered in the last column of each table row

**4. RLS Note**

Delete is already restricted to admins via existing RLS policies. No database changes needed -- all tables already allow authenticated users to update.

### Files to Change
- `src/hooks/useLedgers.ts` -- add 6 new mutation hooks
- `src/hooks/useWeeklyStockCounts.ts` -- add 1 update mutation
- `src/pages/Issuance.tsx` -- add Actions column with edit/delete
- `src/pages/Received.tsx` -- add Actions column with edit/delete
- `src/pages/Transfers.tsx` -- add Actions column with edit/delete
- `src/pages/WeeklyCount.tsx` -- add edit dialog

