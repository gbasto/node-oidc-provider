"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = checkPKCE;
var _errors = require("../../helpers/errors.js");
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
var _pkce_format = _interopRequireDefault(require("../../helpers/pkce_format.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/*
 * - assign default code_challenge_method if a code_challenge is provided
 * - check presence of code code_challenge if code_challenge_method is provided
 * - enforce PKCE use for native clients using hybrid or code flow
 */
function checkPKCE(ctx, next) {
  const {
    params,
    route
  } = ctx.oidc;
  const {
    pkce
  } = (0, _weak_cache.default)(ctx.oidc.provider).configuration();
  if (!params.code_challenge_method && params.code_challenge) {
    if (pkce.methods.includes('plain')) {
      params.code_challenge_method = 'plain';
    } else {
      throw new _errors.InvalidRequest('plain code_challenge_method fallback disabled, code_challenge_method must be provided');
    }
  }
  if (params.code_challenge_method) {
    if (!pkce.methods.includes(params.code_challenge_method)) {
      throw new _errors.InvalidRequest('not supported value of code_challenge_method');
    }
    if (!params.code_challenge) {
      throw new _errors.InvalidRequest('code_challenge must be provided with code_challenge_method');
    }
  }
  if (params.response_type.includes('code')) {
    if (!params.code_challenge && (pkce.required(ctx, ctx.oidc.client) || ctx.oidc.isFapi('1.0 Final') && route === 'pushed_authorization_request')) {
      throw new _errors.InvalidRequest('Authorization Server policy requires PKCE to be used for this request');
    }
  }
  if (params.code_challenge !== undefined) {
    (0, _pkce_format.default)(params.code_challenge, 'code_challenge');
  }
  return next();
}