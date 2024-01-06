"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parameters = exports.handler = void 0;
var _upper_first = _interopRequireDefault(require("../../helpers/_/upper_first.js"));
var _camel_case = _interopRequireDefault(require("../../helpers/_/camel_case.js"));
var errors = _interopRequireWildcard(require("../../helpers/errors.js"));
var _validate_presence = _interopRequireDefault(require("../../helpers/validate_presence.js"));
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
var _filter_claims = _interopRequireDefault(require("../../helpers/filter_claims.js"));
var _revoke = _interopRequireDefault(require("../../helpers/revoke.js"));
var _validate_dpop = _interopRequireDefault(require("../../helpers/validate_dpop.js"));
var _resolve_resource = _interopRequireDefault(require("../../helpers/resolve_resource.js"));
var _epoch_time = _interopRequireDefault(require("../../helpers/epoch_time.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const {
  AuthorizationPending,
  ExpiredToken,
  InvalidGrant
} = errors;
const gty = 'device_code';
const handler = exports.handler = async function deviceCodeHandler(ctx, next) {
  (0, _validate_presence.default)(ctx, 'device_code');
  const {
    issueRefreshToken,
    conformIdTokenClaims,
    features: {
      userinfo,
      mTLS: {
        getCertificate
      },
      resourceIndicators
    }
  } = (0, _weak_cache.default)(ctx.oidc.provider).configuration();
  const dPoP = await (0, _validate_dpop.default)(ctx);
  const code = await ctx.oidc.provider.DeviceCode.find(ctx.oidc.params.device_code, {
    ignoreExpiration: true
  });
  if (!code) {
    throw new InvalidGrant('device code not found');
  }
  if (code.clientId !== ctx.oidc.client.clientId) {
    throw new InvalidGrant('client mismatch');
  }
  let cert;
  if (ctx.oidc.client.tlsClientCertificateBoundAccessTokens) {
    cert = getCertificate(ctx);
    if (!cert) {
      throw new InvalidGrant('mutual TLS client certificate not provided');
    }
  }
  if (!dPoP && ctx.oidc.client.dpopBoundAccessTokens) {
    throw new InvalidGrant('DPoP proof JWT not provided');
  }
  if (code.isExpired) {
    throw new ExpiredToken('device code is expired');
  }
  if (!code.accountId && !code.error) {
    throw new AuthorizationPending();
  }
  if (code.consumed) {
    await (0, _revoke.default)(ctx, code.grantId);
    throw new InvalidGrant('device code already consumed');
  }
  await code.consume();
  if (code.error) {
    const className = (0, _upper_first.default)((0, _camel_case.default)(code.error));
    if (errors[className]) {
      throw new errors[className](code.errorDescription);
    }
    throw new errors.CustomOIDCProviderError(code.error, code.errorDescription);
  }
  const grant = await ctx.oidc.provider.Grant.find(code.grantId, {
    ignoreExpiration: true
  });
  if (!grant) {
    throw new InvalidGrant('grant not found');
  }
  if (grant.isExpired) {
    throw new InvalidGrant('grant is expired');
  }
  if (grant.clientId !== ctx.oidc.client.clientId) {
    throw new InvalidGrant('client mismatch');
  }
  ctx.oidc.entity('DeviceCode', code);
  ctx.oidc.entity('Grant', grant);
  const account = await ctx.oidc.provider.Account.findAccount(ctx, code.accountId, code);
  if (!account) {
    throw new InvalidGrant('device code invalid (referenced account not found)');
  }
  if (code.accountId !== grant.accountId) {
    throw new InvalidGrant('accountId mismatch');
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
  if (dPoP) {
    const unique = await ReplayDetection.unique(ctx.oidc.client.clientId, dPoP.jti, (0, _epoch_time.default)() + 300);
    ctx.assert(unique, new InvalidGrant('DPoP proof JWT Replay detected'));
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
      ...{
        acr: code.acr,
        amr: code.amr,
        auth_time: code.authTime
      }
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
  return next();
};
const parameters = exports.parameters = new Set(['device_code']);