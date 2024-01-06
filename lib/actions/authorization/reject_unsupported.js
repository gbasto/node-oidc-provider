"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = rejectUnsupported;
var _errors = require("../../helpers/errors.js");
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/*
 * Rejects request and request_uri parameters when not supported.
 *
 * @throws: request_not_supported
 * @throws: request_uri_not_supported
 */
function rejectUnsupported(ctx, next) {
  const {
    requestObjects,
    pushedAuthorizationRequests
  } = (0, _weak_cache.default)(ctx.oidc.provider).configuration('features');
  const {
    params
  } = ctx.oidc;
  if (params.request !== undefined && !requestObjects.request) {
    throw new _errors.RequestNotSupported();
  }
  if (params.request_uri !== undefined && (ctx.oidc.route !== 'authorization' || !(requestObjects.requestUri || pushedAuthorizationRequests.enabled))) {
    // TODO: https://gitlab.com/openid/conformance-suite/-/issues/1139
    if (ctx.oidc.route === 'pushed_authorization_request') {
      throw new _errors.InvalidRequest('`request_uri` parameter must not be used at the pushed_authorization_request_endpoint');
    }
    throw new _errors.RequestUriNotSupported();
  }
  return next();
}