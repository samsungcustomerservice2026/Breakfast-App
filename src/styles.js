export const ink = "#2b2320", cream = "#fbf6ec", paper = "#fffdf8",
  clay = "#c0392b", clayDark = "#9c2a1e", line = "#e7ddcb",
  muted = "#8a7f70", yolk = "#f2b134", green = "#2f6b4f";

export const globalCss = `
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  @keyframes spin{to{transform:rotate(360deg);}}
  .spin{animation:spin .9s linear infinite;}
  @keyframes floaty{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
  @keyframes rise{from{opacity:0;transform:translate(-50%,12px);}to{opacity:1;transform:translate(-50%,0);}}
  button:focus-visible{outline:2px solid ${clay};outline-offset:2px;}
  input:focus-visible{outline:2px solid ${clay};outline-offset:1px;}
  @keyframes bravoPop{0%{transform:scale(.45) rotate(-10deg);opacity:0;}55%{transform:scale(1.1) rotate(3deg);opacity:1;}100%{transform:scale(1) rotate(0);}}
  .bravo-pop{animation:bravoPop .38s cubic-bezier(.2,1.4,.4,1);}
  @keyframes haramShake{0%,100%{transform:rotate(0) scale(1);}18%{transform:rotate(-5deg) scale(1.08);}36%{transform:rotate(5deg) scale(1.06);}54%{transform:rotate(-4deg) scale(1.04);}72%{transform:rotate(3deg);} }
  .haram-pop{animation:haramShake .5s ease;}
  @media (prefers-reduced-motion:reduce){.spin,[style*="floaty"],.bravo-pop,.haram-pop{animation:none!important;}}
  ::-webkit-scrollbar{height:7px;width:7px;}::-webkit-scrollbar-thumb{background:${line};border-radius:9px;}
`;

export const S = {
  app: { fontFamily: "'DM Sans',ui-sans-serif,system-ui,sans-serif", background: cream, color: ink, minHeight: "100vh" },
  screenCenter: { fontFamily: "'DM Sans',ui-sans-serif,system-ui,sans-serif", minHeight: "100vh", background: cream, color: ink, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 24 },
  loadPulse: { color: clay, animation: "floaty 2.2s ease-in-out infinite" },
  loadText: { color: muted, fontSize: 15, textAlign: "center", fontFamily: "'Cairo','DM Sans',sans-serif" },

  signCard: { background: paper, border: `1px solid ${line}`, borderRadius: 20, padding: "30px 26px", width: "100%", maxWidth: 400, boxShadow: "0 18px 50px -30px rgba(80,50,20,.4)" },
  brandRow: { display: "flex", gap: 14, alignItems: "center", marginBottom: 22 },
  logoImg: { width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0, background: paper, border: `1px solid ${line}` },
  logoImgLg: { width: 56, height: 56, borderRadius: "50%", objectFit: "cover", flexShrink: 0, background: paper, border: `1px solid ${line}` },
  brandTitle: { fontFamily: "'Cairo','Fraunces',Georgia,serif", fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: 0, lineHeight: 1.3 },
  brandSub: { margin: "3px 0 0", fontSize: 13.5, color: muted, fontFamily: "'Cairo','DM Sans',sans-serif" },
  label: { display: "block", fontSize: 13, fontWeight: 700, color: muted, marginBottom: 7, fontFamily: "'Cairo','DM Sans',sans-serif" },
  input: { width: "100%", padding: "13px 15px", fontSize: 16, borderRadius: 12, border: `1.5px solid ${line}`, background: cream, color: ink, fontFamily: "inherit" },
  errText: { color: clay, fontSize: 13, marginTop: 10, fontWeight: 600 },
  okText: { color: green, fontSize: 13, marginTop: 10, fontWeight: 600 },
  finePrint: { fontSize: 12.5, color: muted, marginTop: 14, lineHeight: 1.5 },
  linkBtn: { background: "none", border: "none", color: clay, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, padding: 0, marginTop: 14 },

  header: { position: "sticky", top: 0, zIndex: 20, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(251,246,236,.92)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${line}`, flexWrap: "wrap", gap: 8 },
  brandRowSm: { display: "flex", gap: 9, alignItems: "center" },
  logoImgSm: { width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0, background: paper, border: `1px solid ${line}` },
  headerTitle: { fontFamily: "'Cairo','Fraunces',Georgia,serif", fontSize: 17, fontWeight: 700, letterSpacing: 0, lineHeight: 1.25 },
  headerRight: { display: "flex", gap: 8, alignItems: "center" },
  hello: { fontSize: 13.5, color: muted, marginRight: 2 },

  ghostBtn: { display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: `1.5px solid ${line}`, color: ink, borderRadius: 10, padding: "8px 12px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo','DM Sans',sans-serif" },
  primaryBtn: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: clay, color: "#fff", border: "none", borderRadius: 12, padding: "12px 18px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo','DM Sans',sans-serif", boxShadow: `0 8px 20px -12px ${clayDark}` },

  shopWrap: { maxWidth: 1080, margin: "0 auto", padding: "18px 16px 60px" },
  dateBanner: { display: "flex", flexDirection: "column", gap: 2, padding: "16px 20px", background: paper, border: `1px solid ${line}`, borderRadius: 16, marginBottom: 16, borderLeft: `5px solid ${yolk}` },
  dateEyebrow: { fontSize: 12.5, fontWeight: 700, letterSpacing: 0, textTransform: "none", color: clay, fontFamily: "'Cairo','DM Sans',sans-serif" },
  dateBig: { fontFamily: "'Fraunces',Georgia,serif", fontSize: 21, fontWeight: 600, letterSpacing: "-.01em" },

  tabRow: { display: "flex", gap: 8, marginBottom: 16 },
  tabBtn: { background: "transparent", border: `1.5px solid ${line}`, color: muted, borderRadius: 999, padding: "8px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo','DM Sans',sans-serif" },
  tabActive: { background: ink, color: cream, borderColor: ink },

  columns: { display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 20, alignItems: "start" },
  menuCol: { minWidth: 0 },
  catTabs: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 14 },
  catTab: { flexShrink: 0, background: paper, border: `1.5px solid ${line}`, borderRadius: 10, padding: "8px 13px", cursor: "pointer", fontFamily: "'Cairo','DM Sans',sans-serif", color: ink, fontWeight: 700, fontSize: 13.5 },
  catTabActive: { borderColor: clay, background: "#fdeee3", color: clayDark },

  menuGrid: { display: "grid", gap: 10 },
  menuCard: { display: "flex", alignItems: "stretch", gap: 14, background: paper, border: `1px solid ${line}`, borderRadius: 14, padding: "10px 15px 10px 10px" },
  memeFrame: { width: 112, flexShrink: 0, display: "flex", flexDirection: "column" },
  menuImg: { width: 112, height: 86, borderRadius: "12px 12px 0 0", objectFit: "cover", background: cream, border: `1px solid ${line}`, borderBottom: "none" },
  memeBar: { background: ink, color: cream, fontFamily: "'Cairo','Segoe UI',sans-serif", fontSize: 11, fontWeight: 700, textAlign: "center", padding: "6px 5px", borderRadius: "0 0 12px 12px", lineHeight: 1.35, minHeight: 38, display: "flex", alignItems: "center", justifyContent: "center" },
  afeyaFrom: { fontSize: 11, color: muted, fontFamily: "'Cairo','Segoe UI',sans-serif", marginBottom: 4 },
  cartThumb: { width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0, background: cream },
  menuTop: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", marginBottom: 9 },
  menuName: { fontWeight: 700, fontSize: 15 },
  menuAr: { fontSize: 14, color: muted, fontFamily: "'Cairo','Segoe UI',sans-serif" },
  tierRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  tierChip: { display: "flex", alignItems: "center", gap: 8, background: cream, border: `1.5px solid ${line}`, borderRadius: 10, padding: "6px 8px 6px 11px" },
  tierChipActive: { borderColor: clay, background: "#fdeee3" },
  tierName: { fontSize: 12.5, fontWeight: 700, color: muted },
  tierPrice: { fontSize: 13.5, fontWeight: 700, color: clay, fontFamily: "'Fraunces',Georgia,serif" },
  tierAdd: { width: 26, height: 26, borderRadius: 8, background: ink, color: cream, border: "none", display: "grid", placeItems: "center", cursor: "pointer" },
  tierStepper: { display: "flex", alignItems: "center", gap: 3 },
  stepBtnXs: { width: 24, height: 24, borderRadius: 7, border: `1.5px solid ${line}`, background: paper, color: ink, display: "grid", placeItems: "center", cursor: "pointer" },
  stepQtyXs: { minWidth: 16, textAlign: "center", fontWeight: 700, fontSize: 13 },

  stepperSm: { display: "flex", alignItems: "center", gap: 4, flexShrink: 0 },
  stepBtn: { width: 28, height: 28, borderRadius: 8, border: `1.5px solid ${line}`, background: cream, color: ink, display: "grid", placeItems: "center", cursor: "pointer" },
  stepQty: { minWidth: 18, textAlign: "center", fontWeight: 700, fontSize: 14 },

  tierTag: { display: "inline-block", fontSize: 11, fontWeight: 700, color: clayDark, background: "#fdeee3", borderRadius: 6, padding: "1px 6px", marginLeft: 4, verticalAlign: "middle" },

  myOrderBox: { marginTop: 18, background: "#f3f8f2", border: "1px solid #cfe4d0", borderRadius: 14, padding: "16px 18px" },
  myOrderHead: { display: "flex", alignItems: "center", gap: 7, fontWeight: 700, color: green, marginBottom: 10 },
  myOrderLine: { display: "flex", justifyContent: "space-between", gap: 10, fontSize: 14, padding: "3px 0", color: ink },
  myOrderTotal: { display: "flex", justifyContent: "space-between", fontWeight: 700, borderTop: "1px dashed #cfe4d0", marginTop: 8, paddingTop: 8 },
  billRow: { display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13.5, color: muted, padding: "3px 0", fontFamily: "'Cairo','DM Sans',sans-serif" },
  billGrand: { display: "flex", justifyContent: "space-between", gap: 10, fontWeight: 800, borderTop: `1px dashed ${line}`, marginTop: 6, paddingTop: 8, marginBottom: 4, fontSize: 15.5, fontFamily: "'Cairo','DM Sans',sans-serif" },

  cartCol: { position: "sticky", top: 74 },
  cartCard: { background: paper, border: `1px solid ${line}`, borderRadius: 16, padding: "18px 18px 20px", boxShadow: "0 14px 40px -30px rgba(80,50,20,.5)" },
  cartHead: { display: "flex", alignItems: "center", gap: 9, fontWeight: 700, fontSize: 16, marginBottom: 14 },
  cartBadge: { marginLeft: "auto", background: clay, color: "#fff", borderRadius: 999, fontSize: 12.5, fontWeight: 700, padding: "2px 9px" },
  cartEmpty: { color: muted, fontSize: 14, lineHeight: 1.5, margin: 0 },
  cartLines: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 },
  cartLine: { display: "flex", alignItems: "center", gap: 8 },
  cartLineName: { fontSize: 14, fontWeight: 600, fontFamily: "'Cairo','DM Sans',sans-serif" },
  cartLineMeta: { fontSize: 12, color: muted },
  trashBtn: { background: "transparent", border: "none", color: muted, cursor: "pointer", padding: 4, display: "grid", placeItems: "center" },
  cartTotalRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "12px 0", borderTop: `1px solid ${line}`, marginBottom: 12, fontWeight: 700 },
  cartTotalNum: { fontFamily: "'Fraunces',Georgia,serif", fontSize: 20, color: clay },

  historyWrap: { display: "grid", gap: 12, maxWidth: 640 },

  toast: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", color: "#fff", padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 12px 30px -12px rgba(0,0,0,.4)", zIndex: 50, animation: "rise .25s ease", maxWidth: "90vw" },

  adminWrap: { maxWidth: 1080, margin: "0 auto", padding: "18px 16px 60px" },
  adminPad: { maxWidth: 1080, margin: "0 auto", padding: "60px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 },
  adminTopRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 },
  adminH: { fontFamily: "'Fraunces',Georgia,serif", fontSize: 24, fontWeight: 600, margin: "2px 0 0", letterSpacing: "-.02em" },
  emptyState: { background: paper, border: `1px dashed ${line}`, borderRadius: 16, padding: "40px 24px", textAlign: "center" },

  dateTabs: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 14 },
  dateTab: { flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, background: paper, border: `1.5px solid ${line}`, borderRadius: 12, padding: "9px 14px", cursor: "pointer", fontFamily: "inherit", color: ink, fontWeight: 700, fontSize: 14 },
  dateTabActive: { borderColor: clay, background: "#fdeee3", color: clayDark },
  dateTabDate: { fontSize: 11, fontWeight: 500, color: muted },

  adminActions: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" },
  adminStat: { marginLeft: "auto", fontSize: 14, color: muted, fontWeight: 600 },
  adminStatBar: { display: "flex", flexWrap: "wrap", gap: "8px 14px", background: paper, border: `1px solid ${line}`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 13.5, fontWeight: 700, color: ink, fontFamily: "'Cairo','DM Sans',sans-serif" },
  adminTabs: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 },
  adminTab: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: paper, border: `1.5px solid ${line}`, color: muted, borderRadius: 14, padding: "12px 10px", fontSize: 14.5, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo','DM Sans',sans-serif" },
  adminTabActive: { background: ink, color: cream, borderColor: ink },
  adminTabSub: { fontSize: 11, fontWeight: 600, opacity: 0.75 },
  payFold: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: paper, border: `1.5px solid ${line}`, borderRadius: 14, padding: "12px 14px", marginBottom: 10, cursor: "pointer", textAlign: "right", fontFamily: "'Cairo','DM Sans',sans-serif", color: ink },
  payFoldHint: { display: "block", fontSize: 12, fontWeight: 600, color: muted, marginTop: 2 },
  payEditGrid: { display: "grid", gridTemplateColumns: "160px minmax(0,1fr)", gap: 16, alignItems: "start" },
  payEditStack: { display: "grid", gap: 16 },
  payEditTitle: { fontWeight: 800, fontFamily: "'Cairo',sans-serif", marginBottom: 8 },
  qrPreviewSm: { width: "100%", maxWidth: 160, display: "block", margin: "0 auto", borderRadius: 12, background: "#fff", border: `1px solid ${line}` },
  payPhoneLink: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: clay, marginTop: 4, fontWeight: 700, textDecoration: "none", fontFamily: "'DM Sans',sans-serif" },

  modeRow: { display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" },
  modeBtn: { display: "inline-flex", alignItems: "center", gap: 7, background: paper, border: `1.5px solid ${line}`, color: muted, borderRadius: 10, padding: "9px 14px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  modeActive: { background: ink, color: cream, borderColor: ink },

  fullWrap: { display: "grid", gap: 14, maxWidth: 720 },
  catBlock: { background: paper, border: `1px solid ${line}`, borderRadius: 14, padding: "14px 16px" },
  catBlockHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline", fontFamily: "'Fraunces',Georgia,serif", fontSize: 16, fontWeight: 600, marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${line}` },
  catBlockSub: { fontSize: 14, color: clay },
  tallyLineLight: { display: "flex", alignItems: "center", gap: 10, fontSize: 14.5, padding: "5px 0" },
  tallyQtyDark: { fontFamily: "'Fraunces',Georgia,serif", fontWeight: 600, color: clay, minWidth: 30 },
  personLinePrice: { color: muted, fontSize: 13.5, whiteSpace: "nowrap" },
  grandTotal: { display: "flex", justifyContent: "space-between", background: ink, color: cream, borderRadius: 14, padding: "16px 20px", fontWeight: 700, fontSize: 17, fontFamily: "'Fraunces',Georgia,serif" },

  personGrid: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12, alignItems: "start" },
  payCard: { background: paper, border: `1px solid ${line}`, borderRadius: 14, padding: "14px 16px" },
  payCardPaid: { borderColor: "#cfe4d0", background: "#f6fbf5" },
  payHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 9, paddingBottom: 9, borderBottom: `1px dashed ${line}` },
  personName: { fontWeight: 700, fontSize: 15.5 },
  payPhone: { display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: muted, marginTop: 2 },
  payAmount: { fontFamily: "'Fraunces',Georgia,serif", fontWeight: 600, color: clay, fontSize: 18, whiteSpace: "nowrap" },
  personLine: { display: "flex", justifyContent: "space-between", gap: 8, fontSize: 14, padding: "3px 0" },
  payFoot: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 9, paddingTop: 9, borderTop: `1px solid ${line}` },
  paidToggle: { display: "inline-flex", alignItems: "center", gap: 6, border: `1.5px solid ${line}`, background: cream, borderRadius: 999, padding: "5px 11px", fontSize: 12.5, fontWeight: 700, color: muted, cursor: "pointer", fontFamily: "inherit" },
  paidToggleOn: { borderColor: green, background: "#e9f5ea", color: green },
  personCard: { background: paper, border: `1px solid ${line}`, borderRadius: 14, padding: "14px 16px" },
  personHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8, paddingBottom: 8, borderBottom: `1px dashed ${line}` },
  personTotal: { fontFamily: "'Fraunces',Georgia,serif", fontWeight: 600, color: clay },

  bravoScrim: { position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,.62)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, cursor: "pointer" },
  bravoCard: { position: "relative", maxWidth: "min(420px, 92vw)" },
  bravoImg: { display: "block", width: "100%", maxHeight: "62vh", objectFit: "contain", borderRadius: 18, background: "#111", boxShadow: "0 24px 60px -18px rgba(0,0,0,.7)" },
  bravoYell: { position: "absolute", left: 0, right: 0, bottom: 0, padding: "14px 12px 16px", borderRadius: "0 0 18px 18px", background: "linear-gradient(transparent, rgba(0,0,0,.82))", color: "#ffe14a", fontFamily: "'Cairo','Segoe UI',sans-serif", fontWeight: 800, fontSize: "clamp(22px, 6vw, 34px)", textAlign: "center", lineHeight: 1.2, textShadow: "0 2px 0 #000, 0 0 10px #000", letterSpacing: 0 },
  qrBox: { background: paper, border: `1px solid ${line}`, borderRadius: 16, padding: 16, marginBottom: 16 },
  qrPreview: { width: "100%", maxWidth: 280, display: "block", margin: "10px auto 0", borderRadius: 12, background: "#fff", border: `1px solid ${line}` },
  payCardModal: { background: paper, borderRadius: 20, padding: "22px 20px 20px", width: "min(420px, 92vw)", textAlign: "center", boxShadow: "0 24px 60px -18px rgba(0,0,0,.5)" },
  payQrImg: { width: "100%", maxWidth: 280, height: "auto", objectFit: "contain", borderRadius: 12, background: "#fff", border: `1px solid ${line}`, margin: "12px auto", display: "block" },
  hiddenFile: { display: "none" },
};
