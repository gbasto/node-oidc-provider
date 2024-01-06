"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = pushedAuthorizationRequestResponse;
var _jose = require("jose");
var _index = require("../../consts/index.js");
var _epoch_time = _interopRequireDefault(require("../../helpers/epoch_time.js"));
var JWT = _interopRequireWildcard(require("../../helpers/jwt.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const MAX_TTL = 60;
async function pushedAuthorizationRequestResponse(ctx, next) {
  let request;
  let ttl;
  let dpopJkt;
  const now = (0, _epoch_time.default)();
  if (ctx.oidc.body.request) {
    ({
      request
    } = ctx.oidc.body);
    const {
      payload: {
        exp,
        dpop_jkt: thumbprint
      }
    } = JWT.decode(request);
    ttl = exp - now;
    if (!Number.isInteger(ttl) || ttl > MAX_TTL) {
      ttl = MAX_TTL;
    }
    dpopJkt = thumbprint || ctx.oidc.params.dpop_jkt;
  } else {
    ttl = MAX_TTL;
    request = new _jose.UnsecuredJWT({
      ...ctx.oidc.params
    }).setIssuedAt(now).setIssuer(ctx.oidc.client.clientId).setAudience(ctx.oidc.issuer).setExpirationTime(now + MAX_TTL).setNotBefore(now).encode();
    dpopJkt = ctx.oidc.params.dpop_jkt;
  }
  const requestObject = new ctx.oidc.provider.PushedAuthorizationRequest({
    request,
    dpopJkt,
    trusted: ctx.oidc.client.clientAuthMethod !== 'none' || !!ctx.oidc.trusted?.length
  });
  const id = await requestObject.save(ttl);
  ctx.oidc.entity('PushedAuthorizationRequest', requestObject);
  ctx.status = 201;
  ctx.body = {
    expires_in: ttl,
    request_uri: `${_index.PUSHED_REQUEST_URN}${id}`
  };
  ctx.oidc.provider.emit('pushed_authorization_request.success', ctx, ctx.oidc.client);
  return next();
}