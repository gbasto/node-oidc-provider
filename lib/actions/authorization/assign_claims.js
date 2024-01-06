"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = assignClaims;
var _merge = _interopRequireDefault(require("../../helpers/_/merge.js"));
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/*
 * Merges requested claims with auth_time as requested if max_age is provided or require_auth_time
 * is configured for the client.
 *
 * Merges requested claims with acr as requested if acr_values is provided
 */
function assignClaims(ctx, next) {
  const {
    params
  } = ctx.oidc;
  if (params.claims !== undefined && (0, _weak_cache.default)(ctx.oidc.provider).configuration('features.claimsParameter.enabled')) {
    ctx.oidc.claims = JSON.parse(params.claims);
  }
  if (params.max_age !== undefined || ctx.oidc.client.requireAuthTime || ctx.oidc.prompts.has('login')) {
    (0, _merge.default)(ctx.oidc.claims, {
      id_token: {
        auth_time: {
          essential: true
        }
      }
    });
  }
  const acrValues = params.acr_values;
  if (acrValues) {
    (0, _merge.default)(ctx.oidc.claims, {
      id_token: {
        acr: {
          values: acrValues.split(' ')
        }
      }
    });
  }
  return next();
}