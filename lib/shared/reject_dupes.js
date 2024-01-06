"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = rejectDupes;
var _errors = require("../helpers/errors.js");
var formatters = _interopRequireWildcard(require("../helpers/formatters.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function exceptMap([key, value]) {
  if (Array.isArray(value) && !this.has(key)) {
    return key;
  }
  return undefined;
}
function onlyMap([key, value]) {
  if (Array.isArray(value) && this.has(key)) {
    return key;
  }
  return undefined;
}
function defaultMap([key, value]) {
  return Array.isArray(value) ? key : undefined;
}

// eslint-disable-next-line default-param-last
function rejectDupes({
  except,
  only
} = {}, ctx, next) {
  let mapFn;
  if (except) {
    mapFn = exceptMap.bind(except);
  } else if (only) {
    mapFn = onlyMap.bind(only);
  } else {
    mapFn = defaultMap;
  }
  const dupes = Object.entries(ctx.oidc.params).map(mapFn);
  if (dupes.some(Boolean)) {
    const params = dupes.filter(Boolean);
    params.forEach(param => {
      ctx.oidc.params[param] = undefined;
    });
    throw new _errors.InvalidRequest(`${formatters.formatList(params)} ${formatters.pluralize('parameter', params.length)} must not be provided twice`);
  }
  return next();
}