"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = oidcRequired;
var _validate_presence = _interopRequireDefault(require("../../helpers/validate_presence.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/*
 * Validates presence of redirect_uri and conditionally nonce if specific implicit or hybrid flow
 * are used.
 * Validates that openid scope is present is OpenID Connect specific parameters are provided.
 *
 * @throws: invalid_request
 */
function oidcRequired(ctx, next) {
  const {
    params
  } = ctx.oidc;
  const required = new Set(['redirect_uri']);

  // Check for nonce if implicit or hybrid flow responding with id_token issued by the authorization
  // endpoint
  if (typeof params.response_type === 'string' && params.response_type.includes('id_token')) {
    required.add('nonce');
  }
  if (ctx.oidc.isFapi('1.0 Final', '1.0 ID2')) {
    required.add(ctx.oidc.requestParamScopes.has('openid') ? 'nonce' : 'state');
  }
  (0, _validate_presence.default)(ctx, ...required);
  return next();
}