"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = checkResponseType;
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
var _errors = require("../../helpers/errors.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/*
 * Validates requested response_type is supported by the provided and allowed in the client
 * configuration
 *
 * @throws: unsupported_response_type
 * @throws: unauthorized_client
 */
function checkResponseType(ctx, next) {
  const {
    params
  } = ctx.oidc;
  const supported = (0, _weak_cache.default)(ctx.oidc.provider).configuration('responseTypes');
  params.response_type = [...new Set(params.response_type.split(' '))].sort().join(' ');
  if (!supported.includes(params.response_type)) {
    throw new _errors.UnsupportedResponseType();
  }
  if (!ctx.oidc.client.responseTypeAllowed(params.response_type)) {
    throw new _errors.UnauthorizedClient('requested response_type is not allowed for this client');
  }
  return next();
}