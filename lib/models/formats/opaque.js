"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _pick_by = _interopRequireDefault(require("../../helpers/_/pick_by.js"));
var _jwt = require("../../helpers/jwt.js");
var _epoch_time = _interopRequireDefault(require("../../helpers/epoch_time.js"));
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
var _nanoid = _interopRequireDefault(require("../../helpers/nanoid.js"));
var _ctx_ref = _interopRequireDefault(require("../ctx_ref.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const withExtra = new Set(['AccessToken', 'ClientCredentials']);
const bitsPerSymbol = Math.log2(64);
const tokenLength = i => Math.ceil(i / bitsPerSymbol);
var _default = provider => ({
  generateTokenId() {
    let length;
    if (this.kind !== 'PushedAuthorizationRequest') {
      const bitsOfOpaqueRandomness = (0, _weak_cache.default)(provider).configuration('formats.bitsOfOpaqueRandomness');
      if (typeof bitsOfOpaqueRandomness === 'function') {
        length = tokenLength(bitsOfOpaqueRandomness(_ctx_ref.default.get(this), this));
      } else {
        length = tokenLength(bitsOfOpaqueRandomness);
      }
    }
    return (0, _nanoid.default)(length);
  },
  async getValueAndPayload() {
    const now = (0, _epoch_time.default)();
    const exp = this.exp || now + this.expiration;
    const payload = {
      iat: this.iat || (0, _epoch_time.default)(),
      ...(exp ? {
        exp
      } : undefined),
      ...(0, _pick_by.default)(this, (val, key) => this.constructor.IN_PAYLOAD.includes(key) && typeof val !== 'undefined')
    };
    if (withExtra.has(this.kind)) {
      // eslint-disable-next-line no-multi-assign
      payload.extra = this.extra = await (0, _weak_cache.default)(provider).configuration('extraTokenClaims')(_ctx_ref.default.get(this), this);
    }
    return {
      value: this.jti,
      payload
    };
  },
  async verify(stored, {
    ignoreExpiration
  } = {}) {
    // checks that legacy tokens aren't accepted as opaque when their jti is passed
    if ('jwt' in stored || 'jwt-ietf' in stored || 'paseto' in stored) throw new TypeError();
    if ('format' in stored && stored.format !== 'opaque') throw new TypeError();
    (0, _jwt.assertPayload)(stored, {
      ignoreExpiration,
      clockTolerance: (0, _weak_cache.default)(provider).configuration('clockTolerance')
    });
    return stored;
  }
});
exports.default = _default;