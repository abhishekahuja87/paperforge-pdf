/*
 * Cleans document HTML. Plain JavaScript on purpose: the editor imports it, and the same text is copied into every
 * locked page (see page.ts, which removes the word "export" when it embeds this file), so the page that opens the
 * document cleans it the same way the editor does. It rebuilds the document from a short list of safe tags and
 * attributes, so scripts, event handlers, forms, frames, remote images and javascript: links never get through.
 */
var SD_TAGS = 'a abbr b blockquote br caption code col colgroup del div em figcaption figure h1 h2 h3 h4 h5 h6 hr i img ins li mark ol p pre s small span strike strong sub sup table tbody td tfoot th thead tr u ul'.split(' ');
var SD_DROP = 'script style iframe object embed link meta form input button textarea select option svg math noscript template title head base audio video canvas frame frameset applet'.split(' ');
var SD_STYLE = 'color background-color background font-family font-size font-weight font-style text-decoration text-decoration-line text-align text-indent line-height margin margin-left margin-right margin-top margin-bottom padding padding-left padding-right padding-top padding-bottom width height max-width border border-top border-bottom border-left border-right border-color border-style border-width border-collapse vertical-align list-style-type white-space letter-spacing text-transform float display'.split(' ');
var SD_FONT_SIZES = { 1: '10px', 2: '13px', 3: '16px', 4: '18px', 5: '24px', 6: '32px', 7: '48px' };

function sdCleanStyle(value) {
  var out = [];
  String(value || '').split(';').forEach(function (part) {
    var at = part.indexOf(':');
    if (at < 1) return;
    var name = part.slice(0, at).trim().toLowerCase();
    var val = part.slice(at + 1).trim();
    if (SD_STYLE.indexOf(name) < 0 || !val || val.length > 120) return;
    if (/url\(|expression|javascript|@import|[\\<>{}]|\/\*/i.test(val)) return;
    if (name === 'display' && !/^(block|inline|inline-block|table|none)$/.test(val)) return;
    if (name === 'float' && !/^(left|right|none)$/.test(val)) return;
    out.push(name + ': ' + val);
  });
  return out.join('; ');
}

function sdSafeLink(href) {
  var value = String(href || '').trim();
  return /^(https?:|mailto:|tel:|#)/i.test(value) ? value : '';
}

function sdCopy(from, to, tag) {
  var style = sdCleanStyle(from.getAttribute('style'));
  if (tag === 'font') {
    var extra = [];
    if (from.getAttribute('color')) extra.push('color: ' + from.getAttribute('color'));
    if (from.getAttribute('face')) extra.push('font-family: ' + from.getAttribute('face'));
    if (SD_FONT_SIZES[from.getAttribute('size')]) extra.push('font-size: ' + SD_FONT_SIZES[from.getAttribute('size')]);
    style = sdCleanStyle((style ? style + ';' : '') + extra.join(';'));
  }
  if (style) to.setAttribute('style', style);
  var cls = String(from.getAttribute('class') || '').split(/\s+/).filter(function (c) { return /^sd-[a-z0-9-]{1,30}$/.test(c); });
  if (cls.length) to.setAttribute('class', cls.join(' '));
  var title = from.getAttribute('title');
  if (title) to.setAttribute('title', title.slice(0, 200));
  if (tag === 'a') {
    var href = sdSafeLink(from.getAttribute('href'));
    if (href) {
      to.setAttribute('href', href);
      if (href.charAt(0) !== '#') { to.setAttribute('target', '_blank'); to.setAttribute('rel', 'noopener noreferrer'); }
    }
  }
  if (tag === 'img') {
    var src = String(from.getAttribute('src') || '');
    if (/^data:image\/(png|jpeg|jpg|gif|webp);base64,[a-z0-9+\/=]+$/i.test(src)) to.setAttribute('src', src);
    to.setAttribute('alt', String(from.getAttribute('alt') || '').slice(0, 300));
  }
  if (tag === 'td' || tag === 'th') {
    ['colspan', 'rowspan'].forEach(function (key) {
      var n = parseInt(from.getAttribute(key) || '', 10);
      if (n > 1 && n < 50) to.setAttribute(key, String(n));
    });
  }
}

function sdWalk(node, out, doc) {
  var kids = node.childNodes;
  for (var i = 0; i < kids.length; i++) {
    var child = kids[i];
    if (child.nodeType === 3) { out.appendChild(doc.createTextNode(child.nodeValue)); continue; }
    if (child.nodeType !== 1) continue;
    var tag = child.nodeName.toLowerCase();
    if (SD_DROP.indexOf(tag) >= 0) continue;
    if (tag === 'font') {
      var span = doc.createElement('span');
      sdCopy(child, span, 'font');
      sdWalk(child, span, doc);
      out.appendChild(span);
    } else if (tag === 'img' && !/^data:image\//i.test(child.getAttribute('src') || '')) {
      continue;
    } else if (SD_TAGS.indexOf(tag) >= 0) {
      var el = doc.createElement(tag);
      sdCopy(child, el, tag);
      if (tag !== 'img' && tag !== 'br' && tag !== 'hr') sdWalk(child, el, doc);
      out.appendChild(el);
    } else {
      sdWalk(child, out, doc);
    }
  }
}

export function sdSanitize(html) {
  var parsed = new DOMParser().parseFromString('<!doctype html><body>' + String(html || ''), 'text/html');
  var holder = parsed.createElement('div');
  sdWalk(parsed.body, holder, parsed);
  return holder.innerHTML;
}
