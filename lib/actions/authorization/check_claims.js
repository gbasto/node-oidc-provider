"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = checkClaims;
var _errors = require("../../helpers/errors.js");
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
var _is_plain_object = _interopRequireDefault(require("../../helpers/_/is_plain_object.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/*
 * If claims parameter is provided and supported handles its validation
 * - should not be combined with rt none
 * - should be JSON serialized object with id_token or userinfo properties as objects
 * - claims.userinfo should not be used if authorization result is not access_token
 *
 * Merges requested claims with auth_time as requested if max_age is provided or require_auth_time
 * is configured for the client.
 *
 * Merges requested claims with acr as requested if acr_values is provided
 *
 * @throws: invalid_request
 */
function checkClaims(ctx, next) {
  const {
    params
  } = ctx.oidc;
  if (params.claims !== undefined) {
    const {
      features: {
        claimsParameter,
        userinfo
      }
    } = (0, _weak_cache.default)(ctx.oidc.provider).configuration();
    if (claimsParameter.enabled) {
      if (params.response_type === 'none') {
        throw new _errors.InvalidRequest('claims parameter should not be combined with response_type none');
      }
      let claims;
      try {
        claims = JSON.parse(params.claims);
      } catch (err) {
        throw new _errors.InvalidRequest('could not parse the claims parameter JSON');
      }
      if (!(0, _is_plain_object.default)(claims)) {
        throw new _errors.InvalidRequest('claims parameter should be a JSON object');
      }
      if (claims.userinfo === undefined && claims.id_token === undefined) {
        throw new _errors.InvalidRequest('claims parameter should have userinfo or id_token properties');
      }
      if (claims.userinfo !== undefined && !(0, _is_plain_object.default)(claims.userinfo)) {
        throw new _errors.InvalidRequest('claims.userinfo should be an object');
      }
      if (claims.id_token !== undefined && !(0, _is_plain_object.default)(claims.id_token)) {
        throw new _errors.InvalidRequest('claims.id_token should be an object');
      }
      if (claims.userinfo && !userinfo.enabled) {
        throw new _errors.InvalidRequest('claims.userinfo should not be used since userinfo endpoint is not supported');
      }
      if (params.response_type === 'id_token' && claims.userinfo) {
        throw new _errors.InvalidRequest('claims.userinfo should not be used if access_token is not issued');
      }
    }
  }
  return next();
}