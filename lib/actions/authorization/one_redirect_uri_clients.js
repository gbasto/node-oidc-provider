"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = oneRedirectUriClients;
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/*
 * If no redirect_uri is provided and client only pre-registered one unique value it is assumed
 * to be the requested redirect_uri and used as if it was explicitly provided;
 */
function oneRedirectUriClients(ctx, next) {
  if (!(0, _weak_cache.default)(ctx.oidc.provider).configuration('allowOmittingSingleRegisteredRedirectUri')) {
    return next();
  }
  const {
    params,
    client
  } = ctx.oidc;
  if (params.redirect_uri === undefined && client.redirectUris.length === 1) {
    ctx.oidc.redirectUriCheckPerformed = true;
    [params.redirect_uri] = client.redirectUris;
  }
  return next();
}