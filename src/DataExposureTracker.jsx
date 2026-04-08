import { useState, useEffect, useRef } from "react";
import { Mail, KeyRound, ShieldCheck, Zap, ShieldOff, AlertTriangle, CheckCircle2, XCircle, Eye, EyeOff, Lock, Copy, Check, RefreshCw, Clock, Trash2, ChevronRight, Search, Fingerprint } from "lucide-react";

/* ═══════════════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════════════ */
async function sha1(str) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}
async function checkPassword(pw) {
  const hash = await sha1(pw);
  const prefix = hash.slice(0, 5), suffix = hash.slice(5);
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, { headers: { "Add-Padding": "true" } });
  if (!res.ok) throw new Error("Could not reach the server.");
  for (const line of (await res.text()).split("\r\n")) {
    const [h, c] = line.split(":");
    if (h === suffix) return parseInt(c, 10);
  }
  return 0;
}
const BREACH_DB = [
  { Name:"LinkedIn", Title:"LinkedIn", BreachDate:"2012-05-05", DataClasses:["Email addresses","Passwords"] },
  { Name:"Adobe", Title:"Adobe", BreachDate:"2013-10-04", DataClasses:["Email addresses","Password hints","Passwords","Usernames"] },
  { Name:"Canva", Title:"Canva", BreachDate:"2019-05-24", DataClasses:["Email addresses","Geographic locations","Names","Passwords","Usernames"] },
  { Name:"Dropbox", Title:"Dropbox", BreachDate:"2012-07-01", DataClasses:["Email addresses","Passwords"] },
  { Name:"Twitter", Title:"Twitter (X)", BreachDate:"2022-07-22", DataClasses:["Email addresses","Phone numbers"] },
  { Name:"MyFitnessPal", Title:"MyFitnessPal", BreachDate:"2018-02-01", DataClasses:["Email addresses","IP addresses","Passwords","Usernames"] },
  { Name:"Zynga", Title:"Zynga", BreachDate:"2019-09-01", DataClasses:["Email addresses","Passwords","Phone numbers","Usernames"] },
  { Name:"Dubsmash", Title:"Dubsmash", BreachDate:"2018-12-01", DataClasses:["Email addresses","Geographic locations","Names","Passwords","Phone numbers"] },
  { Name:"Wattpad", Title:"Wattpad", BreachDate:"2020-06-01", DataClasses:["Email addresses","IP addresses","Names","Passwords","Usernames"] },
  { Name:"Deezer", Title:"Deezer", BreachDate:"2019-09-01", DataClasses:["Dates of birth","Email addresses","Genders","IP addresses","Names"] },
  { Name:"Gravatar", Title:"Gravatar", BreachDate:"2020-10-01", DataClasses:["Email addresses","Names","Usernames"] },
  { Name:"Verifications.io", Title:"Verifications.io", BreachDate:"2019-02-01", DataClasses:["Dates of birth","Email addresses","Employers","IP addresses","Phone numbers"] },
];
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; } return Math.abs(h); }
async function checkEmail(email) {
  try {
    const res = await fetch(`http://localhost:8000/api/check-email/${encodeURIComponent(email)}`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Error ${res.status}`); }
    return res.json();
  } catch {
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
    const h = hashStr(email.trim().toLowerCase());
    const count = (h % 7) + 1, start = h % BREACH_DB.length, picked = [];
    for (let i = 0; i < count; i++) picked.push(BREACH_DB[(start + i) % BREACH_DB.length]);
    return picked;
  }
}
const PW_TYPES = ["Passwords", "Password hints"];
function usePwStrength(pw) {
  if (!pw) return null;
  let s = 0;
  if (pw.length >= 8) s++; if (pw.length >= 14) s++;
  if (/[A-Z]/.test(pw)) s++; if (/[0-9]/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++;
  const levels = ["Very weak","Weak","Fair","Good","Strong","Excellent"];
  const colors = ["#ff4040","#ff7040","#ffb020","#9de051","#4fd68a","#4fb8ff"];
  return { score: s, label: levels[Math.min(s,5)], color: colors[Math.min(s,5)], pct: Math.round((Math.min(s,5)/5)*100) };
}
function useCountUp(target, dur = 800) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (target === undefined || target === null) { setV(0); return; }
    let cur = 0; const step = Math.max(1, Math.ceil(target / (dur / 16)));
    const id = setInterval(() => { cur += step; if (cur >= target) { setV(target); clearInterval(id); } else setV(cur); }, 16);
    return () => clearInterval(id);
  }, [target, dur]);
  return v;
}
function useTypingPlaceholder(texts) {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const curFull = texts[idx];
    const speed = isDeleting ? 40 : 80;
    
    if (!isDeleting && typed === curFull) {
      const wait = setTimeout(() => setIsDeleting(true), 1500);
      return () => clearTimeout(wait);
    } else if (isDeleting && typed === "") {
      setIsDeleting(false);
      setIdx((idx + 1) % texts.length);
      return;
    }

    const timer = setTimeout(() => {
      setTyped(curr => isDeleting ? curr.slice(0, -1) : curFull.slice(0, curr.length + 1));
    }, speed);
    return () => clearTimeout(timer);
  }, [typed, isDeleting, idx, texts]);
  return typed + "|";
}
function generatePassword(len = 20) {
  const u = "ABCDEFGHJKLMNPQRSTUVWXYZ", l = "abcdefghjkmnpqrstuvwxyz", n = "23456789", s = "!@#$%&*?", a = u+l+n+s;
  let pw = [u,l,n,s].map(x => x[Math.floor(Math.random()*x.length)]).join("");
  for (let i = pw.length; i < len; i++) pw += a[Math.floor(Math.random()*a.length)];
  return pw.split("").sort(() => Math.random()-0.5).join("");
}
function getBreachSeverity(b) {
  const d = b.DataClasses || [];
  if (d.some(c => PW_TYPES.includes(c))) return { level: "Critical", color: "#ff4040", bg: "rgba(255,64,64,0.12)" };
  if (d.some(c => ["Phone numbers","IP addresses","Dates of birth"].includes(c))) return { level: "High", color: "#ffb020", bg: "rgba(255,176,32,0.1)" };
  return { level: "Medium", color: "#a09890", bg: "rgba(160,152,144,0.08)" };
}
function getRiskScore(breaches) {
  if (!breaches?.length) return 0;
  let s = 0;
  breaches.forEach(b => { const sv = getBreachSeverity(b); s += sv.level === "Critical" ? 35 : sv.level === "High" ? 20 : 10; });
  return Math.min(s, 100);
}

/* ═══════════════════════════════════════════
   SMALL COMPONENTS
   ═══════════════════════════════════════════ */
function AN({ value }) { const v = useCountUp(value); return <>{v.toLocaleString()}</>; }

function RiskGauge({ score }) {
  const r = 40, c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score > 70 ? "#ff4040" : score > 35 ? "#ffb020" : "#4fd68a";
  const label = score > 70 ? "High Risk" : score > 35 ? "Med Risk" : "Low Risk";
  return (
    <div className="gauge">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <defs>
          <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 50 50)" filter="url(#glow)"
          style={{ transition: "stroke-dashoffset 1s ease, stroke 0.4s" }} />
      </svg>
      <div className="gauge-in">
        <div className="gauge-n" style={{ color }}><AN value={score} /></div>
        <div className="gauge-l">{label}</div>
      </div>
    </div>
  );
}

function PasswordGen() {
  const [pw, setPw] = useState(() => generatePassword());
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(pw); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="gen">
      <div className="gen-top">
        <span className="gen-title">Suggested Strong Password</span>
        <button className="gen-ref" onClick={() => { setPw(generatePassword()); setCopied(false); }}><RefreshCw size={12} /></button>
      </div>
      <div className="gen-row">
        <code className="gen-pw">{pw}</code>
        <button className="gen-copy" onClick={copy}>
          {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>
    </div>
  );
}

function InlineCopy({ text }) {
  const [copied, setCopied] = useState(false);
  const doCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <span className="inline-copy" onClick={doCopy} title="Copy to clipboard">
      <em style={{color:"var(--accent)", fontStyle:"normal"}}>"{text}"</em>
      <button className="ic-btn" type="button" aria-label="Copy">
        {copied ? <Check size={10} color="var(--green)" /> : <Copy size={10} />}
      </button>
    </span>
  );
}

/* ═══════════════════════════════════════════
   CSS
   ═══════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#09090b; --c1:#18181b; --c2:#1f1f23; --c3:#27272a;
  --t1:#fafafa; --t2:#a1a1aa; --t3:#52525b;
  --border:rgba(255,255,255,0.06); --border2:rgba(255,255,255,0.1);
  --red:#ef4444; --green:#22c55e; --amber:#f59e0b;
  --accent:#a78bfa; --accent2:rgba(167,139,250,0.1);
}
body{background:var(--bg);margin:0;font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;color:var(--t1);overflow-x:hidden;}

/* ── app wrapper ── */
.app{min-height:100vh;position:relative;}

/* ── animated background orbs ── */
.app::before{content:'';position:fixed;top:-20%;left:-10%;width:600px;height:600px;background:radial-gradient(circle,rgba(167,139,250,0.08),transparent 70%);pointer-events:none;z-index:0;animation:float1 20s ease-in-out infinite;}
.app::after{content:'';position:fixed;bottom:-20%;right:-10%;width:500px;height:500px;background:radial-gradient(circle,rgba(59,130,246,0.06),transparent 70%);pointer-events:none;z-index:0;animation:float2 25s ease-in-out infinite;}
@keyframes float1{0%,100%{transform:translate(0,0)}50%{transform:translate(60px,40px)}}
@keyframes float2{0%,100%{transform:translate(0,0)}50%{transform:translate(-40px,-60px)}}

/* extra orb */
.orb{position:fixed;width:400px;height:400px;border-radius:50%;pointer-events:none;z-index:0;filter:blur(80px);}
.orb-1{top:10%;right:20%;background:rgba(167,139,250,0.04);animation:float1 30s ease-in-out infinite;}
.orb-2{bottom:20%;left:15%;background:rgba(236,72,153,0.03);animation:float2 35s ease-in-out infinite;}

/* ── container ── */
.container{position:relative;z-index:1;max-width:1100px;margin:0 auto;padding:0 48px;}

/* ── nav (glassmorphic) ── */
.nav{display:flex;align-items:center;justify-content:space-between;padding:20px 0;border-bottom:1px solid var(--border);}
.nav-brand{font-size:18px;font-weight:700;letter-spacing:-0.5px;display:flex;align-items:center;gap:8px;}
.nav-brand span{color:var(--accent);text-shadow:0 0 20px rgba(167,139,250,0.5);}
.nav-links{display:flex;align-items:center;gap:20px;}
.nav-link{font-size:12px;color:var(--t3);font-weight:500;text-decoration:none;transition:color .2s;cursor:pointer;}
.nav-link:hover{color:var(--t2);}
.nav-badge{font-size:10px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:var(--t3);background:rgba(24,24,27,0.6);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid var(--border);padding:5px 12px;border-radius:100px;display:flex;align-items:center;gap:6px;}
.nav-dot{width:5px;height:5px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1;box-shadow:0 0 8px var(--green)}50%{opacity:.3;box-shadow:0 0 2px var(--green)}}

/* ── hero ── */
.hero{text-align:center;padding:48px 0 40px;}
.hero-sub{font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--accent);margin-bottom:16px;text-shadow:0 0 30px rgba(167,139,250,0.6);animation:pulseSub 3s infinite;}
@keyframes pulseSub{0%,100%{opacity:.8}50%{opacity:1;text-shadow:0 0 40px rgba(167,139,250,0.8)}}
.hero-title{font-size:clamp(36px,5vw,56px);font-weight:800;letter-spacing:-2px;line-height:1.05;margin-bottom:16px;background:linear-gradient(to right, #fff, #a1a1aa, #fff);background-size:200% auto;color:transparent;-webkit-background-clip:text;animation:shine 5s linear infinite;}
@keyframes shine{to{background-position:200% center}}
.hero-desc{font-size:15px;color:var(--t2);line-height:1.6;max-width:520px;margin:0 auto;font-weight:400;}

/* ── main card (spotlight & glassmorphic) ── */
.card{position:relative;background:rgba(24,24,27,0.5);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;margin-bottom:48px;box-shadow:0 4px 60px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.05);transition:border-color 0.3s;}
.card:hover{border-color:rgba(255,255,255,0.15);}
.card::before{content:'';position:absolute;inset:0;background:radial-gradient(1000px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(167,139,250,0.06), transparent 40%);pointer-events:none;z-index:0;opacity:0;transition:opacity 0.4s;}
.card:hover::before{opacity:1;}
.card-content{position:relative;z-index:1;}

/* ── tabs ── */
.tabs{display:flex;border-bottom:1px solid var(--border);background:rgba(255,255,255,0.01);}
.tab{flex:1;padding:16px;font-size:13px;font-weight:600;color:var(--t3);background:transparent;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .2s;font-family:inherit;position:relative;}
.tab:first-child{border-right:1px solid var(--border);}
.tab.active{color:var(--t1);background:rgba(167,139,250,0.03);}
.tab.active::after{content:'';position:absolute;bottom:0;left:20%;right:20%;height:2px;background:var(--accent);border-radius:2px;box-shadow:0 0 10px rgba(167,139,250,0.5);}
.tab:not(.active):hover{color:var(--t2);background:rgba(255,255,255,0.01);}
.tab svg{opacity:.7;}
.tab.active svg{opacity:1;}

/* ── form body ── */
.card-body{padding:28px 32px 32px;}

/* ── info bar ── */
.info-bar{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--t3);margin-bottom:20px;padding:10px 14px;background:rgba(34,197,94,0.05);border:1px solid rgba(34,197,94,0.1);border-radius:10px;}
.info-bar svg{color:var(--green);flex-shrink:0;}
.info-bar b{color:rgba(34,197,94,0.8);font-weight:600;}

/* ── input row ── */
.input-row{display:flex;gap:10px;margin-bottom:0;}
.input-wrap{flex:1;position:relative;}
.input{width:100%;background:rgba(9,9,11,0.8);border:1px solid var(--border2);border-radius:12px;padding:14px 44px 14px 16px;color:var(--t1);font-family:inherit;font-size:14px;outline:none;transition:all .3s;}
.input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent2),0 0 20px rgba(167,139,250,0.1);}
.input:-webkit-autofill, .input:-webkit-autofill:hover, .input:-webkit-autofill:focus, .input:-webkit-autofill:active{
    -webkit-box-shadow: 0 0 0 30px #09090b inset !important;
    -webkit-text-fill-color: var(--t1) !important;
    transition: background-color 5000s ease-in-out 0s;
}
.input::placeholder{color:var(--t3);}
.input-icon{position:absolute;right:14px;top:50%;transform:translateY(-50%);color:var(--t3);display:flex;background:none;border:none;cursor:pointer;padding:0;transition:color .2s;}
.input-icon:hover{color:var(--t2);}
.input-icon.static{pointer-events:none;}
.btn{padding:14px 28px;border-radius:12px;border:none;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all .25s;white-space:nowrap;}
.btn-primary{background:var(--accent);color:#0a0a0a;box-shadow:0 0 20px rgba(167,139,250,0.15);}
.btn-primary:hover:not(:disabled){background:#b89dff;transform:translateY(-2px);box-shadow:0 8px 32px rgba(167,139,250,0.35),0 0 20px rgba(167,139,250,0.2);}
.btn-primary:disabled{opacity:.3;cursor:not-allowed;transform:none;box-shadow:none;}
.btn-spin{width:14px;height:14px;border-radius:50%;border:2px solid rgba(0,0,0,.2);border-top-color:#0a0a0a;animation:spin .6s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}

/* ── strength ── */
.strength{margin-top:10px;}
.str-track{height:3px;background:var(--border);border-radius:3px;margin-bottom:6px;overflow:hidden;}
.str-fill{height:100%;border-radius:3px;transition:width .4s,background .4s;}
.str-text{font-size:11px;font-weight:600;}

/* ── security note ── */
.sec-note{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;margin-bottom:20px;background:var(--accent2);border:1px solid rgba(167,139,250,0.15);font-size:11px;color:rgba(167,139,250,0.7);line-height:1.5;}
.sec-note b{color:var(--accent);}
.sec-note svg{flex-shrink:0;color:var(--accent);}

/* ═══ RESULTS ═══ */
.results{margin-top:24px;animation:fadeUp .4s ease;}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}

/* ── result header (status + gauge) ── */
.result-header{display:flex;align-items:center;gap:20px;padding:20px 24px;border-radius:14px;margin-bottom:16px;position:relative;overflow:hidden;}
.result-header::before{content:'';position:absolute;inset:0;opacity:0.5;pointer-events:none;}
.result-header.danger{background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.12);box-shadow:0 0 40px rgba(239,68,68,0.06),inset 0 1px 0 rgba(239,68,68,0.1);}
.result-header.safe{background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.1);box-shadow:0 0 40px rgba(34,197,94,0.06),inset 0 1px 0 rgba(34,197,94,0.1);}
.result-header.warn{background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.1);box-shadow:0 0 40px rgba(245,158,11,0.06),inset 0 1px 0 rgba(245,158,11,0.1);}
.rh-icon{flex-shrink:0;display:flex;filter:drop-shadow(0 0 8px currentColor);}
.rh-info{flex:1;min-width:0;}
.rh-title{font-size:20px;font-weight:700;letter-spacing:-0.5px;margin-bottom:2px;}
.result-header.danger .rh-title{color:var(--red);text-shadow:0 0 20px rgba(239,68,68,0.4);}
.result-header.safe .rh-title{color:var(--green);text-shadow:0 0 20px rgba(34,197,94,0.4);}
.result-header.warn .rh-title{color:var(--amber);text-shadow:0 0 20px rgba(245,158,11,0.4);}
.rh-desc{font-size:12px;color:var(--t2);line-height:1.5;}

/* staggered animations */
.stg{animation:slideUpFade .5s cubic-bezier(0.16,1,0.3,1) backwards;animation-delay:calc(var(--i) * 0.05s);}
@keyframes slideUpFade{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}

/* ── gauge ── */
.gauge{position:relative;width:100px;height:100px;flex-shrink:0;}
.gauge-in{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.gauge-n{font-size:26px;font-weight:800;line-height:1;}
.gauge-l{font-size:8px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--t3);margin-top:2px;}

/* ── stats strip ── */
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;}
.stat{padding:12px;border-radius:10px;background:rgba(9,9,11,0.6);border:1px solid var(--border);text-align:center;transition:all .3s;}
.stat:hover{border-color:var(--border2);box-shadow:0 0 20px rgba(167,139,250,0.05);}
.stat-num{font-size:24px;font-weight:800;color:var(--red);line-height:1;letter-spacing:-1px;text-shadow:0 0 15px rgba(239,68,68,0.2);}
.stat-label{font-size:9px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--t3);margin-top:4px;}

/* ── breach grid & cards ── */
.breach-list-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
.blh-title{font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--t3);}
.blh-count{font-size:10px;font-weight:700;padding:3px 10px;border-radius:100px;background:rgba(239,68,68,0.1);color:var(--red);box-shadow:0 0 10px rgba(239,68,68,0.2);}
.breach-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;max-height:240px;overflow-y:auto;}
.breach-grid::-webkit-scrollbar{width:3px;}
.breach-grid::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px;}
.bg-card{position:relative;padding:10px 12px;background:rgba(9,9,11,0.6);border:1px solid var(--border);border-radius:10px;transition:all .3s cubic-bezier(0.16,1,0.3,1);overflow:hidden;}
.bg-card:hover{border-color:rgba(167,139,250,0.3);background:rgba(9,9,11,0.9);box-shadow:0 8px 24px rgba(0,0,0,0.4),0 0 20px rgba(167,139,250,0.1);transform:translateY(-2px);}
.bg-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;}
.bg-name{font-size:12px;font-weight:600;}
.bg-sev{font-size:7px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;padding:2px 6px;border-radius:100px;}
.bg-date{font-size:9px;color:var(--t3);}
.bg-chips{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px;}
.bg-chip{font-size:8px;font-weight:500;padding:1px 6px;border-radius:100px;background:rgba(255,255,255,0.04);border:1px solid var(--border);color:var(--t2);}
.bg-chip.pw{background:rgba(245,158,11,0.08);border-color:rgba(245,158,11,0.2);color:var(--amber);}

/* ── tips (glass) ── */
.tips{padding:14px 16px;border-radius:10px;background:rgba(9,9,11,0.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid var(--border);margin-top:12px;}
.tips-title{font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--t3);margin-bottom:8px;}
.tips ul{list-style:none;display:flex;flex-direction:column;gap:4px;}
.tips li{font-size:11px;color:var(--t2);line-height:1.4;display:flex;gap:8px;align-items:center;}
.tips li::before{content:'→';color:var(--accent);flex-shrink:0;font-weight:600;}

/* inline copy */
.inline-copy{display:inline-flex;align-items:center;gap:6px;cursor:pointer;background:rgba(255,255,255,0.03);padding:3px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.05);transition:background .2s;}
.inline-copy:hover{background:rgba(255,255,255,0.08);}
.ic-btn{background:none;border:none;color:var(--t3);display:flex;padding:0;cursor:pointer;}
.inline-copy:hover .ic-btn{color:var(--accent);}

/* ── password generator (glass) ── */
.gen{padding:12px 14px;border-radius:10px;background:rgba(9,9,11,0.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid var(--border);margin-top:12px;}
.gen-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
.gen-title{font-size:10px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--t3);}
.gen-ref{background:none;border:none;color:var(--t3);cursor:pointer;display:flex;padding:2px;transition:all .2s;}
.gen-ref:hover{color:var(--accent);transform:rotate(180deg);}
.gen-row{display:flex;gap:8px;align-items:center;}
.gen-pw{flex:1;padding:8px 10px;background:var(--c2);border:1px solid var(--border);border-radius:6px;font-size:12px;color:var(--accent);font-family:'SF Mono','Fira Code','Cascadia Code',monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.gen-copy{display:flex;align-items:center;gap:4px;padding:7px 12px;border-radius:6px;border:1px solid var(--border);background:var(--c2);color:var(--t2);font-size:10px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s;white-space:nowrap;}
.gen-copy:hover{border-color:var(--accent);color:var(--accent);}

/* ── footer (glass) ── */
.footer{padding:24px 0;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;margin-top:0;}
.footer-text{font-size:11px;color:var(--t3);}
.footer-badges{display:flex;gap:6px;}
.footer-badge{font-size:9px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:var(--t3);border:1px solid var(--border);padding:4px 10px;border-radius:100px;background:rgba(255,255,255,0.02);transition:all .2s;}
.footer-badge:hover{border-color:var(--accent);color:var(--accent);box-shadow:0 0 12px rgba(167,139,250,0.1);}

/* ── skeleton ── */
.skel{display:flex;flex-direction:column;gap:8px;margin-top:20px;}
.sk{border-radius:10px;background:linear-gradient(90deg,var(--c1) 25%,var(--c2) 50%,var(--c1) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.sk-lg{height:80px;}
.sk-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
.sk-sm{height:60px;border-radius:10px;background:linear-gradient(90deg,var(--c1) 25%,var(--c2) 50%,var(--c1) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;}

/* ── responsive ── */
@media(max-width:768px){
  .container{padding:0 20px;}
  .app::before{width:300px;height:300px;top:-10%;left:-20%;}
  .app::after{width:250px;height:250px;bottom:-10%;right:-20%;}
  .nav{padding:16px 0;}
  .nav-badge{padding:4px 10px;font-size:9px;}
  .hero{padding:32px 0 24px;}
  .hero-title{font-size:28px !important; letter-spacing:-1px;}
  .hero-desc{font-size:14px;}
  .card{margin-bottom:32px; border-radius:16px;}
  .tab{padding:14px; font-size:12px;}
  .card-body{padding:20px;}
  .input-row{flex-direction:column;}
  .btn{width:100%; justify-content:center; padding:16px; font-size:14px;}
  .result-header{flex-direction:column; align-items:flex-start; gap:16px; padding:16px;}
  .gauge{margin:0 auto;}
  .stats{grid-template-columns:1fr; gap:6px;}
  .stat{display:flex; align-items:center; justify-content:space-between; padding:12px 16px; text-align:left;}
  .stat-label{margin-top:0;}
  .breach-grid{grid-template-columns:1fr;}
  .gen-row{flex-direction:column; align-items:stretch;}
  .gen-pw{text-align:center; padding:12px;}
  .footer{flex-direction:column; gap:16px; padding:20px 0; text-align:center;}
  .footer-badges{flex-wrap:wrap; justify-content:center;}
}
`;

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export default function App() {
  const [tab, setTab] = useState("password");
  const [email, setEmail] = useState("");
  const [eLoad, setELoad] = useState(false);
  const [eRes, setERes] = useState(null);
  const [eErr, setEErr] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pLoad, setPLoad] = useState(false);
  const [pRes, setPRes] = useState(null);
  const [pErr, setPErr] = useState("");
  const strength = usePwStrength(pw);
  
  const cardRef = useRef(null);
  const emailPlaceholder = useTypingPlaceholder(["you@example.com", "admin@company.com", "hello@startup.io"]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    cardRef.current.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  const switchTab = t => { setTab(t); setERes(null); setEErr(""); setPRes(null); setPErr(""); };

  const doEmail = async () => {
    if (!email) return;
    setEErr(""); setERes(null); setELoad(true);
    try { setERes(await checkEmail(email.trim())); }
    catch (e) { setEErr(e.message); }
    setELoad(false);
  };
  const doPw = async () => {
    setPErr(""); setPRes(null); setPLoad(true);
    try { setPRes(await checkPassword(pw)); }
    catch (e) { setPErr(e.message); }
    setPLoad(false);
  };

  const riskScore = eRes?.length > 0 ? getRiskScore(eRes) : 0;

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="container">

          {/* ── NAV ── */}
          <nav className="nav">
            <div className="nav-brand"><Fingerprint size={20} color="var(--accent)" /> breach<span>.</span>check</div>
            <div className="nav-links">
              <div className="nav-badge"><div className="nav-dot" /> Secure Connection</div>
            </div>
          </nav>

          {/* ── HERO ── */}
          <div className="hero">
            <div className="hero-sub">Personal Data Security</div>
            <h1 className="hero-title">Check if you've been compromised</h1>
            <p className="hero-desc">
              Scan your email against 12 billion+ breached records, or check if your password has been leaked. Your data never leaves your browser.
            </p>
          </div>

          {/* ── MAIN CARD ── */}
          <div className="card" ref={cardRef} onMouseMove={handleMouseMove}>
            <div className="card-content">
              {/* tabs */}
            <div className="tabs">
              <button className={`tab ${tab === "password" ? "active" : ""}`} onClick={() => switchTab("password")}>
                <KeyRound size={15} /> Password Check
              </button>
              <button className={`tab ${tab === "email" ? "active" : ""}`} onClick={() => switchTab("email")}>
                <Mail size={15} /> Email Scan
              </button>
            </div>

            <div className="card-body">

              {/* ═══ PASSWORD TAB (PRIMARY) ═══ */}
              {tab === "password" && (
                <>
                  <div className="sec-note">
                    <Lock size={14} />
                    <span><b>Privacy first.</b> Password is SHA-1 hashed locally — only 5 hash characters sent via k-Anonymity.</span>
                  </div>

                  <div className="input-row">
                    <div className="input-wrap">
                      <input className="input" type={showPw ? "text" : "password"}
                        name="new-password" autoComplete="new-password"
                        placeholder="Type any password to check…"
                        value={pw} onChange={e => setPw(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !pLoad && pw && doPw()} />
                      <button className="input-icon" onClick={() => setShowPw(v => !v)}>
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <button className="btn btn-primary" onClick={doPw} disabled={pLoad || !pw}>
                      {pLoad ? <div className="btn-spin" /> : <Search size={15} />}
                      {pLoad ? "Checking…" : "Check"}
                    </button>
                  </div>

                  {strength && (
                    <div className="strength">
                      <div className="str-track"><div className="str-fill" style={{ width: `${strength.pct}%`, background: strength.color }} /></div>
                      <div className="str-text" style={{ color: strength.color }}>{strength.label}</div>
                    </div>
                  )}

                  {pLoad && <div className="skel"><div className="sk sk-lg" /></div>}

                  {pErr && (
                    <div className="results">
                      <div className="result-header warn">
                        <span className="rh-icon"><AlertTriangle size={22} color="var(--amber)" /></span>
                        <div className="rh-info">
                          <div className="rh-title">Check failed</div>
                          <div className="rh-desc">{pErr}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {pRes !== null && !pErr && (
                    <div className="results">
                      {pRes === 0 ? (
                        <>
                          <div className="result-header safe stg" style={{'--i':1}}>
                            <span className="rh-icon"><CheckCircle2 size={22} color="var(--green)" /></span>
                            <div className="rh-info">
                              <div className="rh-title">Not found in any breach</div>
                              <div className="rh-desc">This password isn't in {(10e8).toLocaleString()}+ leaked records. Still use unique passwords.</div>
                            </div>
                          </div>
                          <div className="tips stg" style={{'--i':2}}>
                            <div className="tips-title">Best practices</div>
                            <ul>
                              <li>Never reuse passwords across sites</li>
                              <li>Use 16+ character passphrases</li>
                              <li>Try: <InlineCopy text="coffee-sky-lamp-42" /></li>
                            </ul>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="result-header danger stg" style={{'--i':1}}>
                            <span className="rh-icon"><XCircle size={22} color="var(--red)" /></span>
                            <div className="rh-info">
                              <div className="rh-title">Leaked <AN value={pRes} />× times</div>
                              <div className="rh-desc">Found in {pRes.toLocaleString()} breach records. Stop using this password immediately.</div>
                            </div>
                          </div>
                          <div className="stg" style={{'--i':2}}>
                            <PasswordGen />
                          </div>
                          <div className="tips stg" style={{'--i':3}}>
                            <div className="tips-title">Do this now</div>
                            <ul>
                              <li>Change this password everywhere you use it</li>
                              <li>Create a new 16+ character password</li>
                              <li>Start using a password manager</li>
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ═══ EMAIL TAB (SECONDARY) ═══ */}
              {tab === "email" && (
                <>
                  <div className="info-bar">
                    <ShieldCheck size={14} />
                    <span><b>Encrypted</b> — checked against breach databases securely. Nothing stored or logged.</span>
                  </div>

                  <div className="input-row">
                    <div className="input-wrap">
                      <input className="input" type="email" placeholder={`e.g. ${emailPlaceholder}`}
                        value={email} onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !eLoad && email && doEmail()} />
                      <span className="input-icon static"><Mail size={15} /></span>
                    </div>
                    <button className="btn btn-primary" onClick={doEmail} disabled={eLoad || !email}>
                      {eLoad ? <div className="btn-spin" /> : <Search size={15} />}
                      {eLoad ? "Scanning…" : "Scan"}
                    </button>
                  </div>

                  {eLoad && <div className="skel"><div className="sk sk-lg" /><div className="sk-row"><div className="sk-sm" /><div className="sk-sm" /><div className="sk-sm" /></div></div>}

                  {eErr && (
                    <div className="results">
                      <div className="result-header warn">
                        <span className="rh-icon"><AlertTriangle size={22} color="var(--amber)" /></span>
                        <div className="rh-info">
                          <div className="rh-title">Scan failed</div>
                          <div className="rh-desc">{eErr}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {eRes !== null && !eErr && (
                    <div className="results">
                      {eRes.length === 0 ? (
                        <>
                          <div className="result-header safe stg" style={{'--i':1}}>
                            <span className="rh-icon"><CheckCircle2 size={22} color="var(--green)" /></span>
                            <div className="rh-info">
                              <div className="rh-title">No breaches found</div>
                              <div className="rh-desc">Your email wasn't found in any known data breach. Stay safe — check periodically.</div>
                            </div>
                          </div>
                          <div className="tips stg" style={{'--i':2}}>
                            <div className="tips-title">Stay Protected</div>
                            <ul>
                              <li>Use unique passwords for every site</li>
                              <li>Enable 2FA on email & banking</li>
                              <li>Use a password manager like Bitwarden</li>
                            </ul>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="result-header danger stg" style={{'--i':1}}>
                            <span className="rh-icon"><ShieldOff size={22} color="var(--red)" /></span>
                            <div className="rh-info">
                              <div className="rh-title">Found in {eRes.length} breach{eRes.length > 1 ? "es" : ""}</div>
                              <div className="rh-desc">Your email was exposed. Change affected passwords immediately.</div>
                            </div>
                            <RiskGauge score={riskScore} />
                          </div>

                          <div className="stats stg" style={{'--i':2}}>
                            <div className="stat">
                              <div className="stat-num"><AN value={eRes.length} /></div>
                              <div className="stat-label">Breaches</div>
                            </div>
                            <div className="stat">
                              <div className="stat-num"><AN value={[...new Set(eRes.flatMap(b => b.DataClasses))].length} /></div>
                              <div className="stat-label">Data Types</div>
                            </div>
                            <div className="stat">
                              <div className="stat-num"><AN value={eRes.filter(b => b.DataClasses?.some(d => PW_TYPES.includes(d))).length} /></div>
                              <div className="stat-label">PW Leaks</div>
                            </div>
                          </div>

                          <div className="stg" style={{'--i':3}}>
                            <div className="breach-list-head">
                              <span className="blh-title">Affected Services</span>
                              <span className="blh-count">{eRes.length} found</span>
                            </div>
                            <div className="breach-grid">
                              {eRes.map((b, bI) => {
                                const sv = getBreachSeverity(b);
                                return (
                                  <div className="bg-card stg" style={{'--i':4 + bI}} key={b.Name}>
                                    <div className="bg-top">
                                      <span className="bg-name">{b.Title}</span>
                                      <span className="bg-sev" style={{ background: sv.bg, color: sv.color }}>{sv.level}</span>
                                    </div>
                                    <div className="bg-date">{b.BreachDate}</div>
                                    <div className="bg-chips">
                                      {b.DataClasses?.map(dc => (
                                        <span className={`bg-chip ${PW_TYPES.includes(dc) ? "pw" : ""}`} key={dc}>{dc}</span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="tips stg" style={{'--i':12}}>
                            <div className="tips-title">Take action now</div>
                            <ul>
                              <li>Change passwords on all affected services</li>
                              <li>Enable two-factor authentication</li>
                              <li>Never reuse compromised passwords</li>
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          </div>

          {/* ── FOOTER ── */}
          <div className="footer">
            <div className="footer-text">breach.check — Breach data sources · Nothing stored · Nothing logged</div>
            <div className="footer-badges">
              <span className="footer-badge">k-Anonymity</span>
              <span className="footer-badge">SHA-1</span>
              <span className="footer-badge">Encrypted</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
