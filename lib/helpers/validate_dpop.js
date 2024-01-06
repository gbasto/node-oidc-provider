"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _nodeCrypto = require("node:crypto");
var _jose = require("jose");
var _errors = require("./errors.js");
var _weak_cache = _interopRequireDefault(require("./weak_cache.js"));
var base64url = _interopRequireWildcard(require("./base64url.js"));
var _epoch_time = _interopRequireDefault(require("./epoch_time.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = async (ctx, accessToken) => {
  const {
    features: {
      dPoP: dPoPConfig
    },
    dPoPSigningAlgValues
  } = (0, _weak_cache.default)(ctx.oidc.provider).configuration();
  if (!dPoPConfig.enabled) {
    return undefined;
  }
  const proof = ctx.get('DPoP');
  if (!proof) {
    return undefined;
  }
  const {
    DPoPNonces
  } = (0, _weak_cache.default)(ctx.oidc.provider);
  const requireNonce = dPoPConfig.requireNonce(ctx);
  if (typeof requireNonce !== 'boolean') {
    throw new Error('features.dPoP.requireNonce must return a boolean');
  }
  if (DPoPNonces) {
    ctx.set('DPoP-Nonce', DPoPNonces.nextNonce());
  } else if (requireNonce) {
    throw new Error('features.dPoP.nonceSecret configuration is missing');
  }
  let payload;
  let protectedHeader;
  try {
    ({
      protectedHeader,
      payload
    } = await (0, _jose.jwtVerify)(proof, _jose.EmbeddedJWK, {
      algorithms: dPoPSigningAlgValues,
      typ: 'dpop+jwt'
    }));
    if (typeof payload.iat !== 'number' || !payload.iat) {
      throw new _errors.InvalidDpopProof('DPoP proof must have a iat number property');
    }
    if (typeof payload.jti !== 'string' || !payload.jti) {
      throw new _errors.InvalidDpopProof('DPoP proof must have a jti string property');
    }
    if (payload.nonce !== undefined && typeof payload.nonce !== 'string') {
      throw new _errors.InvalidDpopProof('DPoP proof nonce must be a string');
    }
    if (!payload.nonce) {
      const now = (0, _epoch_time.default)();
      const diff = Math.abs(now - payload.iat);
      if (diff > 300) {
        throw new _errors.InvalidDpopProof('DPoP proof iat is not recent enough');
      }
    }
    if (payload.htm !== ctx.method) {
      throw new _errors.InvalidDpopProof('DPoP proof htm mismatch');
    }
    {
      const expected = new URL(ctx.oidc.urlFor(ctx.oidc.route)).href;
      let actual;
      try {
        actual = new URL(payload.htu);
        actual.hash = '';
        actual.search = '';
      } catch {}
      if (actual?.href !== expected) {
        throw new _errors.InvalidDpopProof('DPoP proof htu mismatch');
      }
    }
    if (accessToken) {
      const ath = base64url.encode((0, _nodeCrypto.createHash)('sha256').update(accessToken).digest());
      if (payload.ath !== ath) {
        throw new _errors.InvalidDpopProof('DPoP proof ath mismatch');
      }
    }
  } catch (err) {
    if (err instanceof _errors.InvalidDpopProof) {
      throw err;
    }
    throw new _errors.InvalidDpopProof('invalid DPoP key binding', err.message);
  }
  if (!payload.nonce && requireNonce) {
    throw new _errors.UseDpopNonce('nonce is required in the DPoP proof');
  }
  if (payload.nonce && (!DPoPNonces || !DPoPNonces.checkNonce(payload.nonce))) {
    throw new _errors.UseDpopNonce('invalid nonce in DPoP proof');
  }
  const thumbprint = await (0, _jose.calculateJwkThumbprint)(protectedHeader.jwk);
  return {
    thumbprint,
    jti: payload.jti,
    iat: payload.iat
  };
};
exports.default = _default;