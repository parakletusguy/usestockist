import { describe, it, expect } from "vitest";

interface StockRow {
  id?: string;
  item_id: string;
  open_qty: number;
  qty_in: number;
  close_qty: number;
  sales_qty: number;
  reach: string;
  os_status: string;
  remark: string;
}

/**
 * Mirrors the save logic in StockEntryTable: splits rows into
 * update (has id) vs insert (no id) to avoid sending null ids.
 */
function prepareSavePayloads(
  rows: StockRow[],
  date: string,
  teamMember: string
) {
  const validRows = rows.filter((r) => r.item_id);

  const rowsToUpdate = validRows.filter((r) => r.id);
  const rowsToInsert = validRows.filter((r) => !r.id);

  const updateData = rowsToUpdate.map((row) => ({
    id: row.id!,
    date,
    retail_team_name: teamMember,
    item_id: row.item_id,
    open_qty: row.open_qty,
    qty_in: row.qty_in,
    close_qty: row.close_qty,
    sales_qty: row.sales_qty,
    reach: row.reach || null,
    os_status: row.os_status || null,
    remark: row.remark || null,
  }));

  const insertData = rowsToInsert.map((row) => ({
    date,
    retail_team_name: teamMember,
    item_id: row.item_id,
    open_qty: row.open_qty,
    qty_in: row.qty_in,
    close_qty: row.close_qty,
    sales_qty: row.sales_qty,
    reach: row.reach || null,
    os_status: row.os_status || null,
    remark: row.remark || null,
  }));

  return { updateData, insertData };
}

describe("Stock save logic - null id prevention", () => {
  const date = "2026-02-15";
  const team = "Raphael Favour";

  const makeRow = (overrides: Partial<StockRow> = {}): StockRow => ({
    item_id: "abc-123",
    open_qty: 10,
    qty_in: 5,
    close_qty: 8,
    sales_qty: 7,
    reach: "",
    os_status: "",
    remark: "",
    ...overrides,
  });

  it("new rows must NOT have an id field in insert payload", () => {
    const rows = [makeRow()]; // no id
    const { insertData, updateData } = prepareSavePayloads(rows, date, team);

    expect(updateData).toHaveLength(0);
    expect(insertData).toHaveLength(1);
    expect(insertData[0]).not.toHaveProperty("id");
  });

  it("existing rows must have a valid id in update payload", () => {
    const rows = [makeRow({ id: "existing-uuid-1" })];
    const { insertData, updateData } = prepareSavePayloads(rows, date, team);

    expect(insertData).toHaveLength(0);
    expect(updateData).toHaveLength(1);
    expect(updateData[0].id).toBe("existing-uuid-1");
  });

  it("mixed rows are correctly split", () => {
    const rows = [
      makeRow({ id: "uuid-1" }),
      makeRow(), // new
      makeRow({ id: "uuid-2" }),
      makeRow(), // new
    ];
    const { insertData, updateData } = prepareSavePayloads(rows, date, team);

    expect(updateData).toHaveLength(2);
    expect(insertData).toHaveLength(2);
    insertData.forEach((row) => {
      expect(row).not.toHaveProperty("id");
    });
    updateData.forEach((row) => {
      expect(row.id).toBeTruthy();
    });
  });

  it("rows without item_id are filtered out entirely", () => {
    const rows = [makeRow({ item_id: "" }), makeRow({ item_id: "" , id: "uuid-x" })];
    const { insertData, updateData } = prepareSavePayloads(rows, date, team);

    expect(insertData).toHaveLength(0);
    expect(updateData).toHaveLength(0);
  });

  it("empty string optional fields become null", () => {
    const rows = [makeRow({ reach: "", os_status: "", remark: "" })];
    const { insertData } = prepareSavePayloads(rows, date, team);

    expect(insertData[0].reach).toBeNull();
    expect(insertData[0].os_status).toBeNull();
    expect(insertData[0].remark).toBeNull();
  });
});
