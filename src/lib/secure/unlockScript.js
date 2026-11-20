/*
 * The script inside every locked page. It runs in the reader's browser, needs no internet, and uses only WebCrypto.
 * It is copied as plain text into the page by page.ts, after sanitizeCore.js (which provides sdSanitize).
 */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var data = JSON.parse($('lk').textContent);
  var form = $('form');
  var field = $('pw');
  var status = $('status');
  var go = $('go');

  function say(text, bad) { status.textContent = text; status.className = bad ? 'bad' : ''; }
  function bytes(b64) {
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function size(n) { return n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }

  if (!window.crypto || !window.crypto.subtle) {
    go.disabled = true;
    say('This browser cannot unlock the page here. Open the file in Chrome, Edge, Firefox or Safari from your Downloads, not from inside an email or chat app.', true);
  }

  $('show').addEventListener('change', function (e) { field.type = e.target.checked ? 'text' : 'password'; });

  async function unlock(password) {
    var enc = new TextEncoder();
    var material = await crypto.subtle.importKey('raw', enc.encode(password.normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
    var key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: bytes(data.s), iterations: data.i, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    var plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(data.n), additionalData: enc.encode('mdu1|' + data.i) }, key, bytes(data.c)));
    var n = new DataView(plain.buffer).getUint32(0);
    return { head: JSON.parse(new TextDecoder().decode(plain.subarray(4, 4 + n))), body: plain.subarray(4 + n) };
  }

  function reveal() {
    $('gate').hidden = true;
    $('view').hidden = false;
    window.scrollTo(0, 0);
  }

  function showDoc(head, body) {
    var style = document.createElement('style');
    style.textContent = head.c || '';
    document.head.appendChild(style);
    var html = new TextDecoder().decode(body);
    var holder = $('doc');
    holder.className = 'sdoc';
    holder.innerHTML = sdSanitize(html);
    $('print').hidden = false;
    reveal();
  }

  function showHtml(head, body) {
    var frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts allow-popups allow-forms allow-modals allow-downloads');
    frame.title = head.t || 'Document';
    frame.srcdoc = new TextDecoder().decode(body);
    $('frame').appendChild(frame);
    $('view').classList.add('full');
    reveal();
  }

  function showFile(head, body) {
    var type = head.y || 'application/octet-stream';
    var blob = new Blob([body], { type: type });
    var url = URL.createObjectURL(blob);
    var name = head.n || 'file';
    $('fname').textContent = name;
    $('fmeta').textContent = size(body.length) + (head.y ? ' · ' + head.y : '');
    var dl = $('download');
    dl.href = url;
    dl.download = name;
    var open = $('openfile');
    if (/^(application\/pdf|image\/(png|jpe?g|gif|webp)|text\/plain)$/.test(type)) { open.href = url; open.hidden = false; }
    $('filebox').hidden = false;
    reveal();
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!field.value) { say('Type the password first.', true); field.focus(); return; }
    go.disabled = true;
    say('Unlocking. This takes a few seconds on purpose.', false);
    await new Promise(function (r) { setTimeout(r, 30); });
    var result;
    try { result = await unlock(field.value); }
    catch (err) {
      go.disabled = false;
      say('That password did not open this file. Check the spelling and the capital letters, then try again.', true);
      field.select();
      return;
    }
    field.value = '';
    var head = result.head;
    document.title = head.t || 'Document';
    if (head.m === 'doc') showDoc(head, result.body);
    else if (head.m === 'html') showHtml(head, result.body);
    else showFile(head, result.body);
  });

  $('print').addEventListener('click', function () { window.print(); });
  $('lock').addEventListener('click', function () { location.reload(); });
})();
