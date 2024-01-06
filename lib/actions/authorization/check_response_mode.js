"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = checkResponseMode;
var _errors = require("../../helpers/errors.js");
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
var _resolve_response_mode = require("../../helpers/resolve_response_mode.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/*
 * Resolves and assigns params.response_mode if it was not explicitly requested. Validates id_token
 * and token containing responses do not use response_mode query.
 *
 * @throws: invalid_request
 */
function checkResponseMode(ctx, next, forceCheck) {
  const {
    params,
    client
  } = ctx.oidc;
  const frontChannel = (0, _resolve_response_mode.isFrontChannel)(params.response_type);
  const mode = ctx.oidc.responseMode;
  if (mode !== undefined && !(0, _weak_cache.default)(ctx.oidc.provider).responseModes.has(mode)) {
    params.response_mode = undefined;
    throw new _errors.UnsupportedResponseMode();
  }
  const JWT = /jwt/.test(mode);
  if (mode !== undefined && JWT && (/^HS/.test(client.authorizationSignedResponseAlg) || /^(A|dir$)/.test(client.authorizationEncryptedResponseAlg))) {
    try {
      client.checkClientSecretExpiration('client secret is expired, cannot issue a JWT Authorization response');
    } catch (err) {
      const [explicit] = mode === 'jwt' ? [undefined] : mode.split('.');
      params.response_mode = explicit || undefined;
      throw err;
    }
  }
  if (mode === 'query' && frontChannel) {
    throw new _errors.InvalidRequest('response_mode not allowed for this response_type');
  } else if (mode === 'query.jwt' && frontChannel && !client.authorizationEncryptedResponseAlg) {
    throw new _errors.InvalidRequest('response_mode not allowed for this response_type unless encrypted');
  }
  const fapiProfile = ctx.oidc.isFapi('1.0 Final', '1.0 ID2');
  if (params.response_type && fapiProfile) {
    if ((!params.request && !params.request_uri || forceCheck) && !params.response_type.includes('id_token') && !JWT) {
      throw new _errors.InvalidRequest(`requested response_mode not allowed for the requested response_type in FAPI ${fapiProfile}`);
    }
  }
  return next();
}