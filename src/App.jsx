import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Plus, Minus, Trash2, Check, ClipboardCopy, RefreshCw, Layers, Users, Phone, RotateCcw, ChevronDown, Search, Home, ShoppingBag, ArrowRight, ClipboardList, Shield, LogOut, Star, CalendarDays } from "lucide-react";
import { supabase, configError } from "./supabase.js";
import { S, U, accent, globalCss } from "./styles.js";
import { itemImage, onImgError } from "./itemImages.js";
import { afeya } from "./afeyat.js";
import { pickSituationMeme, loadMemeCatalog } from "./memes.js";
import { MEME_SITUATIONS } from "./memeCatalog.js";
import { expandOrders, withNewBatch, setBatchPaid, parseOrderId } from "./orders.js";
import { loadPayQr, savePayQr, loadPayLink, savePayLink, loadCollectorPay, fileToDataUrl, normalizePayLink, settingsSaveHint, PAY_QR_FALLBACK, loadSetting, saveSetting } from "./settings.js";
import { uploadAsset, setMediaRev, resolveLogoSrc, publicObject, LOGO_PATH, MEDIA_REV_KEY, MEMES_BUCKET, LOGO_BUCKET } from "./media.js";
import { POPULAR_ID, POPULAR_ITEMS, CAT_SHORT, CAT_ICON, POPULAR_ID_SET } from "./popular.js";
import ReportView from "./report.jsx";

const TIER_LABELS = { shami: "شامي", balady: "بلدي", fino: "فينو", sm: "صغير", md: "وسط", lg: "كبير", each: "" };
const CAT_TIER_LABELS = { omelet_plates: { sm: "2 بيض", md: "3 بيض" } };
const PRICE_NOTE = "ملحوظة: الأسعار دي مش ثابتة، والأسعار ممكن تزيد.";
const DELIVERY_FEE = 5;
const APP_NAME = "هيئة مكافحة الجوع المش رسمية";
const TEAMS = [
  { id: "cs", label: "Customer service CS" },
  { id: "sales-mx", label: "Sales MX" },
  { id: "sales-ce", label: "Sales CE" },
  { id: "marketing", label: "Marketing" },
  { id: "hr", label: "HR" },
  { id: "finance", label: "Finance" },
  { id: "legal", label: "Legal" },
  { id: "it", label: "IT" },
];
const teamLabel = (id) => TEAMS.find((t) => t.id === id)?.label || "";
const TEAM_ORDER = TEAMS.map((t) => t.id);
const COLLECTOR_LS = "hayat_collector";
const isSuperAdmin = (p) => p?.role === "super_admin";
const isAdminUser = (p) => p?.is_admin === true || p?.role === "admin" || p?.role === "super_admin";
const roleLabel = (p) => (p?.role === "super_admin" ? "المدير" : (p?.is_admin || p?.role === "admin") ? "مأمور" : "مستخدم");
const officeLabel = (p) => (isSuperAdmin(p) ? "المدير" : "المأمور");
const CASH_PROOF = "cash";
const isCashPay = (o) => o?.pay_proof === CASH_PROOF || o?.pay_method === "cash";
const isShotProof = (p) => typeof p === "string" && p.length > 8 && p !== CASH_PROOF;
const loadOfficers = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,name,pay_qr,pay_link,role,is_admin")
    .or("is_admin.eq.true,role.in.(admin,super_admin)")
    .order("name");
  if (error) return [];
  return data || [];
};
function ChoiceGrid({ value, onChange, options }) {
  return (
    <div style={S.choiceGrid}>
      {options.map((o) => (
        <button
          key={o.id || "none"}
          type="button"
          style={{ ...S.choiceChip, ...(value === o.id ? S.choiceChipOn : {}) }}
          onClick={(e) => { e.stopPropagation(); onChange(o.id); }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
const Logo = ({ size = "sm", className }) => {
  const img = size === "xl" ? S.logoXl : size === "lg" ? S.logoLg : size === "avatar" ? S.logoAvatar : size === "lock" ? S.logoLock : S.logoSm;
  const [src, setSrc] = useState(() => (
    import.meta.env.VITE_SUPABASE_URL
      ? publicObject(LOGO_BUCKET, LOGO_PATH, Date.now())
      : `/logo.png?v=${Date.now()}`
  ));
  useEffect(() => {
    const apply = async (rev, path) => {
      setMediaRev(rev || "");
      if (path) {
        setSrc(publicObject(LOGO_BUCKET, path, rev || Date.now()));
        return;
      }
      setSrc(await resolveLogoSrc(rev));
    };
    loadSetting(MEDIA_REV_KEY, "").then((rev) => apply(rev));
    const onRev = (e) => {
      const d = e.detail;
      if (d && typeof d === "object") apply(d.rev, d.path);
      else apply(d);
    };
    window.addEventListener("media-rev", onRev);
    return () => window.removeEventListener("media-rev", onRev);
  }, []);
  return (
    <img
      key={src}
      src={src}
      alt={APP_NAME}
      className={className}
      style={img}
      onError={() => {
        const local = `/logo.png?v=${Date.now()}`;
        if (src === local) return;
        setSrc(local);
      }}
    />
  );
};
const money = (n) => {
  const x = Number(n || 0);
  const shown = Math.round(x * 10) % 10 === 0 ? x.toFixed(0) : x.toFixed(1);
  return `${shown} جنيه`;
};
const foodOf = (items) => (items || []).reduce((s, l) => s + Number(l.price || 0) * Number(l.qty || 0), 0);
const tierLabel = (catId, tier) => CAT_TIER_LABELS[catId]?.[tier] ?? TIER_LABELS[tier] ?? "";
const customizeLabel = (cat, tiers) => {
  if (!tiers.length) return "";
  if (tiers.length === 1) return "";
  if (cat.id === "omelet_plates") return "اختار عدد البيض";
  if (cat.tiered) return "اختار الحجم";
  if (tiers.some((t) => t.tier === "fino" || t.tier === "shami" || t.tier === "balady")) return "اختار العيش";
  return "اختار النوع";
};
const Bill = ({ food }) => (
  <div dir="rtl">
    <div style={S.billRow}><span>الأكل</span><span>{money(food)}</span></div>
    <div style={S.billRow}><span>توصيل</span><span>{money(DELIVERY_FEE)}</span></div>
    <div style={S.billGrand}><span>الحساب</span><span>{money(Number(food || 0) + DELIVERY_FEE)}</span></div>
    <p style={{ ...S.finePrint, marginTop: 10 }}>{PRICE_NOTE}</p>
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
function OrderBlock({ order, title, onReorder, onPay, tone, collectorName }) {
  return (
    <div style={tone === "today" ? S.myOrderBox : S.personCard} dir="rtl">
      <div style={tone === "today" ? S.myOrderHead : S.personHead}>
        {tone === "today" ? <><Check size={15} /> {title}</> : <span style={{ ...S.personName, fontFamily: "'Cairo',sans-serif" }}>{title}</span>}
        {tone !== "today" && <span style={S.personTotal}>{money(foodOf(order.items) + DELIVERY_FEE)}</span>}
      </div>
      {collectorName ? <div style={S.payPhone}>هتدفع عند {collectorName}</div> : null}
      {order.paid ? <div style={{ ...S.paidStamp, marginTop: 8 }}>دافع</div> : <div style={{ ...S.paidWait, marginTop: 8 }}>لسه ما اتعلّمش دافع</div>}
      {isCashPay(order) && !order.paid ? <div style={S.collectorTag}>هدفع كاش</div> : null}
      {order.items.map((l) => (
        <div key={l.key} style={tone === "today" ? S.myOrderLine : S.personLine}>
          <span>{l.qty}× {l.nameAr || l.name}{l.tierLabel ? <> <span style={S.tierTag}>{l.tierLabel}</span></> : null}</span>
          <span style={S.personLinePrice}>{money(l.price * l.qty)}</span>
        </div>
      ))}
      <Bill food={foodOf(order.items)} />
      {isShotProof(order.pay_proof) ? (
        <div style={S.proofBox}>
          <div style={S.payEditTitle}>سكرين التحويل</div>
          <img src={order.pay_proof} alt="" style={S.proofImg} />
        </div>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        {onReorder && <button type="button" style={{ ...S.primaryBtn, width: "100%" }} onClick={() => onReorder(order)}><RotateCcw size={15} /> اطلبه تاني</button>}
        {onPay && (
          <button type="button" style={{ ...S.ghostBtn, width: "100%", justifyContent: "center" }} onClick={onPay}>
            {isCashPay(order) ? "هدفع كاش — غيّر لو حابب" : isShotProof(order.pay_proof) ? "شوف كيو آر إنستاباي" : "ادفع بإنستاباي أو كاش"}
          </button>
        )}
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
  const keys = tiered
    ? [["sm", "price_sm"], ["md", "price_md"], ["lg", "price_lg"]]
    : [["balady", "price_balady"], ["fino", "price_fino"], ["shami", "price_shami"], ["each", "price_each"]];
  return keys.filter(([, col]) => row[col] != null).map(([tier, col]) => ({ tier, price: Number(row[col]) }));
}
function defaultTier(tiers) {
  return tiers.find((t) => t.tier === "balady")?.tier || tiers[0]?.tier;
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

  useEffect(() => {
    loadSetting(MEDIA_REV_KEY, "").then(setMediaRev);
  }, []);

  /* auth session listener */
  useEffect(() => {
    if (configError) { setPhase("error"); return; }
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setErrMsg(error.message || "الدخول وقف في السكة.");
        setPhase("error");
        return;
      }
      setSession(data.session);
    }).catch((e) => {
      setErrMsg(e.message || "الدخول وقف في السكة.");
      setPhase("error");
    });
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
        if (!prof || !prof.department) { setProfile(prof); setPhase("needsProfile"); return; }
        setProfile(prof);
        await loadMenu();
        await loadMemeCatalog();
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
    for (const it of items || []) (byCat[it.category_id] = byCat[it.category_id] || []).push(it);
    setCatalog((cats || []).map((c) => ({ ...c, items: byCat[c.id] || [] })));
  }, []);

  useEffect(() => {
    if (view === "admin" && !isAdminUser(profile)) setView("shop");
  }, [view, profile]);

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
  if (phase === "loading") return (<Center><Logo size="lg" /><p style={S.loadText} dir="rtl">ثواني يا معلم… الهيئة بتسخّن</p></Center>);
  if (phase === "auth") return (<AuthScreen />);
  if (phase === "needsProfile") return (<><ProfileScreen session={session} existing={profile} onDone={(p) => { setProfile(p); loadMenu().then(() => setPhase("ready")); }} />{bravoPop}</>);

  return (
    <div style={view === "shop" ? U.app : S.app}>
      {view === "admin" && (
        <header style={S.header}>
          <div style={S.brandRowSm}><Logo /><span style={S.headerTitle} dir="rtl">{APP_NAME}</span></div>
          <div style={S.headerRight}>
            <span style={S.hello} dir="rtl">يا {(profile.name || "").split(" ")[0] || "معلم"}{teamLabel(profile.department) ? ` · ${teamLabel(profile.department)}` : ""}{isSuperAdmin(profile) ? " · المدير" : ""}</span>
            <button style={S.ghostBtn} onClick={() => setView("shop")}>المنيو</button>
            <button style={S.ghostBtn} onClick={signOut} title="سيّب المكان">خروج</button>
          </div>
        </header>
      )}

      {view === "shop"
        ? <ShopView {...{ catalog, profile, showToast, signOut, setView }} />
        : <AdminView {...{ narrow, showToast, profile }} />}

      {toast && (<div style={{ ...S.toast, background: toast.tone === "err" ? "#b23a2f" : "#2f6b4f" }}>{toast.tone === "err" ? "!" : <Check size={16} />} {toast.msg}</div>)}
      {bravoPop}
      <style>{globalCss}</style>
    </div>
  );
}

function Center({ children }) {
  return (
    <div style={{ ...S.screenCenter, direction: "rtl" }}>
      <div style={S.authStack}>{children}</div>
      <style>{globalCss}</style>
    </div>
  );
}

function MemePop({ src, localSrc, caption, onClose, actionLabel = "تمام", onAction }) {
  const go = onAction || onClose;
  return (
    <div style={S.bravoScrim} onClick={onClose} role="presentation">
      <div style={S.authMemeCard} className="bravo-pop" onClick={(e) => e.stopPropagation()} dir="rtl">
        <img
          src={src}
          alt=""
          style={S.bravoImg}
          onError={(e) => {
            if (localSrc && !e.currentTarget.dataset.local) {
              e.currentTarget.dataset.local = "1";
              e.currentTarget.src = localSrc;
            }
          }}
        />
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
      <div style={S.signCard} dir="rtl">
        <Logo size="xl" className="auth-logo" />
        <p style={S.authTagline}>الجوع كافر — الحق اطلب الفطار قبل الساعة 10</p>
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
          <div style={S.signupHint}>
            <span>جديد هنا؟</span>
            <button type="button" style={S.signupLink} onClick={() => { setMode("signup"); setErr(""); setOk(""); }}>اعمل حساب</button>
          </div>
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
function ProfileScreen({ session, existing, onDone }) {
  const [name, setName] = useState(existing?.name || "");
  const [phone, setPhone] = useState(existing?.phone || "");
  const [team, setTeam] = useState(existing?.department || "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setErr("");
    if (!name.trim()) return setErr("الاسم يا باشا… من غير اسم مفيش سندوتش.");
    if (phone.replace(/\D/g, "").length < 7) return setErr("رقم الموبايل ناقص أو غلط.");
    if (!team || !TEAMS.some((t) => t.id === team)) return setErr("اختار الفريق يا معلم.");
    setBusy(true);
    try {
      const row = { id: session.user.id, name: name.trim(), phone: phone.trim(), department: team };
      const { data, error } = await supabase.from("profiles").upsert(row).select().single();
      if (error) throw error;
      await supabase.auth.updateUser({ data: { name: row.name, phone: row.phone } });
      onDone(data);
    } catch (e) { setErr(e.message || "ما حفظناش. جرّب تاني."); }
    finally { setBusy(false); }
  };

  return (
    <Center>
      <div style={S.signCard} dir="rtl">
        <Logo size="lg" className="auth-logo" />
        <h1 style={{ ...S.brandTitle, textAlign: "center" }}>ثواني يا باشا</h1>
        <p style={{ ...S.authTagline, marginBottom: 16 }}>اسمك والفريق… على مسئوليتي</p>
        <label style={S.label}>اسمك</label>
        <input style={S.input} value={name} placeholder="مثلاً أحمد فوزي" onChange={(e) => setName(e.target.value)} autoFocus />
        <label style={{ ...S.label, marginTop: 14 }}>الموبايل</label>
        <input style={S.input} value={phone} placeholder="مثلاً 0100 123 4567" inputMode="tel" onChange={(e) => setPhone(e.target.value)} />
        <label style={{ ...S.label, marginTop: 14 }}>الفريق</label>
        <ChoiceGrid
          value={team}
          onChange={setTeam}
          options={TEAMS.map((t) => ({ id: t.id, label: t.label }))}
        />
        {err && <p style={S.errText}>{err}</p>}
        <button style={{ ...S.primaryBtn, width: "100%", marginTop: 16, opacity: busy ? 0.7 : 1 }} onClick={save} disabled={busy}>
          {busy ? <><RefreshCw size={16} className="spin" /> ثواني ثواني…</> : "كده رضا"}
        </button>
      </div>
    </Center>
  );
}

function srcCatOf(cat, it) {
  return it._srcCat || cat;
}

function Stars({ n = 4 }) {
  return (
    <div style={U.detailStars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={18} fill={i <= n ? accent : "none"} color={i <= n ? accent : "#D5D5D5"} />
      ))}
      <span style={U.starScore}>({n}.0)</span>
    </div>
  );
}

function ProductCard({ cat, it, qty, onOpen }) {
  const src = srcCatOf(cat, it);
  const a = afeya(it.id);
  return (
    <button type="button" style={{ ...U.card, position: "relative" }} dir="rtl" onClick={() => onOpen(src, it)}>
      {qty > 0 && <span style={U.cardQty}>{qty}</span>}
      <div style={U.cardImgWrap}>
        <img src={itemImage(it.id)} alt="" style={U.cardImg} data-item-id={it.id} onError={onImgError} />
      </div>
      <div style={U.cardName}>{it.name_ar || it.name}</div>
      <div style={U.cardSub}>{a.text}</div>
      <div style={U.cardFoot}>
        <span style={U.plus} aria-hidden><Plus size={16} /></span>
      </div>
    </button>
  );
}

function ItemDetail({ pick, onClose, onAdd }) {
  const { cat: pc, it } = pick;
  const tiers = tiersOf(it, pc.tiered);
  const [tier, setTier] = useState(defaultTier(tiers));
  const [n, setN] = useState(1);
  const price = Number(tiers.find((t) => t.tier === tier)?.price || 0);
  const a = afeya(it.id);
  const sizeTitle = customizeLabel(pc, tiers) || (tiers.length > 1 ? "اختار" : "النوع");
  const stars = POPULAR_ID_SET.has(it.id) ? 5 : 4;
  useEffect(() => {
    setTier(defaultTier(tiers));
    setN(1);
  }, [it.id]);
  return (
    <div style={U.detail} dir="rtl">
      <div style={U.detailTop}>
        <button type="button" style={U.ghostIcon} onClick={onClose} aria-label="رجوع"><ArrowRight size={22} /></button>
      </div>
      <div style={U.detailHero}>
        <h1 style={U.detailTitle}>{it.name_ar || it.name}</h1>
        <p style={U.detailSub}>{a.text}</p>
        <Stars n={stars} />
        <div style={U.detailPrice}>{money(price)}</div>
        <div style={U.detailImgWrap}>
          <img src={itemImage(it.id)} alt="" style={U.detailImg} data-item-id={it.id} onError={onImgError} />
        </div>
      </div>
      {tiers.length > 0 && (
        <>
          <div style={U.sizeLab}>{sizeTitle}</div>
          <div style={U.sizeRow}>
            {tiers.map((t) => (
              <button
                key={t.tier}
                type="button"
                style={{ ...U.sizeChip, ...(tier === t.tier ? U.sizeOn : {}) }}
                onClick={() => setTier(t.tier)}
              >
                {tierLabel(pc.id, t.tier) || it.name_ar || it.name}
              </button>
            ))}
          </div>
        </>
      )}
      <p style={U.detailNote}>
        {a.from ? `${a.from}. ` : ""}{PRICE_NOTE} التوصيل {money(DELIVERY_FEE)}.
      </p>
      <div style={U.detailBar}>
        <div style={U.qtyPill}>
          <button type="button" style={U.qtyBtn} onClick={() => setN((x) => Math.max(1, x - 1))}><Minus size={16} /></button>
          <span style={{ fontWeight: 800, minWidth: 18, textAlign: "center" }}>{n}</span>
          <button type="button" style={U.qtyBtn} onClick={() => setN((x) => x + 1)}><Plus size={16} /></button>
        </div>
        <button
          type="button"
          style={U.addCart}
          onClick={() => {
            if (tier) onAdd(pc.id, it.id, tier, n);
            onClose();
          }}
        >
          <ShoppingBag size={16} /> ضيف للعربية
        </button>
      </div>
    </div>
  );
}

/* ─────────────── Shop ─────────────── */
function ShopView({ catalog, profile, showToast, signOut, setView }) {
  const date = todayStr();
  const [activeCat, setActiveCat] = useState(POPULAR_ID);
  const [tab, setTab] = useState("menu");
  const [q, setQ] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState({}); // "catId::itemId::tier" -> qty
  const [history, setHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [bravo, setBravo] = useState(null);
  const [pick, setPick] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payFor, setPayFor] = useState({ name: "", qr: PAY_QR_FALLBACK, link: "" });
  const [payOrderId, setPayOrderId] = useState("");
  const [proofDone, setProofDone] = useState(false);
  const [proofBusy, setProofBusy] = useState(false);
  const [payMethod, setPayMethod] = useState("instapay");
  const proofInput = useRef(null);
  const [collectors, setCollectors] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [collectorId, setCollectorId] = useState(() => {
    try { return localStorage.getItem(COLLECTOR_LS) || ""; } catch { return ""; }
  });
  const bravoTimer = useRef(null);
  const lastMeme = useRef("");
  const pendingPay = useRef(false);
  const pendingCollector = useRef("");
  const pendingOrderId = useRef("");
  const idleShown = useRef(false);

  const lookup = useMemo(() => {
    const m = {};
    for (const c of catalog) for (const it of c.items) m[`${c.id}::${it.id}`] = { ...it, catId: c.id, catName: c.name_ar || c.name, tiered: c.tiered };
    return m;
  }, [catalog]);

  const shopCats = useMemo(() => {
    const byId = {};
    for (const c of catalog) for (const it of c.items) byId[it.id] = { it, cat: c };
    const items = POPULAR_ITEMS.map((p) => {
      const hit = byId[p.id] || (p.alt ? byId[p.alt] : null);
      if (!hit) return null;
      return { ...hit.it, name_ar: p.nameAr || hit.it.name_ar, _srcCat: hit.cat };
    }).filter(Boolean);
    if (!items.length) return catalog;
    return [{ id: POPULAR_ID, name: "Most ordered", name_ar: "الأكثر طلبًا", tiered: false, items }, ...catalog];
  }, [catalog]);

  useEffect(() => {
    if (shopCats.length && !shopCats.some((c) => c.id === activeCat)) setActiveCat(shopCats[0].id);
  }, [shopCats, activeCat]);

  const loadOrders = useCallback(async () => {
    let { data, error } = await supabase
      .from("orders")
      .select("*, collector:profiles!orders_collector_id_fkey(name)")
      .eq("user_id", profile.id)
      .order("order_date", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) {
      ({ data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", profile.id)
        .order("order_date", { ascending: false })
        .order("updated_at", { ascending: false }));
    }
    if (error) { showToast("الأوردرات مش راضية تفتح.", "err"); return; }
    setHistory(expandOrders(data || []));
  }, [profile.id, showToast]);

  const loadCollectors = useCallback(async () => {
    const list = await loadOfficers();
    setCollectors(list);
    setCollectorId((cur) => {
      if (cur && list.some((c) => c.id === cur)) return cur;
      let saved = "";
      try { saved = localStorage.getItem(COLLECTOR_LS) || ""; } catch { /* ignore */ }
      if (saved && list.some((c) => c.id === saved)) return saved;
      if (list.length === 1) return list[0].id;
      return "";
    });
  }, []);

  const loadInbox = useCallback(async () => {
    if (!isAdminUser(profile)) { setInbox([]); return; }
    let q = supabase
      .from("orders")
      .select("*, profiles!orders_user_id_profiles_fkey(name,phone,department)")
      .eq("collector_id", profile.id)
      .order("order_date", { ascending: false })
      .order("updated_at", { ascending: false });
    let { data, error } = await q;
    if (error) {
      ({ data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("collector_id", profile.id)
        .order("order_date", { ascending: false })
        .order("updated_at", { ascending: false }));
    }
    if (error) return;
    setInbox(expandOrders(data || []).map((r) => ({
      ...r,
      name: r.profiles?.name || "مش معروف",
      phone: r.profiles?.phone || "",
      department: r.profiles?.department || "",
    })));
  }, [profile]);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => { loadCollectors(); }, [loadCollectors]);
  useEffect(() => { loadInbox(); }, [loadInbox]);
  useEffect(() => {
    if (!isAdminUser(profile)) return undefined;
    const t = setInterval(loadInbox, 12000);
    return () => clearInterval(t);
  }, [loadInbox, profile]);
  useEffect(() => { loadMemeCatalog(); }, []);
  useEffect(() => { if (cartOpen) loadCollectors(); }, [cartOpen, loadCollectors]);

  const openPay = async (id, order) => {
    const info = await loadCollectorPay(id);
    setPayFor(info);
    const oid = order?.parentId || parseOrderId(order?.id).parentId || order?.id || "";
    setPayOrderId(oid);
    const cash = isCashPay(order);
    setPayMethod(cash ? "cash" : "instapay");
    setProofDone(isShotProof(order?.pay_proof));
    setPayOpen(true);
  };

  const closePay = () => {
    if (payMethod !== "cash" && !proofDone) {
      showToast("ارفع سكرين التحويل، أو اختار هدفع كاش.", "err");
      return;
    }
    setPayOpen(false);
  };

  const savePayMethod = async (method) => {
    const was = payMethod;
    setPayMethod(method);
    if (!payOrderId) return true;
    const { parentId } = parseOrderId(payOrderId);
    const patch = method === "cash"
      ? { pay_proof: CASH_PROOF }
      : (proofDone ? {} : { pay_proof: null });
    if (method === "instapay" && proofDone) return true;
    const { error } = await supabase.from("orders").update(patch).eq("id", parentId);
    if (error) {
      showToast("طريقة الدفع ما اتحفظتش.", "err");
      return false;
    }
    if (method === "cash") setProofDone(false);
    await loadOrders();
    if (method === "cash" && was !== "cash") showToast("هتدفع كاش. المأمور هيعلّم دافع لما ياخد الفلوس.");
    return true;
  };

  const onProofFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !payOrderId) return showToast("الأوردر مش جاهز للسكرين. جرّب من أرشيفي.", "err");
    setProofBusy(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const { parentId } = parseOrderId(payOrderId);
      const { error } = await supabase.from("orders").update({ pay_proof: dataUrl }).eq("id", parentId);
      if (error) throw error;
      setProofDone(true);
      setPayMethod("instapay");
      await loadOrders();
      showToast("سكرين التحويل اترفعت. المأمور هيشوفه.");
    } catch (err) {
      showToast(err.message || "الرفع فشل.", "err");
    }
    setProofBusy(false);
  };

  const closeBravo = useCallback(() => {
    setBravo(null);
    if (pendingPay.current) {
      pendingPay.current = false;
      const id = pendingCollector.current;
      const oid = pendingOrderId.current;
      pendingCollector.current = "";
      pendingOrderId.current = "";
      loadCollectorPay(id).then((info) => {
        setPayFor(info);
        setPayOrderId(oid);
        setProofDone(false);
        setPayOpen(true);
      });
    }
  }, []);

  const cheer = useCallback((ctx) => {
    const next = pickSituationMeme({ ...ctx, exceptSrc: lastMeme.current });
    if (!next.src) return false;
    lastMeme.current = next.src;
    setBravo({ ...next, id: Date.now() });
    if (bravoTimer.current) clearTimeout(bravoTimer.current);
    bravoTimer.current = setTimeout(closeBravo, 2000);
    return true;
  }, [closeBravo]);
  useEffect(() => () => { if (bravoTimer.current) clearTimeout(bravoTimer.current); }, []);

  const ck = (c, i, t) => `${c}::${i}::${t}`;
  const add = (c, i, t) => addN(c, i, t, 1);
  const addN = (c, i, t, n = 1) => {
    if (!n) return;
    const k = ck(c, i, t);
    const count = Object.values(cart).reduce((s, x) => s + x, 0) + n;
    cheer({ event: "add", itemId: i, catId: c, count });
    setCart((s) => ({ ...s, [k]: (s[k] || 0) + n }));
  };
  const itemQty = (c, i) => Object.entries(cart).reduce((s, [k, n]) => (k.startsWith(`${c}::${i}::`) ? s + n : s), 0);
  const openItem = (c, it) => setPick({ cat: c, it });
  const dec = (k) => {
    if (!cart[k]) return;
    cheer({ event: "remove" });
    setCart((s) => { const n = (s[k] || 0) - 1; const nx = { ...s }; if (n <= 0) delete nx[k]; else nx[k] = n; return nx; });
  };
  const del = (k) => {
    if (!cart[k]) return;
    cheer({ event: "remove" });
    setCart((s) => { const nx = { ...s }; delete nx[k]; return nx; });
  };

  const cartLines = useMemo(() => Object.entries(cart).map(([k, qty]) => {
    const [catId, itemId, tier] = k.split("::");
    const it = lookup[`${catId}::${itemId}`];
    if (!it) return null;
    const price = Number(it[`price_${tier}`] || 0);
    return { key: k, catId, itemId, tier, tierLabel: tierLabel(catId, tier), name: it.name, nameAr: it.name_ar, catName: it.catName, price, qty };
  }).filter(Boolean), [cart, lookup]);

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
    setCartOpen(true);
    showToast(skipped
      ? "اتنسخ في العربية… شوية أصناف اختفت من المنيو."
      : "اتنسخ في العربية. راجع وعدّل وبعدين على مسئوليتي — هيتسجل أوردر جديد.");
  };
  const cartTotal = useMemo(() => cartLines.reduce((s, l) => s + l.price * l.qty, 0), [cartLines]);
  const cartCount = useMemo(() => cartLines.reduce((s, l) => s + l.qty, 0), [cartLines]);

  useEffect(() => {
    if (tab !== "menu" || cartCount > 0) {
      idleShown.current = false;
      return;
    }
    const t = setTimeout(() => {
      if (idleShown.current) return;
      idleShown.current = true;
      cheer({ event: "idle" });
    }, 60000);
    return () => clearTimeout(t);
  }, [tab, cartCount, cheer]);

  const submit = async () => {
    if (!cartCount) return;
    if (!collectorId) {
      showToast("اختار مين هياخد الأوردر ويدفع.", "err");
      return;
    }
    setSubmitting(true);
    try {
      const items = cartLines.map((l) => ({ key: l.key, itemId: l.itemId, categoryId: l.catId, categoryName: l.catName, name: l.name, nameAr: l.nameAr, tier: l.tier, tierLabel: l.tierLabel, price: l.price, qty: l.qty }));
      const total = foodOf(items) + DELIVERY_FEE;
      const payload = { user_id: profile.id, collector_id: collectorId, order_date: date, items, total, updated_at: new Date().toISOString() };
      let saved = null;
      const { data, error } = await supabase.from("orders").insert(payload).select("id,pay_proof").single();
      if (error) {
        const dup = error.code === "23505" || /duplicate|unique/i.test(error.message || "");
        if (!dup) throw error;
        const { data: existing, error: findErr } = await supabase.from("orders").select("*").eq("user_id", profile.id).eq("order_date", date).maybeSingle();
        if (findErr || !existing) throw error;
        const patch = { ...withNewBatch(existing, items, total), collector_id: collectorId };
        const { data: updated, error: upErr } = await supabase.from("orders").update(patch).eq("id", existing.id).select("id,pay_proof").single();
        if (upErr) throw upErr;
        saved = updated || existing;
      } else {
        saved = data;
      }
      const count = cartCount;
      setCart({});
      setCartOpen(false);
      await loadOrders();
      const shown = cheer({ event: count === 1 ? "pay_one" : "pay" });
      if (shown) {
        pendingPay.current = true;
        pendingCollector.current = collectorId;
        pendingOrderId.current = saved?.id || "";
      } else await openPay(collectorId, saved);
      showToast("أوردر جديد اتقفل. ادفع بإنستاباي أو كاش.");
    } catch (e) { showToast(e.message || "الأوردر ما اتحفظش. جرّب تاني.", "err"); }
    finally { setSubmitting(false); }
  };

  const cat = shopCats.find((c) => c.id === activeCat) || shopCats[0];
  const needle = q.trim();
  const shown = (cat?.items || []).filter((it) => {
    if (!needle) return true;
    const blob = `${it.name_ar || ""} ${it.name || ""}`.toLowerCase();
    return blob.includes(needle.toLowerCase());
  });
  const firstName = (profile.name || "").split(" ")[0] || "معلم";
  const admin = isAdminUser(profile);
  const hideDock = !!(pick || cartOpen || payOpen || bravo?.src);

  const cartBody = (
    !cartLines.length ? <p style={{ ...S.cartEmpty, textAlign: "right" }} dir="rtl">العربية فاضية يا باشا… الجوع كافر</p> : (
      <>
        <div style={S.cartLines}>
          {cartLines.map((l) => (
            <div key={l.key} style={S.cartLine}>
              <img src={itemImage(l.itemId)} alt="" style={S.cartThumb} data-item-id={l.itemId} onError={onImgError} />
              <div style={{ flex: 1, minWidth: 0 }}><div style={S.cartLineName}>{l.nameAr || l.name}{l.tierLabel ? <> <span style={S.tierTag}>{l.tierLabel}</span></> : null}</div><div style={S.cartLineMeta}>{money(l.price)} الواحدة</div></div>
              <div style={S.stepperSm}><button style={S.stepBtn} onClick={() => dec(l.key)}><Minus size={13} /></button><span style={S.stepQty}>{l.qty}</span><button style={S.stepBtn} onClick={() => add(l.catId, l.itemId, l.tier)}><Plus size={13} /></button></div>
              <button style={S.trashBtn} onClick={() => del(l.key)} title="شيل"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        <Bill food={cartTotal} />
        <label style={{ ...S.label, marginTop: 14 }}>مين هياخد الأوردر ويدفع؟</label>
        {collectors.length ? (
          <ChoiceGrid
            value={collectorId}
            onChange={(id) => {
              setCollectorId(id);
              try { if (id) localStorage.setItem(COLLECTOR_LS, id); else localStorage.removeItem(COLLECTOR_LS); } catch { /* ignore */ }
            }}
            options={collectors.map((c) => ({ id: c.id, label: c.name }))}
          />
        ) : (
          <p style={S.errText}>لسه مفيش مأمور. كلّم فوزي يعيّن حد.</p>
        )}
        <p style={{ ...S.finePrint, marginTop: 8 }}>هو اللي هيجمع الأكل ويدفع للمحل، وإنت تحاسبه.</p>
      </>
    )
  );

  return (
    <div style={U.shell} dir="rtl">
      <header style={U.sticky}>
        <div style={U.brandLock}>
          <Logo size="lock" />
          <h1 style={U.brandName}>{APP_NAME}</h1>
        </div>
        <div style={U.stickyRow}>
          <span style={U.stickyHello}>يا {firstName}{teamLabel(profile.department) ? ` · ${teamLabel(profile.department)}` : ""}</span>
          <div style={U.stickyBtns}>
            {admin && <button type="button" style={U.stickyGhost} onClick={() => setView("admin")}>{officeLabel(profile)}</button>}
            <button type="button" style={U.stickyGhost} onClick={signOut}>خروج</button>
            <button type="button" style={U.iconBtn} onClick={() => { setTab("menu"); setCartOpen(true); }} aria-label="العربية">
              <ShoppingBag size={22} />
              {cartCount > 0 && <span style={U.bagDot}>{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {tab === "history" ? (
        <div style={U.hist}>
          {admin && (
            <>
              <h1 style={U.heroA}>نازلة عليك</h1>
              {!inbox.length
                ? <p style={S.cartEmpty} dir="rtl">مفيش أوردر نازل عليك دلوقتي.</p>
                : inbox.map((o) => (
                  <OrderBlock
                    key={o.id}
                    order={o}
                    title={`${o.name}${teamLabel(o.department) ? ` · ${teamLabel(o.department)}` : ""}`}
                    onPay={o.order_date === date ? () => openPay(profile.id, o) : undefined}
                  />
                ))}
              <button type="button" style={{ ...S.primaryBtn, width: "100%" }} onClick={() => setView("admin")}>افتح المكتب</button>
              <h1 style={{ ...U.heroA, marginTop: 12 }}>أرشيفي</h1>
            </>
          )}
          {!admin && <h1 style={U.heroA}>أرشيفي</h1>}
          {!history.length ? <p style={S.cartEmpty} dir="rtl">مفيش أرشيف يا معلم… لسه ما طلبتش</p> : historyGroups.map((g) => (
            <div key={g.date} style={{ display: "grid", gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#888" }}>{g.date === date ? "أوردرات النهارده" : prettyDate(g.date)}</div>
              {g.orders.map((o) => (
                <OrderBlock
                  key={o.id}
                  order={o}
                  title={g.orders.length > 1 ? `أوردر ${orderNo(history, o)}` : "الأوردر"}
                  collectorName={o.collector?.name}
                  onReorder={reorder}
                  onPay={g.date === date ? () => openPay(o.collector_id, o) : undefined}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div style={U.hero}>
            <p style={U.heroA}>جعان؟</p>
            <p style={U.heroB}>اطلب وكُل.</p>
          </div>
          {admin && inbox.length > 0 && (
            <button type="button" style={S.inboxBanner} onClick={() => setView("admin")}>
              عندك {inbox.length} أوردر نازل عليك — افتح المكتب
            </button>
          )}
          <div style={U.search}>
            <Search size={18} color="#9A9A9A" />
            <input
              style={U.searchInput}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="دور على سندوتش"
              dir="rtl"
            />
          </div>
          <div style={U.catBand}>
            <div className="catRail" style={U.catRail}>
              {shopCats.map((c) => {
                const on = c.id === activeCat;
                const iconId = CAT_ICON[c.id] || c.items?.[0]?.id;
                return (
                  <button key={c.id} type="button" style={U.catBtn} onClick={() => setActiveCat(c.id)}>
                    <img src={itemImage(iconId)} alt="" style={{ ...U.catImg, ...(on ? U.catImgOn : {}) }} onError={onImgError} />
                    <span style={{ ...U.catName, ...(on ? U.catNameOn : {}) }}>{CAT_SHORT[c.id] || c.name_ar || c.name}</span>
                    {on ? <span style={U.catLine} /> : <span style={{ height: 3 }} />}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={U.grid}>
            {!shown.length && <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#888", fontWeight: 700 }}>مفيش حاجة بالاسم ده.</p>}
            {shown.map((it) => {
              const src = srcCatOf(cat, it);
              return (
                <ProductCard
                  key={`${src.id}::${it.id}`}
                  cat={cat}
                  it={it}
                  qty={itemQty(src.id, it.id)}
                  onOpen={openItem}
                />
              );
            })}
          </div>
        </>
      )}

      {!hideDock && (
        <nav style={U.dock}>
          <button type="button" style={{ ...U.dockBtn, ...(tab === "menu" && !cartOpen ? U.dockOn : {}) }} onClick={() => { setTab("menu"); setCartOpen(false); }} aria-label="المنيو"><Home size={20} /></button>
          <button type="button" style={{ ...U.dockBtn, ...(tab === "history" ? U.dockOn : {}) }} onClick={() => { setTab("history"); setCartOpen(false); }} aria-label="أرشيفي"><ClipboardList size={20} /></button>
          <button type="button" style={{ ...U.dockBtn, ...(cartOpen ? U.dockOn : {}) }} onClick={() => { setTab("menu"); setCartOpen(true); }} aria-label="العربية">
            <ShoppingBag size={20} />
            {cartCount > 0 && <span style={U.dockDot}>{cartCount}</span>}
          </button>
          {admin && (
            <button type="button" style={U.dockBtn} onClick={() => setView("admin")} aria-label={officeLabel(profile)}>
              <Shield size={20} />
              {inbox.length > 0 && <span style={U.dockDot}>{inbox.length}</span>}
            </button>
          )}
          <button type="button" style={U.dockBtn} onClick={signOut} aria-label="خروج"><LogOut size={20} /></button>
        </nav>
      )}

      {cartOpen && (
        <div style={U.sheetScrim} onClick={() => setCartOpen(false)} role="presentation">
          <div style={{ ...U.sheet, ...(cartLines.length ? { height: "92dvh" } : {}) }} onClick={(e) => e.stopPropagation()} dir="rtl">
            <div style={U.sheetGrab} />
            <h2 style={U.sheetTitle}>العربية</h2>
            <div style={U.sheetBody}>{cartBody}</div>
            {cartLines.length > 0 && (
              <div style={U.sheetBar}>
                <button style={{ ...U.addCart, width: "100%", opacity: submitting || !collectorId ? 0.7 : 1 }} onClick={submit} disabled={submitting || !collectorId}>
                  {submitting ? <><RefreshCw size={16} className="spin" /> ثواني ثواني…</> : <><Check size={16} /> على مسئوليتي</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {pick && <ItemDetail pick={pick} onClose={() => setPick(null)} onAdd={addN} />}

      {bravo?.src && (
        <div style={S.bravoScrim} onClick={closeBravo} role="presentation">
          <div style={S.bravoCard} className={bravo.shake ? "haram-pop" : "bravo-pop"}>
            <img
              src={bravo.src}
              alt=""
              style={S.bravoImg}
              onError={(e) => {
                if (e.currentTarget.dataset.tried) {
                  closeBravo();
                  return;
                }
                e.currentTarget.dataset.tried = "1";
                const p = String(bravo.src || "").replace(/^\//, "").replace(/^memes\//, "").split("?")[0];
                e.currentTarget.src = publicObject(MEMES_BUCKET, p);
              }}
            />
          </div>
        </div>
      )}
      {payOpen && (
        <div style={S.payScrim} onClick={closePay} role="presentation">
          <div style={S.payCardModal} onClick={(e) => e.stopPropagation()} dir="rtl">
            <div style={S.payModalBody}>
              <Logo size="lock" />
              <h2 style={{ ...S.brandTitle, marginTop: 8, fontSize: 20 }}>ادفع وإنت مطمن</h2>
              <p style={{ ...S.brandSub, marginBottom: 10 }}>اختار هتدفع إزاي</p>
              <ChoiceGrid
                value={payMethod}
                onChange={savePayMethod}
                options={[
                  { id: "instapay", label: "إنستاباي" },
                  { id: "cash", label: "هدفع كاش" },
                ]}
              />
              {payMethod === "cash" ? (
                <div style={S.proofBox}>
                  <div style={S.payEditTitle}>هدفع كاش</div>
                  <p style={{ ...S.finePrint, marginTop: 0 }}>من غير سكرين. ادفع للمأمور، وهو هيعلّم دافع لما ياخد الفلوس في إيده.</p>
                  <p style={S.okText}>تمام، الطريقة كاش.</p>
                </div>
              ) : (
                <>
                  <p style={S.brandSub}>{payFor.name ? `امسح كيو آر ${payFor.name} على إنستاباي` : "امسح كيو آر إنستاباي من الموبايل"}</p>
                  <img src={payFor.qr} alt="" className="pay-qr" style={S.payQrImg} />
                  {payFor.link && (
                    <>
                      <a href={payFor.link} target="_blank" rel="noopener noreferrer" style={{ ...S.primaryBtn, width: "100%", marginTop: 4, textDecoration: "none" }}>افتح لينك إنستاباي</a>
                      <button
                        type="button"
                        style={{ ...S.ghostBtn, width: "100%", marginTop: 8, justifyContent: "center" }}
                        onClick={async () => {
                          try { await navigator.clipboard.writeText(payFor.link); showToast("اللينك اتنسخ."); }
                          catch { showToast("النسخ فشل — انسخه بإيدك.", "err"); }
                        }}
                      >
                        <ClipboardCopy size={15} /> انسخ اللينك
                      </button>
                    </>
                  )}
                  <div style={S.proofBox}>
                    <div style={S.payEditTitle}>سكرين التحويل</div>
                    <p style={{ ...S.finePrint, marginTop: 0 }}>بعد ما تحوّل، ارفع صورة التحويل. المأمور مش هيعلّم دافع من غيرها.</p>
                    {proofDone ? <p style={S.okText}>السكرين اترفعت. تمام التمام.</p> : null}
                    <input ref={proofInput} type="file" accept="image/*" style={S.hiddenFile} onChange={onProofFile} />
                    <button
                      type="button"
                      style={{ ...S.ghostBtn, width: "100%", marginTop: 8, justifyContent: "center", opacity: proofBusy ? 0.7 : 1 }}
                      disabled={proofBusy}
                      onClick={() => proofInput.current?.click()}
                    >
                      {proofBusy ? "ثواني…" : (proofDone ? "غيّر السكرين" : "ارفع سكرين التحويل")}
                    </button>
                  </div>
                </>
              )}
            </div>
            <div style={S.payModalBar}>
              <button
                type="button"
                style={{ ...S.primaryBtn, width: "100%", opacity: (payMethod === "cash" || proofDone) ? 1 : 0.55 }}
                onClick={closePay}
              >
                {payMethod === "cash" || proofDone ? "تمام التمام" : "ارفع السكرين أو اختار كاش"}
              </button>
              <p style={{ ...S.finePrint, marginBottom: 0 }}>{PRICE_NOTE}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────── Admin ─────────────── */
function AdminOrderCard({ o, siblings, onMarkPaid, hideCollector }) {
  const [open, setOpen] = useState(false);
  const extra = siblings.filter((x) => x.user_id === o.user_id).length > 1
    ? ` · ${orderNo(siblings.filter((x) => x.user_id === o.user_id), o)}`
    : "";
  const due = money(foodOf(o.items) + DELIVERY_FEE);
  const itemCount = (o.items || []).reduce((s, l) => s + Number(l.qty || 0), 0);
  const collectorLine = o.collectorName ? `نازل على ${o.collectorName}` : "من غير مأمور";
  return (
    <div style={{ ...S.orderRow, ...(o.paid ? S.orderRowPaid : {}) }}>
      <button type="button" style={S.orderRowMain} onClick={() => setOpen((v) => !v)}>
        <div style={{ minWidth: 0, textAlign: "right" }}>
          <div style={{ ...S.personName, fontFamily: "'Cairo',sans-serif" }}>{o.name}{extra}</div>
          <div style={S.orderRowMeta}>
            {teamLabel(o.department) || "من غير فريق"}
            {" · "}
            {itemCount} صنف
            {isCashPay(o) ? " · كاش" : isShotProof(o.pay_proof) ? " · إنستاباي" : ""}
          </div>
          {!hideCollector && <div style={S.collectorTag}>{collectorLine}</div>}
        </div>
        <div style={{ flexShrink: 0, textAlign: "left" }}>
          <div style={{ ...S.orderRowPrice, ...(o.paid ? S.orderRowPricePaid : {}) }}>{due}</div>
          <div style={S.orderRowHint}>{open ? "اقفل التفاصيل" : "التفاصيل"}</div>
        </div>
      </button>
      {open && (
        <div style={S.orderRowBody}>
          <div style={{ ...S.collectorTag, marginTop: 8, marginBottom: 6 }}>{collectorLine}</div>
          {o.phone
            ? <a href={`tel:${o.phone.replace(/\s/g, "")}`} style={S.payPhoneLink} dir="ltr"><Phone size={12} /> {o.phone}</a>
            : <div style={S.payPhone}>مفيش موبايل</div>}
          {o.items.map((l) => (
            <div key={l.key} style={S.personLine}>
              <span>{l.qty}× {l.nameAr || l.name}{l.tierLabel ? <> <span style={S.tierTag}>{l.tierLabel}</span></> : null}</span>
              <span style={S.personLinePrice}>{money(l.price * l.qty)}</span>
            </div>
          ))}
          <Bill food={foodOf(o.items)} />
          {isShotProof(o.pay_proof) ? (
            <div style={S.proofBox}>
              <div style={S.payEditTitle}>سكرين التحويل</div>
              <img src={o.pay_proof} alt="" style={S.proofImg} />
            </div>
          ) : isCashPay(o) ? (
            <p style={S.okText}>هدفع كاش. علّم دافع لما تاخد الفلوس في إيدك.</p>
          ) : <p style={S.errText}>لسه ما رفعش سكرين التحويل، ولا اختار كاش.</p>}
        </div>
      )}
      <div style={S.orderRowFoot}>
        {o.paid ? (
          <span style={S.paidStamp}><Check size={13} /> دافع</span>
        ) : (
          <>
            <span style={S.paidWait}>لسه</span>
            <button type="button" style={S.paidMark} onClick={() => onMarkPaid(o.id)}>
              <Check size={13} /> علّم دافع
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SuperUserCard({ p, meId, busy, open, onToggle, onSave, onPassword, onDelete, onQr }) {
  const [name, setName] = useState(p.name || "");
  const [phone, setPhone] = useState(p.phone || "");
  const [team, setTeam] = useState(p.department || "");
  const [role, setRole] = useState(p.role || "user");
  const [payLink, setPayLink] = useState(p.pay_link || "");
  const [pw, setPw] = useState("");
  const qrInput = useRef(null);
  useEffect(() => {
    setName(p.name || "");
    setPhone(p.phone || "");
    setTeam(p.department || "");
    setRole(p.role || "user");
    setPayLink(p.pay_link || "");
  }, [p.name, p.phone, p.department, p.role, p.pay_link]);
  const mine = p.id === meId;
  const officer = role === "admin" || role === "super_admin";
  return (
    <div style={S.userCard}>
      <button type="button" style={S.userFold} onClick={onToggle}>
        <div style={{ minWidth: 0 }}>
          <div style={{ ...S.personName, fontFamily: "'Cairo',sans-serif" }}>{p.name || "من غير اسم"}</div>
          <div style={S.userFoldMeta}>
            {roleLabel({ ...p, role: p.role })}
            {teamLabel(p.department) ? ` · ${teamLabel(p.department)}` : ""}
            {p.email ? ` · ${p.email}` : ""}
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: "left" }}>
          <span style={{
            ...S.roleBadge,
            marginTop: 0,
            ...(p.role === "super_admin" ? S.roleBadgeSuper : (p.role === "admin" || p.is_admin) ? S.roleBadgeAdmin : {}),
          }}>{roleLabel(p)}</span>
          <div style={S.userFoldHint}>{open ? "اقفل" : "عدّل"}</div>
          <ChevronDown size={16} style={{ display: "block", margin: "4px 0 0 auto", transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
        </div>
      </button>
      {open && (
        <div style={S.userBody} onClick={(e) => e.stopPropagation()}>
          <label style={S.label}>الاسم</label>
          <input style={S.input} value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
          <label style={{ ...S.label, marginTop: 4 }}>الموبايل</label>
          <input style={S.input} value={phone} inputMode="tel" onChange={(e) => setPhone(e.target.value)} disabled={busy} />
          <label style={{ ...S.label, marginTop: 4 }}>الفريق</label>
          <ChoiceGrid
            value={team}
            onChange={setTeam}
            options={[{ id: "", label: "من غير فريق" }, ...TEAMS.map((t) => ({ id: t.id, label: t.label }))]}
          />
          <label style={{ ...S.label, marginTop: 4 }}>الصلاحية</label>
          <select style={S.select} value={role} onChange={(e) => setRole(e.target.value)} disabled={busy}>
            <option value="user">مستخدم</option>
            <option value="admin">مأمور</option>
            <option value="super_admin">مدير</option>
          </select>
          {officer && (
            <div style={S.qrOfficerBox}>
              <div style={S.payEditTitle}>كيو آر إنستاباي بتاعه</div>
              <p style={{ ...S.finePrint, marginTop: 0 }}>اللي يختار المأمور ده في العربية هيشوف الكيو آر ده.</p>
              {p.pay_qr ? <img src={p.pay_qr} alt="" style={S.qrPreviewSm} /> : <p style={S.errText}>لسه مفيش كيو آر — ارفع صورة.</p>}
              <input ref={qrInput} type="file" accept="image/*" style={S.hiddenFile} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onQr(p, f); }} />
              <button type="button" style={{ ...S.ghostBtn, width: "100%", marginTop: 8, justifyContent: "center" }} disabled={busy} onClick={() => qrInput.current?.click()}>
                ارفع كيو آر
              </button>
              <label style={{ ...S.label, marginTop: 12 }}>لينك إنستاباي</label>
              <input
                style={{ ...S.input, direction: "ltr", textAlign: "left" }}
                value={payLink}
                placeholder="https://ipn.eg/..."
                onChange={(e) => setPayLink(e.target.value)}
                disabled={busy}
              />
            </div>
          )}
          <label style={{ ...S.label, marginTop: 4 }}>باسورد جديد</label>
          <input style={S.input} type="password" value={pw} autoComplete="new-password" placeholder="سيبه فاضي لو مش هتغير" onChange={(e) => setPw(e.target.value)} disabled={busy} />
          <div style={S.userActions}>
            <button
              type="button"
              style={{ ...S.ghostBtn, opacity: busy ? 0.7 : 1 }}
              disabled={busy}
              onClick={() => onSave(p, { name: name.trim(), phone: phone.trim(), department: team || null, role, is_admin: role === "admin" || role === "super_admin", pay_link: officer ? normalizePayLink(payLink) : null })}
            >
              احفظ
            </button>
            <button
              type="button"
              style={{ ...S.ghostBtn, opacity: busy ? 0.7 : 1 }}
              disabled={busy || pw.length < 6}
              onClick={() => { onPassword(p, pw); setPw(""); }}
            >
              غيّر الباسورد
            </button>
            {!mine && (
              <button
                type="button"
                style={{ ...S.ghostBtn, color: "#c0392b", borderColor: "#f0c9c4", opacity: busy ? 0.7 : 1, gridColumn: "1 / -1" }}
                disabled={busy}
                onClick={() => onDelete(p)}
              >
                <Trash2 size={14} /> امسح
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SuperUsersPanel({ showToast, meId }) {
  const [people, setPeople] = useState([]);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    let rows = [];
    const { data, error } = await supabase.rpc("admin_directory");
    if (error) {
      const fallback = await supabase.from("profiles").select("id,name,phone,department,role,is_admin,pay_qr,pay_link").order("name");
      if (fallback.error) showToast(fallback.error.message || "الناس مش راضية تظهر.", "err");
      else rows = fallback.data || [];
    } else {
      const { data: pays } = await supabase.from("profiles").select("id,pay_qr,pay_link");
      const map = Object.fromEntries((pays || []).map((x) => [x.id, x]));
      rows = (data || []).map((p) => ({ ...p, ...(map[p.id] || {}) }));
    }
    setPeople(rows);
    if (!quiet) setLoading(false);
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const runAdmin = async (body) => {
    const { data, error } = await supabase.functions.invoke("admin-users", { body });
    const msg = data?.error || error?.message;
    if (msg) throw new Error(msg);
    return data;
  };

  const saveProfile = async (p, patch) => {
    if (!patch.name) return showToast("الاسم ناقص.", "err");
    if ((patch.phone || "").replace(/\D/g, "").length < 7) return showToast("رقم الموبايل ناقص أو غلط.", "err");
    if (!["user", "admin", "super_admin"].includes(patch.role || p.role)) return showToast("الصلاحية غلط.", "err");
    setBusyId(p.id);
    const { error } = await supabase.from("profiles").update(patch).eq("id", p.id);
    if (error) showToast(error.message || "البيانات ما اتحفظتش.", "err");
    else {
      setPeople((rows) => rows.map((x) => (x.id === p.id ? { ...x, ...patch } : x)));
      showToast("اتحفظ. الصلاحية والبيانات اتظبطت.");
    }
    setBusyId(null);
  };

  const uploadQr = async (p, file) => {
    setBusyId(p.id);
    try {
      const dataUrl = await fileToDataUrl(file);
      const { error } = await supabase.from("profiles").update({ pay_qr: dataUrl }).eq("id", p.id);
      if (error) throw error;
      setPeople((rows) => rows.map((x) => (x.id === p.id ? { ...x, pay_qr: dataUrl } : x)));
      showToast(`كيو آر ${p.name} اتحفظ. اللي يختاره هيدفع عليه.`);
    } catch (e) {
      showToast(e.message || "الكيو آر ما اترفعتش.", "err");
    }
    setBusyId(null);
  };

  const setPassword = async (p, password) => {
    setBusyId(p.id);
    try {
      await runAdmin({ action: "set_password", user_id: p.id, password });
      showToast(`باسورد ${p.name} اتغيّر.`);
    } catch (e) {
      showToast(e.message || "الباسورد ما اتغيرش.", "err");
    }
    setBusyId(null);
  };

  const deleteUser = async (p) => {
    if (!window.confirm(`هتمسح ${p.name}؟ الحساب مش هيرجع.`)) return;
    setBusyId(p.id);
    try {
      await runAdmin({ action: "delete", user_id: p.id });
      showToast(`${p.name} اتمسح.`);
      await load();
    } catch (e) {
      showToast(e.message || "المسح فشل.", "err");
    }
    setBusyId(null);
  };

  const needle = q.trim().toLowerCase();
  const shown = people.filter((p) => {
    if (!needle) return true;
    const blob = `${p.name || ""} ${p.phone || ""} ${p.email || ""} ${teamLabel(p.department)} ${roleLabel(p)}`.toLowerCase();
    return blob.includes(needle);
  });

  if (loading && !people.length) return <p style={S.loadText} dir="rtl">بنلمّ الناس…</p>;

  return (
    <div style={{ display: "grid", gap: 10 }} dir="rtl">
      <p style={{ ...S.finePrint, margin: 0 }}>
        اضغط على الاسم عشان تغيّر الباسورد أو الرقم أو الرول أو ترفع كيو آر إنستاباي.
      </p>
      <input style={S.input} value={q} placeholder="دور على اسم أو موبايل أو إيميل" onChange={(e) => setQ(e.target.value)} />
      {shown.map((p) => (
        <SuperUserCard
          key={p.id}
          p={p}
          meId={meId}
          busy={busyId === p.id}
          open={openId === p.id}
          onToggle={() => setOpenId((id) => (id === p.id ? null : p.id))}
          onSave={saveProfile}
          onPassword={setPassword}
          onDelete={deleteUser}
          onQr={uploadQr}
        />
      ))}
      {!shown.length && <p style={S.cartEmpty}>مفيش حد بالاسم ده.</p>}
    </div>
  );
}

function AdminView({ narrow, showToast, profile }) {
  const today = todayStr();
  const superAdmin = isSuperAdmin(profile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [section, setSection] = useState("orders");
  const [mode, setMode] = useState("person");
  const [openTeam, setOpenTeam] = useState("");
  const [pickedOfficer, setPickedOfficer] = useState("");
  const [payQr, setPayQr] = useState(PAY_QR_FALLBACK);
  const [payLinkDraft, setPayLinkDraft] = useState("");
  const [qrBusy, setQrBusy] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [memeBusy, setMemeBusy] = useState(false);
  const [memeSit, setMemeSit] = useState("second_item");
  const [officers, setOfficers] = useState([]);
  const qrInput = useRef(null);
  const logoInput = useRef(null);
  const memeInput = useRef(null);

  useEffect(() => {
    loadPayQr().then(setPayQr);
    loadPayLink().then(setPayLinkDraft);
  }, []);

  useEffect(() => {
    setOpenTeam("");
  }, [selectedDate, pickedOfficer, mode]);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) { setLoading(true); setError(null); }
    try {
      const staff = await loadOfficers();
      setOfficers(staff);
      let query = supabase
        .from("orders")
        .select("id,user_id,collector_id,order_date,items,total,paid,pay_proof,updated_at,profiles!orders_user_id_profiles_fkey(name,phone,department),collector:profiles!orders_collector_id_fkey(id,name)")
        .order("order_date", { ascending: false })
        .order("updated_at", { ascending: true });
      if (!superAdmin) query = query.eq("collector_id", profile.id);
      let { data, error } = await query;
      if (error) {
        let fallback = supabase
          .from("orders")
          .select("id,user_id,collector_id,order_date,items,total,paid,pay_proof,updated_at,profiles!orders_user_id_profiles_fkey(name,phone,department)")
          .order("order_date", { ascending: false })
          .order("updated_at", { ascending: true });
        if (!superAdmin) fallback = fallback.eq("collector_id", profile.id);
        ({ data, error } = await fallback);
      }
      if (error) throw error;
      let expanded = expandOrders(data || []);
      const missingIds = [...new Set(expanded.filter((r) => r.collector_id && !r.collector?.name).map((r) => r.collector_id))];
      if (missingIds.length) {
        const { data: cols } = await supabase.from("profiles").select("id,name").in("id", missingIds);
        const cmap = Object.fromEntries((cols || []).map((c) => [c.id, c]));
        expanded = expanded.map((r) => (r.collector?.name ? r : { ...r, collector: cmap[r.collector_id] || r.collector }));
      }
      const names = Object.fromEntries(staff.map((c) => [c.id, c.name]));
      expanded = expanded.map((r) => r.collector?.name ? r : { ...r, collector: r.collector_id ? { id: r.collector_id, name: names[r.collector_id] || r.collector?.name || "" } : r.collector });
      setRows(expanded);
    } catch (e) { if (!quiet) setError(e.message || "الأوردرات وقفت في الزحمة."); }
    finally { if (!quiet) setLoading(false); }
  }, [superAdmin, profile.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (section !== "orders" && section !== "report") return undefined;
    const t = setInterval(() => load(true), 12000);
    return () => clearInterval(t);
  }, [load, section]);

  const dayOrders = useMemo(
    () => rows.filter((r) => r.order_date === selectedDate)
      .map((r) => ({
        ...r,
        name: r.profiles?.name || "مش معروف",
        phone: r.profiles?.phone || "",
        department: r.profiles?.department || "",
        collectorName: r.collector?.name || "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "ar") || String(orderStamp(a)).localeCompare(String(orderStamp(b)))),
    [rows, selectedDate]
  );
  const visibleOrders = useMemo(() => {
    if (!superAdmin) return dayOrders.filter((o) => o.collector_id === profile.id);
    if (!pickedOfficer) return [];
    if (pickedOfficer === "none") return dayOrders.filter((o) => !o.collector_id);
    return dayOrders.filter((o) => o.collector_id === pickedOfficer);
  }, [dayOrders, superAdmin, profile.id, pickedOfficer]);
  const dayFood = useMemo(() => visibleOrders.reduce((s, o) => s + foodOf(o.items), 0), [visibleOrders]);
  const unpaid = useMemo(() => visibleOrders.filter((o) => !o.paid).length, [visibleOrders]);
  const dayDue = dayFood + DELIVERY_FEE * visibleOrders.length;

  const byCategory = useMemo(() => {
    const cats = {};
    for (const o of visibleOrders) for (const l of o.items) {
      const c = (cats[l.categoryName] = cats[l.categoryName] || { name: l.categoryName, lines: {}, subtotal: 0 });
      const lk = `${l.itemId}::${l.tier}`;
      if (!c.lines[lk]) c.lines[lk] = { name: l.nameAr || l.name, tierLabel: l.tierLabel, price: l.price, qty: 0 };
      c.lines[lk].qty += l.qty; c.subtotal += l.price * l.qty;
    }
    return Object.values(cats).map((c) => ({ ...c, lines: Object.values(c.lines).sort((a, b) => b.qty - a.qty) }));
  }, [visibleOrders]);

  const byTeam = useMemo(() => {
    const map = {};
    for (const o of visibleOrders) {
      const k = o.department || "_none";
      (map[k] = map[k] || []).push(o);
    }
    const keys = Object.keys(map).sort((a, b) => {
      if (a === "_none") return 1;
      if (b === "_none") return -1;
      const ia = TEAM_ORDER.indexOf(a);
      const ib = TEAM_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return keys.map((k) => {
      const orders = map[k];
      const food = orders.reduce((s, o) => s + foodOf(o.items), 0);
      return {
        id: k,
        label: teamLabel(k) || "من غير فريق",
        orders,
        food,
        due: food + DELIVERY_FEE * orders.length,
        unpaid: orders.filter((o) => !o.paid).length,
      };
    });
  }, [visibleOrders]);

  const markPaid = async (orderId) => {
    const current = rows.find((r) => r.id === orderId);
    if (current?.paid) return;
    if (!window.confirm("هتعلّم الأوردر دافع؟ الخطوة دي مش هترجع.")) return;
    setRows((rs) => rs.map((r) => (r.id === orderId ? { ...r, paid: true } : r)));
    const { parentId, batchId } = parseOrderId(orderId);
    let error;
    if (!batchId) {
      ({ error } = await supabase.from("orders").update({ paid: true }).eq("id", parentId));
    } else {
      const { data, error: readErr } = await supabase.from("orders").select("items").eq("id", parentId).single();
      if (readErr) error = readErr;
      else {
        const patch = setBatchPaid(data.items, batchId, true);
        ({ error } = await supabase.from("orders").update(patch).eq("id", parentId));
      }
    }
    if (error) { showToast("الفلوس ما اتعلّمتش.", "err"); setRows((rs) => rs.map((r) => (r.id === orderId ? { ...r, paid: false } : r))); }
    else showToast("اتعلّم دافع.");
  };

  const buildText = () => {
    let out = `${APP_NAME} — أوردر المكتب\n${prettyDate(selectedDate)}\n${"=".repeat(36)}\n\nالأوردر الكامل للمحل\n${"-".repeat(36)}\n`;
    byCategory.forEach((c) => { out += `\n${c.name}\n`; c.lines.forEach((l) => (out += `  ${l.qty}× ${l.name}${l.tierLabel ? ` [${l.tierLabel}]` : ""}  ${money(l.price * l.qty)}\n`)); });
    out += `\n${"=".repeat(36)}\nكل واحد وحقه\n${"-".repeat(36)}\n`;
    visibleOrders.forEach((o) => {
      out += `\n${o.name}${teamLabel(o.department) ? ` · ${teamLabel(o.department)}` : ""}${o.collectorName ? ` · عند ${o.collectorName}` : ""} — ${o.phone}${o.paid ? "  (دافع)" : isCashPay(o) ? "  (كاش)" : ""}\n`;
      o.items.forEach((l) => (out += `  ${l.qty}× ${l.nameAr || l.name}${l.tierLabel ? ` [${l.tierLabel}]` : ""}  ${money(l.price * l.qty)}\n`));
      out += `  يدفع: ${money(foodOf(o.items) + DELIVERY_FEE)}\n`;
    });
    out += `\n${"=".repeat(36)}\nناس: ${visibleOrders.length}\nأكل المحل: ${money(dayFood)}\nتوصيل: ${money(DELIVERY_FEE * visibleOrders.length)}\nحساب اليوم: ${money(dayDue)}\n\n${PRICE_NOTE}\n`;
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

  const onLogoFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLogoBusy(true);
    try {
      const rev = String(Date.now());
      await uploadAsset(LOGO_PATH, file);
      setMediaRev(rev);
      await saveSetting(MEDIA_REV_KEY, rev);
      window.dispatchEvent(new CustomEvent("media-rev", { detail: { rev, path: LOGO_PATH } }));
      showToast("اللوغو اتحفظ. اعمل خروج وشوف صفحة الدخول.");
    } catch (err) {
      showToast(err.message?.includes("Bucket") || err.message?.includes("not found")
        ? "ارفع الصورة على Storage → Logo"
        : settingsSaveHint(err), "err");
    } finally { setLogoBusy(false); }
  };

  const onMemeFiles = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    if (!files.length) return;
    setMemeBusy(true);
    try {
      let n = 0;
      for (const file of files) {
        const key = await uploadAsset(`${memeSit}/${file.name}`, file, MEMES_BUCKET);
        const path = key.startsWith("memes/") ? key : `memes/${key}`;
        const { error } = await supabase.from("meme_files").upsert(
          { situation: memeSit, path, original_name: file.name, sort: n + 1 },
          { onConflict: "situation,path" }
        );
        if (error) throw error;
        n += 1;
      }
      await loadMemeCatalog();
      const sit = MEME_SITUATIONS.find((s) => s.id === memeSit);
      showToast(`اترفع ${n} ميم على «${sit?.labelAr || sit?.label || memeSit}».`);
    } catch (err) {
      showToast(err.message || "الرفع فشل يا معلم.", "err");
    } finally { setMemeBusy(false); }
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

  if (loading && section === "orders") return (<div style={S.adminPad}><div style={S.loadPulse}><Layers size={34} strokeWidth={1.5} /></div><p style={S.loadText} dir="rtl">بنلمّ أوردرات العيال…</p></div>);
  if (error && section === "orders") return (<div style={S.adminPad}><p style={S.loadText}>{error}</p><button style={S.primaryBtn} onClick={() => load()}><RefreshCw size={16} /> جرّب تاني</button></div>);

  return (
    <div style={S.adminWrap} dir="rtl">
      <div style={S.adminTopRow}>
        <div>
          <span style={S.dateEyebrow}>{superAdmin ? "مكتب المدير" : "مكتب المأمور"}</span>
          <h2 style={{ ...S.adminH, fontFamily: "'Cairo',sans-serif" }}>
            {section === "staff" ? "المأمورين" : section === "look" ? "الهوية" : section === "report" ? "التقارير" : "الأوردرات"}
          </h2>
        </div>
        <button style={S.ghostBtn} onClick={() => load()}><RefreshCw size={15} /> حدّث</button>
      </div>

      {superAdmin && (
        <div style={S.deskNav}>
          <button type="button" style={{ ...S.deskNavBtn, ...(section === "orders" ? S.deskNavOn : {}) }} onClick={() => setSection("orders")}>الأوردرات</button>
          <button type="button" style={{ ...S.deskNavBtn, ...(section === "staff" ? S.deskNavOn : {}) }} onClick={() => setSection("staff")}>المأمورين</button>
          <button type="button" style={{ ...S.deskNavBtn, ...(section === "report" ? S.deskNavOn : {}) }} onClick={() => setSection("report")}>التقارير</button>
          <button type="button" style={{ ...S.deskNavBtn, ...(section === "look" ? S.deskNavOn : {}) }} onClick={() => setSection("look")}>الهوية</button>
        </div>
      )}

      {section === "staff" && superAdmin ? (
        <SuperUsersPanel showToast={showToast} meId={profile.id} />
      ) : section === "report" && superAdmin ? (
        <>
          <div style={S.dateBar}>
            <button type="button" style={{ ...S.chip, ...(selectedDate === today ? S.chipOn : {}) }} onClick={() => setSelectedDate(today)}>النهارده</button>
            <label style={S.dateCal}>
              <CalendarDays size={16} />
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={S.dateInput} />
            </label>
          </div>
          <p style={{ ...S.dateBig, fontFamily: "'Cairo',sans-serif", margin: "0 0 12px" }}>{prettyDate(selectedDate)}</p>
          <ReportView orders={dayOrders} officers={officers} teamLabel={teamLabel} />
        </>
      ) : section === "look" && superAdmin ? (
        <div style={S.qrBox}>
          <div style={narrow ? S.payEditStack : S.payEditGrid}>
            <div>
              <div style={S.payEditTitle}>اللوغو</div>
              <Logo size="lg" />
              <input ref={logoInput} type="file" accept="image/*" style={S.hiddenFile} onChange={onLogoFile} />
              <button style={{ ...S.primaryBtn, width: "100%", marginTop: 10, opacity: logoBusy ? 0.7 : 1 }} onClick={() => logoInput.current?.click()} disabled={logoBusy}>
                {logoBusy ? "ثواني…" : "غيّر اللوغو"}
              </button>
              <input ref={memeInput} type="file" accept="image/*" multiple style={S.hiddenFile} onChange={onMemeFiles} />
              <label style={{ ...S.label, marginTop: 14 }}>سيناريو الميم</label>
              <select style={S.select} value={memeSit} onChange={(e) => setMemeSit(e.target.value)}>
                {MEME_SITUATIONS.map((s) => (
                  <option key={s.id} value={s.id}>{s.labelAr || s.label}</option>
                ))}
              </select>
              <button style={{ ...S.ghostBtn, width: "100%", marginTop: 10, justifyContent: "center", opacity: memeBusy ? 0.7 : 1 }} onClick={() => memeInput.current?.click()} disabled={memeBusy}>
                {memeBusy ? "ثواني…" : "ارفع ميمز على السيناريو"}
              </button>
            </div>
            <div>
              <div style={S.payEditTitle}>كيو آر احتياطي</div>
              <p style={{ ...S.finePrint, marginTop: 0 }}>لو المأمور مالوش كيو آر مرفوع، الناس تشوف ده.</p>
              <img src={payQr} alt="" style={S.qrPreviewSm} />
              <input ref={qrInput} type="file" accept="image/*" style={S.hiddenFile} onChange={onQrFile} />
              <button style={{ ...S.primaryBtn, width: "100%", marginTop: 10, opacity: qrBusy ? 0.7 : 1 }} onClick={() => qrInput.current?.click()} disabled={qrBusy}>
                {qrBusy ? "ثواني…" : "غيّر الاحتياطي"}
              </button>
            </div>
            <div>
              <div style={S.payEditTitle}>لينك احتياطي</div>
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
      ) : (
        <>
          <div style={S.dateBar}>
            <button type="button" style={{ ...S.chip, ...(selectedDate === today ? S.chipOn : {}) }} onClick={() => setSelectedDate(today)}>النهارده</button>
            <label style={S.dateCal}>
              <CalendarDays size={16} />
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={S.dateInput} />
            </label>
          </div>
          <p style={{ ...S.dateBig, fontFamily: "'Cairo',sans-serif", margin: "0 0 12px" }}>{prettyDate(selectedDate)}</p>

          {superAdmin && (
            <div style={S.chipRow}>
              {officers.map((c) => {
                const n = dayOrders.filter((o) => o.collector_id === c.id).length;
                return (
                  <button
                    key={c.id}
                    type="button"
                    style={{ ...S.chip, ...(pickedOfficer === c.id ? S.chipOn : {}) }}
                    onClick={() => setPickedOfficer(c.id)}
                  >
                    {c.name}{n ? ` · ${n}` : ""}
                  </button>
                );
              })}
              {dayOrders.some((o) => !o.collector_id) && (
                <button
                  type="button"
                  style={{ ...S.chip, ...(pickedOfficer === "none" ? S.chipOn : {}) }}
                  onClick={() => setPickedOfficer("none")}
                >
                  من غير مأمور · {dayOrders.filter((o) => !o.collector_id).length}
                </button>
              )}
            </div>
          )}
          {superAdmin && !pickedOfficer && (
            <p style={{ ...S.finePrint, marginTop: 0 }}>اختار مأمور من فوق، والأوردرات النازلة عليه في اليوم ده هتظهر.</p>
          )}

          <div style={S.adminStatBar}>
            <span>{visibleOrders.length} {visibleOrders.length === 1 ? "أوردر" : "أوردرات"}</span>
            <span>{unpaid ? `${unpaid} لسه ما دفعوش` : visibleOrders.length ? "كلهم دفعوا" : (superAdmin ? "مفيش أوردرات في اليوم ده" : "مفيش أوردرات نازلة عليك")}</span>
            <span>المفروض يتجمع {money(dayDue)}</span>
          </div>

          <div style={S.chipRow}>
            <button type="button" style={{ ...S.chip, ...(mode === "person" ? S.chipOn : {}) }} onClick={() => setMode("person")}>بالناس</button>
            <button type="button" style={{ ...S.chip, ...(mode === "team" ? S.chipOn : {}) }} onClick={() => setMode("team")}>بالفرق</button>
            <button type="button" style={{ ...S.chip, ...(mode === "full" ? S.chipOn : {}) }} onClick={() => setMode("full")}>أوردر المحل</button>
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
                      <span style={{ flex: 1, fontFamily: "'Cairo',sans-serif" }}>{l.name}{l.tierLabel ? <> <span style={S.tierTag}>{l.tierLabel}</span></> : null}</span>
                      <span style={S.personLinePrice}>{money(l.price * l.qty)}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ ...S.grandTotal, fontFamily: "'Cairo',sans-serif" }}><span>أكل المحل</span><span>{money(dayFood)}</span></div>
              <p style={S.finePrint}>التوصيل 5 جنيه على كل أوردر — مش جزء من أوردر المحل.</p>
              <p style={S.finePrint}>{PRICE_NOTE}</p>
            </div>
          ) : mode === "team" ? (
            <div>
              {byTeam.map((g) => {
                const open = openTeam === g.id;
                return (
                  <div key={g.id} style={S.teamBlock}>
                    <button
                      type="button"
                      style={{ ...S.teamHead, ...(open ? S.teamHeadOpen : {}) }}
                      onClick={() => setOpenTeam(open ? "" : g.id)}
                      aria-expanded={open}
                    >
                      <div style={{ minWidth: 0 }}>
                        <h3 style={S.teamTitle}>{g.label}</h3>
                        <div style={S.teamMeta}>{g.orders.length} أوردر{g.unpaid ? ` · ${g.unpaid} لسه ما دفعوش` : ""}</div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: "left" }}>
                        <div style={S.payAmount}>{money(g.due)}</div>
                        <div style={S.userFoldHint}>{open ? "اقفل" : "الأوردرات"}</div>
                        <ChevronDown size={16} style={{ display: "block", margin: "4px 0 0 auto", transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
                      </div>
                    </button>
                    {open && (
                      <div style={{ ...S.orderList, padding: "0 6px 10px" }}>
                        {g.orders.map((o) => (
                          <AdminOrderCard key={o.id} o={o} siblings={g.orders} onMarkPaid={markPaid} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {!byTeam.length && <p style={S.cartEmpty}>{superAdmin ? "مفيش أوردرات في اليوم ده." : "مفيش أوردرات نازلة عليك في اليوم ده."}</p>}
            </div>
          ) : (
            <div style={S.orderList}>
              {visibleOrders.map((o) => (
                <AdminOrderCard key={o.id} o={o} siblings={visibleOrders} onMarkPaid={markPaid} />
              ))}
              {!visibleOrders.length && (
                <p style={S.cartEmpty}>
                  {superAdmin
                    ? (pickedOfficer ? "مفيش أوردرات نازلة على المأمور ده في اليوم ده." : "اختار مأمور من فوق.")
                    : "مفيش أوردرات نازلة عليك في اليوم ده."}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
