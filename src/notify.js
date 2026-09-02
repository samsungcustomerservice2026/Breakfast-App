import { supabase } from "./supabase.js";

const TITLE = "هيئة مكافحة الجوع المش رسمية";
const BODY = "الأكل وصل — انزل خد الأوردر يا معلم";

// Public half of the VAPID pair. The private key lives in Supabase app_push_vapid.
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY
  || "BL8YTicw4VsjKkblqiEkw9LL2beHRugB7tD00GfO3W9nE-rgx7luVuLjwTkbQgMKLaMSQz4wMRJuYC90_BI8Hf0";

let audioCtx = null;

export function isIosPhone() {
  try {
    return /iphone|ipad|ipod/i.test(navigator.userAgent || "")
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  } catch {
    return false;
  }
}

export function isStandaloneApp() {
  try {
    return window.matchMedia("(display-mode: standalone)").matches
      || window.navigator.standalone === true;
  } catch {
    return false;
  }
}

export function canUseWebPush() {
  try {
    return typeof window !== "undefined"
      && "serviceWorker" in navigator
      && "PushManager" in window
      && typeof Notification !== "undefined";
  } catch {
    return false;
  }
}

export function notifyPermission() {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

const INSTALL_LS = "hayat-home-install";
let installListening = false;
let deferredInstall = null;

export function shouldAskInstall() {
  if (typeof window === "undefined") return false;
  if (isStandaloneApp()) return false;
  try { if (localStorage.getItem(INSTALL_LS)) return false; } catch { /* ignore */ }
  return true;
}

export function dismissInstallAsk() {
  try { localStorage.setItem(INSTALL_LS, "1"); } catch { /* ignore */ }
}

export function canNativeInstall() {
  return !!deferredInstall;
}

export function listenInstallPrompt() {
  if (installListening || typeof window === "undefined") return;
  installListening = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstall = e;
    window.dispatchEvent(new Event("hayat-can-install"));
  });
  window.addEventListener("appinstalled", () => {
    deferredInstall = null;
    dismissInstallAsk();
    window.dispatchEvent(new Event("hayat-installed"));
  });
}

export async function promptInstall() {
  if (!deferredInstall) return "unavailable";
  try {
    deferredInstall.prompt();
    const choice = await deferredInstall.userChoice;
    deferredInstall = null;
    if (choice?.outcome === "accepted") dismissInstallAsk();
    return choice?.outcome || "dismissed";
  } catch {
    deferredInstall = null;
    return "dismissed";
  }
}

export function shouldAskNotify() {
  const perm = notifyPermission();
  if (perm === "granted" || perm === "denied") return false;
  if (isIosPhone() && !isStandaloneApp()) return true;
  return perm === "default" || perm === "unsupported";
}

export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch { /* ignore */ }
}

export function playPingSound() {
  try {
    unlockAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const tone = (freq, start, dur, vol = 0.16) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(vol, now + start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.03);
    };
    tone(880, 0, 0.14);
    tone(1175, 0.12, 0.18);
    tone(1568, 0.28, 0.26, 0.14);
  } catch { /* ignore */ }
}

export function buzzPhone() {
  try { navigator.vibrate?.([220, 80, 220, 80, 420]); } catch { /* ignore */ }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export async function registerNotifyWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

export async function syncPushSubscription(userId) {
  if (!userId || !canUseWebPush()) return false;
  if (notifyPermission() !== "granted") return false;
  try {
    const reg = await registerNotifyWorker();
    const ready = reg ? await navigator.serviceWorker.ready : null;
    const push = ready?.pushManager;
    if (!push) return false;
    let sub = await push.getSubscription();
    if (!sub) {
      sub = await push.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;
    const { error } = await supabase.from("push_subscriptions").upsert({
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent || "",
      updated_at: new Date().toISOString(),
    }, { onConflict: "endpoint" });
    return !error;
  } catch {
    return false;
  }
}

export async function enablePhoneAlerts(userId) {
  unlockAudio();
  await registerNotifyWorker();
  if (typeof Notification === "undefined") return "unsupported";
  let perm = Notification.permission;
  if (perm !== "granted") {
    try { perm = await Notification.requestPermission(); }
    catch { perm = Notification.permission; }
  }
  if (perm === "granted" && userId) await syncPushSubscription(userId);
  return perm;
}

export async function showPhonePing(body = BODY, title = TITLE) {
  playPingSound();
  buzzPhone();
  const text = body || BODY;
  try {
    const ready = navigator.serviceWorker?.ready
      ? await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((resolve) => setTimeout(() => resolve(null), 800)),
      ])
      : null;
    if (ready && Notification.permission === "granted") {
      ready.active?.postMessage({ type: "PING", title, body: text, url: "/" });
      return;
    }
  } catch { /* fall through */ }
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(title, { body: text, icon: "/logo.png", tag: "hayat-delivered", silent: false, lang: "ar", dir: "rtl" });
    }
  } catch { /* ignore */ }
}
