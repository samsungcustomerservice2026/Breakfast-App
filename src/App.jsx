import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ShoppingCart, Plus, Minus, Trash2, Check, ClipboardCopy, RefreshCw, Layers, Users, Phone, RotateCcw, ChevronDown } from "lucide-react";
import { supabase, configError } from "./supabase.js";
import { S, globalCss } from "./styles.js";
import { itemImage, onImgError } from "./itemImages.js";
import { afeya } from "./afeyat.js";
import { pickSituationMeme } from "./memes.js";
import { expandOrders, withNewBatch, setBatchPaid, parseOrderId } from "./orders.js";
import { loadPayQr, savePayQr, loadPayLink, savePayLink, fileToDataUrl, normalizePayLink, settingsSaveHint, PAY_QR_FALLBACK } from "./settings.js";

const TIER_LABELS = { shami: "شامي", balady: "بلدي", sm: "صغير", md: "وسط", lg: "كبير" };
const DELIVERY_FEE = 5;
const Logo = ({ size = "sm" }) => {
  const st = size === "xl" ? S.logoImgXl : size === "lg" ? S.logoImgLg : S.logoImgSm;
  return <img src="/logo.png" alt="هيئة مكافحة الجوع" style={st} />;
};
const money = (n) => `${Number(n || 0).toFixed(0)} جنيه`;
const foodOf = (items) => (items || []).reduce((s, l) => s + Number(l.price || 0) * Number(l.qty || 0), 0);
const Bill = ({ food }) => (
  <div dir="rtl">
    <div style={S.billRow}><span>الأكل</span><span>{money(food)}</span></div>
    <div style={S.billRow}><span>توصيل</span><span>{money(DELIVERY_FEE)}</span></div>
    <div style={S.billGrand}><span>الحساب</span><span>{money(Number(food || 0) + DELIVERY_FEE)}</span></div>
  </div>
);
const orderStamp = (o) => o.created_at || o.updated_at || o.id;
const sameDayOrders = (list, d) => (list || []).filter((o) => o.order_date === d).slice().sort((a, b) => String(orderStamp(a)).localeCompare(String(orderStamp(b))));
const orderNo = (list, o) => sameDayOrders(list, o.order_date).findIndex((x) => x.id === o.id) + 1;
const orderTitle = (list, o, today) => {
  const n = orderNo(list, o);
  const count = sameDayOrders(list, o.order_date).length;
  const day = o.order_date === today ? "النهارده" : prettyDate(o.order_date);
  return count > 1 ? `${day} · أوردر ${n}` : day;
};
function OrderBlock({ order, title, onReorder, onPay, tone }) {
  return (
    <div style={tone === "today" ? S.myOrderBox : S.personCard} dir="rtl">
      <div style={tone === "today" ? S.myOrderHead : S.personHead}>
        {tone === "today" ? <><Check size={15} /> {title}</> : <span style={{ ...S.personName, fontFamily: "'Cairo',sans-serif" }}>{title}</span>}
        {tone !== "today" && <span style={S.personTotal}>{money(foodOf(order.items) + DELIVERY_FEE)}</span>}
      </div>
      {order.items.map((l) => (
        <div key={l.key} style={tone === "today" ? S.myOrderLine : S.personLine}>
          <span>{l.qty}× {l.nameAr || l.name} <span style={S.tierTag}>{l.tierLabel}</span></span>
          <span style={S.personLinePrice}>{money(l.price * l.qty)}</span>
        </div>
      ))}
      <Bill food={foodOf(order.items)} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        {onReorder && <button style={{ ...S.primaryBtn, width: "100%" }} onClick={() => onReorder(order)}><RotateCcw size={15} /> اطلبه تاني</button>}
        {onPay && <button style={{ ...S.ghostBtn, width: "100%", justifyContent: "center" }} onClick={onPay}>ادفع بإنستاباي</button>}
      </div>
    </div>
  );
}
const todayStr = () => new Date().toISOString().slice(0, 10);
const prettyDate = (d) => {
  try { return new Date(d + "T00:00:00").toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" }); }
  catch { return d; }
};
const weekdayAr = (d) => {
  try { return new Date(d + "T00:00:00").toLocaleDateString("ar-EG", { weekday: "long" }); }
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
  const [loginBravo, setLoginBravo] = useState(false);
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
        setErrMsg(e.message || "حصلت حاجة وحشة وأحنا بنفتح حسابك.");
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

  const signOut = async () => { sessionStorage.removeItem("hayat_bravo"); await supabase.auth.signOut(); setView("shop"); };

  useEffect(() => {
    if (phase === "ready" || phase === "needsProfile") {
      if (sessionStorage.getItem("hayat_bravo") === "1") {
        sessionStorage.removeItem("hayat_bravo");
        setLoginBravo(true);
      }
    }
  }, [phase]);

  const bravoPop = loginBravo ? (
    <MemePop src="/memes/auth-bravo.jpg" caption="برافو عليك" onClose={() => setLoginBravo(false)} />
  ) : null;

  if (phase === "error") return (<Center><p style={{ ...S.loadText, maxWidth: 360 }}>{errMsg}</p></Center>);
  if (phase === "loading") return (<Center><img src="/logo.png" alt="" style={{ ...S.logoImgLg, animation: "floaty 2.2s ease-in-out infinite" }} /><p style={S.loadText} dir="rtl">ثواني يا معلم… الهيئة بتسخّن</p></Center>);
  if (phase === "auth") return (<AuthScreen />);
  if (phase === "needsProfile") return (<><ProfileScreen session={session} onDone={(p) => { setProfile(p); loadMenu().then(() => setPhase("ready")); }} />{bravoPop}</>);

  return (
    <div style={S.app}>
      <header style={S.header}>
        <div style={S.brandRowSm}><Logo /><span style={S.headerTitle} dir="rtl">هيئة مكافحة الجوع</span></div>
        <div style={S.headerRight}>
          <span style={S.hello} dir="rtl">يا {profile.name.split(" ")[0]}</span>
          {profile.is_admin && (view === "shop"
            ? <button style={S.ghostBtn} onClick={() => setView("admin")}>المأمور</button>
            : <button style={S.ghostBtn} onClick={() => setView("shop")}>المنيو</button>)}
          <button style={S.ghostBtn} onClick={signOut} title="سيّب المكان">خروج</button>
        </div>
      </header>

      {view === "shop"
        ? <ShopView {...{ narrow, catalog, profile, showToast }} />
        : <AdminView {...{ narrow, showToast }} />}

      {toast && (<div style={{ ...S.toast, background: toast.tone === "err" ? "#b23a2f" : "#2f6b4f" }}>{toast.tone === "err" ? "!" : <Check size={16} />} {toast.msg}</div>)}
      {bravoPop}
      <style>{globalCss}</style>
    </div>
  );
}

function Center({ children }) { return (<div style={S.screenCenter}>{children}<style>{globalCss}</style></div>); }

function MemePop({ src, caption, onClose, actionLabel = "تمام", onAction }) {
  const go = onAction || onClose;
  return (
    <div style={S.bravoScrim} onClick={onClose} role="presentation">
      <div style={S.authMemeCard} className="bravo-pop" onClick={(e) => e.stopPropagation()} dir="rtl">
        <img src={src} alt="" style={S.bravoImg} />
        {caption && <p style={S.authMemeCap}>{caption}</p>}
        <button style={{ ...S.primaryBtn, width: "100%" }} onClick={go}>{actionLabel}</button>
      </div>
    </div>
  );
}

/* ─────────────── Auth ─────────────── */
function AuthScreen() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [noAccount, setNoAccount] = useState(false);

  const submit = async () => {
    setErr(""); setOk(""); setNoAccount(false);
    if (!email.trim() || pw.length < 6) return setErr("إيميل وباسورد من 6 حروف… مش أصعب من كده.");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password: pw });
        if (error) throw error;
        setOk("الحساب اتفتح. لو التأكيد شغال، بصّ في الإيميل وبعدين ادخل.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
        if (error) {
          const blob = `${error.message || ""} ${error.code || ""}`.toLowerCase();
          if (blob.includes("invalid") || blob.includes("credential") || error.status === 400) {
            setNoAccount(true);
            return;
          }
          throw error;
        }
        sessionStorage.setItem("hayat_bravo", "1");
      }
    } catch (e) { setErr(e.message || "ما نفعش يا معلم. جرّب تاني."); }
    finally { setBusy(false); }
  };

  return (
    <Center>
      <div style={S.signCard}>
        <div style={S.brandRow}>
          <Logo size="xl" />
          <div>
            <h1 style={S.brandTitle} dir="rtl">هيئة مكافحة الجوع</h1>
            <p style={S.brandSub} dir="rtl">الجوع كافر — الحق اطلب الفطار قبل الساعة 10</p>
          </div>
        </div>
        <label style={S.label}>الإيميل</label>
        <input style={S.input} type="email" value={email} placeholder="الإيميل بتاع الشغل" onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} autoFocus />
        <label style={{ ...S.label, marginTop: 14 }}>الباسورد</label>
        <input style={S.input} type="password" value={pw} placeholder="••••••••" onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        {err && <p style={S.errText}>{err}</p>}
        {ok && <p style={S.okText}>{ok}</p>}
        <button style={{ ...S.primaryBtn, width: "100%", marginTop: 16, opacity: busy ? 0.7 : 1 }} onClick={submit} disabled={busy}>
          {busy ? <><RefreshCw size={16} className="spin" /> ثواني ثواني…</> : mode === "signup" ? "افتح ملف" : "ادخل يا معلم"}
        </button>
        {mode === "signup" ? (
          <button style={S.linkBtn} onClick={() => { setMode("signin"); setErr(""); setOk(""); }}>عندك حساب؟ ادخل</button>
        ) : (
          <p style={S.signupHint} dir="rtl">
            جديد هنا؟{" "}
            <button style={S.signupLink} onClick={() => { setMode("signup"); setErr(""); setOk(""); }}>اعمل حساب</button>
          </p>
        )}
      </div>
      {noAccount && (
        <MemePop
          src="/memes/auth-no-account.jpg"
          caption="باعم مش لما تعمل اكونت الأول"
          actionLabel="يلا نعمل حساب"
          onClose={() => setNoAccount(false)}
          onAction={() => { setNoAccount(false); setMode("signup"); setErr(""); }}
        />
      )}
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
    if (!name.trim()) return setErr("الاسم يا باشا… من غير اسم مفيش سندوتش.");
    if (phone.replace(/\D/g, "").length < 7) return setErr("رقم الموبايل ناقص أو غلط.");
    setBusy(true);
    try {
      const row = { id: session.user.id, name: name.trim(), phone: phone.trim() };
      const { data, error } = await supabase.from("profiles").upsert(row).select().single();
      if (error) throw error;
      onDone(data);
    } catch (e) { setErr(e.message || "ما حفظناش. جرّب تاني."); }
    finally { setBusy(false); }
  };

  return (
    <Center>
      <div style={S.signCard}>
        <div style={S.brandRow}>
          <Logo size="xl" />
          <div><h1 style={S.brandTitle} dir="rtl">ثواني يا باشا</h1><p style={S.brandSub} dir="rtl">اسمك على الأوردر… على مسئوليتي</p></div>
        </div>
        <label style={S.label}>اسمك</label>
        <input style={S.input} value={name} placeholder="مثلاً أحمد فوزي" onChange={(e) => setName(e.target.value)} autoFocus />
        <label style={{ ...S.label, marginTop: 14 }}>الموبايل</label>
        <input style={S.input} value={phone} placeholder="مثلاً 0100 123 4567" inputMode="tel" onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} />
        {err && <p style={S.errText}>{err}</p>}
        <button style={{ ...S.primaryBtn, width: "100%", marginTop: 16, opacity: busy ? 0.7 : 1 }} onClick={save} disabled={busy}>
          {busy ? <><RefreshCw size={16} className="spin" /> ثواني ثواني…</> : "كده رضا"}
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
  const [history, setHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [bravo, setBravo] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payQr, setPayQr] = useState(PAY_QR_FALLBACK);
  const [payLink, setPayLink] = useState("");
  const bravoTimer = useRef(null);

  useEffect(() => { if (!activeCat && catalog[0]) setActiveCat(catalog[0].id); }, [catalog, activeCat]);

  const lookup = useMemo(() => {
    const m = {};
    for (const c of catalog) for (const it of c.items) m[`${c.id}::${it.id}`] = { ...it, catId: c.id, catName: c.name_ar || c.name, tiered: c.tiered };
    return m;
  }, [catalog]);

  const loadOrders = useCallback(async () => {
    const { data, error } = await supabase.from("orders").select("*").eq("user_id", profile.id).order("order_date", { ascending: false }).order("updated_at", { ascending: false });
    if (error) { showToast("الأوردرات مش راضية تفتح.", "err"); return; }
    setHistory(expandOrders(data || []));
  }, [profile.id, showToast]);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => {
    loadPayQr().then(setPayQr);
    loadPayLink().then(setPayLink);
  }, []);

  const cheer = useCallback((ctx) => {
    setBravo((prev) => ({ ...pickSituationMeme({ ...ctx, exceptSrc: prev?.src }), id: Date.now() }));
    if (bravoTimer.current) clearTimeout(bravoTimer.current);
    bravoTimer.current = setTimeout(() => setBravo(null), 2000);
  }, []);
  useEffect(() => () => { if (bravoTimer.current) clearTimeout(bravoTimer.current); }, []);

  const ck = (c, i, t) => `${c}::${i}::${t}`;
  const add = (c, i, t) => {
    const k = ck(c, i, t);
    const qty = (cart[k] || 0) + 1;
    const count = Object.values(cart).reduce((s, n) => s + n, 0) + 1;
    cheer({ itemId: i, catId: c, qty, count });
    setCart((s) => ({ ...s, [k]: (s[k] || 0) + 1 }));
  };
  const dec = (k) => setCart((s) => { const n = (s[k] || 0) - 1; const nx = { ...s }; if (n <= 0) delete nx[k]; else nx[k] = n; return nx; });
  const del = (k) => setCart((s) => { const nx = { ...s }; delete nx[k]; return nx; });

  const cartLines = useMemo(() => Object.entries(cart).map(([k, qty]) => {
    const [catId, itemId, tier] = k.split("::");
    const it = lookup[`${catId}::${itemId}`];
    if (!it) return null;
    const price = Number(it[`price_${tier}`] || 0);
    return { key: k, catId, itemId, tier, tierLabel: TIER_LABELS[tier], name: it.name, nameAr: it.name_ar, catName: it.catName, price, qty };
  }).filter(Boolean), [cart, lookup]);

  const todayOrders = useMemo(() => sameDayOrders(history, date).slice().reverse(), [history, date]);
  const historyGroups = useMemo(() => {
    const groups = [];
    for (const o of history) {
      const last = groups[groups.length - 1];
      if (last && last.date === o.order_date) last.orders.push(o);
      else groups.push({ date: o.order_date, orders: [o] });
    }
    return groups;
  }, [history]);

  const reorder = (order) => {
    const next = {};
    let skipped = 0;
    for (const l of order.items || []) {
      const catId = l.categoryId || l.catId;
      const itemId = l.itemId;
      const tier = l.tier;
      if (!catId || !itemId || !tier) { skipped += 1; continue; }
      const it = lookup[`${catId}::${itemId}`];
      if (!it || it[`price_${tier}`] == null) { skipped += l.qty || 1; continue; }
      const k = ck(catId, itemId, tier);
      next[k] = (next[k] || 0) + Number(l.qty || 0);
    }
    const added = Object.values(next).reduce((s, n) => s + n, 0);
    if (!added) {
      showToast("الأصناف دي مش في المنيو دلوقتي.", "err");
      return;
    }
    setCart(next);
    setTab("menu");
    showToast(skipped
      ? "اتنسخ في العربية… شوية أصناف اختفت من المنيو."
      : "اتنسخ في العربية. راجع وعدّل وبعدين على مسئوليتي — هيتسجل أوردر جديد.");
  };
  const cartTotal = useMemo(() => cartLines.reduce((s, l) => s + l.price * l.qty, 0), [cartLines]);
  const cartCount = useMemo(() => cartLines.reduce((s, l) => s + l.qty, 0), [cartLines]);

  const submit = async () => {
    if (!cartCount) return;
    setSubmitting(true);
    try {
      const items = cartLines.map((l) => ({ key: l.key, itemId: l.itemId, categoryId: l.catId, categoryName: l.catName, name: l.name, nameAr: l.nameAr, tier: l.tier, tierLabel: l.tierLabel, price: l.price, qty: l.qty }));
      const total = foodOf(items) + DELIVERY_FEE;
      const payload = { user_id: profile.id, order_date: date, items, total, updated_at: new Date().toISOString() };
      const { error } = await supabase.from("orders").insert(payload);
      if (error) {
        const dup = error.code === "23505" || /duplicate|unique/i.test(error.message || "");
        if (!dup) throw error;
        const { data: existing, error: findErr } = await supabase.from("orders").select("*").eq("user_id", profile.id).eq("order_date", date).maybeSingle();
        if (findErr || !existing) throw error;
        const patch = withNewBatch(existing, items, total);
        const { error: upErr } = await supabase.from("orders").update(patch).eq("id", existing.id);
        if (upErr) throw upErr;
      }
      setCart({});
      await loadOrders();
      setPayOpen(true);
      showToast("أوردر جديد اتقفل. امسح الكيو آر وادفع.");
    } catch (e) { showToast(e.message || "الأوردر ما اتحفظش. جرّب تاني.", "err"); }
    finally { setSubmitting(false); }
  };

  const cat = catalog.find((c) => c.id === activeCat) || catalog[0];
  const colStyle = narrow ? { ...S.columns, gridTemplateColumns: "1fr" } : S.columns;
  const cartColStyle = narrow ? { ...S.cartCol, position: "static", order: -1 } : S.cartCol;

  return (
    <div style={S.shopWrap}>
      <div style={S.dateBanner}><span style={S.dateEyebrow} dir="rtl">مهمة النهارده</span><span style={{ ...S.dateBig, fontFamily: "'Cairo','Fraunces',serif" }} dir="rtl">{prettyDate(date)}</span></div>
      <div style={S.tabRow}>
        <button style={{ ...S.tabBtn, ...(tab === "menu" ? S.tabActive : {}) }} onClick={() => setTab("menu")}>المنيو</button>
        <button style={{ ...S.tabBtn, ...(tab === "history" ? S.tabActive : {}) }} onClick={() => setTab("history")}>أرشيفي {history.length ? `(${history.length})` : ""}</button>
      </div>

      {tab === "history" ? (
        !history.length ? <div style={S.emptyState}><p style={S.cartEmpty} dir="rtl">مفيش أرشيف يا معلم… لسه ما طلبتش</p></div> : (
          <div style={S.historyWrap}>
            {historyGroups.map((g) => (
              <div key={g.date} style={{ display: "grid", gap: 12 }}>
                <div style={S.dateEyebrow} dir="rtl">{g.date === date ? "أوردرات النهارده" : prettyDate(g.date)}</div>
                {g.orders.map((o) => (
                  <OrderBlock
                    key={o.id}
                    order={o}
                    title={g.orders.length > 1 ? `أوردر ${orderNo(history, o)}` : "الأوردر"}
                    onReorder={reorder}
                    onPay={g.date === date ? () => setPayOpen(true) : undefined}
                  />
                ))}
              </div>
            ))}
          </div>
        )
      ) : (
        <div style={colStyle}>
          <section style={S.menuCol}>
            <div style={S.catTabs}>
              {catalog.map((c) => (<button key={c.id} style={{ ...S.catTab, ...(c.id === activeCat ? S.catTabActive : {}) }} onClick={() => setActiveCat(c.id)}>{c.name_ar || c.name}</button>))}
            </div>
            <div style={S.menuGrid}>
              {cat?.items.map((it) => {
                const a = afeya(it.id);
                return (
                <div key={it.id} style={S.menuCard}>
                  <div style={S.memeFrame}>
                    <img src={itemImage(it.id)} alt="" style={S.menuImg} onError={onImgError} />
                    <div style={S.memeBar} dir="rtl">{a.text}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.menuTop}><span style={{ ...S.menuName, fontFamily: "'Cairo',sans-serif" }} dir="rtl">{it.name_ar || it.name}</span><span style={S.menuAr}>{it.name_ar ? it.name : ""}</span></div>
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
                );
              })}
            </div>

            {todayOrders.length > 0 && (
              <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                {todayOrders.map((o) => (
                  <OrderBlock
                    key={o.id}
                    order={o}
                    title={todayOrders.length > 1 ? `أوردر ${orderNo(history, o)} اتقفل` : "أوردر اتقفل"}
                    onReorder={reorder}
                    onPay={() => setPayOpen(true)}
                    tone="today"
                  />
                ))}
                <p style={S.finePrint} dir="rtl">عرّب تاني واضغط على مسئوليتي — هيتسجل أوردر جديد لوحده، مش هيتضاف على اللي فات.</p>
              </div>
            )}
          </section>

          <aside style={cartColStyle}>
            <div style={S.cartCard}>
              <div style={S.cartHead}><ShoppingCart size={18} /><span dir="rtl">العربية</span>{cartCount > 0 && <span style={S.cartBadge}>{cartCount}</span>}</div>
              {!cartLines.length ? <p style={S.cartEmpty} dir="rtl">العربية فاضية يا باشا… الجوع كافر</p> : (
                <>
                  <div style={S.cartLines}>
                    {cartLines.map((l) => (
                      <div key={l.key} style={S.cartLine}>
                        <img src={itemImage(l.itemId)} alt="" style={S.cartThumb} onError={onImgError} />
                        <div style={{ flex: 1, minWidth: 0 }}><div style={S.cartLineName}>{l.nameAr || l.name} <span style={S.tierTag}>{l.tierLabel}</span></div><div style={S.cartLineMeta}>{money(l.price)} الواحدة</div></div>
                        <div style={S.stepperSm}><button style={S.stepBtn} onClick={() => dec(l.key)}><Minus size={13} /></button><span style={S.stepQty}>{l.qty}</span><button style={S.stepBtn} onClick={() => add(l.catId, l.itemId, l.tier)}><Plus size={13} /></button></div>
                        <button style={S.trashBtn} onClick={() => del(l.key)} title="شيل"><Trash2 size={15} /></button>
                      </div>
                    ))}
                  </div>
                  <Bill food={cartTotal} />
                  <button style={{ ...S.primaryBtn, width: "100%", opacity: submitting ? 0.7 : 1 }} onClick={submit} disabled={submitting}>
                    {submitting ? <><RefreshCw size={16} className="spin" /> ثواني ثواني…</> : <><Check size={16} /> على مسئوليتي</>}
                  </button>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
      {bravo && (
        <div style={S.bravoScrim} onClick={() => setBravo(null)} role="presentation">
          <div style={S.bravoCard} className={bravo.shake ? "haram-pop" : "bravo-pop"}>
            <img src={bravo.src} alt="" style={S.bravoImg} />
          </div>
        </div>
      )}
      {payOpen && (
        <div style={S.bravoScrim} onClick={() => setPayOpen(false)} role="presentation">
          <div style={S.payCardModal} className="bravo-pop" onClick={(e) => e.stopPropagation()} dir="rtl">
            <Logo size="lg" />
            <h2 style={{ ...S.brandTitle, marginTop: 12, fontSize: 22 }}>ادفع وإنت مطمن</h2>
            <p style={S.brandSub}>العربية اتقفلت… امسح كيو آر إنستاباي من الموبايل وسيب الباقي على الله</p>
            <img src={payQr} alt="" style={S.payQrImg} />
            {payLink && (
              <>
                <a href={payLink} target="_blank" rel="noopener noreferrer" style={{ ...S.primaryBtn, width: "100%", marginTop: 4, textDecoration: "none" }}>افتح لينك إنستاباي</a>
                <button
                  type="button"
                  style={{ ...S.ghostBtn, width: "100%", marginTop: 8, justifyContent: "center" }}
                  onClick={async () => {
                    try { await navigator.clipboard.writeText(payLink); showToast("اللينك اتنسخ."); }
                    catch { showToast("النسخ فشل — انسخه بإيدك.", "err"); }
                  }}
                >
                  <ClipboardCopy size={15} /> انسخ اللينك
                </button>
                <p style={{ ...S.finePrint, direction: "ltr", wordBreak: "break-all", textAlign: "center" }}>{payLink}</p>
              </>
            )}
            <button style={{ ...S.primaryBtn, width: "100%", marginTop: 8 }} onClick={() => setPayOpen(false)}>تمام التمام</button>
          </div>
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
  const [rows, setRows] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [mode, setMode] = useState("person");
  const [payQr, setPayQr] = useState(PAY_QR_FALLBACK);
  const [payLinkDraft, setPayLinkDraft] = useState("");
  const [qrBusy, setQrBusy] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  const [payEdit, setPayEdit] = useState(false);
  const qrInput = useRef(null);

  useEffect(() => {
    loadPayQr().then(setPayQr);
    loadPayLink().then(setPayLinkDraft);
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id,user_id,order_date,items,total,paid,updated_at,profiles(name,phone)")
        .order("order_date", { ascending: false })
        .order("updated_at", { ascending: true });
      if (error) throw error;
      setRows(expandOrders(data || []));
      const dates = [...new Set((data || []).map((r) => r.order_date))].sort().reverse();
      if (dates.length && !dates.includes(selectedDate)) setSelectedDate(dates[0]);
    } catch (e) { setError(e.message || "الأوردرات وقفت في الزحمة."); }
    finally { setLoading(false); }
  }, [selectedDate]);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const dates = useMemo(() => [...new Set(rows.map((r) => r.order_date))].sort().reverse(), [rows]);
  const dayOrders = useMemo(
    () => rows.filter((r) => r.order_date === selectedDate)
      .map((r) => ({ ...r, name: r.profiles?.name || "مش معروف", phone: r.profiles?.phone || "" }))
      .sort((a, b) => a.name.localeCompare(b.name, "ar") || String(orderStamp(a)).localeCompare(String(orderStamp(b)))),
    [rows, selectedDate]
  );
  const dayFood = useMemo(() => dayOrders.reduce((s, o) => s + foodOf(o.items), 0), [dayOrders]);
  const unpaid = useMemo(() => dayOrders.filter((o) => !o.paid).length, [dayOrders]);
  const dayDue = dayFood + DELIVERY_FEE * dayOrders.length;

  const byCategory = useMemo(() => {
    const cats = {};
    for (const o of dayOrders) for (const l of o.items) {
      const c = (cats[l.categoryName] = cats[l.categoryName] || { name: l.categoryName, lines: {}, subtotal: 0 });
      const lk = `${l.itemId}::${l.tier}`;
      if (!c.lines[lk]) c.lines[lk] = { name: l.nameAr || l.name, tierLabel: l.tierLabel, price: l.price, qty: 0 };
      c.lines[lk].qty += l.qty; c.subtotal += l.price * l.qty;
    }
    return Object.values(cats).map((c) => ({ ...c, lines: Object.values(c.lines).sort((a, b) => b.qty - a.qty) }));
  }, [dayOrders]);

  const togglePaid = async (orderId, next) => {
    setRows((rs) => rs.map((r) => (r.id === orderId ? { ...r, paid: next } : r)));
    const { parentId, batchId } = parseOrderId(orderId);
    let error;
    if (!batchId) {
      ({ error } = await supabase.from("orders").update({ paid: next }).eq("id", parentId));
    } else {
      const { data, error: readErr } = await supabase.from("orders").select("items").eq("id", parentId).single();
      if (readErr) error = readErr;
      else {
        const patch = setBatchPaid(data.items, batchId, next);
        ({ error } = await supabase.from("orders").update(patch).eq("id", parentId));
      }
    }
    if (error) { showToast("الفلوس ما اتعلّمتش.", "err"); setRows((rs) => rs.map((r) => (r.id === orderId ? { ...r, paid: !next } : r))); }
  };

  const buildText = () => {
    let out = `هيئة مكافحة الجوع — أوردر المكتب\n${prettyDate(selectedDate)}\n${"=".repeat(36)}\n\nالأوردر الكامل للمحل\n${"-".repeat(36)}\n`;
    byCategory.forEach((c) => { out += `\n${c.name}\n`; c.lines.forEach((l) => (out += `  ${l.qty}× ${l.name} [${l.tierLabel}]  ${money(l.price * l.qty)}\n`)); });
    out += `\n${"=".repeat(36)}\nكل واحد وحقه\n${"-".repeat(36)}\n`;
    dayOrders.forEach((o) => { out += `\n${o.name} — ${o.phone}${o.paid ? "  (دافع)" : ""}\n`; o.items.forEach((l) => (out += `  ${l.qty}× ${l.nameAr || l.name} [${l.tierLabel}]  ${money(l.price * l.qty)}\n`)); out += `  يدفع: ${money(foodOf(o.items) + DELIVERY_FEE)}\n`; });
    out += `\n${"=".repeat(36)}\nناس: ${dayOrders.length}\nأكل المحل: ${money(dayFood)}\nتوصيل: ${money(DELIVERY_FEE * dayOrders.length)}\nحساب اليوم: ${money(dayDue)}\n`;
    return out;
  };
  const copyList = async () => { try { await navigator.clipboard.writeText(buildText()); showToast("الأوردر اتنسخ. روح اقراه للمحل."); } catch { showToast("النسخ فشل — جرّب التصدير.", "err"); } };
  const exportList = () => { try { const b = new Blob([buildText()], { type: "text/plain" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `hayat-mokafhet-elgoo-${selectedDate}.txt`; a.click(); URL.revokeObjectURL(u); showToast("الملف نزل."); } catch { showToast("التصدير فشل — جرّب انسخ.", "err"); } };

  const onQrFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setQrBusy(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      await savePayQr(dataUrl);
      setPayQr(dataUrl);
      showToast("الكيو آر اتغيّر. الناس هتشوف الصورة الجديدة.");
    } catch (err) {
      showToast(settingsSaveHint(err), "err");
    } finally { setQrBusy(false); }
  };

  const saveLink = async () => {
    setLinkBusy(true);
    try {
      const url = normalizePayLink(payLinkDraft);
      await savePayLink(url);
      setPayLinkDraft(url);
      showToast(url ? "اللينك اتحفظ. الناس هيفتحوه بعد على مسئوليتي." : "اللينك اتشال.");
    } catch (err) {
      showToast(settingsSaveHint(err), "err");
    } finally { setLinkBusy(false); }
  };

  if (loading) return (<div style={S.adminPad}><div style={S.loadPulse}><Layers size={34} strokeWidth={1.5} /></div><p style={S.loadText} dir="rtl">بنلمّ أوردرات العيال…</p></div>);
  if (error) return (<div style={S.adminPad}><p style={S.loadText}>{error}</p><button style={S.primaryBtn} onClick={load}><RefreshCw size={16} /> جرّب تاني</button></div>);

  return (
    <div style={S.adminWrap} dir="rtl">
      <div style={S.adminTopRow}>
        <div>
          <span style={S.dateEyebrow}>مكتب المأمور</span>
          <h2 style={{ ...S.adminH, fontFamily: "'Cairo',sans-serif" }}>شغل النهارده</h2>
        </div>
        <button style={S.ghostBtn} onClick={load}><RefreshCw size={15} /> حدّث</button>
      </div>

      <button type="button" style={S.payFold} onClick={() => setPayEdit((v) => !v)}>
        <span>
          <strong>الدفع — كيو آر ولينك إنستاباي</strong>
          <span style={S.payFoldHint}>اتعدل من هنا براحتك</span>
        </span>
        <ChevronDown size={18} style={{ transform: payEdit ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>
      {payEdit && (
        <div style={S.qrBox}>
          <div style={narrow ? S.payEditStack : S.payEditGrid}>
            <div>
              <div style={S.payEditTitle}>الكيو آر</div>
              <img src={payQr} alt="" style={S.qrPreviewSm} />
              <input ref={qrInput} type="file" accept="image/*" style={S.hiddenFile} onChange={onQrFile} />
              <button style={{ ...S.primaryBtn, width: "100%", marginTop: 10, opacity: qrBusy ? 0.7 : 1 }} onClick={() => qrInput.current?.click()} disabled={qrBusy}>
                {qrBusy ? "ثواني…" : "غيّر الصورة"}
              </button>
            </div>
            <div>
              <div style={S.payEditTitle}>اللينك المباشر</div>
              <p style={{ ...S.finePrint, marginTop: 0 }}>حطه وعدّله في أي وقت — يظهر بعد «على مسئوليتي».</p>
              <input
                style={{ ...S.input, direction: "ltr", textAlign: "left" }}
                value={payLinkDraft}
                placeholder="https://ipn.eg/..."
                onChange={(e) => setPayLinkDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveLink()}
              />
              <button style={{ ...S.ghostBtn, width: "100%", marginTop: 10, justifyContent: "center", opacity: linkBusy ? 0.7 : 1 }} onClick={saveLink} disabled={linkBusy}>
                {linkBusy ? "ثواني…" : "احفظ اللينك"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!dates.length ? (
        <div style={S.emptyState}><p style={S.cartEmpty}>لسه مفيش أوردرات. أول ما العيال تطلب، هتظهر هنا.</p></div>
      ) : (
        <>
          <div style={S.dateTabs}>
            {dates.map((d) => (
              <button key={d} style={{ ...S.dateTab, ...(d === selectedDate ? S.dateTabActive : {}) }} onClick={() => setSelectedDate(d)}>
                {d === today ? "النهارده" : weekdayAr(d)}
                <span style={S.dateTabDate}>{d}</span>
              </button>
            ))}
          </div>

          <div style={S.adminStatBar}>
            <span>{dayOrders.length} {dayOrders.length === 1 ? "أوردر" : "أوردرات"}</span>
            <span>{unpaid ? `${unpaid} لسه ما دفعوش` : "كلهم دفعوا"}</span>
            <span>المفروض يتجمع {money(dayDue)}</span>
          </div>

          <div style={S.adminTabs}>
            <button style={{ ...S.adminTab, ...(mode === "person" ? S.adminTabActive : {}) }} onClick={() => setMode("person")}>
              <Users size={16} />
              <span>الناس اللي طلبت</span>
              <small style={S.adminTabSub}>الاسم · الموبايل · الحساب</small>
            </button>
            <button style={{ ...S.adminTab, ...(mode === "full" ? S.adminTabActive : {}) }} onClick={() => setMode("full")}>
              <Layers size={16} />
              <span>أوردر المحل</span>
              <small style={S.adminTabSub}>تجميعة تتقري للمحل</small>
            </button>
          </div>

          {mode === "full" ? (
            <div style={S.fullWrap}>
              <div style={S.adminActions}>
                <button style={S.primaryBtn} onClick={copyList}><ClipboardCopy size={16} /> انسخ للمحل</button>
                <button style={S.ghostBtn} onClick={exportList}>نزّل ملف</button>
              </div>
              {byCategory.map((c) => (
                <div key={c.name} style={S.catBlock}>
                  <div style={{ ...S.catBlockHead, fontFamily: "'Cairo',sans-serif" }}><span>{c.name}</span><span style={S.catBlockSub}>{money(c.subtotal)}</span></div>
                  {c.lines.map((l, i) => (
                    <div key={i} style={S.tallyLineLight}>
                      <span style={S.tallyQtyDark}>{l.qty}×</span>
                      <span style={{ flex: 1, fontFamily: "'Cairo',sans-serif" }}>{l.name} <span style={S.tierTag}>{l.tierLabel}</span></span>
                      <span style={S.personLinePrice}>{money(l.price * l.qty)}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ ...S.grandTotal, fontFamily: "'Cairo',sans-serif" }}><span>أكل المحل</span><span>{money(dayFood)}</span></div>
              <p style={S.finePrint}>التوصيل 5 جنيه على كل أوردر — مش جزء من أوردر المحل.</p>
            </div>
          ) : (
            <div style={narrow ? { ...S.personGrid, gridTemplateColumns: "1fr" } : S.personGrid}>
              {dayOrders.map((o) => (
                <div key={o.id} style={{ ...S.payCard, ...(o.paid ? S.payCardPaid : {}) }}>
                  <div style={S.payHead}>
                    <div>
                      <div style={{ ...S.personName, fontFamily: "'Cairo',sans-serif" }}>
                        {o.name}{dayOrders.filter((x) => x.user_id === o.user_id).length > 1 ? ` · أوردر ${orderNo(dayOrders.filter((x) => x.user_id === o.user_id), o)}` : ""}
                      </div>
                      {o.phone
                        ? <a href={`tel:${o.phone.replace(/\s/g, "")}`} style={S.payPhoneLink} dir="ltr"><Phone size={12} /> {o.phone}</a>
                        : <div style={S.payPhone}>مفيش موبايل</div>}
                    </div>
                    <div style={S.payAmount}>{money(foodOf(o.items) + DELIVERY_FEE)}</div>
                  </div>
                  {o.items.map((l) => (
                    <div key={l.key} style={S.personLine}>
                      <span>{l.qty}× {l.nameAr || l.name} <span style={S.tierTag}>{l.tierLabel}</span></span>
                      <span style={S.personLinePrice}>{money(l.price * l.qty)}</span>
                    </div>
                  ))}
                  <Bill food={foodOf(o.items)} />
                  <div style={S.payFoot}>
                    <span style={{ fontWeight: 700, color: "#8a7f70", fontFamily: "'Cairo',sans-serif" }}>{o.paid ? "تمام، دافع" : "لسه ما دفعش"}</span>
                    <button style={{ ...S.paidToggle, fontFamily: "'Cairo',sans-serif", ...(o.paid ? S.paidToggleOn : {}) }} onClick={() => togglePaid(o.id, !o.paid)}>
                      <Check size={13} /> {o.paid ? "دافع" : "علّم دافع"}
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
