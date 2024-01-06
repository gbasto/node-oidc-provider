"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = introspectionAction;
var _validate_presence = _interopRequireDefault(require("../helpers/validate_presence.js"));
var _token_auth = _interopRequireDefault(require("../shared/token_auth.js"));
var _no_cache = _interopRequireDefault(require("../shared/no_cache.js"));
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
var _selective_body = require("../shared/selective_body.js");
var _reject_dupes = _interopRequireDefault(require("../shared/reject_dupes.js"));
var _assemble_params = _interopRequireDefault(require("../shared/assemble_params.js"));
var _errors = require("../helpers/errors.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const introspectable = new Set(['AccessToken', 'ClientCredentials', 'RefreshToken']);
const JWT = 'application/token-introspection+jwt';
function introspectionAction(provider) {
  const {
    params: authParams,
    middleware: tokenAuth
  } = (0, _token_auth.default)(provider);
  const PARAM_LIST = new Set(['token', 'token_type_hint', ...authParams]);
  const configuration = (0, _weak_cache.default)(provider).configuration();
  const {
    pairwiseIdentifier,
    features: {
      introspection: {
        allowedPolicy
      },
      jwtIntrospection
    }
  } = configuration;
  const {
    grantTypeHandlers
  } = (0, _weak_cache.default)(provider);
  const {
    IdToken,
    AccessToken,
    ClientCredentials,
    RefreshToken,
    Client
  } = provider;
  function getAccessToken(token) {
    return AccessToken.find(token);
  }
  function getClientCredentials(token) {
    if (!grantTypeHandlers.has('client_credentials')) {
      return undefined;
    }
    return ClientCredentials.find(token);
  }
  function getRefreshToken(token) {
    if (!grantTypeHandlers.has('refresh_token')) {
      return undefined;
    }
    return RefreshToken.find(token);
  }
  function findResult(results) {
    return results.find(found => !!found);
  }
  return [_no_cache.default, _selective_body.urlencoded, _assemble_params.default.bind(undefined, PARAM_LIST), ...tokenAuth, _reject_dupes.default.bind(undefined, {}), async function validateTokenPresence(ctx, next) {
    (0, _validate_presence.default)(ctx, 'token');
    await next();
  }, async function jwtIntrospectionResponse(ctx, next) {
    if (jwtIntrospection.enabled) {
      const {
        client
      } = ctx.oidc;
      const {
        introspectionEncryptedResponseAlg: encrypt,
        introspectionSignedResponseAlg: sign
      } = client;
      const accepts = ctx.accepts('json', JWT);
      if (encrypt && accepts !== JWT) {
        throw new _errors.InvalidRequest(`introspection must be requested with Accept: ${JWT} for this client`);
      }
      await next();
      if ((encrypt || sign) && accepts === JWT) {
        const token = new IdToken({}, {
          ctx
        });
        token.extra = {
          token_introspection: ctx.body,
          aud: ctx.body.aud
        };
        ctx.body = await token.issue({
          use: 'introspection'
        });
        ctx.type = 'application/token-introspection+jwt; charset=utf-8';
      }
    } else {
      await next();
    }
  }, async function renderTokenResponse(ctx, next) {
    const {
      params
    } = ctx.oidc;
    ctx.body = {
      active: false
    };
    let token;
    switch (params.token_type_hint) {
      case 'access_token':
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
        token = await getRefreshToken(params.token).then(result => {
          if (result) return result;
          return Promise.all([getAccessToken(params.token), getClientCredentials(params.token)]).then(findResult);
        });
        break;
      default:
        token = await Promise.all([getAccessToken(params.token), getClientCredentials(params.token), getRefreshToken(params.token)]).then(findResult);
    }
    if (!token || !token.isValid) {
      return;
    }
    if (token.grantId) {
      const grant = await ctx.oidc.provider.Grant.find(token.grantId, {
        ignoreExpiration: true
      });
      if (!grant) return;
      if (grant.isExpired) return;
      if (grant.clientId !== token.clientId) return;
      if (grant.accountId !== token.accountId) return;
      ctx.oidc.entity('Grant', grant);
    }
    if (introspectable.has(token.kind)) {
      ctx.oidc.entity(token.kind, token);
    } else {
      return;
    }
    if (!(await allowedPolicy(ctx, ctx.oidc.client, token))) {
      return;
    }
    if (token.accountId) {
      ctx.body.sub = token.accountId;
      if (token.clientId !== ctx.oidc.client.clientId) {
        const client = await Client.find(token.clientId);
        if (client.subjectType === 'pairwise') {
          ctx.body.sub = await pairwiseIdentifier(ctx, ctx.body.sub, client);
        }
      } else if (ctx.oidc.client.subjectType === 'pairwise') {
        ctx.body.sub = await pairwiseIdentifier(ctx, ctx.body.sub, ctx.oidc.client);
      }
    }
    Object.assign(ctx.body, {
      ...token.extra,
      active: true,
      client_id: token.clientId,
      exp: token.exp,
      iat: token.iat,
      sid: token.sid,
      iss: provider.issuer,
      jti: token.jti !== params.token ? token.jti : undefined,
      aud: token.aud,
      scope: token.scope,
      cnf: token.isSenderConstrained() ? {} : undefined,
      token_type: token.kind !== 'RefreshToken' ? token.tokenType : undefined
    });
    if (token['x5t#S256']) {
      ctx.body.cnf['x5t#S256'] = token['x5t#S256'];
    }
    if (token.jkt) {
      ctx.body.cnf.jkt = token.jkt;
    }
    await next();
  }];
}