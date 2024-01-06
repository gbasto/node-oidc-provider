"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = respond;
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/*
 * Based on the authorization request response mode either redirects with parameters in query or
 * fragment or renders auto-submitting form with the response members as hidden fields.
 *
 * If session management is supported stores User-Agent readable cookie with the session stated
 * used by the OP iframe to detect session state changes.
 *
 * @emits: authorization.success
 */
async function respond(ctx, next) {
  const out = await next();
  const {
    oidc: {
      params
    }
  } = ctx;
  if (params.state !== undefined) {
    out.state = params.state;
  }
  const {
    responseMode
  } = ctx.oidc;
  if (!out.id_token && !responseMode.includes('jwt')) {
    out.iss = ctx.oidc.provider.issuer;
  }
  ctx.oidc.provider.emit('authorization.success', ctx, out);
  const handler = (0, _weak_cache.default)(ctx.oidc.provider).responseModes.get(responseMode);
  await handler(ctx, params.redirect_uri, out);
}