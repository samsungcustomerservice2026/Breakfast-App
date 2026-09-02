export function expandOrders(rows) {
  const out = [];
  for (const row of rows || []) {
    const items = row.items || [];
    if (items[0]?.type === "batch") {
      for (const b of items) {
        out.push({
          ...row,
          id: `${row.id}::${b.id}`,
          parentId: row.id,
          batchId: b.id,
          items: b.lines || [],
          total: b.total,
          paid: !!b.paid,
          created_at: b.at || row.created_at,
          updated_at: b.at || row.updated_at,
        });
      }
    } else {
      out.push(row);
    }
  }
  return out;
}

export function withNewBatch(row, lines, total) {
  const items = row.items || [];
  const batches = items[0]?.type === "batch"
    ? items.slice()
    : [{ type: "batch", id: "legacy", at: row.updated_at || row.created_at, lines: items, total: row.total, paid: !!row.paid }];
  batches.push({
    type: "batch",
    id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `b-${Date.now()}`,
    at: new Date().toISOString(),
    lines,
    total,
    paid: false,
  });
  return {
    items: batches,
    total: batches.reduce((s, b) => s + Number(b.total || 0), 0),
    paid: batches.every((b) => b.paid),
    updated_at: new Date().toISOString(),
  };
}

export function setBatchPaid(items, batchId, paid) {
  const next = (items || []).map((b) => (b.id === batchId ? { ...b, paid } : b));
  return {
    items: next,
    paid: next.length ? next.every((b) => b.paid) : paid,
    updated_at: new Date().toISOString(),
  };
}

export function parseOrderId(id) {
  const s = String(id || "");
  const i = s.indexOf("::");
  if (i < 0) return { parentId: s, batchId: null };
  return { parentId: s.slice(0, i), batchId: s.slice(i + 2) };
}

export function setBatchLines(items, batchId, lines, deliveryFee = 0) {
  const food = (lines || []).reduce((s, l) => s + Number(l.price || 0) * Number(l.qty || 0), 0);
  const batchTotal = food + Number(deliveryFee || 0);
  if (!batchId || !Array.isArray(items) || items[0]?.type !== "batch") {
    return { items: lines, total: batchTotal, updated_at: new Date().toISOString() };
  }
  const next = (items || []).map((b) => (b.id === batchId ? { ...b, lines, total: batchTotal } : b));
  return {
    items: next,
    total: next.reduce((s, b) => s + Number(b.total || 0), 0),
    updated_at: new Date().toISOString(),
  };
}
