"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var authorization_code = _interopRequireWildcard(require("./authorization_code.js"));
var client_credentials = _interopRequireWildcard(require("./client_credentials.js"));
var refresh_token = _interopRequireWildcard(require("./refresh_token.js"));
var device_code = _interopRequireWildcard(require("./device_code.js"));
var ciba = _interopRequireWildcard(require("./ciba.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/* eslint-disable camelcase */
var _default = exports.default = {
  authorization_code,
  client_credentials,
  refresh_token,
  'urn:ietf:params:oauth:grant-type:device_code': device_code,
  'urn:openid:params:grant-type:ciba': ciba
};