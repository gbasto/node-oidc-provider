"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parameters = exports.handler = void 0;
var _difference = _interopRequireDefault(require("../../helpers/_/difference.js"));
var _errors = require("../../helpers/errors.js");
var _validate_presence = _interopRequireDefault(require("../../helpers/validate_presence.js"));
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
var _revoke = _interopRequireDefault(require("../../helpers/revoke.js"));
var _certificate_thumbprint = _interopRequireDefault(require("../../helpers/certificate_thumbprint.js"));
var formatters = _interopRequireWildcard(require("../../helpers/formatters.js"));
var _filter_claims = _interopRequireDefault(require("../../helpers/filter_claims.js"));
var _validate_dpop = _interopRequireDefault(require("../../helpers/validate_dpop.js"));
var _resolve_resource = _interopRequireDefault(require("../../helpers/resolve_resource.js"));
var _epoch_time = _interopRequireDefault(require("../../helpers/epoch_time.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const gty = 'refresh_token';
const handler = exports.handler = async function refreshTokenHandler(ctx, next) {
  (0, _validate_presence.default)(ctx, 'refresh_token');
  const conf = (0, _weak_cache.default)(ctx.oidc.provider).configuration();
  const {
    conformIdTokenClaims,
    rotateRefreshToken,
    features: {
      userinfo,
      mTLS: {
        getCertificate
      },
      resourceIndicators
    }
  } = conf;
  const {
    RefreshToken,
    Account,
    AccessToken,
    IdToken,
    ReplayDetection
  } = ctx.oidc.provider;
  const {
    client
  } = ctx.oidc;
  const dPoP = await (0, _validate_dpop.default)(ctx);
  let refreshTokenValue = ctx.oidc.params.refresh_token;
  let refreshToken = await RefreshToken.find(refreshTokenValue, {
    ignoreExpiration: true
  });
  if (!refreshToken) {
    throw new _errors.InvalidGrant('refresh token not found');
  }
  if (refreshToken.clientId !== client.clientId) {
    throw new _errors.InvalidGrant('client mismatch');
  }
  if (refreshToken.isExpired) {
    throw new _errors.InvalidGrant('refresh token is expired');
  }
  let cert;
  if (client.tlsClientCertificateBoundAccessTokens || refreshToken['x5t#S256']) {
    cert = getCertificate(ctx);
    if (!cert) {
      throw new _errors.InvalidGrant('mutual TLS client certificate not provided');
    }
  }
  if (!dPoP && ctx.oidc.client.dpopBoundAccessTokens) {
    throw new _errors.InvalidGrant('DPoP proof JWT not provided');
  }
  if (refreshToken['x5t#S256'] && refreshToken['x5t#S256'] !== (0, _certificate_thumbprint.default)(cert)) {
    throw new _errors.InvalidGrant('failed x5t#S256 verification');
  }
  const grant = await ctx.oidc.provider.Grant.find(refreshToken.grantId, {
    ignoreExpiration: true
  });
  if (!grant) {
    throw new _errors.InvalidGrant('grant not found');
  }
  if (grant.isExpired) {
    throw new _errors.InvalidGrant('grant is expired');
  }
  if (grant.clientId !== client.clientId) {
    throw new _errors.InvalidGrant('client mismatch');
  }
  if (ctx.oidc.params.scope) {
    const missing = (0, _difference.default)([...ctx.oidc.requestParamScopes], [...refreshToken.scopes]);
    if (missing.length !== 0) {
      throw new _errors.InvalidScope(`refresh token missing requested ${formatters.pluralize('scope', missing.length)}`, missing.join(' '));
    }
  }
  if (dPoP) {
    const unique = await ReplayDetection.unique(client.clientId, dPoP.jti, (0, _epoch_time.default)() + 300);
    ctx.assert(unique, new _errors.InvalidGrant('DPoP proof JWT Replay detected'));
  }
  if (refreshToken.jkt && (!dPoP || refreshToken.jkt !== dPoP.thumbprint)) {
    throw new _errors.InvalidGrant('failed jkt verification');
  }
  ctx.oidc.entity('RefreshToken', refreshToken);
  ctx.oidc.entity('Grant', grant);
  const account = await Account.findAccount(ctx, refreshToken.accountId, refreshToken);
  if (!account) {
    throw new _errors.InvalidGrant('refresh token invalid (referenced account not found)');
  }
  if (refreshToken.accountId !== grant.accountId) {
    throw new _errors.InvalidGrant('accountId mismatch');
  }
  ctx.oidc.entity('Account', account);
  if (refreshToken.consumed) {
    await Promise.all([refreshToken.destroy(), (0, _revoke.default)(ctx, refreshToken.grantId)]);
    throw new _errors.InvalidGrant('refresh token already used');
  }
  if (rotateRefreshToken === true || typeof rotateRefreshToken === 'function' && (await rotateRefreshToken(ctx))) {
    await refreshToken.consume();
    ctx.oidc.entity('RotatedRefreshToken', refreshToken);
    refreshToken = new RefreshToken({
      accountId: refreshToken.accountId,
      acr: refreshToken.acr,
      amr: refreshToken.amr,
      authTime: refreshToken.authTime,
      claims: refreshToken.claims,
      client,
      expiresWithSession: refreshToken.expiresWithSession,
      iiat: refreshToken.iiat,
      grantId: refreshToken.grantId,
      gty: refreshToken.gty,
      nonce: refreshToken.nonce,
      resource: refreshToken.resource,
      rotations: typeof refreshToken.rotations === 'number' ? refreshToken.rotations + 1 : 1,
      scope: refreshToken.scope,
      sessionUid: refreshToken.sessionUid,
      sid: refreshToken.sid,
      'x5t#S256': refreshToken['x5t#S256'],
      jkt: refreshToken.jkt
    });
    if (refreshToken.gty && !refreshToken.gty.endsWith(gty)) {
      refreshToken.gty = `${refreshToken.gty} ${gty}`;
    }
    ctx.oidc.entity('RefreshToken', refreshToken);
    refreshTokenValue = await refreshToken.save();
  }
  const at = new AccessToken({
    accountId: account.accountId,
    client,
    expiresWithSession: refreshToken.expiresWithSession,
    grantId: refreshToken.grantId,
    gty: refreshToken.gty,
    sessionUid: refreshToken.sessionUid,
    sid: refreshToken.sid
  });
  if (client.tlsClientCertificateBoundAccessTokens) {
    at.setThumbprint('x5t', cert);
  }
  if (dPoP) {
    at.setThumbprint('jkt', dPoP.thumbprint);
  }
  if (at.gty && !at.gty.endsWith(gty)) {
    at.gty = `${at.gty} ${gty}`;
  }
  const scope = ctx.oidc.params.scope ? ctx.oidc.requestParamScopes : refreshToken.scopes;
  const resource = await (0, _resolve_resource.default)(ctx, refreshToken, {
    userinfo,
    resourceIndicators
  }, scope);
  if (resource) {
    const resourceServerInfo = await resourceIndicators.getResourceServerInfo(ctx, resource, ctx.oidc.client);
    at.resourceServer = new ctx.oidc.provider.ResourceServer(resource, resourceServerInfo);
    at.scope = grant.getResourceScopeFiltered(resource, [...scope].filter(Set.prototype.has.bind(at.resourceServer.scopes)));
  } else {
    at.claims = refreshToken.claims;
    at.scope = grant.getOIDCScopeFiltered(scope);
  }
  ctx.oidc.entity('AccessToken', at);
  const accessToken = await at.save();
  let idToken;
  if (scope.has('openid')) {
    const claims = (0, _filter_claims.default)(refreshToken.claims, 'id_token', grant);
    const rejected = grant.getRejectedOIDCClaims();
    const token = new IdToken({
      ...(await account.claims('id_token', [...scope].join(' '), claims, rejected)),
      acr: refreshToken.acr,
      amr: refreshToken.amr,
      auth_time: refreshToken.authTime
    }, {
      ctx
    });
    if (conformIdTokenClaims && userinfo.enabled && !at.aud) {
      token.scope = 'openid';
    } else {
      token.scope = grant.getOIDCScopeFiltered(scope);
    }
    token.mask = claims;
    token.rejected = rejected;
    token.set('nonce', refreshToken.nonce);
    token.set('at_hash', accessToken);
    token.set('sid', refreshToken.sid);
    idToken = await token.issue({
      use: 'idtoken'
    });
  }
  ctx.body = {
    access_token: accessToken,
    expires_in: at.expiration,
    id_token: idToken,
    refresh_token: refreshTokenValue,
    scope: at.scope,
    token_type: at.tokenType
  };
  await next();
};
const parameters = exports.parameters = new Set(['refresh_token', 'scope']);