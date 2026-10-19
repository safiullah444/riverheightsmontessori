/* Minimal runtime for the mockup's interactive sections (forms, FAQ, program finder). */
class DCLogic {
  constructor() { this.state = {}; this.props = {}; this._render = function () {}; }
  setState(p) { this.state = Object.assign({}, this.state, p); this._render(); }
  forceUpdate() { this._render(); }
}
(function () {
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  function single(str) { var m = String(str).match(/^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/); return m ? m[1] : null; }
  function resolve(path, vals, scope) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var parts = path.split('.');
    var cur = Object.prototype.hasOwnProperty.call(scope, parts[0]) ? scope : vals;
    for (var i = 0; i < parts.length; i++) { if (cur == null) return undefined; cur = cur[parts[i]]; }
    return cur;
  }
  function interp(str, vals, scope) {
    return str.replace(HOLE, function (m, p) { var v = resolve(p, vals, scope); return v == null ? '' : String(v); });
  }
  function truthy(v) { return !!v && v !== 'false'; }
  function renderChildren(src, dst, vals, scope) {
    Array.prototype.forEach.call(src.childNodes, function (n) { renderNode(n, dst, vals, scope); });
  }
  function renderNode(n, dst, vals, scope) {
    if (n.nodeType === 3) { dst.appendChild(document.createTextNode(interp(n.nodeValue, vals, scope))); return; }
    if (n.nodeType !== 1) return;
    var tag = n.localName;
    if (tag === 'sc-if') {
      var p = single(n.getAttribute('value') || '');
      if (p && truthy(resolve(p, vals, scope))) renderChildren(n, dst, vals, scope);
      return;
    }
    if (tag === 'sc-for') {
      var lp = single(n.getAttribute('list') || '');
      var list = (lp ? resolve(lp, vals, scope) : []) || [];
      var as = n.getAttribute('as') || 'item';
      list.forEach(function (it, i) {
        var sc = Object.assign({}, scope); sc[as] = it; sc.$index = i;
        renderChildren(n, dst, vals, sc);
      });
      return;
    }
    var el = n.cloneNode(false);
    var deferValue;
    Array.prototype.slice.call(n.attributes).forEach(function (a) {
      var name = a.name, val = a.value;
      if (name.indexOf('hint-') === 0) { el.removeAttribute(name); return; }
      if (name === 'data-on-click' || name === 'data-on-change') {
        el.removeAttribute(name);
        var fp = single(val);
        var fn = fp ? resolve(fp, vals, scope) : null;
        if (typeof fn === 'function') {
          var ev = 'click';
          if (name === 'data-on-change') {
            var t = (n.getAttribute('type') || '').toLowerCase();
            ev = (tag === 'select' || t === 'checkbox' || t === 'radio') ? 'change' : 'input';
          }
          el.addEventListener(ev, fn);
        }
        return;
      }
      if (val.indexOf('{{') < 0) return;
      var hp = single(val);
      var v = hp ? resolve(hp, vals, scope) : interp(val, vals, scope);
      if (name === 'checked' || name === 'disabled' || name === 'selected') {
        if (truthy(v)) el.setAttribute(name, ''); else el.removeAttribute(name);
        try { el[name] = truthy(v); } catch (e) {}
        return;
      }
      if (name === 'value') { deferValue = v == null ? '' : String(v); el.removeAttribute('value'); return; }
      el.setAttribute(name, v == null ? '' : String(v));
    });
    renderChildren(n, el, vals, scope);
    if (deferValue !== undefined) { el.value = deferValue; if (tag === 'input') el.setAttribute('value', deferValue); }
    dst.appendChild(el);
  }
  window.dcMount = function (root, Comp) {
    if (!root) return;
    var inst = new Comp();
    var mounts = Array.prototype.map.call(root.querySelectorAll('[data-mount]'), function (el) {
      return { el: el, tpl: el.innerHTML };
    });
    inst._render = function () {
      var vals = inst.renderVals();
      var ae = document.activeElement;
      var aid = ae && ae.id && root.contains(ae) ? ae.id : null;
      var s0 = null, s1 = null;
      try { if (aid) { s0 = ae.selectionStart; s1 = ae.selectionEnd; } } catch (e) {}
      mounts.forEach(function (m) {
        var t = document.createElement('template');
        t.innerHTML = m.tpl;
        var frag = document.createDocumentFragment();
        renderChildren(t.content, frag, vals, {});
        m.el.replaceChildren(frag);
      });
      if (aid) {
        var nEl = document.getElementById(aid);
        if (nEl) { nEl.focus({ preventScroll: true }); try { if (s0 != null) nEl.setSelectionRange(s0, s1); } catch (e) {} }
      }
    };
    inst._render();
  };
})();
