"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getTokenJwtAuth;
var _errors = require("../helpers/errors.js");
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
var JWT = _interopRequireWildcard(require("../helpers/jwt.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function getTokenJwtAuth(provider) {
  const clockTolerance = (0, _weak_cache.default)(provider).configuration('clockTolerance');
  return async function tokenJwtAuth(ctx, keystore, algorithms) {
    const acceptedAud = ctx.oidc.clientJwtAuthExpectedAudience();
    const {
      header,
      payload
    } = JWT.decode(ctx.oidc.params.client_assertion);
    if (!algorithms.includes(header.alg)) {
      throw new _errors.InvalidClientAuth('alg mismatch');
    }
    if (!payload.exp) {
      throw new _errors.InvalidClientAuth('expiration must be specified in the client_assertion JWT');
    }
    if (!payload.jti) {
      throw new _errors.InvalidClientAuth('unique jti (JWT ID) must be provided in the client_assertion JWT');
    }
    if (!payload.iss) {
      throw new _errors.InvalidClientAuth('iss (JWT issuer) must be provided in the client_assertion JWT');
    }
    if (payload.iss !== ctx.oidc.client.clientId) {
      throw new _errors.InvalidClientAuth('iss (JWT issuer) must be the client_id');
    }
    if (!payload.aud) {
      throw new _errors.InvalidClientAuth('aud (JWT audience) must be provided in the client_assertion JWT');
    }
    if (Array.isArray(payload.aud)) {
      if (!payload.aud.some(aud => acceptedAud.has(aud))) {
        throw new _errors.InvalidClientAuth('list of audience (aud) must include the endpoint url, issuer identifier or token endpoint url');
      }
    } else if (!acceptedAud.has(payload.aud)) {
      throw new _errors.InvalidClientAuth('audience (aud) must equal the endpoint url, issuer identifier or token endpoint url');
    }
    try {
      await JWT.verify(ctx.oidc.params.client_assertion, keystore, {
        clockTolerance,
        ignoreAzp: true
      });
    } catch (err) {
      throw new _errors.InvalidClientAuth(err.message);
    }
    const unique = await provider.ReplayDetection.unique(payload.iss, payload.jti, payload.exp + clockTolerance);
    if (!unique) {
      throw new _errors.InvalidClientAuth('client assertion tokens must only be used once');
    }
  };
}