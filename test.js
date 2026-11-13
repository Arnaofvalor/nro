// ==UserScript==
// @name         Link4m (Bypass)
// @namespace    https://link4m.app/
// @version      1.0.0
// @description  Bypass Link4m — bản dựng lại sạch
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_setClipboard
// @grant        GM_openInTab
// @grant        GM_info
// @connect      link4m.app
// @connect      link4m.com
// @connect      api.ocr.space
// @connect      cdn.jsdelivr.net
// @connect      *
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  "use strict";
  if (window.top !== window.self) return;
  if (!/^https?:$/.test(location.protocol)) return;

  /* ================= HẰNG SỐ ================= */
  const SERVER       = "https://s1.link4m.app";
  const OCR_API      = "https://api.ocr.space/parse/image";
  const OCR_KEYS     = ["helloworld", "K89899142388957", "K81724188988957"];
  const TESSERACT_JS = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
  const STORE_URL    = "https://robuxvien.com/home";
  const DISCORD_URL  = "https://discord.gg/rcRBbzTfqB";
  const CID_KEY      = "_traffic_cid_";
  const VERSION      = (typeof GM_info !== "undefined" && GM_info.script && GM_info.script.version) || "1.0.0";

  const SUFFIXES = ["com.vn","net.vn","edu.vn","org.vn","gov.vn","info.vn","pro.vn","ac.vn","health.vn","name.vn","co.uk","org.uk","com.au","com.sg","com.my","com.ph","co.jp","co.kr","co.id","co.th","com.br","vn","com","net","org","io","info","co","me","xyz","app","dev","top","site","online","store","club","pro","tv","cc","gg","asia","biz","us","uk","ca","de","jp","kr","sg","id","th","my","ph","lat","icu","fun","space","tech","website","lol","click","link","live","news","blog","shop","vip","win","work","world","zone","ai","to","sh","fm","ly","gl","it","es","fr","ru","br","in","au","nl","se","no","pl","cz","ch","at","be","dk","fi","gr","hk","tw","nz","za","mx","ar","cl","pe","ve","ua","ro","hu","tr","sa","ae","pk","bd","lk","np","mm","kh","la","bn","mobi","name","page","life","today","cloud","digital","media","network","systems","solutions","services","games","game","apk","download"];

  const RE = {
    service:    /<script[^>]+src=["'](?:https?:)?\/\/([^\/"']+)\/widget\/(service(?:-v\d+)?\.js)\?([^"']*)["']/gi,
    widgetFile: /(?:get_code\.html|get_quest_code\.html)/g,
    refList:    /var\s+ref_domain_list\s*=\s*\[([^\]]*)\]/g,
    quoted:     /["']([^"']+)["']/g,
    keyVar:     /[?&]key=["']\s*\+\s*([A-Za-z_$][\w$]*)/,
    codeVar:    /[?&]code=["']\s*\+\s*([A-Za-z_$][\w$]*)/,
    sessVar:    /traffic_session=["']\s*\+\s*([A-Za-z_$][\w$]*)/,
    domainVar:  /["']https?:\/\/["']\s*\+\s*([A-Za-z_$][\w$]*)\s*\+\s*["']\/widget\//,
    hex24:      /var\s+([A-Za-z_$][\w$]*)\s*=\s*["']([0-9a-f]{24})["']/i,
    queryKey:   /(?:^|&)key=([^&"'\s]+)/,
    appServer:  /https:\/\/[a-z0-9-]+\.link4m\.app/gi,
    link4mHost: /(^|\.)link4m\.(com|net|org|app)$/i,
    guideImg:   /\/uploads\/advertiser\//i,
    imgLink4m:  /img\.link4m\./i,
    imgOne:     /\/1_[^\/]+\.[a-z]+$/i,
    bgUrl:      /url\(["']?([^"')]+)["']?\)/i,
    domain:     /(?:https?:\/\/)?((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?:\.[a-z]{2,})?)\b/gi,
    domainLine: /\b((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?:\.[a-z]{2,})?)\b/gi,
    urlInText:  /https?:\/\/([a-z0-9][a-z0-9.\-]{1,61}\.[a-z]{2,}(?:\.[a-z]{2,})?)/gi,
    step3:      /Bước\s*3\s*[:.\-]?([\s\S]*?)(?:Bước\s*4|$)/i,
    step3Hint:  /Bước\s*3|website|trang\s*web/i,
    word:       /\b([a-z0-9-]{5,40})\b/gi,
    label:      /^[a-z0-9-]+$/,
    proto:      /^[a-zA-Z][a-zA-Z0-9+.\-]*:\/\//,
    skip:       /^(?:www\.)?(?:google\.[a-z.]+|link4m\.[a-z.]+|gstatic\.com|googleapis\.com|googleusercontent\.com|cloudflare\.com|youtube\.com|youtu\.be|facebook\.com|fb\.com|chrome\.google\.com|android\.com|apple\.com|microsoft\.com|w3\.org|schema\.org|example\.com)$/i,
  };
  const varNum = (n) => new RegExp("var\\s+" + n + "\\s*=\\s*['\"]?(-?[0-9]+(?:\\.[0-9]+)?)['\"]?");
  const varStr = (n) => new RegExp("var\\s+" + n + "\\s*=\\s*['\"]([^'\"]+)['\"]");

  /* ================= TIỆN ÍCH ================= */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const now = () => Date.now();
  const enc = encodeURIComponent;
  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ESC[c]);
  const cut = (s, n) => { s = String(s == null ? "" : s); return s.length > n ? s.slice(0, n) + "…" : s; };

  function errText(e) {
    if (e == null) return "";
    if (typeof e === "string") return e === "[object Object]" ? "lỗi không xác định" : cut(e, 120);
    const out = [];
    if (e.status && e.status !== 0) out.push("HTTP " + e.status);
    if (e.statusText && e.statusText !== "error") out.push(cut(e.statusText, 120));
    if (typeof e.error === "string" && e.error) out.push(cut(e.error, 120));
    if (typeof e.message === "string" && e.message) out.push(cut(e.message, 120));
    if (!out.length) { const s = String(e); out.push(s === "[object Object]" ? "lỗi không xác định" : cut(s, 120)); }
    return out.join(" · ");
  }

  function request(opt) {
    return new Promise((resolve, reject) => {
      const method = opt.method || "GET";
      const timeout = opt.timeout || 25000;
      if (typeof GM_xmlhttpRequest !== "undefined") {
        GM_xmlhttpRequest({
          method, url: opt.url, headers: opt.headers || {}, data: opt.data, timeout,
          responseType: opt.responseType === "arraybuffer" ? "arraybuffer" : undefined,
          anonymous: opt.credentials === "omit",
          onload: resolve,
          onerror: () => reject(new Error("network error")),
          ontimeout: () => reject(new Error("hết thời gian chờ (" + Math.round(timeout / 1000) + "s)")),
        });
      } else {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), timeout);
        fetch(opt.url, {
          method, headers: opt.headers, body: opt.data, signal: ctrl.signal,
          credentials: opt.credentials === "omit" ? "omit" : "include",
        }).then(async (r) => {
          clearTimeout(t);
          const body = opt.responseType === "arraybuffer" ? await r.arrayBuffer() : await r.text();
          resolve({ status: r.status, statusText: r.statusText, responseText: body, response: body, ok: r.ok });
        }).catch((e) => { clearTimeout(t); reject(e); });
      }
    });
  }

  const storeGet = (k, d) => {
    try { if (typeof GM_getValue !== "undefined") return GM_getValue(k, d); } catch (e) {}
    try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
  };
  const storeSet = (k, v) => {
    try { if (typeof GM_setValue !== "undefined") return GM_setValue(k, v); } catch (e) {}
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  };

  async function copyText(text) {
    try { if (typeof GM_setClipboard !== "undefined") { GM_setClipboard(text); return true; } } catch (e) {}
    try { if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); return true; } } catch (e) {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand("copy"); ta.remove(); return ok;
    } catch (e) { return false; }
  }

  function openTab(url) {
    try { if (typeof GM_openInTab !== "undefined") return GM_openInTab(url, { active: true, insert: true }); } catch (e) {}
    window.open(url, "_blank", "noopener");
  }

  function uuid() {
    try { if (crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
    let seed = now();
    try { if (performance && typeof performance.now === "function") seed += performance.now(); } catch (e) {}
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (seed + Math.random() * 16) % 16 | 0;
      seed = Math.floor(seed / 16);
      return (c === "x" ? r : (r & 3) | 8).toString(16);
    });
  }

  function normalizeUrl(input) {
    let s = String(input || "").trim();
    if (!s) return { err: "empty" };
    if (!RE.proto.test(s)) s = "https://" + s;
    let u;
    try { u = new URL(s); } catch (e) { return { err: "invalid" }; }
    if (u.protocol === "http:") u.protocol = "https:";
    if (u.protocol !== "https:") return { err: "protocol" };
    return { url: u.href, host: u.hostname, origin: u.origin };
  }

  function findServer(html) {
    try {
      const m = (html || document.documentElement.innerHTML).match(RE.appServer);
      if (m && m.length) return m[0];
    } catch (e) {}
    return SERVER;
  }

  function abToBase64(buf) {
    const b = new Uint8Array(buf);
    let s = "";
    for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192));
    return btoa(s);
  }

  function htmlToText(html) {
    if (!html) return "";
    const d = document.createElement("div");
    d.innerHTML = String(html);
    return d.textContent || "";
  }

  function levenshtein(a, b) {
    a = String(a || ""); b = String(b || "");
    if (!a) return b.length;
    if (!b) return a.length;
    let prev = [], cur = [];
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      cur[0] = i;
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      const t = prev; prev = cur; cur = t;
    }
    return prev[b.length];
  }

  /* ================= JSCD (fingerprint) ================= */
  const jscd = (function () {
    const n = navigator, ua = n.userAgent || "", av = n.appVersion || "", an = n.appName || "";
    const o = {
      browser: "", browserVersion: 0, os: "", osVersion: "",
      platform: n.platform || "", userAgent: ua, appVersion: av, appName: an,
      language: n.language || "", languages: (n.languages || []).join(","),
      cookieEnabled: !!n.cookieEnabled, screenWidth: screen.width, screenHeight: screen.height,
      colorDepth: screen.colorDepth || 24, devicePixelRatio: window.devicePixelRatio || 1,
      hardwareConcurrency: n.hardwareConcurrency || 0, deviceMemory: n.deviceMemory || 0,
      maxTouchPoints: n.maxTouchPoints || 0,
      timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone) || "",
      timezoneOffset: new Date().getTimezoneOffset(),
    };
    const find = (needle, skip, sep) => {
      const i = skip ? ua.indexOf(needle, ua.indexOf(skip) + 1) : ua.indexOf(needle);
      if (i < 0) return null;
      const rest = ua.substring(i + needle.length + (sep || 0));
      const end = rest.search(/[;)\s]/);
      return end < 0 ? rest : rest.substring(0, end);
    };
    let v;
    if ((v = find("OPR/", null, 0)) !== null) { o.browser = "Opera"; o.browserVersion = v; }
    else if ((v = find("Edg/", null, 0)) !== null) { o.browser = "Edge"; o.browserVersion = v; }
    else if ((v = find("MSIE ", null, 0)) !== null) { o.browser = "Microsoft Internet Explorer"; o.browserVersion = v; }
    else if (ua.indexOf("Trident/") >= 0) { const m = /rv:([0-9.]+)/.exec(ua); o.browser = "Microsoft Internet Explorer"; o.browserVersion = m ? m[1] : 0; }
    else if ((v = find("Chrome/", null, 0)) !== null) { o.browser = "Chrome"; o.browserVersion = v; }
    else if ((v = find("Firefox/", null, 0)) !== null) { o.browser = "Firefox"; o.browserVersion = v; }
    else if (ua.indexOf("Safari") >= 0 && (v = find("Version/", null, 0)) !== null) { o.browser = "Safari"; o.browserVersion = v; }
    else if (an === "Netscape" || an === "Microsoft Internet Explorer") { const m = /rv:([0-9.]+)/.exec(ua); o.browser = an; o.browserVersion = m ? m[1] : 0; }
    o.browserMajorVersion = parseInt(o.browserVersion, 10) || 0;

    const osList = [
      ["Windows", /Windows NT ([0-9.]+)/], ["Mac OS X", /Mac OS X ([0-9_\.]+)/],
      ["Android", /Android ([0-9.]+)/], ["iOS", /OS ([0-9_]+)/],
      ["QNX", /QNX/], ["UNIX", /UNIX/], ["BeOS", /BeOS/], ["OS/2", /OS\/2/],
      ["Linux", /Linux/], ["Search Bot", /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/],
    ];
    for (const [name, rx] of osList) {
      if (rx.test(ua)) {
        o.os = name;
        const m = rx.exec(ua);
        o.osVersion = m && m[1] ? m[1].replace(/_/g, ".") : "";
        break;
      }
    }
    if (/MacPPC|MacIntel|Mac_PowerPC|Macintosh/.test(ua) && !o.os) o.os = "Mac OS";
    return o;
  })();

  function evalChallenge(code, vars) {
    try {
      let src = "";
      if (vars) for (const k in vars) src += "var " + k + " = " + JSON.stringify(vars[k]) + ";\n";
      src += "var __r = eval(" + JSON.stringify(String(code)) + ");\n" +
             "return { r: __r, jscd: (typeof jscd !== 'undefined' ? jscd : null) };";
      const out = new Function("window", "document", "navigator", "jscd", src)(window, document, navigator, jscd);
      return { ok: true, value: out.r, jscd: out.jscd };
    } catch (e) { return { ok: false, error: errText(e) }; }
  }

  /* ================= GIAO DIỆN ================= */
  const CSS = `
*{box-sizing:border-box;margin:0;padding:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
.panel{position:relative;width:min(372px,calc(100vw - 24px));border-radius:20px;overflow:hidden;color:#e9f4fa;line-height:1.5;border:1px solid transparent;background:linear-gradient(180deg,#0c141d,#05080d 62%) padding-box,linear-gradient(160deg,rgba(125,216,245,.75),rgba(150,235,255,.3) 45%,rgba(125,216,245,.5)) border-box;box-shadow:0 18px 44px rgba(0,0,0,.55),0 0 26px rgba(88,196,236,.14),inset 0 1px 0 rgba(255,255,255,.05);animation:l4m-pop .26s cubic-bezier(.2,.85,.3,1.1)}
.panel::before{content:"";position:absolute;top:-70px;right:-60px;width:190px;height:190px;border-radius:50%;background:radial-gradient(circle,rgba(88,196,236,.32),transparent 68%);pointer-events:none}
.panel::after{content:"";position:absolute;bottom:-80px;left:-50px;width:170px;height:170px;border-radius:50%;background:radial-gradient(circle,rgba(140,230,255,.16),transparent 70%);pointer-events:none}
.panel>*{position:relative;z-index:1}
.head{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.06)}
.title{flex:1;min-width:0;font-size:14.5px;font-weight:800;letter-spacing:.2px;color:#e9f4fa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ver{flex:none;font-size:10px;font-weight:700;letter-spacing:.5px;color:#8fd4ea;background:rgba(88,196,236,.16);border:1px solid rgba(150,228,250,.3);padding:2px 7px;border-radius:999px}
.min{flex:none;width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:transparent;border:1px solid transparent;border-radius:9px;color:#93a0b8;font-size:17px;cursor:pointer;transition:background .15s,color .15s,border-color .15s}
.min:hover{background:rgba(255,255,255,.08);color:#e9f4fa;border-color:rgba(255,255,255,.08)}
.status{position:relative;display:flex;align-items:center;gap:10px;min-height:44px;padding:11px 14px;font-size:13.5px;color:#c7dde8;border-bottom:1px solid rgba(255,255,255,.06)}
#statusText{flex:1;min-width:0;word-break:break-word;line-height:1.5;font-weight:600;letter-spacing:.1px;transition:color .18s ease}
.stx.ok{color:#83d6a6}.stx.err{color:#f2837a}.stx.warn{color:#efc67a}.stx.info{color:#8fd4f0}
.spin{display:none;width:12px;height:12px;flex:none;border:2px solid rgba(255,255,255,.12);border-top-color:#6fd8f5;border-radius:50%;animation:l4m-rot .8s linear infinite}
.spin.on{display:inline-block;filter:drop-shadow(0 0 5px rgba(125,216,245,.65))}
@keyframes l4m-rot{to{transform:rotate(360deg)}}
.cdline{position:absolute;left:0;right:0;bottom:-1px;height:3px;background:rgba(255,255,255,.05);pointer-events:none}
.cdline i{display:block;height:100%;width:0%;background:linear-gradient(90deg,#3fb6dd,#7de8ff);box-shadow:0 0 9px rgba(125,232,255,.55);transition:width .25s linear}
.cd{display:inline-flex;align-items:center;gap:6px;margin-left:8px;padding:3px 11px 3px 9px;border-radius:999px;font-size:12.5px;background:linear-gradient(135deg,rgba(88,196,236,.24),rgba(150,235,255,.14));border:1px solid rgba(150,228,250,.45);color:#d8f2fc;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:.4px}
.cd .cddot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#6fd8f5;box-shadow:0 0 6px rgba(125,216,245,.85);animation:l4m-pulse 1.1s ease-in-out infinite}
@keyframes l4m-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.8)}}
.cd.urgent{background:linear-gradient(135deg,rgba(233,106,92,.2),rgba(233,106,92,.1));border-color:rgba(233,106,92,.5);color:#ffc4bd}
.cd.urgent .cddot{background:#f07a6b;box-shadow:0 0 6px rgba(240,122,107,.8)}
.notice{display:none;margin:12px 14px 0;padding:10px 12px;align-items:center;gap:10px;border-radius:12px;background:linear-gradient(135deg,rgba(88,196,236,.18),rgba(150,235,255,.09));border:1px solid rgba(150,228,250,.4)}
.notice.on{display:flex;animation:l4m-in .22s ease}
.nico{flex:none;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:14px;border-radius:8px;background:rgba(88,196,236,.24)}
.ntx{min-width:0;font-size:13px;font-weight:700;color:#d2f1fc;letter-spacing:.2px}
.inputrow{display:flex;flex-direction:column;gap:10px;padding:12px 14px 13px}
.urlwrap{display:flex;align-items:center;gap:8px;background:rgba(7,11,20,.75);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:0 12px;transition:border-color .15s,box-shadow .15s}
.urlwrap:focus-within{border-color:#56c8ea;box-shadow:0 0 0 3px rgba(88,196,236,.18)}
.uic{flex:none;font-size:13px;opacity:.6}
.url{flex:1;min-width:0;background:transparent;border:none;outline:none;color:#e9f4fa;padding:12px 0;font-size:14px}
.url::placeholder{color:#55607a}
.url:disabled{opacity:.5}
.go{width:100%;min-height:44px;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(135deg,#7de0ff,#3a9fd8);color:#071120;font-size:14px;font-weight:800;letter-spacing:.3px;box-shadow:0 6px 18px rgba(88,196,236,.32),inset 0 1px 0 rgba(255,255,255,.25);transition:transform .12s,filter .15s,box-shadow .15s,opacity .15s}
.go:hover:not(:disabled){filter:brightness(1.07);box-shadow:0 8px 22px rgba(88,196,236,.42),inset 0 1px 0 rgba(255,255,255,.25)}
.go:active:not(:disabled){transform:scale(.98)}
.go:disabled{opacity:.4;cursor:not-allowed;box-shadow:none}
.links{display:flex;gap:8px;width:100%}
.lbtn{flex:1;min-height:42px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-size:13.5px;font-weight:800;letter-spacing:.25px;box-shadow:0 4px 14px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.08);transition:transform .12s,filter .15s,background .15s,border-color .15s,box-shadow .15s}
.lbtn:active{transform:scale(.97)}
.lbtn.store{background:linear-gradient(135deg,rgba(88,196,236,.18),rgba(150,235,255,.08));border:1px solid rgba(150,228,250,.38);color:#d8f2fc}
.lbtn.store:hover{background:linear-gradient(135deg,rgba(88,196,236,.28),rgba(150,235,255,.15));border-color:rgba(150,228,250,.65);box-shadow:0 6px 18px rgba(88,196,236,.22),inset 0 1px 0 rgba(255,255,255,.14);filter:brightness(1.06)}
.lbtn.server{background:linear-gradient(135deg,rgba(114,137,218,.22),rgba(88,101,242,.1));border:1px solid rgba(138,156,245,.42);color:#dce2ff}
.lbtn.server:hover{background:linear-gradient(135deg,rgba(114,137,218,.32),rgba(88,101,242,.18));border-color:rgba(156,172,255,.7);box-shadow:0 6px 18px rgba(114,137,218,.24),inset 0 1px 0 rgba(255,255,255,.14);filter:brightness(1.06)}
.result{margin:0 14px 13px;display:none;border-radius:14px;overflow:hidden;background:linear-gradient(165deg,rgba(88,171,125,.16),rgba(88,171,125,.05));border:1px solid rgba(116,199,149,.32)}
.result.on{display:block;animation:l4m-in .22s ease}
.rtag{padding:10px 12px 0;font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#8fd8ac}
.rurl{margin:8px 10px 0;padding:9px 11px;background:rgba(4,10,7,.55);border:1px solid rgba(116,199,149,.18);border-radius:10px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.55;color:#c4e8d2;word-break:break-all;max-height:80px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(116,199,149,.35) transparent}
.rurl::-webkit-scrollbar{width:6px}
.rurl::-webkit-scrollbar-track{background:transparent}
.rurl::-webkit-scrollbar-thumb{background:rgba(116,199,149,.35);border-radius:3px}
.rurl::-webkit-scrollbar-thumb:hover{background:rgba(116,199,149,.55)}
.rbtns{display:flex;gap:8px;padding:10px 10px 11px}
.rbtn{flex:1;min-height:42px;border:none;border-radius:11px;cursor:pointer;font-size:13px;font-weight:800;letter-spacing:.2px;transition:transform .12s,filter .15s,background .15s,box-shadow .15s}
.rbtn:active{transform:scale(.97)}
.rbtn.copy{background:linear-gradient(135deg,#66bd90,#4aa274);color:#05130b;box-shadow:0 4px 14px rgba(88,171,125,.28)}
.rbtn.copy:hover{filter:brightness(1.06)}
.rbtn.open{background:rgba(116,199,149,.1);color:#a4dcbd;border:1px solid rgba(116,199,149,.32)}
.rbtn.open:hover{background:rgba(116,199,149,.18)}
@keyframes l4m-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@keyframes l4m-pop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
.fab{width:54px;height:54px;border-radius:17px;cursor:pointer;border:1px solid rgba(150,228,250,.34);background:linear-gradient(160deg,#0e1c26,#070d13);box-shadow:0 8px 24px rgba(0,0,0,.5),0 0 16px rgba(88,196,236,.16),inset 0 1px 0 rgba(255,255,255,.07);animation:l4m-pop .22s ease;display:none;transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease,filter .16s ease}
.fab::before{content:"🔓";font-size:22px;display:flex;align-items:center;justify-content:center;width:100%;height:100%}
.fab:hover{border-color:rgba(150,228,250,.65);box-shadow:0 10px 26px rgba(0,0,0,.55),0 0 20px rgba(88,196,236,.3),inset 0 1px 0 rgba(255,255,255,.12);filter:brightness(1.12)}
.fab:active{transform:scale(.93)}
button:focus-visible{outline:2px solid #6fd8f5;outline-offset:2px}
@media (max-width:480px){.panel{width:calc(100vw - 14px)}.head{padding:11px 12px;gap:9px}.title{font-size:14px}.ver{display:none}.status{min-height:42px;padding:10px 12px;font-size:13px}.inputrow{gap:9px;padding:11px 12px 12px}.urlwrap{padding:0 11px}.url{font-size:16px;padding:11px 0}.go{min-height:46px;font-size:13.5px}.lbtn{min-height:44px;font-size:13px}.notice{margin:10px 12px 0}.result{margin:0 12px 11px}.rbtn{min-height:44px}}
@media (pointer:coarse){.url{font-size:16px}.min{width:34px;height:34px}.rbtn,.lbtn{min-height:44px}}
@media (prefers-reduced-motion:reduce){.panel,.fab,.result.on,.notice.on{animation:none}.spin{animation-duration:1.6s}.cd .cddot{animation:none}.cdline i{transition:none}}`;

  const UI = { el: {}, cds: {}, base: "Sẵn sàng", kind: "info", busy: false, running: false, tick: null };

  function buildUI() {
    const host = document.createElement("div");
    host.id = "l4m-bypass-host";
    host.style.cssText = "position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:2147483647;";
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML =
      "<style>" + CSS + "</style>" +
      '<div class="panel" id="panel">' +
      '<div class="head"><span class="title">Link4m (Bypass)</span><span class="ver">v' + esc(VERSION) + '</span>' +
      '<button class="min" id="btnMin" title="Thu nhỏ" type="button">−</button></div>' +
      '<div class="status" id="status"><span class="spin" id="spin"></span><span id="statusText" class="stx info">Đang khởi tạo…</span>' +
      '<span class="cdline"><i id="cdfill"></i></span></div>' +
      '<div class="notice" id="notice"><span class="nico">🔓</span><span class="ntx">Hãy giải reCaptcha…</span></div>' +
      '<form class="inputrow" id="iform" novalidate><div class="urlwrap" id="urlwrap"><span class="uic">🔗</span>' +
      '<input class="url" id="url" type="url" inputmode="url" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Nhập URL (vd: example.com)"></div>' +
      '<button class="go" id="go" type="submit">Bắt đầu</button>' +
      '<div class="links"><button class="lbtn store" id="btnStore" type="button">My Store</button>' +
      '<button class="lbtn server" id="btnServer" type="button">My Server</button></div></form>' +
      '<div class="result" id="result"><div class="rtag">✓ URL của bạn</div><div class="rurl" id="rurl"></div>' +
      '<div class="rbtns"><button class="rbtn copy" id="rCopy" type="button">⧉ Copy URL</button>' +
      '<button class="rbtn open" id="rOpen" type="button">↗ Mở URL</button></div></div></div>' +
      '<button class="fab" id="fab" type="button" title="Mở Link4m (Bypass)" aria-label="Mở Link4m (Bypass)"></button>';
    (document.body || document.documentElement).appendChild(host);

    const q = (id) => root.getElementById(id);
    UI.el = {
      panel: q("panel"), fab: q("fab"), spin: q("spin"), statusText: q("statusText"),
      input: q("url"), go: q("go"), urlwrap: q("urlwrap"), store: q("btnStore"),
      server: q("btnServer"), result: q("result"), cdfill: q("cdfill"),
      notice: q("notice"), rurl: q("rurl"), rCopy: q("rCopy"), rOpen: q("rOpen"), iform: q("iform"),
    };

    q("btnMin").addEventListener("click", () => toggle(false));
    UI.el.fab.addEventListener("click", () => toggle(true));
    UI.el.store.addEventListener("click", () => openTab(STORE_URL));
    UI.el.server.addEventListener("click", () => openTab(DISCORD_URL));
    UI.el.iform.addEventListener("submit", (e) => { e.preventDefault(); start(); });
    UI.el.input.addEventListener("keydown", (e) => {
      if (e.isComposing) return;
      if (e.key === "Enter" || e.keyCode === 13) { e.preventDefault(); start(); }
    });
    UI.el.rCopy.addEventListener("click", async () => {
      const u = UI.el.rurl.textContent;
      if (!u) return;
      flash(UI.el.rCopy, (await copyText(u)) ? "✓ Đã copy" : "✗ Lỗi copy");
    });
    UI.el.rOpen.addEventListener("click", () => { const u = UI.el.rurl.textContent; if (u) openTab(u); });

    UI.tick = setInterval(renderCd, 250);
    setStatus("Sẵn sàng — nhập URL nhiệm vụ", "info", false);
  }

  function flash(btn, txt) {
    const old = btn.textContent;
    btn.textContent = txt;
    setTimeout(() => { btn.textContent = old; }, 1400);
  }
  function toggle(open) {
    UI.el.panel.style.display = open ? "" : "none";
    UI.el.fab.style.display = open ? "none" : "block";
  }
  function setStatus(text, kind, busy) {
    UI.base = text; UI.kind = kind || "info"; UI.busy = busy !== false;
    renderCd();
  }
  function setNotice(on) { UI.el.notice.classList.toggle("on", !!on); }
  function setBusy(on, label) {
    UI.el.input.disabled = !!on;
    UI.el.go.disabled = !!on;
    UI.el.go.textContent = on ? (label || "Đang xử lý…") : "Bắt đầu";
  }
  function showResult(url) { UI.el.rurl.textContent = url; UI.el.result.classList.add("on"); }
  function clearResult() { UI.el.rurl.textContent = ""; UI.el.result.classList.remove("on"); }
  function cd(key, label, ms) { UI.cds[key] = { label, end: now() + ms, dur: ms }; renderCd(); }
  function cdClear(key) { delete UI.cds[key]; renderCd(); }

  function renderCd() {
    const st = UI.el.statusText;
    if (!st) return;
    const t = now();
    let act = null;
    for (const k of Object.keys(UI.cds)) {
      const c = UI.cds[k];
      if (c.end - t <= 0) { delete UI.cds[k]; continue; }
      if (!act || c.end < act.end) act = c;
    }
    st.className = "stx " + UI.kind;
    UI.el.spin.classList.toggle("on", UI.busy);
    if (!act) {
      st.textContent = UI.base;
      UI.el.cdfill.style.width = "0%";
      return;
    }
    const left = Math.max(0, act.end - t);
    const sec = Math.ceil(left / 1000);
    const label = sec >= 60 ? Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0") : sec + "s";
    st.innerHTML = esc(UI.base) + '<span class="cd' + (sec <= 10 ? " urgent" : "") + '"><i class="cddot"></i>' + label + "</span>";
    UI.el.cdfill.style.width = Math.max(0, Math.min(100, (1 - left / act.dur) * 100)) + "%";
  }

  /* ================= CLOUDFLARE / RECAPTCHA ================= */
  function cfTitle() {
    const t = (document.title || "").toLowerCase().trim();
    return t === "just a moment" || t === "chờ một chút";
  }
  async function waitCloudflare() {
    if (!cfTitle()) return;
    setStatus("⏳ Chờ Cloudflare…", "info", true);
    while (cfTitle()) await sleep(500);
  }

  function recaptchaToken() {
    const nodes = document.querySelectorAll('[name="g-recaptcha-response"], textarea#g-recaptcha-response');
    for (const n of nodes) if (n.value) return n.value;
    try {
      const g = window.grecaptcha;
      if (g && typeof g.getResponse === "function") {
        for (let i = 0; i < 4; i++) { try { const r = g.getResponse(i); if (r) return r; } catch (e) {} }
        try { const r = g.getResponse(); if (r) return r; } catch (e) {}
      }
    } catch (e) {}
    return "";
  }
  function tryExecute() {
    try {
      const g = window.grecaptcha;
      if (!g || typeof g.execute !== "function") return false;
      for (const a of [null, 0, 1, 2]) {
        try { const p = a == null ? g.execute() : g.execute(a); if (p && typeof p.catch === "function") p.catch(() => {}); } catch (e) {}
      }
      return true;
    } catch (e) { return false; }
  }
  async function waitRecaptcha() {
    const limit = 300000, t0 = now();
    setNotice(true);
    setStatus("Đang chờ giải reCaptcha…", "info", true);
    cd("rc", "reCaptcha", limit);
    try {
      let tk = recaptchaToken();
      while (!tk) {
        if (now() - t0 > limit) throw new Error("✗ Chờ reCaptcha quá 5 phút");
        await sleep(500);
        tk = recaptchaToken();
      }
      return tk;
    } finally { cdClear("rc"); setNotice(false); }
  }

  /* ================= HƯỚNG DẪN / ẢNH ================= */
  const wrapperEl = () => document.getElementById("advertise-html-wrapper") || document.querySelector(".advertise-html-wrapper");

  async function waitAdvertise(timeout) {
    const t0 = now(), limit = timeout || 15000;
    while (now() - t0 < limit) {
      const el = wrapperEl();
      if (el && el.innerHTML) return el;
      await sleep(300);
    }
    return wrapperEl();
  }

  async function waitGuide() {
    const t0 = now();
    let last = "", stable = 0;
    cd("guide", "Hướng dẫn", 60000);
    try {
      while (now() - t0 < 60000) {
        const el = wrapperEl();
        if (el && el.innerHTML) {
          if (el.innerHTML !== last) { last = el.innerHTML; stable = now(); }
          const links = el.querySelectorAll("a[href]");
          let real = 0;
          for (const a of links) {
            const href = a.getAttribute("href") || "";
            if (/google\.com/i.test(href)) continue;
            if ((a.textContent || "").trim()) real++;
          }
          if (real > 0) setStatus("Đang kiểm tra hướng dẫn…", "info", true);
          if (el.querySelector("img") && now() - stable > 1000) return el;
          if (real > 0 && now() - stable > 10000) return el;
        }
        await sleep(300);
      }
      return wrapperEl();
    } finally { cdClear("guide"); }
  }

  function findImages(root) {
    const scope = root || document, seen = new Set(), out = [];
    const add = (url, el, score) => {
      if (!url) return;
      let abs; try { abs = new URL(url, location.href).href; } catch (e) { return; }
      if (seen.has(abs)) return;
      seen.add(abs);
      out.push({ url: abs, el: el || null, score });
    };
    for (const im of scope.querySelectorAll("img")) {
      const src = im.currentSrc || im.src || im.getAttribute("data-src") || "";
      if (!src) continue;
      const one = RE.imgOne.test(src);
      if (one || RE.guideImg.test(src) || RE.imgLink4m.test(src)) {
        let sc = 5;
        if (one) sc += 20;
        if ((im.naturalWidth || im.width || 0) >= 80 && (im.naturalHeight || im.height || 0) >= 25) sc += 15;
        add(src, im, sc);
      }
      const hint = ((im.previousElementSibling && im.previousElementSibling.textContent) ||
                    (im.parentElement && im.parentElement.textContent) || "");
      if (RE.step3Hint.test(hint)) add(src, im, 25);
    }
    for (const el of scope.querySelectorAll("*")) {
      let bg = ""; try { bg = getComputedStyle(el).backgroundImage || ""; } catch (e) {}
      const m = RE.bgUrl.exec(bg);
      if (m && (RE.guideImg.test(m[1]) || RE.imgLink4m.test(m[1]))) add(m[1], el, 8);
    }
    try {
      if (window.performance && typeof performance.getEntriesByType === "function") {
        for (const r of performance.getEntriesByType("resource")) {
          if (RE.guideImg.test(r.name) || RE.imgLink4m.test(r.name)) add(r.name, null, 8);
        }
      }
    } catch (e) {}
    out.sort((a, b) => b.score - a.score);
    return out;
  }

  async function toDataURL(item) {
    if (item.el && item.el.tagName === "IMG" && item.el.naturalWidth > 0) {
      try {
        const cv = document.createElement("canvas");
        cv.width = item.el.naturalWidth; cv.height = item.el.naturalHeight;
        cv.getContext("2d").drawImage(item.el, 0, 0);
        return cv.toDataURL("image/png");
      } catch (e) {}
    }
    try {
      const r = await request({
        url: item.url, method: "GET", responseType: "arraybuffer", timeout: 20000,
        headers: { Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" },
      });
      const buf = r.response || r.responseText;
      if (buf && buf.byteLength > 100) {
        const mime = /\.png(\?|$)/i.test(item.url) ? "image/png" : /\.webp(\?|$)/i.test(item.url) ? "image/webp" : "image/jpeg";
        return "data:" + mime + ";base64," + abToBase64(buf);
      }
    } catch (e) {}
    return null;
  }

  function variants(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onerror = () => resolve([dataUrl]);
      img.onload = () => {
        const out = [];
        const w = img.naturalWidth, h = img.naturalHeight;
        const paint = (scale, filter) => {
          try {
            const cv = document.createElement("canvas");
            cv.width = Math.max(1, Math.round(w * scale));
            cv.height = Math.max(1, Math.round(h * scale));
            const c = cv.getContext("2d");
            c.fillStyle = "#ffffff"; c.fillRect(0, 0, cv.width, cv.height);
            c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
            try { c.filter = filter; } catch (e) {}
            c.drawImage(img, 0, 0, cv.width, cv.height);
            out.push(cv.toDataURL("image/png"));
          } catch (e) {}
        };
        const base = w > 900 ? 0.92 : 2.5;
        paint(base, "contrast(1.35)");
        paint(base, "contrast(1.25) brightness(1.02)");
        if (h >= 70) paint(0.6, "contrast(1.35)");
        out.push(dataUrl);
        resolve(out.length ? out : [dataUrl]);
      };
      img.src = dataUrl;
    });
  }

  /* ================= OCR ================= */
  async function ocrSpace(dataUrl, engine, key) {
    const f = new URLSearchParams();
    f.set("apikey", key);
    f.set("base64Image", dataUrl);
    f.set("OCREngine", String(engine));
    f.set("language", "eng");
    f.set("isOverlayRequired", "false");
    f.set("scale", "true");
    const r = await request({
      url: OCR_API, method: "POST", timeout: 30000,
      headers: { "Content-Type": "application/x-www-form-urlencoded" }, data: f.toString(),
    });
    let j = null; try { j = JSON.parse(r.responseText); } catch (e) { return ""; }
    if (!j || !j.ParsedResults) return "";
    const parts = [];
    for (const p of j.ParsedResults) if (p && p.ParsedText) parts.push(p.ParsedText);
    return parts.join("\n");
  }

  let tessP = null;
  function loadTess() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (tessP) return tessP;
    tessP = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = TESSERACT_JS;
      s.onload = () => res(window.Tesseract);
      s.onerror = () => rej(new Error("không tải được Tesseract"));
      (document.head || document.documentElement).appendChild(s);
    });
    return tessP;
  }
  async function ocrTess(dataUrl) {
    try {
      const T = await loadTess();
      if (!T || typeof T.recognize !== "function") return "";
      const r = await T.recognize(dataUrl, "eng");
      return r && r.data && r.data.text ? String(r.data.text) : "";
    } catch (e) { return ""; }
  }

  /* ================= DOMAIN ================= */
  function validHost(d) {
    if (!d) return false;
    const parts = d.split(".");
    if (parts.length < 2) return false;
    for (const p of parts) if (!RE.label.test(p)) return false;
    const tld = parts[parts.length - 1];
    return tld.length >= 2 && !/^\d+$/.test(tld);
  }
  function suffixOf(d) {
    const p = d.split(".");
    if (p.length >= 3) {
      const s2 = p.slice(-2).join(".");
      if (SUFFIXES.indexOf(s2) >= 0) return s2;
    }
    const s1 = p[p.length - 1];
    return SUFFIXES.indexOf(s1) >= 0 ? s1 : "";
  }

  function extractInfo(el) {
    const info = { directDomains: [], masks: [] };
    if (!el) return info;
    const text = el.innerText || el.textContent || "";
    const seen = new Set();
    const push = (d) => {
      d = String(d || "").toLowerCase().replace(/^www\./, "").replace(/^\.+|\.+$/g, "");
      if (!d || seen.has(d) || RE.skip.test(d) || !validHost(d)) return;
      seen.add(d); info.directDomains.push(d);
    };
    const step = RE.step3.exec(text);
    const zone = step && step[1] ? step[1] : text;
    let m;
    RE.domain.lastIndex = 0;
    while ((m = RE.domain.exec(zone))) push(m[1]);
    RE.domain.lastIndex = 0;
    while ((m = RE.domain.exec(text))) push(m[1]);
    const words = zone.match(RE.word) || [];
    for (const w of words) {
      const lw = w.toLowerCase();
      if (lw.length >= 5 && lw.length <= 40 && !/^\d+$/.test(lw)) info.masks.push({ type: "prefix", value: lw });
    }
    return info;
  }

  function scoreHost(d, masks) {
    let sc = 0;
    const suf = suffixOf(d);
    if (suf) sc += suf.indexOf(".") >= 0 ? 1000 : 500;
    for (const m of masks || []) {
      if (m.type === "prefix" && d.startsWith(m.value)) sc += 60;
      else if (m.type === "suffix" && d.endsWith(m.value)) sc += 60;
      else if (m.value && levenshtein(d.split(".")[0], m.value) <= 2) sc += 30;
    }
    if (d.split(".").length > 4) sc -= 50;
    return sc;
  }

  function pickDomain(text, info) {
    if (!text) return null;
    const masks = (info && info.masks) || [];
    const map = new Map();
    const add = (d, base) => {
      d = String(d || "").toLowerCase().replace(/^www\./, "").replace(/^\.+|\.+$/g, "");
      if (!d || RE.skip.test(d) || !validHost(d)) return;
      const cur = map.get(d) || { domain: d, score: 0, count: 0 };
      cur.count++; cur.score += base;
      map.set(d, cur);
    };
    let m;
    RE.urlInText.lastIndex = 0;
    while ((m = RE.urlInText.exec(text))) add(m[1], 100);
    for (const line of text.split(/\r?\n/)) {
      RE.domainLine.lastIndex = 0;
      while ((m = RE.domainLine.exec(line))) {
        const sc = scoreHost(m[1], masks);
        if (sc > 0) add(m[1], sc);
      }
    }
    let best = null;
    for (const c of map.values()) {
      const total = c.score + c.count * 10;
      if (!best || total > best.total) best = { domain: c.domain, total };
    }
    return best ? best.domain : null;
  }

  async function runOcr(list, info) {
    for (let k = 0; k < OCR_KEYS.length; k++) {
      for (const v of list) {
        for (const engine of [2, 1]) {
          try {
            const txt = await ocrSpace(v, engine, OCR_KEYS[k]);
            if (txt) { const d = pickDomain(txt, info); if (d) return d; }
          } catch (e) {}
        }
      }
    }
    setStatus("Đang OCR dự phòng (Tesseract)…", "info", true);
    for (const v of list) {
      const txt = await ocrTess(v);
      if (txt) { const d = pickDomain(txt, info); if (d) return d; }
    }
    return null;
  }

  async function ocrDomain() {
    const wrap = await waitGuide();
    const info = extractInfo(wrap);
    if (info.directDomains.length) {
      const d = info.directDomains[0], url = "https://" + d;
      UI.el.input.value = url;
      setStatus("✓ Đã lấy domain: " + d, "ok", true);
      return url;
    }
    setStatus("Đang lấy ảnh hướng dẫn…", "info", true);
    await waitAdvertise(6000);
    const imgs = findImages(wrap);
    if (!imgs.length) { setStatus("⊘ Không OCR được domain — hãy nhập tay", "warn", false); return null; }
    const count = Math.min(imgs.length, 3);
    let found = null;
    for (let i = 0; i < count && !found; i++) {
      setStatus("Đang OCR ảnh (" + (i + 1) + "/" + count + ")…", "info", true);
      const du = await toDataURL(imgs[i]);
      if (!du) continue;
      found = await runOcr(await variants(du), info);
    }
    if (found) {
      const url = "https://" + found;
      UI.el.input.value = url;
      setStatus("✓ Đã OCR: " + found + " — bắt đầu giải…", "ok", true);
      return url;
    }
    setStatus("⊘ Lỗi tự động OCR — hãy nhập URL tay", "warn", false);
    return null;
  }

  /* ================= WIDGET ================= */
  const readStr = (h, n) => { const m = varStr(n).exec(h); return m ? m[1] : null; };
  const readNum = (h, n) => { const m = varNum(n).exec(h); return m ? parseFloat(m[1]) : null; };

  function widgetFiles(html) {
    const seen = {}, out = [];
    let m; RE.widgetFile.lastIndex = 0;
    while ((m = RE.widgetFile.exec(html))) if (!seen[m[0]]) { seen[m[0]] = 1; out.push(m[0]); }
    return out;
  }
  function refDomains(html) {
    const out = []; let m, q;
    RE.refList.lastIndex = 0;
    while ((m = RE.refList.exec(html))) {
      RE.quoted.lastIndex = 0;
      while ((q = RE.quoted.exec(m[1]))) out.push(q[1]);
    }
    return out;
  }
  function serviceWidgets(html) {
    const out = []; let m;
    RE.service.lastIndex = 0;
    while ((m = RE.service.exec(html))) {
      const km = RE.queryKey.exec(m[3]);
      out.push("https://" + m[1] + "/widget/" + m[2] + (km ? "?key=" + km[1] : ""));
    }
    return out;
  }
  function parseVars(html) {
    const c = { key: null, code: null, session: null, domain: null, uuidName: null };
    c.uuidName = readStr(html, "uuid_name");
    c.domain = readStr(html, "traffic_domain");
    let m = RE.domainVar.exec(html);
    if (m) c.domain = readStr(html, m[1]) || c.domain;
    m = RE.keyVar.exec(html);
    if (m) c.key = readStr(html, m[1]);
    if (!c.key || c.key === "-") c.key = readStr(html, "traffic_key") || c.key;
    m = RE.codeVar.exec(html);
    if (m) c.code = readStr(html, m[1]);
    if (!c.code || c.code === "traffic_id") c.code = readStr(html, "traffic_id") || c.code;
    m = RE.sessVar.exec(html);
    if (m) c.session = readStr(html, m[1]);
    if (!c.session) c.session = readStr(html, "traffic_session");
    if (!c.session) { const h = RE.hex24.exec(html); if (h) c.session = "hex24:" + h[2]; }
    return c;
  }
  function validate(html) {
    if (!html) return { ok: false, reason: "không có nội dung widget" };
    const refs = refDomains(html), files = widgetFiles(html);
    const cfg = parseVars(html);
    if (!files.length) {
      if (cfg.key && cfg.code && cfg.session && cfg.domain) return { ok: true, cfg, refs };
      return { ok: false, reason: "không có widget" };
    }
    if (files[0] === "get_quest_code.html" && !refs.length) return { ok: false, reason: "không có ref google (0)" };
    if (!cfg.key || !cfg.code || !cfg.session || !cfg.domain) return { ok: false, reason: "thiếu key/code/session/domain" };
    return { ok: true, cfg, refs, reason: "có ref (" + refs.length + ")" };
  }
  const formVal = (n) => {
    const el = document.querySelector('input[name="' + n + '"]') || document.querySelector('textarea[name="' + n + '"]');
    return el ? el.value : "";
  };

  async function widgetFlow(link, seed) {
    let mode = "page", attempt = 0, cid = null, extra = "";
    let totalStep = 1, step = 1, endpoint = null, roles = null, cfg = null, code = null;
    let pageHtml = "", data = seed || null;

    while (attempt < 5 && !code) {
      try {
        if (mode === "page") {
          if (data && data.body) {
            const ch = evalChallenge(data.body, { jscd });
            if (ch.ok && ch.value != null) extra = "v=" + enc(String(ch.value));
          } else {
            const r = await request({ url: link, method: "GET", timeout: 20000, headers: { Accept: "text/html,*/*" } });
            pageHtml = r.responseText || "";
          }
          const v = validate(pageHtml);
          if (!v.ok) throw new Error(v.reason);
          cfg = v.cfg;

          const body = new URLSearchParams();
          body.set("traffic_session", cfg.session);
          body.set("key", cfg.key);
          const un = cfg.uuidName || "uuid";
          let cidVal = storeGet(CID_KEY, "");
          if (!cidVal) { cidVal = uuid(); storeSet(CID_KEY, cidVal); }
          body.set(un, cidVal);
          if (extra) extra.split("&").forEach((kv) => { const i = kv.indexOf("="); if (i > 0) body.set(kv.slice(0, i), decodeURIComponent(kv.slice(i + 1))); });

          const r = await request({
            url: "https://" + cfg.domain + "/widget/client.js", method: "POST", timeout: 25000,
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
            data: body.toString(),
          });
          let j = null; try { j = JSON.parse(r.responseText); } catch (e) {}
          if (j) {
            if (j.id) { cid = j.id; storeSet(CID_KEY, j.id); }
            if (j.totalStep) totalStep = parseInt(j.totalStep, 10) || totalStep;
            if (j.endpoints && j.endpoints[0]) endpoint = j.endpoints[0];
            if (j.roles) roles = j.roles;
            if (j.body) {
              const ch = evalChallenge(j.body, { jscd });
              if (ch.ok && ch.value != null) extra = "v=" + enc(String(ch.value));
            }
            if (j.html) { const c = parseVars(j.html); if (c.code) { code = c.code; break; } }
            if (endpoint) { mode = "endpoint"; }
          } else {
            const c = parseVars(r.responseText || "");
            if (c.code && /[0-9a-f]{16,}/i.test(c.code)) { code = c.code; break; }
          }
        } else {
          const qs = new URLSearchParams();
          qs.set("traffic_session", cfg.session);
          qs.set("key", cfg.key);
          if (cid) qs.set("id", cid);
          if (extra) extra.split("&").forEach((kv) => { const i = kv.indexOf("="); if (i > 0) qs.set(kv.slice(0, i), decodeURIComponent(kv.slice(i + 1))); });
          const r = await request({
            url: "https://" + cfg.domain + "/widget/" + endpoint + "?" + qs.toString(),
            method: "GET", timeout: 25000, headers: { Accept: "application/json,text/plain,*/*" },
          });
          let j = null; try { j = JSON.parse(r.responseText); } catch (e) {}
          if (j) {
            if (j.totalStep) totalStep = parseInt(j.totalStep, 10) || totalStep;
            if (j.endpoints && j.endpoints[0]) endpoint = j.endpoints[0];
            if (j.roles) roles = j.roles;
            if (j.body) {
              const ch = evalChallenge(j.body, { jscd });
              if (ch.ok && ch.value != null) extra = "v=" + enc(String(ch.value));
            }
            if (j.html) { const c = parseVars(j.html); if (c.code) { code = c.code; break; } }
          } else {
            const c = parseVars(r.responseText || "");
            if (c.code && /[0-9a-f]{16,}/i.test(c.code)) { code = c.code; break; }
          }
        }

        const wname = String(step) === "2" ? "traffic_step_2_wait_time" : "traffic_wait_time";
        let wait = readNum(pageHtml, wname);
        if (wait == null || isNaN(wait) || wait <= 0) wait = 16;
        wait = Math.min(wait, 120);

        setStatus("Chờ bước (" + step + "/" + totalStep + ")", "info", true);
        cd("w", "Bước " + step, wait * 1000);
        if (!navigator.onLine) {
          setStatus("⚠ Mất mạng — chờ kết nối lại để tiếp tục bước " + step, "warn", true);
          await sleep(120000);
        }
        await sleep(wait * 1000);
        cdClear("w");
        if (step < totalStep) step++;
        attempt = 0;
      } catch (e) {
        attempt++;
        cdClear("w");
        if (attempt >= 5) throw e;
        await sleep(1000 * attempt);
      }
    }
    cdClear("w");
    if (!code) throw new Error("không lấy được mã");
    setStatus("✓ Đã có mã", "ok", true);
    return { code, cfg, roles };
  }

  /* ================= LINK CUỐI ================= */
  async function verifyLink(url) {
    try {
      const r = await request({ url, method: "GET", timeout: 20000, headers: { Accept: "text/html,*/*" } });
      return r.status >= 200 && r.status < 400;
    } catch (e) { return false; }
  }

  async function getFinalLink(ctx) {
    const alias = formVal("alias"), campaign = formVal("campaign_id");
    const display = formVal("display_id"), prefix = formVal("prefix") || ctx.code;
    if (!alias && !campaign && !display && !formVal("prefix")) {
      setStatus("⊘ Không tìm thấy form lấy mã", "warn", false);
      return null;
    }
    const hasRc = !!document.querySelector('[name="g-recaptcha-response"], .g-recaptcha, iframe[src*="recaptcha"], iframe[src*="google.com/recaptcha"]');
    let token = "";
    if (hasRc) { tryExecute(); token = await waitRecaptcha(); }

    const server = findServer();
    const body = "alias=" + enc(alias) + "&campaign_id=" + enc(campaign) + "&display_id=" + enc(display) +
                 "&prefix=" + enc(prefix) + "&g-recaptcha-response=" + enc(token);
    let r;
    try {
      r = await request({
        url: server + "/links/get-link-info", method: "POST", timeout: 30000,
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" }, data: body,
      });
    } catch (e) {
      setStatus("✗ Lấy URL thất bại: " + errText(e), "err", false);
      return null;
    }
    let j = null; try { j = JSON.parse(r.responseText); } catch (e) {}
    if (!j || !j.success || !j.url) { setStatus("✗ Lấy URL thất bại", "err", false); return null; }

    try {
      await request({
        url: server + "/widget/click.html?campaign_id=" + enc(campaign) + "&display_id=" + enc(display) + "&code=" + enc(ctx.code),
        method: "GET", timeout: 15000,
      });
    } catch (e) {}

    await verifyLink(j.url);
    showResult(j.url);
    setStatus("✓ Lấy URL thành công", "ok", false);
    return j.url;
  }

  /* ================= LUỒNG CHÍNH ================= */
  async function start() {
    if (UI.running) return;
    const raw = UI.el.input.value.trim() || location.href;
    const n = normalizeUrl(raw);
    if (n.err === "empty") { setStatus("✗ Chưa nhập URL", "err", false); return; }
    if (n.err) { setStatus("✗ URL không hợp lệ", "err", false); return; }
    if (RE.link4mHost.test(n.host)) {
      setStatus('✗ Đừng nhập URL "Link4m" — hãy nhập URL nhiệm vụ', "err", false);
      return;
    }

    UI.running = true;
    setBusy(true, "Đang xử lý…");
    clearResult(); setNotice(false);

    try {
      await waitCloudflare();
      setStatus("Đang tải trang nhiệm vụ…", "info", true);
      let html = "";
      try {
        const r = await request({ url: n.url, method: "GET", timeout: 30000, headers: { Accept: "text/html,*/*" } });
        if (r.status >= 400) throw new Error("HTTP " + r.status);
        html = r.responseText || "";
      } catch (e) {
        setStatus("✗ Không tải được trang: " + errText(e), "err", false);
        return;
      }

      let widgets = serviceWidgets(html);
      if (!widgets.length) {
        const files = widgetFiles(html);
        if (files.length) widgets = files.map((f) => n.origin + "/widget/" + f);
      }
      if (!widgets.length) {
        const c = parseVars(html);
        if (c.domain && c.key) widgets = ["https://" + c.domain + "/widget/client.js"];
      }
      if (!widgets.length) { setStatus("⊘ Không tìm thấy widget nào", "warn", false); return; }

      setStatus("Đang chạy " + widgets.length + " widget…", "info", true);
      let finalUrl = null;
      for (let i = 0; i < widgets.length && !finalUrl; i++) {
        try {
          const ctx = await widgetFlow(widgets[i], null);
          if (!ctx.cfg.domain || RE.skip.test(ctx.cfg.domain)) {
            const d = await ocrDomain();
            if (d) ctx.cfg.domain = normalizeUrl(d).host;
          }
          finalUrl = await getFinalLink(ctx);
        } catch (e) {
          setStatus("⊘ Widget " + (i + 1) + ": " + errText(e), "warn", true);
          await sleep(400);
        }
      }
      if (!finalUrl) setStatus("⊘ Không lấy được mã từ widget", "warn", false);
    } catch (e) {
      setStatus("✗ Có lỗi xảy ra: " + errText(e), "err", false);
    } finally {
      UI.running = false;
      setBusy(false); setNotice(false);
      cdClear("w"); cdClear("rc"); cdClear("guide");
    }
  }

  /* ================= INIT ================= */
  function init() {
    if (document.getElementById("l4m-bypass-host")) return;
    buildUI();
    if (RE.link4mHost.test(location.hostname)) UI.el.input.value = location.href;
  }
  if (document.readyState === "complete" || document.readyState === "interactive") init();
  else {
    document.addEventListener("DOMContentLoaded", init, { once: true });
    window.addEventListener("load", init, { once: true });
  }
})();
