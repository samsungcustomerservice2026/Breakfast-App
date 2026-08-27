import { useMemo } from "react";
import { S } from "./styles.js";

const PIE_COLORS = ["#c0392b", "#f2b134", "#2f6b4f", "#2b2320", "#4a7c9b", "#7b5ea7", "#c45c26", "#8a7f70"];

function Pie({ slices, title }) {
  const total = slices.reduce((s, x) => s + Number(x.value || 0), 0);
  let acc = 0;
  const stops = (total
    ? slices.map((s) => {
      const start = acc;
      acc += (Number(s.value || 0) / total) * 100;
      return `${s.color} ${start}% ${acc}%`;
    })
    : ["#e7ddcb 0% 100%"]
  ).join(", ");
  return (
    <div style={S.pieCard} dir="rtl">
      <h3 style={S.pieTitle}>{title}</h3>
      <div style={{ ...S.pieDisc, background: `conic-gradient(${stops})` }} aria-hidden />
      {!total ? <p style={S.cartEmpty}>مفيش بيانات في اليوم ده.</p> : (
        <ul style={S.pieLegend}>
          {slices.filter((s) => s.value > 0).map((s) => (
            <li key={s.label} style={S.pieLegendRow}>
              <span style={{ ...S.pieSwatch, background: s.color }} />
              <span style={{ flex: 1 }}>{s.label}</span>
              <span style={S.pieVal}>{s.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ReportView({ orders, officers, teamLabel }) {
  const byCollector = useMemo(() => {
    const map = {};
    for (const o of orders) {
      const id = o.collector_id || "_none";
      map[id] = (map[id] || 0) + 1;
    }
    const names = Object.fromEntries((officers || []).map((c) => [c.id, c.name]));
    return Object.entries(map).map(([id, value], i) => ({
      label: id === "_none" ? "من غير مأمور" : (names[id] || "مأمور"),
      value,
      color: PIE_COLORS[i % PIE_COLORS.length],
    })).sort((a, b) => b.value - a.value);
  }, [orders, officers]);

  const byTeam = useMemo(() => {
    const map = {};
    for (const o of orders) {
      const k = o.department || "_none";
      map[k] = (map[k] || 0) + 1;
    }
    return Object.entries(map).map(([id, value], i) => ({
      label: id === "_none" ? "من غير فريق" : (teamLabel(id) || id),
      value,
      color: PIE_COLORS[i % PIE_COLORS.length],
    })).sort((a, b) => b.value - a.value);
  }, [orders, teamLabel]);

  const byPaid = useMemo(() => {
    const paid = orders.filter((o) => o.paid).length;
    const due = orders.length - paid;
    return [
      { label: "دافع", value: paid, color: "#2f6b4f" },
      { label: "لسه", value: due, color: "#c0392b" },
    ];
  }, [orders]);

  const byCat = useMemo(() => {
    const map = {};
    for (const o of orders) {
      for (const l of o.items || []) {
        const k = l.categoryName || "تاني";
        map[k] = (map[k] || 0) + Number(l.qty || 0);
      }
    }
    return Object.entries(map).map(([label, value], i) => ({
      label,
      value,
      color: PIE_COLORS[i % PIE_COLORS.length],
    })).sort((a, b) => b.value - a.value);
  }, [orders]);

  return (
    <div style={S.pieGrid} dir="rtl">
      <p style={{ ...S.finePrint, margin: "0 0 4px" }}>تقرير اليوم المختار — عدد الأوردرات والأصناف.</p>
      <Pie title="الأوردرات على المأمورين" slices={byCollector} />
      <Pie title="الأوردرات على الفرق" slices={byTeam} />
      <Pie title="الدفع" slices={byPaid} />
      <Pie title="الأصناف حسب القسم" slices={byCat} />
    </div>
  );
}
