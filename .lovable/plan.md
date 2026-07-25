Replace all user-facing `$` currency symbols with `₦` (Naira) across the app. Parser/regex/template-literal code that uses `$` for non-currency purposes (regex anchors, `${}` interpolation, CSV escape) is left untouched.

## Files to update

- `src/pages/ItemManager.tsx` — 3 spots: `Unit Cost ($)` labels (lines 244, 413) and `${...toFixed(2)}` displays (lines 226, 274).
- `src/pages/StockCount.tsx` — headers `Unit Cost ($)` / `Variance Val ($)` (606, 607) and inline `${...toFixed(2)}` displays (168, 172).
- `src/pages/DepartmentView.tsx` — header `Unit Cost ($)` (230) and cost displays (211, 265).
- `src/pages/ItemSalesReport.tsx` — header `Total ($)` (374) and `$` prefixes on totals (354, 471).

## Not changed
- `src/lib/parsePdf.ts` and `src/test/pdfParsing.test.ts` — the `$` inside `[₦$N]` char classes is intentional (Reach POS PDF may render `$` as an OCR variant). Leaving in place preserves parser robustness.
- Any `${...}` template literals and regex `$` anchors.
