import sanitizeSource from './sanitizeCore.js?raw';
import unlockSource from './unlockScript.js?raw';
import type { Sealed } from './crypto';

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const PAGE_CSS = `
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;min-height:100vh;font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#0f172a;background:#eef2f7}
[hidden]{display:none!important}
#gate{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{width:100%;max-width:420px;background:#fff;border-radius:18px;padding:28px 24px;box-shadow:0 1px 3px rgba(15,23,42,.12),0 18px 50px -20px rgba(15,23,42,.35);text-align:center}
.lock{width:56px;height:56px;margin:0 auto 12px;border-radius:50%;background:#e0e7ff;color:#3730a3;display:flex;align-items:center;justify-content:center}
h1{font-size:1.35rem;margin:.2rem 0 .4rem}
.msg{margin:.5rem 0 1rem;padding:.6rem .8rem;border-radius:10px;background:#f1f5f9;color:#334155;font-size:.95rem;white-space:pre-wrap;overflow-wrap:anywhere;text-align:left}
label{display:block;text-align:left;font-size:.85rem;font-weight:600;color:#334155}
input[type=password],input[type=text]{width:100%;margin-top:6px;padding:12px 14px;font-size:1rem;border:1.5px solid #cbd5e1;border-radius:10px;background:#fff;color:#0f172a}
input:focus{outline:3px solid #c7d2fe;border-color:#6366f1}
.row{display:flex;align-items:center;gap:8px;margin:10px 0 14px;font-size:.85rem;color:#475569;text-align:left}
.row input{width:auto;margin:0}
button,.btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 20px;font:600 1rem system-ui,sans-serif;border:0;border-radius:10px;background:#3730a3;color:#fff;cursor:pointer;text-decoration:none}
#go{width:100%}
button:disabled{opacity:.6;cursor:wait}
.alt{background:#fff;color:#1e293b;border:1.5px solid #cbd5e1}
#status{min-height:1.4em;margin:12px 0 0;font-size:.9rem;color:#475569}
#status.bad{color:#b91c1c}
.small{margin:16px 0 0;font-size:.78rem;color:#64748b}
.small a{color:#475569}
#view{padding:16px 12px 40px}
#view.full{padding:0}
.bar{max-width:56rem;margin:0 auto 12px;display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
#view.full .bar{max-width:none;padding:10px 12px;margin:0;background:#fff;border-bottom:1px solid #e2e8f0}
.bar button{min-height:40px;padding:0 14px;font-size:.9rem}
#frame iframe{display:block;width:100%;height:calc(100vh - 62px);border:0;background:#fff}
#filebox{max-width:30rem;margin:8vh auto 0;background:#fff;border-radius:18px;padding:28px 24px;text-align:center;box-shadow:0 1px 3px rgba(15,23,42,.12),0 18px 50px -20px rgba(15,23,42,.35)}
#fname{font-weight:700;overflow-wrap:anywhere}
#fmeta{color:#64748b;font-size:.9rem;margin:4px 0 18px}
#filebox .btn{margin:4px}
@media (prefers-color-scheme:dark){body{background:#0b1220;color:#e2e8f0}.card,#filebox{background:#111a2e}.msg{background:#1b2640;color:#cbd5e1}input[type=password],input[type=text]{background:#0b1220;color:#e2e8f0;border-color:#334155}.alt{background:#111a2e;color:#e2e8f0;border-color:#334155}label,.row,#status,.small,.small a{color:#94a3b8}#view.full .bar{background:#111a2e;border-color:#243049}}
@media print{body{background:#fff}#gate,.bar{display:none!important}#view{padding:0}}
`;

export interface LockedPageOptions {
  sealed: Sealed;
  /** Text shown on the unlock screen before the password, such as who it is from. Public, not encrypted. */
  message?: string;
}

/** Builds the single HTML file: an unlock screen, the sealed data and the small script that opens it. Needs no internet and no server. */
export function buildLockedPage({ sealed, message = '' }: LockedPageOptions): string {
  const script = `${sanitizeSource.replace(/^export /gm, '')}\n${unlockSource}`;
  if (/<\/script/i.test(script)) throw new Error('The unlock script cannot contain a closing script tag.');
  const note = message.trim() ? `<p class="msg">${escapeHtml(message.trim().slice(0, 500))}</p>` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Locked document</title>
<style>${PAGE_CSS}</style>
</head>
<body>
<main id="gate">
<div class="card">
<div class="lock" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></div>
<h1>This file is locked</h1>
<p style="margin:0 0 .4rem;color:#475569">Type the password you were given to open it.</p>
${note}
<form id="form" autocomplete="off">
<label for="pw">Password<input id="pw" type="password" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
<div class="row"><input id="show" type="checkbox"><label for="show" style="font-weight:400;display:inline">Show the password</label></div>
<button id="go" type="submit">Unlock</button>
<p id="status" role="status" aria-live="polite"></p>
</form>
<p class="small">Locked with AES-256 encryption. It opens on this device only, with no internet and no upload. Made at <a href="https://www.mydailyutils.in" rel="noopener">mydailyutils.in</a>.</p>
</div>
</main>
<section id="view" hidden>
<div class="bar"><button id="print" class="alt" type="button" hidden>Print or save as PDF</button><button id="lock" class="alt" type="button">Lock again</button></div>
<article id="doc"></article>
<div id="frame"></div>
<div id="filebox" hidden><p id="fname"></p><p id="fmeta"></p><a id="download" class="btn">Download the file</a><a id="openfile" class="btn alt" target="_blank" rel="noopener" hidden>Open it</a></div>
</section>
<script type="application/json" id="lk">${JSON.stringify(sealed)}</script>
<script>
${script}
</script>
</body>
</html>`;
}
