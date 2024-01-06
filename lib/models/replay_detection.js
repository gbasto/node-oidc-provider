"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _objectHash = _interopRequireDefault(require("object-hash"));
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
var _epoch_time = _interopRequireDefault(require("../helpers/epoch_time.js"));
var base64url = _interopRequireWildcard(require("../helpers/base64url.js"));
var _has_format = _interopRequireDefault(require("./mixins/has_format.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const fingerprint = properties => base64url.encodeBuffer((0, _objectHash.default)(properties, {
  ignoreUnknown: true,
  unorderedArrays: true,
  encoding: 'buffer',
  algorithm: 'sha256'
}));
var _default = provider => class ReplayDetection extends (0, _has_format.default)(provider, 'ReplayDetection', (0, _weak_cache.default)(provider).BaseModel) {
  static get IN_PAYLOAD() {
    return [...super.IN_PAYLOAD, 'iss'];
  }
  static async unique(iss, jti, exp) {
    const id = fingerprint({
      iss,
      jti
    });
    const found = await this.find(id);
    if (found) {
      return false;
    }
    const inst = this.instantiate({
      jti: id,
      iss
    });
    await inst.save(exp - (0, _epoch_time.default)());
    return true;
  }
};
exports.default = _default;