"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CLIENT_ATTRIBUTES = void 0;
Object.defineProperty(exports, "DEV_KEYSTORE", {
  enumerable: true,
  get: function () {
    return _dev_keystore.default;
  }
});
exports.JWA = void 0;
Object.defineProperty(exports, "PARAM_LIST", {
  enumerable: true,
  get: function () {
    return _param_list.default;
  }
});
exports.PUSHED_REQUEST_URN = void 0;
var _param_list = _interopRequireDefault(require("./param_list.js"));
var _dev_keystore = _interopRequireDefault(require("./dev_keystore.js"));
var CLIENT_ATTRIBUTES = _interopRequireWildcard(require("./client_attributes.js"));
exports.CLIENT_ATTRIBUTES = CLIENT_ATTRIBUTES;
var JWA = _interopRequireWildcard(require("./jwa.js"));
exports.JWA = JWA;
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const PUSHED_REQUEST_URN = exports.PUSHED_REQUEST_URN = 'urn:ietf:params:oauth:request_uri:';