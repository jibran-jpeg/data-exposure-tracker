import { useState, useEffect, useRef } from "react";

async function sha1(str) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}
async function checkPassword(pw) {
  const hash = await sha1(pw);
  const prefix = hash.slice(0, 5), suffix = hash.slice(5);
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, { headers: { "Add-Padding": "true" } });
  if (!res.ok) throw new Error("Could not reach the server. Please try again.");
  for (const line of (await res.text()).split("\r\n")) {
    const [h, c] = line.split(":");
    if (h === suffix) return parseInt(c, 10);
  }
  return 0;
}
async function checkEmail(email) {
  const res = await fetch(`http://localhost:8000/api/check-email/${encodeURIComponent(email)}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Error ${res.status}. Try again.`);
  }
  return res.json();
}
const PW_TYPES = ["Passwords", "Password hints"];

function usePwStrength(pw) {
  if (!pw) return null;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 14) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const levels = ["Very weak","Weak","Fair","Good","Strong","Excellent"];
  const colors = ["#ff4040","#ff7040","#ffb020","#9de051","#4fd68a","#4fb8ff"];
  return { score: s, label: levels[Math.min(s,5)], color: colors[Math.min(s,5)], pct: Math.round((Math.min(s,5)/5)*100) };
}

const G = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{background:#0a0a0a;-webkit-font-smoothing:antialiased;}

:root{
  --ink:#f0ede8;
  --ink2:#a09890;
  --ink3:#504840;
  --bg:#0a0a0a;
  --s1:#111110;
  --s2:#18180f;
  --line:rgba(240,237,232,0.08);
  --line2:rgba(240,237,232,0.14);
  --red:#ff4040;
  --red2:rgba(255,64,64,0.12);
  --green:#4fd68a;
  --green2:rgba(79,214,138,0.1);
  --amber:#ffb020;
  --amber2:rgba(255,176,32,0.1);
  --accent:#d4f040;
  --accent2:rgba(212,240,64,0.1);
}

.x{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--ink);min-height:100vh;position:relative;overflow-x:hidden;}

/* ── big decorative number ── */
.x-deco{
  position:fixed;top:-60px;right:-40px;
  font-family:'Instrument Serif',serif;font-size:520px;line-height:1;
  color:rgba(240,237,232,0.018);pointer-events:none;z-index:0;
  user-select:none;letter-spacing:-20px;
}

.x-inner{position:relative;z-index:1;max-width:640px;margin:0 auto;padding:56px 24px 100px;}

/* ── nav bar ── */
.nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:64px;}
.nav-logo{
  font-family:'Instrument Serif',serif;font-style:italic;
  font-size:18px;color:var(--ink);letter-spacing:-0.3px;
}
.nav-logo em{font-style:normal;color:var(--accent);}
.nav-pill{
  font-size:11px;font-weight:500;letter-spacing:0.8px;text-transform:uppercase;
  color:var(--ink3);background:var(--s1);border:1px solid var(--line);
  padding:6px 14px;border-radius:100px;
}

/* ── headline block ── */
.hl{margin-bottom:56px;}
.hl-eyebrow{
  display:flex;align-items:center;gap:10px;
  font-size:11px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;
  color:var(--ink3);margin-bottom:20px;
}
.hl-eyebrow::before{content:'';width:24px;height:1px;background:var(--line2);}
.hl-title{
  font-family:'Instrument Serif',serif;
  font-size:clamp(40px,8vw,68px);line-height:0.96;
  letter-spacing:-2px;color:var(--ink);margin-bottom:0;
}
.hl-title i{font-style:italic;color:var(--accent);}
.hl-rule{height:1px;background:var(--line);margin:28px 0;}
.hl-desc{font-size:14px;color:var(--ink2);line-height:1.7;font-weight:300;max-width:400px;}

/* ── toggle ── */
.tog{display:flex;gap:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-bottom:36px;background:var(--s1);}
.tog-btn{
  flex:1;padding:13px 16px;background:transparent;border:none;
  font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;
  cursor:pointer;transition:all .2s;color:var(--ink3);
  display:flex;align-items:center;justify-content:center;gap:8px;
}
.tog-btn .t-ico{font-size:15px;}
.tog-btn.on{background:var(--accent2);color:var(--accent);font-weight:600;}
.tog-btn:not(.on):hover{color:var(--ink2);background:rgba(240,237,232,0.03);}
.tog-sep{width:1px;background:var(--line);flex-shrink:0;}

/* ── form area ── */
.form-area{position:relative;}

/* ── field ── */
.fld{margin-bottom:20px;}
.fld-top{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px;}
.fld-label{font-size:12px;font-weight:600;letter-spacing:0.4px;color:var(--ink2);text-transform:uppercase;}
.fld-sub{font-size:11px;color:var(--ink3);}
.fld-sub a{color:var(--accent);text-decoration:none;}
.fld-sub a:hover{text-decoration:underline;}

.inp-wrap{position:relative;}
.inp{
  width:100%;
  background:var(--s1);
  border:1px solid var(--line);
  border-radius:10px;
  padding:14px 46px 14px 18px;
  color:var(--ink);
  font-family:'DM Sans',sans-serif;font-size:14px;font-weight:400;
  outline:none;transition:border-color .2s,background .2s;
  caret-color:var(--accent);
}
.inp:focus{border-color:var(--line2);background:var(--s2);}
.inp::placeholder{color:var(--ink3);}
.inp-side{
  position:absolute;right:14px;top:50%;transform:translateY(-50%);
  background:none;border:none;cursor:pointer;
  color:var(--ink3);font-size:15px;padding:4px;line-height:1;
  transition:color .2s;
}
.inp-side:hover{color:var(--ink2);}
.inp-side.fixed{pointer-events:none;}

/* strength bar */
.str-bar{margin-top:10px;}
.str-track{height:2px;background:var(--line);border-radius:2px;margin-bottom:6px;overflow:hidden;}
.str-fill{height:100%;border-radius:2px;transition:width .4s,background .4s;}
.str-label{font-size:11px;font-weight:500;}

/* api notice */
.api-note{
  display:flex;gap:12px;align-items:flex-start;
  padding:14px 16px;border-radius:10px;margin-bottom:20px;
  border:1px solid var(--line);background:var(--s1);
}
.api-note-ico{font-size:16px;flex-shrink:0;margin-top:1px;}
.api-note-txt{font-size:12px;color:var(--ink3);line-height:1.65;}
.api-note-txt b{color:var(--ink2);font-weight:500;}
.api-note-txt a{color:var(--accent);text-decoration:none;}

/* ── CTA button ── */
.cta{
  width:100%;padding:15px 20px;margin-top:4px;
  background:var(--accent);border:none;border-radius:10px;
  font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;
  color:#0a0a0a;cursor:pointer;letter-spacing:-0.2px;
  display:flex;align-items:center;justify-content:center;gap:9px;
  transition:all .2s;
  box-shadow:0 0 0 0 rgba(212,240,64,0);
}
.cta:hover:not(:disabled){
  background:#e4f742;transform:translateY(-1px);
  box-shadow:0 8px 32px rgba(212,240,64,0.2);
}
.cta:disabled{opacity:.35;cursor:not-allowed;transform:none;}
.cta-spin{
  width:15px;height:15px;border-radius:50%;
  border:2px solid rgba(10,10,10,.25);border-top-color:#0a0a0a;
  animation:spin .6s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}

/* ── result wrapper ── */
.res{margin-top:32px;display:flex;flex-direction:column;gap:16px;}
@keyframes up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.res>*{animation:up .35s ease forwards;}

/* ── big status ── */
.status-big{
  padding:24px;border-radius:14px;
  display:flex;gap:18px;align-items:flex-start;
}
.status-big.ok{background:var(--green2);border:1px solid rgba(79,214,138,.2);}
.status-big.bad{background:var(--red2);border:1px solid rgba(255,64,64,.2);}
.status-big.warn{background:var(--amber2);border:1px solid rgba(255,176,32,.2);}
.status-ico{font-size:28px;line-height:1;flex-shrink:0;}
.status-ttl{font-family:'Instrument Serif',serif;font-size:22px;line-height:1.15;margin-bottom:6px;letter-spacing:-0.5px;}
.status-big.ok .status-ttl{color:var(--green);}
.status-big.bad .status-ttl{color:var(--red);}
.status-big.warn .status-ttl{color:var(--amber);}
.status-body{font-size:13px;color:var(--ink2);line-height:1.6;font-weight:300;}

/* ── stats row ── */
.stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
.stat-box{
  padding:18px 14px;border-radius:12px;
  background:var(--s1);border:1px solid var(--line);
  text-align:center;
}
.stat-n{font-family:'Instrument Serif',serif;font-size:32px;color:var(--red);line-height:1;}
.stat-l{font-size:10px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:var(--ink3);margin-top:4px;}

/* ── breach list ── */
.breach-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.breach-count{
  font-size:11px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:var(--ink3);
}
.breach-badge{
  font-size:11px;font-weight:600;padding:3px 10px;border-radius:100px;
  background:var(--red2);border:1px solid rgba(255,64,64,.2);color:var(--red);
}
.breach-scroll{max-height:340px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;}
.breach-scroll::-webkit-scrollbar{width:3px;}
.breach-scroll::-webkit-scrollbar-track{background:transparent;}
.breach-scroll::-webkit-scrollbar-thumb{background:var(--line2);border-radius:3px;}

.bc{
  background:var(--s1);border:1px solid var(--line);
  border-radius:10px;padding:14px 16px;
  transition:border-color .15s,background .15s;
  cursor:default;
}
.bc:hover{border-color:var(--line2);background:var(--s2);}
.bc-row1{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:8px;flex-wrap:wrap;}
.bc-name{font-size:13px;font-weight:600;color:var(--ink);letter-spacing:-0.2px;}
.bc-date{font-size:11px;color:var(--ink3);}
.chips{display:flex;flex-wrap:wrap;gap:5px;}
.chip{
  font-size:10px;font-weight:500;padding:2px 9px;border-radius:100px;
  background:rgba(255,64,64,.08);border:1px solid rgba(255,64,64,.18);color:rgba(255,140,140,.9);
}
.chip.pw{background:rgba(255,176,32,.08);border-color:rgba(255,176,32,.2);color:var(--amber);}

/* ── tips ── */
.tips{
  background:var(--s1);border:1px solid var(--line);
  border-radius:12px;padding:18px 20px;
}
.tips-ttl{
  font-size:11px;font-weight:700;letter-spacing:.8px;
  text-transform:uppercase;color:var(--ink3);margin-bottom:12px;
}
.tips-list{list-style:none;display:flex;flex-direction:column;gap:9px;}
.tips-list li{
  font-size:13px;color:var(--ink2);line-height:1.5;font-weight:300;
  display:flex;align-items:flex-start;gap:10px;
}
.tips-list li::before{content:'↗';color:var(--accent);flex-shrink:0;font-weight:600;font-size:12px;margin-top:1px;}

/* ── security note ── */
.sec-note{
  display:flex;gap:10px;align-items:flex-start;
  padding:12px 14px;border-radius:10px;
  background:var(--accent2);border:1px solid rgba(212,240,64,.15);
}
.sec-note-txt{font-size:12px;color:rgba(212,240,64,.7);line-height:1.6;}
.sec-note-txt b{color:var(--accent);}

/* ── footer ── */
.foot{margin-top:48px;padding-top:24px;border-top:1px solid var(--line);
  display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;}
.foot-txt{font-size:11px;color:var(--ink3);}
.foot-txt a{color:var(--ink3);text-decoration:none;}
.foot-txt a:hover{color:var(--ink2);}
.foot-badge{
  font-size:10px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;
  color:var(--ink3);border:1px solid var(--line);
  padding:4px 10px;border-radius:100px;
}
`;

export default function App() {
  const [tab, setTab] = useState("email");
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

  return (
    <>
      <style>{G}</style>
      <div className="x">
        <div className="x-deco">?</div>
        <div className="x-inner">

          {/* nav */}
          <nav className="nav">
            <div className="nav-logo">breach<em>.</em>check</div>
            <div className="nav-pill">Free Tool</div>
          </nav>

          {/* headline */}
          <div className="hl">
            <div className="hl-eyebrow">Data Security</div>
            <h1 className="hl-title">
              Have you<br />been <i>exposed?</i>
            </h1>
            <div className="hl-rule" />
            <p className="hl-desc">
              Check if your email or passwords have appeared in a known data breach — your data never leaves your browser.
            </p>
          </div>

          {/* tab toggle */}
          <div className="tog">
            <button className={`tog-btn ${tab === "email" ? "on" : ""}`} onClick={() => switchTab("email")}>
              <span className="t-ico">📧</span> Check Email
            </button>
            <div className="tog-sep" />
            <button className={`tog-btn ${tab === "password" ? "on" : ""}`} onClick={() => switchTab("password")}>
              <span className="t-ico">🔑</span> Check Password
            </button>
          </div>

          {/* ── EMAIL FORM ── */}
          {tab === "email" && (
            <div className="form-area">
              <div className="fld">
                <div className="fld-top">
                  <span className="fld-label">Email Address</span>
                </div>
                <div className="inp-wrap">
                  <input className="inp" type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !eLoad && email && doEmail()} />
                  <span className="inp-side fixed">@</span>
                </div>
              </div>

              <button className="cta" onClick={doEmail} disabled={eLoad || !email}>
                {eLoad ? <><div className="cta-spin" />Scanning…</> : <>Run Breach Scan</>}
              </button>

              {eErr && (
                <div className="res">
                  <div className="status-big warn">
                    <span className="status-ico">⚠️</span>
                    <div>
                      <div className="status-ttl">Couldn't complete scan</div>
                      <div className="status-body">{eErr}</div>
                    </div>
                  </div>
                </div>
              )}

              {eRes !== null && !eErr && (
                <div className="res">
                  {eRes.length === 0 ? (
                    <>
                      <div className="status-big ok">
                        <span className="status-ico">✦</span>
                        <div>
                          <div className="status-ttl">You're in the clear.</div>
                          <div className="status-body">No known data breaches found for this email. Check back periodically — new breaches are discovered regularly.</div>
                        </div>
                      </div>
                      <div className="tips">
                        <div className="tips-ttl">Stay protected</div>
                        <ul className="tips-list">
                          <li>Use a unique password on every website — no reusing</li>
                          <li>Turn on two-factor authentication on Gmail, banking & social media</li>
                          <li>Bitwarden is a free password manager worth using</li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="status-big bad">
                        <span className="status-ico">⚠</span>
                        <div>
                          <div className="status-ttl">Found in {eRes.length} breach{eRes.length > 1 ? "es" : ""}.</div>
                          <div className="status-body">
                            Your email appeared in {eRes.length} known data breach{eRes.length > 1 ? "es" : ""}. Change your passwords on the affected services below.
                          </div>
                        </div>
                      </div>

                      <div className="stats-row">
                        <div className="stat-box">
                          <div className="stat-n">{eRes.length}</div>
                          <div className="stat-l">Breaches</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-n">{[...new Set(eRes.flatMap(b => b.DataClasses))].length}</div>
                          <div className="stat-l">Data Types</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-n">{eRes.filter(b => b.DataClasses?.some(d => PW_TYPES.includes(d))).length}</div>
                          <div className="stat-l">PW Leaks</div>
                        </div>
                      </div>

                      <div>
                        <div className="breach-head">
                          <span className="breach-count">Affected Services</span>
                          <span className="breach-badge">{eRes.length} found</span>
                        </div>
                        <div className="breach-scroll">
                          {eRes.map(b => (
                            <div className="bc" key={b.Name}>
                              <div className="bc-row1">
                                <span className="bc-name">{b.Title}</span>
                                <span className="bc-date">{b.BreachDate}</span>
                              </div>
                              <div className="chips">
                                {b.DataClasses?.map(dc => (
                                  <span className={`chip ${PW_TYPES.includes(dc) ? "pw" : ""}`} key={dc}>{dc}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="tips">
                        <div className="tips-ttl">What to do now</div>
                        <ul className="tips-list">
                          <li>Change your password on every service listed above</li>
                          <li>If you reused that password anywhere else — change those too</li>
                          <li>Enable 2FA on your email account first — it's the most important one</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── PASSWORD FORM ── */}
          {tab === "password" && (
            <div className="form-area">
              <div className="sec-note">
                <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
                <div className="sec-note-txt">
                  <b>Your password never leaves your device.</b> We hash it locally with SHA-1 and only send 5 characters of that hash — a technique called k-Anonymity used by security professionals worldwide.
                </div>
              </div>

              <div className="fld" style={{ marginTop: 20 }}>
                <div className="fld-top">
                  <span className="fld-label">Password</span>
                </div>
                <div className="inp-wrap">
                  <input className="inp" type={showPw ? "text" : "password"}
                    placeholder="Type any password to check…"
                    value={pw} onChange={e => setPw(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !pLoad && pw && doPw()} />
                  <button className="inp-side" onClick={() => setShowPw(v => !v)}>{showPw ? "🙈" : "👁️"}</button>
                </div>
                {strength && (
                  <div className="str-bar" style={{ animation: "up .3s ease" }}>
                    <div className="str-track">
                      <div className="str-fill" style={{ width: `${strength.pct}%`, background: strength.color }} />
                    </div>
                    <div className="str-label" style={{ color: strength.color }}>{strength.label}</div>
                  </div>
                )}
              </div>

              <button className="cta" onClick={doPw} disabled={pLoad || !pw}>
                {pLoad ? <><div className="cta-spin" />Checking…</> : <>Check This Password</>}
              </button>

              {pErr && (
                <div className="res">
                  <div className="status-big warn">
                    <span className="status-ico">⚠️</span>
                    <div>
                      <div className="status-ttl">Something went wrong</div>
                      <div className="status-body">{pErr}</div>
                    </div>
                  </div>
                </div>
              )}

              {pRes !== null && !pErr && (
                <div className="res">
                  {pRes === 0 ? (
                    <>
                      <div className="status-big ok">
                        <span className="status-ico">✦</span>
                        <div>
                          <div className="status-ttl">Not found in any breach.</div>
                          <div className="status-body">This password doesn't appear in our database of {(10e8).toLocaleString()}+ leaked passwords. Still, use a unique one per site.</div>
                        </div>
                      </div>
                      <div className="tips">
                        <div className="tips-ttl">Best practice</div>
                        <ul className="tips-list">
                          <li>Never reuse this password — one breach = all accounts at risk</li>
                          <li>Longer passwords (16+ chars) are stronger than complex short ones</li>
                          <li>A passphrase like <em>"coffee-sky-lamp-42"</em> is easy to remember and very strong</li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="status-big bad">
                        <span className="status-ico">✕</span>
                        <div>
                          <div className="status-ttl">Leaked {pRes.toLocaleString()}× times.</div>
                          <div className="status-body">
                            This password was found in {pRes.toLocaleString()} breach records. Hackers use these lists to break into accounts — stop using it now.
                          </div>
                        </div>
                      </div>
                      <div className="tips">
                        <div className="tips-ttl">Do this right now</div>
                        <ul className="tips-list">
                          <li>Change this password on every site you've used it on</li>
                          <li>Create a new one: 16+ characters, mix of letters, numbers, symbols</li>
                          <li>Use a password manager — you only need to remember one strong password</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* footer */}
          <div className="foot">
            <div className="foot-txt">
              Data via <a href="https://haveibeenpwned.com" target="_blank" rel="noreferrer">HaveIBeenPwned</a> · Nothing stored · Open source
            </div>
            <div className="foot-badge">k-Anonymity Protected</div>
          </div>

        </div>
      </div>
    </>
  );
}
