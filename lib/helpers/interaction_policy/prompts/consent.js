"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _prompt = _interopRequireDefault(require("../prompt.js"));
var _check = _interopRequireDefault(require("../check.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable no-unused-expressions */
/* eslint-disable camelcase */

const missingOIDCScope = Symbol();
const missingOIDCClaims = Symbol();
const missingResourceScopes = Symbol();
var _default = () => new _prompt.default({
  name: 'consent',
  requestable: true
}, new _check.default('native_client_prompt', 'native clients require End-User interaction', 'interaction_required', ctx => {
  const {
    oidc
  } = ctx;
  if (oidc.client.applicationType === 'native' && oidc.params.response_type !== 'none' && (!oidc.result || !('consent' in oidc.result))) {
    return _check.default.REQUEST_PROMPT;
  }
  return _check.default.NO_NEED_TO_PROMPT;
}), new _check.default('op_scopes_missing', 'requested scopes not granted', ctx => {
  const {
    oidc
  } = ctx;
  const encounteredScopes = new Set(oidc.grant.getOIDCScopeEncountered().split(' '));
  let missing;
  for (const scope of oidc.requestParamOIDCScopes) {
    if (!encounteredScopes.has(scope)) {
      missing ||= [];
      missing.push(scope);
    }
  }
  if (missing?.length) {
    ctx.oidc[missingOIDCScope] = missing;
    return _check.default.REQUEST_PROMPT;
  }
  return _check.default.NO_NEED_TO_PROMPT;
}, ({
  oidc
}) => ({
  missingOIDCScope: oidc[missingOIDCScope]
})), new _check.default('op_claims_missing', 'requested claims not granted', ctx => {
  const {
    oidc
  } = ctx;
  const encounteredClaims = new Set(oidc.grant.getOIDCClaimsEncountered());
  let missing;
  for (const claim of oidc.requestParamClaims) {
    if (!encounteredClaims.has(claim) && !['sub', 'sid', 'auth_time', 'acr', 'amr', 'iss'].includes(claim)) {
      missing ||= [];
      missing.push(claim);
    }
  }
  if (missing?.length) {
    ctx.oidc[missingOIDCClaims] = missing;
    return _check.default.REQUEST_PROMPT;
  }
  return _check.default.NO_NEED_TO_PROMPT;
}, ({
  oidc
}) => ({
  missingOIDCClaims: oidc[missingOIDCClaims]
})),
// checks resource server scopes
new _check.default('rs_scopes_missing', 'requested scopes not granted', ctx => {
  const {
    oidc
  } = ctx;
  let missing;
  for (const [indicator, resourceServer] of Object.entries(ctx.oidc.resourceServers)) {
    const encounteredScopes = new Set(oidc.grant.getResourceScopeEncountered(indicator).split(' '));
    const requestedScopes = ctx.oidc.requestParamScopes;
    const availableScopes = resourceServer.scopes;
    for (const scope of requestedScopes) {
      if (availableScopes.has(scope) && !encounteredScopes.has(scope)) {
        missing || (missing = {});
        missing[indicator] || (missing[indicator] = []);
        missing[indicator].push(scope);
      }
    }
  }
  if (missing && Object.keys(missing).length) {
    ctx.oidc[missingResourceScopes] = missing;
    return _check.default.REQUEST_PROMPT;
  }
  return _check.default.NO_NEED_TO_PROMPT;
}, ({
  oidc
}) => ({
  missingResourceScopes: oidc[missingResourceScopes]
})));
exports.default = _default;