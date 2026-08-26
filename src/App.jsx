import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ShoppingCart, Plus, Minus, Trash2, Check, ClipboardCopy, RefreshCw, ArrowLeft, LogOut, ChefHat, Layers, Users, Phone } from "lucide-react";
import { supabase, configError } from "./supabase.js";
import { S, globalCss } from "./styles.js";

const TIER_LABELS = { shami: "Shami", balady: "Balady", sm: "Small", md: "Medium", lg: "Large" };
const money = (n) => `${Number(n || 0).toFixed(0)} EGP`;
const todayStr = () => new Date().toISOString().slice(0, 10);
const prettyDate = (d) => {
  try { return new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
  catch { return d; }
};

function useIsNarrow() {
  const [n, setN] = useState(typeof window !== "undefined" ? window.innerWidth < 760 : false);
  useEffect(() => { const on = () => setN(window.innerWidth < 760); window.addEventListener("resize", on); return () => window.removeEventListener("resize", on); }, []);
  return n;
}

/* map a DB menu_items row to price tiers present */
function tiersOf(row, tiered) {
  const keys = tiered ? [["sm", "price_sm"], ["md", "price_md"], ["lg", "price_lg"]] : [["shami", "price_shami"], ["balady", "price_balady"]];
  return keys.filter(([, col]) => row[col] != null).map(([tier, col]) => ({ tier, price: Number(row[col]) }));
}

export default function App() {
  const [phase, setPhase] = useState("loading"); // loading | auth | needsProfile | ready | error
  const [errMsg, setErrMsg] = useState(configError || null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [view, setView] = useState("shop");
  const [toast, setToast] = useState(null);
  const narrow = useIsNarrow();

  const showToast = useCallback((msg, tone = "ok") => { setToast({ msg, tone }); setTimeout(() => setToast(null), 3400); }, []);

  /* auth session listener */
  useEffect(() => {
    if (configError) { setPhase("error"); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  /* when session changes, load profile + menu */
  useEffect(() => {
    if (configError) return;
    (async () => {
      if (!session) { setPhase("auth"); setProfile(null); return; }
      setPhase("loading");
      try {
        const { data: prof, error: pErr } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
        if (pErr) throw pErr;
        if (!prof) { setPhase("needsProfile"); return; }
        setProfile(prof);
        await loadMenu();
        setPhase("ready");
      } catch (e) {
        setErrMsg(e.message || "Something went wrong loading your account.");
        setPhase("error");
      }
    })();
    // eslint-disable-next-line
  }, [session]);

  const loadMenu = useCallback(async () => {
    const [{ data: cats, error: cErr }, { data: items, error: iErr }] = await Promise.all([
      supabase.from("menu_categories").select("*").order("sort"),
      supabase.from("menu_items").select("*").order("sort"),
    ]);
    if (cErr) throw cErr;
    if (iErr) throw iErr;
    const byCat = {};
    for (const it of items) (byCat[it.category_id] = byCat[it.category_id] || []).push(it);
    setCatalog(cats.map((c) => ({ ...c, items: byCat[c.id] || [] })));
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); setView("shop"); };

  if (phase === "error") return (<Center><p style={{ ...S.loadText, maxWidth: 360 }}>{errMsg}</p></Center>);
  if (phase === "loading") return (<Center><div style={S.loadPulse}><ChefHat size={40} strokeWidth={1.5} /></div><p style={S.loadText}>Warming up the kitchen…</p></Center>);
  if (phase === "auth") return (<AuthScreen showToast={showToast} />);
  if (phase === "needsProfile") return (<ProfileScreen session={session} onDone={(p) => { setProfile(p); loadMenu().then(() => setPhase("ready")); }} />);

  return (
    <div style={S.app}>
      <header style={S.header}>
        <div style={S.brandRowSm}><div style={S.logoDotSm}><ChefHat size={16} strokeWidth={2.2} /></div><span style={S.headerTitle}>El Shabrawy</span></div>
        <div style={S.headerRight}>
          <span style={S.hello}>Hi, {profile.name.split(" ")[0]}</span>
          {profile.is_admin && (view === "shop"
            ? <button style={S.ghostBtn} onClick={() => setView("admin")}><Users size={15} /> Admin</button>
            : <button style={S.ghostBtn} onClick={() => setView("shop")}><ArrowLeft size={15} /> Menu</button>)}
          <button style={S.ghostBtn} onClick={signOut} title="Sign out"><LogOut size={15} /></button>
        </div>
      </header>

      {view === "shop"
        ? <ShopView {...{ narrow, catalog, profile, showToast }} />
        : <AdminView {...{ narrow, showToast }} />}

      {toast && (<div style={{ ...S.toast, background: toast.tone === "err" ? "#b23a2f" : "#2f6b4f" }}>{toast.tone === "err" ? "!" : <Check size={16} />} {toast.msg}</div>)}
      <style>{globalCss}</style>
    </div>
  );
}

function Center({ children }) { return (<div style={S.screenCenter}>{children}<style>{globalCss}</style></div>); }

/* ─────────────── Auth ─────────────── */
function AuthScreen() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const submit = async () => {
    setErr(""); setOk("");
    if (!email.trim() || pw.length < 6) return setErr("Enter an email and a password of at least 6 characters.");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password: pw });
        if (error) throw error;
        setOk("Account created. If email confirmation is on, check your inbox, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
        if (error) throw error;
      }
    } catch (e) { setErr(e.message || "Couldn't complete that. Try again."); }
    finally { setBusy(false); }
  };

  return (
    <Center>
      <div style={S.signCard}>
        <div style={S.brandRow}>
          <div style={S.logoDot}><ChefHat size={22} strokeWidth={2} /></div>
          <div><h1 style={S.brandTitle}>El Shabrawy</h1><p style={S.brandSub}>Office breakfast, sorted before 9.</p></div>
        </div>
        <label style={S.label}>Email</label>
        <input style={S.input} type="email" value={email} placeholder="you@company.com" onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} autoFocus />
        <label style={{ ...S.label, marginTop: 14 }}>Password</label>
        <input style={S.input} type="password" value={pw} placeholder="••••••••" onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        {err && <p style={S.errText}>{err}</p>}
        {ok && <p style={S.okText}>{ok}</p>}
        <button style={{ ...S.primaryBtn, width: "100%", marginTop: 16, opacity: busy ? 0.7 : 1 }} onClick={submit} disabled={busy}>
          {busy ? <><RefreshCw size={16} className="spin" /> Please wait…</> : mode === "signup" ? "Create account" : "Sign in"}
        </button>
        <button style={S.linkBtn} onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setErr(""); setOk(""); }}>
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </Center>
  );
}

/* ─────────────── Profile setup (first login) ─────────────── */
function ProfileScreen({ session, onDone }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setErr("");
    if (!name.trim()) return setErr("Please enter your name.");
    if (phone.replace(/\D/g, "").length < 7) return setErr("Please enter a valid phone number.");
    setBusy(true);
    try {
      const row = { id: session.user.id, name: name.trim(), phone: phone.trim() };
      const { data, error } = await supabase.from("profiles").upsert(row).select().single();
      if (error) throw error;
      onDone(data);
    } catch (e) { setErr(e.message || "Couldn't save your details."); }
    finally { setBusy(false); }
  };

  return (
    <Center>
      <div style={S.signCard}>
        <div style={S.brandRow}>
          <div style={S.logoDot}><ChefHat size={22} strokeWidth={2} /></div>
          <div><h1 style={S.brandTitle}>One quick step</h1><p style={S.brandSub}>Tell us who to put on the order.</p></div>
        </div>
        <label style={S.label}>Your name</label>
        <input style={S.input} value={name} placeholder="e.g. Ahmed Fawzy" onChange={(e) => setName(e.target.value)} autoFocus />
        <label style={{ ...S.label, marginTop: 14 }}>Phone number</label>
        <input style={S.input} value={phone} placeholder="e.g. 0100 123 4567" inputMode="tel" onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} />
        {err && <p style={S.errText}>{err}</p>}
        <button style={{ ...S.primaryBtn, width: "100%", marginTop: 16, opacity: busy ? 0.7 : 1 }} onClick={save} disabled={busy}>
          {busy ? <><RefreshCw size={16} className="spin" /> Saving…</> : "Save and continue"}
        </button>
      </div>
    </Center>
  );
}

/* ─────────────── Shop ─────────────── */
function ShopView({ narrow, catalog, profile, showToast }) {
  const date = todayStr();
  const [activeCat, setActiveCat] = useState(catalog[0]?.id);
  const [tab, setTab] = useState("menu");
  const [cart, setCart] = useState({}); // "catId::itemId::tier" -> qty
  const [myOrder, setMyOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!activeCat && catalog[0]) setActiveCat(catalog[0].id); }, [catalog, activeCat]);

  const lookup = useMemo(() => {
    const m = {};
    for (const c of catalog) for (const it of c.items) m[`${c.id}::${it.id}`] = { ...it, catId: c.id, catName: c.name, tiered: c.tiered };
    return m;
  }, [catalog]);

  const loadOrders = useCallback(async () => {
    const { data, error } = await supabase.from("orders").select("*").eq("user_id", profile.id).order("order_date", { ascending: false });
    if (error) { showToast("Couldn't load your orders.", "err"); return; }
    setHistory(data || []);
    setMyOrder((data || []).find((o) => o.order_date === date) || null);
  }, [profile.id, date, showToast]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const ck = (c, i, t) => `${c}::${i}::${t}`;
  const add = (c, i, t) => setCart((s) => ({ ...s, [ck(c, i, t)]: (s[ck(c, i, t)] || 0) + 1 }));
  const dec = (k) => setCart((s) => { const n = (s[k] || 0) - 1; const nx = { ...s }; if (n <= 0) delete nx[k]; else nx[k] = n; return nx; });
  const del = (k) => setCart((s) => { const nx = { ...s }; delete nx[k]; return nx; });

  const cartLines = useMemo(() => Object.entries(cart).map(([k, qty]) => {
    const [catId, itemId, tier] = k.split("::");
    const it = lookup[`${catId}::${itemId}`];
    if (!it) return null;
    const price = Number(it[`price_${tier}`] || 0);
    return { key: k, catId, itemId, tier, tierLabel: TIER_LABELS[tier], name: it.name, nameAr: it.name_ar, catName: it.catName, price, qty };
  }).filter(Boolean), [cart, lookup]);
  const cartTotal = useMemo(() => cartLines.reduce((s, l) => s + l.price * l.qty, 0), [cartLines]);
  const cartCount = useMemo(() => cartLines.reduce((s, l) => s + l.qty, 0), [cartLines]);

  const submit = async () => {
    if (!cartCount) return;
    setSubmitting(true);
    try {
      const merged = {};
      const stash = (l) => { const k = l.key || ck(l.catId, l.itemId, l.tier); if (!merged[k]) merged[k] = { ...l, key: k, qty: 0 }; merged[k].qty += l.qty; };
      if (myOrder) myOrder.items.forEach(stash);
      cartLines.forEach(stash);
      const items = Object.values(merged).map((l) => ({ key: l.key, itemId: l.itemId, categoryId: l.catId, categoryName: l.catName, name: l.name, nameAr: l.nameAr, tier: l.tier, tierLabel: l.tierLabel, price: l.price, qty: l.qty }));
      const total = items.reduce((s, l) => s + l.price * l.qty, 0);
      const { error } = await supabase.from("orders").upsert(
        { user_id: profile.id, order_date: date, items, total, updated_at: new Date().toISOString() },
        { onConflict: "user_id,order_date" }
      );
      if (error) throw error;
      setCart({});
      await loadOrders();
      showToast(myOrder ? "Order updated — added to today's order." : "Order placed! You're on the list for today.");
    } catch (e) { showToast(e.message || "Couldn't save your order.", "err"); }
    finally { setSubmitting(false); }
  };

  const cat = catalog.find((c) => c.id === activeCat) || catalog[0];
  const colStyle = narrow ? { ...S.columns, gridTemplateColumns: "1fr" } : S.columns;
  const cartColStyle = narrow ? { ...S.cartCol, position: "static", order: -1 } : S.cartCol;

  return (
    <div style={S.shopWrap}>
      <div style={S.dateBanner}><span style={S.dateEyebrow}>Ordering for</span><span style={S.dateBig}>{prettyDate(date)}</span></div>
      <div style={S.tabRow}>
        <button style={{ ...S.tabBtn, ...(tab === "menu" ? S.tabActive : {}) }} onClick={() => setTab("menu")}>Menu</button>
        <button style={{ ...S.tabBtn, ...(tab === "history" ? S.tabActive : {}) }} onClick={() => setTab("history")}>My history {history.length ? `(${history.length})` : ""}</button>
      </div>

      {tab === "history" ? (
        !history.length ? <div style={S.emptyState}><p style={S.cartEmpty}>No past orders yet. Once you submit an order it'll show up here.</p></div> : (
          <div style={S.historyWrap}>
            {history.map((o) => (
              <div key={o.order_date} style={S.personCard}>
                <div style={S.personHead}><span style={S.personName}>{prettyDate(o.order_date)}</span><span style={S.personTotal}>{money(o.total)}</span></div>
                {o.items.map((l) => (<div key={l.key} style={S.personLine}><span>{l.qty}× {l.name} <span style={S.tierTag}>{l.tierLabel}</span></span><span style={S.personLinePrice}>{money(l.price * l.qty)}</span></div>))}
              </div>
            ))}
          </div>
        )
      ) : (
        <div style={colStyle}>
          <section style={S.menuCol}>
            <div style={S.catTabs}>
              {catalog.map((c) => (<button key={c.id} style={{ ...S.catTab, ...(c.id === activeCat ? S.catTabActive : {}) }} onClick={() => setActiveCat(c.id)}>{c.name}</button>))}
            </div>
            <div style={S.menuGrid}>
              {cat?.items.map((it) => (
                <div key={it.id} style={S.menuCard}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.menuTop}><span style={S.menuName}>{it.name}</span><span style={S.menuAr} dir="rtl">{it.name_ar}</span></div>
                    <div style={S.tierRow}>
                      {tiersOf(it, cat.tiered).map(({ tier, price }) => {
                        const k = ck(cat.id, it.id, tier); const qty = cart[k] || 0;
                        return (
                          <div key={tier} style={{ ...S.tierChip, ...(qty > 0 ? S.tierChipActive : {}) }}>
                            <span style={S.tierName}>{TIER_LABELS[tier]}</span>
                            <span style={S.tierPrice}>{money(price)}</span>
                            {qty === 0
                              ? <button style={S.tierAdd} onClick={() => add(cat.id, it.id, tier)}><Plus size={13} /></button>
                              : <div style={S.tierStepper}><button style={S.stepBtnXs} onClick={() => dec(k)}><Minus size={12} /></button><span style={S.stepQtyXs}>{qty}</span><button style={S.stepBtnXs} onClick={() => add(cat.id, it.id, tier)}><Plus size={12} /></button></div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {myOrder && (
              <div style={S.myOrderBox}>
                <div style={S.myOrderHead}><Check size={15} /> Your order today</div>
                {myOrder.items.map((l) => (<div key={l.key} style={S.myOrderLine}><span>{l.qty}× {l.name} <span style={S.tierTag}>{l.tierLabel}</span></span><span>{money(l.price * l.qty)}</span></div>))}
                <div style={S.myOrderTotal}><span>Total</span><span>{money(myOrder.total)}</span></div>
                <p style={S.finePrint}>Add more above and submit again — it'll be added to this order.</p>
              </div>
            )}
          </section>

          <aside style={cartColStyle}>
            <div style={S.cartCard}>
              <div style={S.cartHead}><ShoppingCart size={18} /><span>Your cart</span>{cartCount > 0 && <span style={S.cartBadge}>{cartCount}</span>}</div>
              {!cartLines.length ? <p style={S.cartEmpty}>Nothing here yet. Pick a category and add something warm.</p> : (
                <>
                  <div style={S.cartLines}>
                    {cartLines.map((l) => (
                      <div key={l.key} style={S.cartLine}>
                        <div style={{ flex: 1, minWidth: 0 }}><div style={S.cartLineName}>{l.name} <span style={S.tierTag}>{l.tierLabel}</span></div><div style={S.cartLineMeta}>{money(l.price)} each</div></div>
                        <div style={S.stepperSm}><button style={S.stepBtn} onClick={() => dec(l.key)}><Minus size={13} /></button><span style={S.stepQty}>{l.qty}</span><button style={S.stepBtn} onClick={() => add(l.catId, l.itemId, l.tier)}><Plus size={13} /></button></div>
                        <button style={S.trashBtn} onClick={() => del(l.key)} title="Remove"><Trash2 size={15} /></button>
                      </div>
                    ))}
                  </div>
                  <div style={S.cartTotalRow}><span>Total</span><span style={S.cartTotalNum}>{money(cartTotal)}</span></div>
                  <button style={{ ...S.primaryBtn, width: "100%", opacity: submitting ? 0.7 : 1 }} onClick={submit} disabled={submitting}>
                    {submitting ? <><RefreshCw size={16} className="spin" /> Saving…</> : <><Check size={16} /> Submit order</>}
                  </button>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

/* ─────────────── Admin ─────────────── */
function AdminView({ narrow, showToast }) {
  const today = todayStr();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]); // joined orders + profile
  const [selectedDate, setSelectedDate] = useState(today);
  const [mode, setMode] = useState("full");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id,user_id,order_date,items,total,paid,profiles(name,phone)")
        .order("order_date", { ascending: false });
      if (error) throw error;
      setRows(data || []);
      const dates = [...new Set((data || []).map((r) => r.order_date))].sort().reverse();
      if (dates.length && !dates.includes(selectedDate)) setSelectedDate(dates[0]);
    } catch (e) { setError(e.message || "Couldn't load orders."); }
    finally { setLoading(false); }
  }, [selectedDate]);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const dates = useMemo(() => [...new Set(rows.map((r) => r.order_date))].sort().reverse(), [rows]);
  const dayOrders = useMemo(
    () => rows.filter((r) => r.order_date === selectedDate)
      .map((r) => ({ ...r, name: r.profiles?.name || "Unknown", phone: r.profiles?.phone || "" }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [rows, selectedDate]
  );
  const dayTotal = useMemo(() => dayOrders.reduce((s, o) => s + Number(o.total), 0), [dayOrders]);

  const byCategory = useMemo(() => {
    const cats = {};
    for (const o of dayOrders) for (const l of o.items) {
      const c = (cats[l.categoryName] = cats[l.categoryName] || { name: l.categoryName, lines: {}, subtotal: 0 });
      const lk = `${l.itemId}::${l.tier}`;
      if (!c.lines[lk]) c.lines[lk] = { name: l.name, tierLabel: l.tierLabel, price: l.price, qty: 0 };
      c.lines[lk].qty += l.qty; c.subtotal += l.price * l.qty;
    }
    return Object.values(cats).map((c) => ({ ...c, lines: Object.values(c.lines).sort((a, b) => b.qty - a.qty) }));
  }, [dayOrders]);

  const togglePaid = async (orderId, next) => {
    // optimistic
    setRows((rs) => rs.map((r) => (r.id === orderId ? { ...r, paid: next } : r)));
    const { error } = await supabase.from("orders").update({ paid: next }).eq("id", orderId);
    if (error) { showToast("Couldn't update paid status.", "err"); setRows((rs) => rs.map((r) => (r.id === orderId ? { ...r, paid: !next } : r))); }
  };

  const buildText = () => {
    let out = `El Shabrawy — office order\n${prettyDate(selectedDate)}\n${"=".repeat(36)}\n\nFULL ORDER FOR THE STORE (by category)\n${"-".repeat(36)}\n`;
    byCategory.forEach((c) => { out += `\n${c.name}\n`; c.lines.forEach((l) => (out += `  ${l.qty}× ${l.name} [${l.tierLabel}]  ${money(l.price * l.qty)}\n`)); });
    out += `\n${"=".repeat(36)}\nPER PERSON (who pays what)\n${"-".repeat(36)}\n`;
    dayOrders.forEach((o) => { out += `\n${o.name} — ${o.phone}${o.paid ? "  (PAID)" : ""}\n`; o.items.forEach((l) => (out += `  ${l.qty}× ${l.name} [${l.tierLabel}]  ${money(l.price * l.qty)}\n`)); out += `  PAYS: ${money(o.total)}\n`; });
    out += `\n${"=".repeat(36)}\nPeople: ${dayOrders.length}\nDAY TOTAL: ${money(dayTotal)}\n`;
    return out;
  };
  const copyList = async () => { try { await navigator.clipboard.writeText(buildText()); showToast("Compiled order copied."); } catch { showToast("Copy failed — use Export.", "err"); } };
  const exportList = () => { try { const b = new Blob([buildText()], { type: "text/plain" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `elshabrawy-${selectedDate}.txt`; a.click(); URL.revokeObjectURL(u); showToast("Exported .txt."); } catch { showToast("Export failed — use Copy.", "err"); } };

  if (loading) return (<div style={S.adminPad}><div style={S.loadPulse}><Layers size={34} strokeWidth={1.5} /></div><p style={S.loadText}>Compiling everyone's orders…</p></div>);
  if (error) return (<div style={S.adminPad}><p style={S.loadText}>{error}</p><button style={S.primaryBtn} onClick={load}><RefreshCw size={16} /> Try again</button></div>);

  return (
    <div style={S.adminWrap}>
      <div style={S.adminTopRow}><div><span style={S.dateEyebrow}>Admin hub</span><h2 style={S.adminH}>Compiled orders</h2></div><button style={S.ghostBtn} onClick={load}><RefreshCw size={15} /> Refresh</button></div>

      {!dates.length ? (
        <div style={S.emptyState}><p style={S.cartEmpty}>No orders yet. Once people submit, they'll appear here grouped by date.</p></div>
      ) : (
        <>
          <div style={S.dateTabs}>
            {dates.map((d) => (<button key={d} style={{ ...S.dateTab, ...(d === selectedDate ? S.dateTabActive : {}) }} onClick={() => setSelectedDate(d)}>{d === today ? "Today" : prettyDate(d).replace(/,.*/, "")}<span style={S.dateTabDate}>{d}</span></button>))}
          </div>
          <div style={S.adminActions}>
            <button style={S.primaryBtn} onClick={copyList}><ClipboardCopy size={16} /> Copy full order</button>
            <button style={S.ghostBtn} onClick={exportList}>Export .txt</button>
            <span style={S.adminStat}>{dayOrders.length} {dayOrders.length === 1 ? "person" : "people"} · {money(dayTotal)}</span>
          </div>
          <div style={S.modeRow}>
            <button style={{ ...S.modeBtn, ...(mode === "full" ? S.modeActive : {}) }} onClick={() => setMode("full")}><Layers size={15} /> Full order by category</button>
            <button style={{ ...S.modeBtn, ...(mode === "person" ? S.modeActive : {}) }} onClick={() => setMode("person")}><Users size={15} /> Per person &amp; payment</button>
          </div>

          {mode === "full" ? (
            <div style={S.fullWrap}>
              {byCategory.map((c) => (
                <div key={c.name} style={S.catBlock}>
                  <div style={S.catBlockHead}><span>{c.name}</span><span style={S.catBlockSub}>{money(c.subtotal)}</span></div>
                  {c.lines.map((l, i) => (<div key={i} style={S.tallyLineLight}><span style={S.tallyQtyDark}>{l.qty}×</span><span style={{ flex: 1 }}>{l.name} <span style={S.tierTag}>{l.tierLabel}</span></span><span style={S.personLinePrice}>{money(l.price * l.qty)}</span></div>))}
                </div>
              ))}
              <div style={S.grandTotal}><span>Day total for the store</span><span>{money(dayTotal)}</span></div>
            </div>
          ) : (
            <div style={narrow ? { ...S.personGrid, gridTemplateColumns: "1fr" } : S.personGrid}>
              {dayOrders.map((o) => (
                <div key={o.id} style={{ ...S.payCard, ...(o.paid ? S.payCardPaid : {}) }}>
                  <div style={S.payHead}>
                    <div><div style={S.personName}>{o.name}</div><div style={S.payPhone}><Phone size={11} /> {o.phone}</div></div>
                    <div style={S.payAmount}>{money(o.total)}</div>
                  </div>
                  {o.items.map((l) => (<div key={l.key} style={S.personLine}><span>{l.qty}× {l.name} <span style={S.tierTag}>{l.tierLabel}</span></span><span style={S.personLinePrice}>{money(l.price * l.qty)}</span></div>))}
                  <div style={S.payFoot}>
                    <span style={{ fontWeight: 700, color: "#8a7f70" }}>Pays {money(o.total)}</span>
                    <button style={{ ...S.paidToggle, ...(o.paid ? S.paidToggleOn : {}) }} onClick={() => togglePaid(o.id, !o.paid)}>
                      <Check size={13} /> {o.paid ? "Paid" : "Mark paid"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
