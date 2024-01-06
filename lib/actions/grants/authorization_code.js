"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parameters = exports.handler = void 0;
var _errors = require("../../helpers/errors.js");
var _validate_presence = _interopRequireDefault(require("../../helpers/validate_presence.js"));
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
var _pkce = _interopRequireDefault(require("../../helpers/pkce.js"));
var _revoke = _interopRequireDefault(require("../../helpers/revoke.js"));
var _filter_claims = _interopRequireDefault(require("../../helpers/filter_claims.js"));
var _validate_dpop = _interopRequireDefault(require("../../helpers/validate_dpop.js"));
var _resolve_resource = _interopRequireDefault(require("../../helpers/resolve_resource.js"));
var _epoch_time = _interopRequireDefault(require("../../helpers/epoch_time.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const gty = 'authorization_code';
const handler = exports.handler = async function authorizationCodeHandler(ctx, next) {
  const {
    issueRefreshToken,
    allowOmittingSingleRegisteredRedirectUri,
    conformIdTokenClaims,
    features: {
      userinfo,
      mTLS: {
        getCertificate
      },
      resourceIndicators
    }
  } = (0, _weak_cache.default)(ctx.oidc.provider).configuration();
  if (allowOmittingSingleRegisteredRedirectUri && ctx.oidc.params.redirect_uri === undefined) {
    // It is permitted to omit the redirect_uri if only ONE is registered on the client
    const {
      0: uri,
      length
    } = ctx.oidc.client.redirectUris;
    if (uri && length === 1) {
      ctx.oidc.params.redirect_uri = uri;
    }
  }
  (0, _validate_presence.default)(ctx, 'code', 'redirect_uri');
  const dPoP = await (0, _validate_dpop.default)(ctx);
  const code = await ctx.oidc.provider.AuthorizationCode.find(ctx.oidc.params.code, {
    ignoreExpiration: true
  });
  if (!code) {
    throw new _errors.InvalidGrant('authorization code not found');
  }
  if (code.clientId !== ctx.oidc.client.clientId) {
    throw new _errors.InvalidGrant('client mismatch');
  }
  if (code.isExpired) {
    throw new _errors.InvalidGrant('authorization code is expired');
  }
  const grant = await ctx.oidc.provider.Grant.find(code.grantId, {
    ignoreExpiration: true
  });
  if (!grant) {
    throw new _errors.InvalidGrant('grant not found');
  }
  if (grant.isExpired) {
    throw new _errors.InvalidGrant('grant is expired');
  }
  (0, _pkce.default)(ctx.oidc.params.code_verifier, code.codeChallenge, code.codeChallengeMethod);
  let cert;
  if (ctx.oidc.client.tlsClientCertificateBoundAccessTokens) {
    cert = getCertificate(ctx);
    if (!cert) {
      throw new _errors.InvalidGrant('mutual TLS client certificate not provided');
    }
  }
  if (!dPoP && ctx.oidc.client.dpopBoundAccessTokens) {
    throw new _errors.InvalidGrant('DPoP proof JWT not provided');
  }
  if (grant.clientId !== ctx.oidc.client.clientId) {
    throw new _errors.InvalidGrant('client mismatch');
  }
  if (code.redirectUri !== ctx.oidc.params.redirect_uri) {
    throw new _errors.InvalidGrant('authorization code redirect_uri mismatch');
  }
  if (code.consumed) {
    await (0, _revoke.default)(ctx, code.grantId);
    throw new _errors.InvalidGrant('authorization code already consumed');
  }
  await code.consume();
  ctx.oidc.entity('AuthorizationCode', code);
  ctx.oidc.entity('Grant', grant);
  const account = await ctx.oidc.provider.Account.findAccount(ctx, code.accountId, code);
  if (!account) {
    throw new _errors.InvalidGrant('authorization code invalid (referenced account not found)');
  }
  if (code.accountId !== grant.accountId) {
    throw new _errors.InvalidGrant('accountId mismatch');
  }
  ctx.oidc.entity('Account', account);
  const {
    AccessToken,
    IdToken,
    RefreshToken,
    ReplayDetection
  } = ctx.oidc.provider;
  const at = new AccessToken({
    accountId: account.accountId,
    client: ctx.oidc.client,
    expiresWithSession: code.expiresWithSession,
    grantId: code.grantId,
    gty,
    sessionUid: code.sessionUid,
    sid: code.sid
  });
  if (ctx.oidc.client.tlsClientCertificateBoundAccessTokens) {
    at.setThumbprint('x5t', cert);
  }
  if (code.dpopJkt && !dPoP) {
    throw new _errors.InvalidGrant('missing DPoP proof JWT');
  }
  if (dPoP) {
    const unique = await ReplayDetection.unique(ctx.oidc.client.clientId, dPoP.jti, (0, _epoch_time.default)() + 300);
    ctx.assert(unique, new _errors.InvalidGrant('DPoP proof JWT Replay detected'));
    if (code.dpopJkt && code.dpopJkt !== dPoP.thumbprint) {
      throw new _errors.InvalidGrant('DPoP proof key thumbprint does not match dpop_jkt');
    }
    at.setThumbprint('jkt', dPoP.thumbprint);
  }
  const resource = await (0, _resolve_resource.default)(ctx, code, {
    userinfo,
    resourceIndicators
  });
  if (resource) {
    const resourceServerInfo = await resourceIndicators.getResourceServerInfo(ctx, resource, ctx.oidc.client);
    at.resourceServer = new ctx.oidc.provider.ResourceServer(resource, resourceServerInfo);
    at.scope = grant.getResourceScopeFiltered(resource, code.scopes);
  } else {
    at.claims = code.claims;
    at.scope = grant.getOIDCScopeFiltered(code.scopes);
  }
  ctx.oidc.entity('AccessToken', at);
  const accessToken = await at.save();
  let refreshToken;
  if (await issueRefreshToken(ctx, ctx.oidc.client, code)) {
    const rt = new RefreshToken({
      accountId: account.accountId,
      acr: code.acr,
      amr: code.amr,
      authTime: code.authTime,
      claims: code.claims,
      client: ctx.oidc.client,
      expiresWithSession: code.expiresWithSession,
      grantId: code.grantId,
      gty,
      nonce: code.nonce,
      resource: code.resource,
      rotations: 0,
      scope: code.scope,
      sessionUid: code.sessionUid,
      sid: code.sid
    });
    if (ctx.oidc.client.clientAuthMethod === 'none') {
      if (at.jkt) {
        rt.jkt = at.jkt;
      }
      if (at['x5t#S256']) {
        rt['x5t#S256'] = at['x5t#S256'];
      }
    }
    ctx.oidc.entity('RefreshToken', rt);
    refreshToken = await rt.save();
  }
  let idToken;
  if (code.scopes.has('openid')) {
    const claims = (0, _filter_claims.default)(code.claims, 'id_token', grant);
    const rejected = grant.getRejectedOIDCClaims();
    const token = new IdToken({
      ...(await account.claims('id_token', code.scope, claims, rejected)),
      acr: code.acr,
      amr: code.amr,
      auth_time: code.authTime
    }, {
      ctx
    });
    if (conformIdTokenClaims && userinfo.enabled && !at.aud) {
      token.scope = 'openid';
    } else {
      token.scope = grant.getOIDCScopeFiltered(code.scopes);
    }
    token.mask = claims;
    token.rejected = rejected;
    token.set('nonce', code.nonce);
    token.set('at_hash', accessToken);
    token.set('sid', code.sid);
    idToken = await token.issue({
      use: 'idtoken'
    });
  }
  ctx.body = {
    access_token: accessToken,
    expires_in: at.expiration,
    id_token: idToken,
    refresh_token: refreshToken,
    scope: at.scope,
    token_type: at.tokenType
  };
  await next();
};
const parameters = exports.parameters = new Set(['code', 'code_verifier', 'redirect_uri']);