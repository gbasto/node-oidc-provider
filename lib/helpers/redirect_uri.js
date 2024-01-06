"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = redirectUri;
var url = _interopRequireWildcard(require("node:url"));
var querystring = _interopRequireWildcard(require("node:querystring"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function redirectUri(uri, payload, mode) {
  const parsed = url.parse(uri, true);
  parsed.search = null;

  // handles a case where url module adds unintended / to the pathname
  // i.e. http://www.example.com => http://www.example.com/
  if (parsed.pathname === '/' && !uri.endsWith('/')) parsed.pathname = null;
  switch (mode) {
    case 'fragment':
      parsed.hash = querystring.stringify(payload);
      break;
    default:
      Object.assign(parsed.query, payload);
      break;
  }
  return url.format(parsed);
}