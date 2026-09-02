export const PING_GRACE_MS = 10 * 60 * 1000;

export function groupOfficeRuns(orders) {
  const list = orders || [];
  const open = list.filter((o) => !o?.closed);
  const closed = list.filter((o) => !!o?.closed);
  const buckets = new Map();
  for (const o of closed) {
    const key = o.updated_at || o.id;
    const at = Date.parse(o.updated_at || 0) || 0;
    const b = buckets.get(key) || { key, at, orders: [] };
    b.orders.push(o);
    buckets.set(key, b);
  }
  const closedRuns = [...buckets.values()].sort((a, b) => a.at - b.at);
  const runs = closedRuns.map((b, i) => ({ no: i + 1, closed: true, closedAt: b.at, orders: b.orders }));
  if (open.length) runs.push({ no: runs.length + 1, closed: false, closedAt: 0, orders: open });
  return runs;
}

export function runCanPing(run, now = Date.now()) {
  if (!run) return false;
  if (!run.closed) return true;
  const at = Number(run.closedAt) || Math.max(0, ...(run.orders || []).map((o) => Date.parse(o.updated_at || 0) || 0));
  return at > 0 && (now - at) < PING_GRACE_MS;
}

export function isBatchedItems(items) {
  return Array.isArray(items) && items[0]?.type === "batch";
}

export function flattenOrderItems(items) {
  if (!isBatchedItems(items)) return items || [];
  return items.flatMap((b) => b.lines || []);
}

export function orderBatchCount(items) {
  return isBatchedItems(items) ? items.length : 1;
}

export function orderIsPaid(row) {
  if (isBatchedItems(row?.items)) return (row.items || []).every((b) => !!b.paid);
  return !!row?.paid;
}

export function setAllBatchesPaid(items, paid) {
  if (!isBatchedItems(items)) {
    return { items: items || [], paid: !!paid, updated_at: new Date().toISOString() };
  }
  const next = items.map((b) => ({ ...b, paid: !!paid }));
  return { items: next, paid: !!paid, updated_at: new Date().toISOString() };
}

export function setParentLines(items, lines, deliveryFee = 0) {
  const food = (lines || []).reduce((s, l) => s + Number(l.price || 0) * Number(l.qty || 0), 0);
  const trips = orderBatchCount(items);
  const total = food + Number(deliveryFee || 0) * trips;
  const now = new Date().toISOString();
  if (!isBatchedItems(items)) {
    return { items: lines, total, updated_at: now };
  }
  const paid = items.every((b) => !!b.paid);
  return {
    items: [{
      type: "batch",
      id: items[0].id,
      at: items[0].at || now,
      lines,
      total,
      paid,
    }],
    total,
    paid,
    updated_at: now,
  };
}

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
