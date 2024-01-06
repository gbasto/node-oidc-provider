"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.codeVerification = void 0;
Object.defineProperty(exports, "discovery", {
  enumerable: true,
  get: function () {
    return _discovery.default;
  }
});
exports.endSession = void 0;
Object.defineProperty(exports, "getAuthorization", {
  enumerable: true,
  get: function () {
    return _index.default;
  }
});
Object.defineProperty(exports, "getIntrospection", {
  enumerable: true,
  get: function () {
    return _introspection.default;
  }
});
Object.defineProperty(exports, "getRevocation", {
  enumerable: true,
  get: function () {
    return _revocation.default;
  }
});
Object.defineProperty(exports, "getToken", {
  enumerable: true,
  get: function () {
    return _token.default;
  }
});
Object.defineProperty(exports, "jwks", {
  enumerable: true,
  get: function () {
    return _jwks.default;
  }
});
exports.registration = void 0;
Object.defineProperty(exports, "userinfo", {
  enumerable: true,
  get: function () {
    return _userinfo.default;
  }
});
var _index = _interopRequireDefault(require("./authorization/index.js"));
var _userinfo = _interopRequireDefault(require("./userinfo.js"));
var _token = _interopRequireDefault(require("./token.js"));
var _jwks = _interopRequireDefault(require("./jwks.js"));
var registration = _interopRequireWildcard(require("./registration.js"));
exports.registration = registration;
var _revocation = _interopRequireDefault(require("./revocation.js"));
var _introspection = _interopRequireDefault(require("./introspection.js"));
var _discovery = _interopRequireDefault(require("./discovery.js"));
var endSession = _interopRequireWildcard(require("./end_session.js"));
exports.endSession = endSession;
var codeVerification = _interopRequireWildcard(require("./code_verification.js"));
exports.codeVerification = codeVerification;
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }