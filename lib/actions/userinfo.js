"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _difference = _interopRequireDefault(require("../helpers/_/difference.js"));
var _set_www_authenticate = _interopRequireDefault(require("../helpers/set_www_authenticate.js"));
var _conditional_body = _interopRequireDefault(require("../shared/conditional_body.js"));
var _reject_dupes = _interopRequireDefault(require("../shared/reject_dupes.js"));
var _assemble_params = _interopRequireDefault(require("../shared/assemble_params.js"));
var _no_cache = _interopRequireDefault(require("../shared/no_cache.js"));
var _certificate_thumbprint = _interopRequireDefault(require("../helpers/certificate_thumbprint.js"));
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
var _filter_claims = _interopRequireDefault(require("../helpers/filter_claims.js"));
var _validate_dpop = _interopRequireDefault(require("../helpers/validate_dpop.js"));
var _epoch_time = _interopRequireDefault(require("../helpers/epoch_time.js"));
var _errors = require("../helpers/errors.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const PARAM_LIST = new Set(['scope', 'access_token']);
const parseBody = _conditional_body.default.bind(undefined, 'application/x-www-form-urlencoded');
var _default = exports.default = [_no_cache.default, async function setWWWAuthenticateHeader(ctx, next) {
  try {
    await next();
  } catch (err) {
    if (err.expose) {
      let scheme;
      if (/dpop/i.test(err.error_description) || ctx.oidc.accessToken?.jkt) {
        scheme = 'DPoP';
      } else {
        scheme = 'Bearer';
      }
      if (err instanceof _errors.InvalidDpopProof || err instanceof _errors.UseDpopNonce) {
        // eslint-disable-next-line no-multi-assign
        err.status = err.statusCode = 401;
      }
      (0, _set_www_authenticate.default)(ctx, scheme, {
        realm: ctx.oidc.issuer,
        ...(err.error_description !== 'no access token provided' ? {
          error: err.message,
          error_description: err.error_description,
          scope: err.scope
        } : undefined),
        ...(scheme === 'DPoP' ? {
          algs: (0, _weak_cache.default)(ctx.oidc.provider).configuration('dPoPSigningAlgValues').join(' ')
        } : undefined)
      });
    }
    throw err;
  }
}, parseBody, _assemble_params.default.bind(undefined, PARAM_LIST), _reject_dupes.default.bind(undefined, {}), async function validateAccessToken(ctx, next) {
  const accessTokenValue = ctx.oidc.getAccessToken({
    acceptDPoP: true
  });
  const dPoP = await (0, _validate_dpop.default)(ctx, accessTokenValue);
  const accessToken = await ctx.oidc.provider.AccessToken.find(accessTokenValue);
  ctx.assert(accessToken, new _errors.InvalidToken('access token not found'));
  ctx.oidc.entity('AccessToken', accessToken);
  const {
    scopes
  } = accessToken;
  if (!scopes.size || !scopes.has('openid')) {
    throw new _errors.InsufficientScope('access token missing openid scope', 'openid');
  }
  if (accessToken['x5t#S256']) {
    const getCertificate = (0, _weak_cache.default)(ctx.oidc.provider).configuration('features.mTLS.getCertificate');
    const cert = getCertificate(ctx);
    if (!cert || accessToken['x5t#S256'] !== (0, _certificate_thumbprint.default)(cert)) {
      throw new _errors.InvalidToken('failed x5t#S256 verification');
    }
  }
  if (dPoP) {
    const unique = await ctx.oidc.provider.ReplayDetection.unique(accessToken.clientId, dPoP.jti, (0, _epoch_time.default)() + 300);
    ctx.assert(unique, new _errors.InvalidToken('DPoP proof JWT Replay detected'));
  }
  if (accessToken.jkt && (!dPoP || accessToken.jkt !== dPoP.thumbprint)) {
    throw new _errors.InvalidToken('failed jkt verification');
  }
  await next();
}, function validateAudience(ctx, next) {
  const {
    oidc: {
      entities: {
        AccessToken: accessToken
      }
    }
  } = ctx;
  if (accessToken.aud !== undefined) {
    throw new _errors.InvalidToken('token audience prevents accessing the userinfo endpoint');
  }
  return next();
}, async function validateScope(ctx, next) {
  if (ctx.oidc.params.scope) {
    const missing = (0, _difference.default)(ctx.oidc.params.scope.split(' '), [...ctx.oidc.accessToken.scopes]);
    if (missing.length !== 0) {
      throw new _errors.InsufficientScope('access token missing requested scope', missing.join(' '));
    }
  }
  await next();
}, async function loadClient(ctx, next) {
  const client = await ctx.oidc.provider.Client.find(ctx.oidc.accessToken.clientId);
  ctx.assert(client, new _errors.InvalidToken('associated client not found'));
  ctx.oidc.entity('Client', client);
  await next();
}, async function loadAccount(ctx, next) {
  const account = await ctx.oidc.provider.Account.findAccount(ctx, ctx.oidc.accessToken.accountId, ctx.oidc.accessToken);
  ctx.assert(account, new _errors.InvalidToken('associated account not found'));
  ctx.oidc.entity('Account', account);
  await next();
}, async function loadGrant(ctx, next) {
  const grant = await ctx.oidc.provider.Grant.find(ctx.oidc.accessToken.grantId, {
    ignoreExpiration: true
  });
  if (!grant) {
    throw new _errors.InvalidToken('grant not found');
  }
  if (grant.isExpired) {
    throw new _errors.InvalidToken('grant is expired');
  }
  if (grant.clientId !== ctx.oidc.accessToken.clientId) {
    throw new _errors.InvalidToken('clientId mismatch');
  }
  if (grant.accountId !== ctx.oidc.accessToken.accountId) {
    throw new _errors.InvalidToken('accountId mismatch');
  }
  ctx.oidc.entity('Grant', grant);
  await next();
}, async function respond(ctx, next) {
  const claims = (0, _filter_claims.default)(ctx.oidc.accessToken.claims, 'userinfo', ctx.oidc.grant);
  const rejected = ctx.oidc.grant.getRejectedOIDCClaims();
  const scope = ctx.oidc.grant.getOIDCScopeFiltered(new Set((ctx.oidc.params.scope || ctx.oidc.accessToken.scope).split(' ')));
  const {
    client
  } = ctx.oidc;
  if (client.userinfoSignedResponseAlg || client.userinfoEncryptedResponseAlg) {
    const token = new ctx.oidc.provider.IdToken(await ctx.oidc.account.claims('userinfo', scope, claims, rejected), {
      ctx
    });
    token.scope = scope;
    token.mask = claims;
    token.rejected = rejected;
    ctx.body = await token.issue({
      expiresAt: ctx.oidc.accessToken.exp,
      use: 'userinfo'
    });
    ctx.type = 'application/jwt; charset=utf-8';
  } else {
    const mask = new ctx.oidc.provider.Claims(await ctx.oidc.account.claims('userinfo', scope, claims, rejected), {
      ctx
    });
    mask.scope(scope);
    mask.mask(claims);
    mask.rejected(rejected);
    ctx.body = await mask.result();
  }
  await next();
}];