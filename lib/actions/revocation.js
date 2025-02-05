"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = revocationAction;
var _errors = require("../helpers/errors.js");
var _validate_presence = _interopRequireDefault(require("../helpers/validate_presence.js"));
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
var _token_auth = _interopRequireDefault(require("../shared/token_auth.js"));
var _selective_body = require("../shared/selective_body.js");
var _reject_dupes = _interopRequireDefault(require("../shared/reject_dupes.js"));
var _assemble_params = _interopRequireDefault(require("../shared/assemble_params.js"));
var _revoke = _interopRequireDefault(require("../helpers/revoke.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const revokeable = new Set(['AccessToken', 'ClientCredentials', 'RefreshToken']);
function revocationAction(provider) {
  const {
    params: authParams,
    middleware: tokenAuth
  } = (0, _token_auth.default)(provider);
  const PARAM_LIST = new Set(['token', 'token_type_hint', ...authParams]);
  const {
    grantTypeHandlers
  } = (0, _weak_cache.default)(provider);
  function getAccessToken(token) {
    return provider.AccessToken.find(token);
  }
  function getClientCredentials(token) {
    if (!grantTypeHandlers.has('client_credentials')) {
      return undefined;
    }
    return provider.ClientCredentials.find(token);
  }
  function getRefreshToken(token) {
    if (!grantTypeHandlers.has('refresh_token')) {
      return undefined;
    }
    return provider.RefreshToken.find(token);
  }
  function findResult(results) {
    return results.find(found => !!found);
  }
  return [_selective_body.urlencoded, _assemble_params.default.bind(undefined, PARAM_LIST), ...tokenAuth, _reject_dupes.default.bind(undefined, {}), async function validateTokenPresence(ctx, next) {
    (0, _validate_presence.default)(ctx, 'token');
    await next();
  }, async function renderTokenResponse(ctx, next) {
    ctx.status = 200;
    ctx.body = '';
    await next();
  }, async function revokeToken(ctx, next) {
    let token;
    const {
      params
    } = ctx.oidc;
    switch (params.token_type_hint) {
      case 'access_token':
      case 'urn:ietf:params:oauth:token-type:access_token':
        token = await getAccessToken(params.token).then(result => {
          if (result) return result;
          return Promise.all([getClientCredentials(params.token), getRefreshToken(params.token)]).then(findResult);
        });
        break;
      case 'client_credentials':
        token = await getClientCredentials(params.token).then(result => {
          if (result) return result;
          return Promise.all([getAccessToken(params.token), getRefreshToken(params.token)]).then(findResult);
        });
        break;
      case 'refresh_token':
      case 'urn:ietf:params:oauth:token-type:refresh_token':
        token = await getRefreshToken(params.token).then(result => {
          if (result) return result;
          return Promise.all([getAccessToken(params.token), getClientCredentials(params.token)]).then(findResult);
        });
        break;
      default:
        token = await Promise.all([getAccessToken(params.token), getClientCredentials(params.token), getRefreshToken(params.token)]).then(findResult);
    }
    if (!token) return;
    if (revokeable.has(token.kind)) {
      ctx.oidc.entity(token.kind, token);
    } else {
      return;
    }
    if (token.clientId !== ctx.oidc.client.clientId) {
      throw new _errors.InvalidRequest('this token does not belong to you');
    }
    await token.destroy();
    if (token.kind === 'RefreshToken') {
      await (0, _revoke.default)(ctx, token.grantId);
    }
    await next();
  }];
}