"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = checkPKCE;
var crypto = _interopRequireWildcard(require("node:crypto"));
var _errors = require("./errors.js");
var _pkce_format = _interopRequireDefault(require("./pkce_format.js"));
var base64url = _interopRequireWildcard(require("./base64url.js"));
var _constant_equals = _interopRequireDefault(require("./constant_equals.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function checkPKCE(verifier, challenge, method) {
  if (verifier) {
    (0, _pkce_format.default)(verifier, 'code_verifier');
  }
  if (verifier || challenge) {
    try {
      let expected = verifier;
      if (!expected) throw new Error();
      if (method === 'S256') {
        expected = base64url.encodeBuffer(crypto.createHash('sha256').update(expected).digest());
      }
      if (!(0, _constant_equals.default)(challenge, expected)) {
        throw new Error();
      }
    } catch (err) {
      throw new _errors.InvalidGrant('PKCE verification failed');
    }
  }
}