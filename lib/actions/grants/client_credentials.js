"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parameters = exports.handler = void 0;
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
var _errors = require("../../helpers/errors.js");
var _validate_dpop = _interopRequireDefault(require("../../helpers/validate_dpop.js"));
var _check_resource = _interopRequireDefault(require("../../shared/check_resource.js"));
var _epoch_time = _interopRequireDefault(require("../../helpers/epoch_time.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const handler = exports.handler = async function clientCredentialsHandler(ctx, next) {
  const {
    client
  } = ctx.oidc;
  const {
    ClientCredentials,
    ReplayDetection
  } = ctx.oidc.provider;
  const {
    features: {
      mTLS: {
        getCertificate
      }
    },
    scopes: statics
  } = (0, _weak_cache.default)(ctx.oidc.provider).configuration();
  const dPoP = await (0, _validate_dpop.default)(ctx);
  await (0, _check_resource.default)(ctx, () => {});
  const scopes = ctx.oidc.params.scope ? [...new Set(ctx.oidc.params.scope.split(' '))] : [];
  if (client.scope) {
    const allowList = new Set(client.scope.split(' '));
    for (const scope of scopes.filter(Set.prototype.has.bind(statics))) {
      if (!allowList.has(scope)) {
        throw new _errors.InvalidScope('requested scope is not allowed', scope);
      }
    }
  }
  const token = new ClientCredentials({
    client,
    scope: scopes.join(' ') || undefined
  });
  Object.values(ctx.oidc.resourceServers).forEach((resourceServer, i) => {
    if (i !== 0) {
      throw new _errors.InvalidTarget('only a single resource indicator value is supported for this grant type');
    }
    token.resourceServer = resourceServer;
    token.scope = scopes.filter(Set.prototype.has.bind(new Set(resourceServer.scope.split(' ')))).join(' ') || undefined;
  });
  if (client.tlsClientCertificateBoundAccessTokens) {
    const cert = getCertificate(ctx);
    if (!cert) {
      throw new _errors.InvalidGrant('mutual TLS client certificate not provided');
    }
    token.setThumbprint('x5t', cert);
  }
  if (dPoP) {
    const unique = await ReplayDetection.unique(client.clientId, dPoP.jti, (0, _epoch_time.default)() + 300);
    ctx.assert(unique, new _errors.InvalidGrant('DPoP proof JWT Replay detected'));
    token.setThumbprint('jkt', dPoP.thumbprint);
  } else if (ctx.oidc.client.dpopBoundAccessTokens) {
    throw new _errors.InvalidGrant('DPoP proof JWT not provided');
  }
  ctx.oidc.entity('ClientCredentials', token);
  const value = await token.save();
  ctx.body = {
    access_token: value,
    expires_in: token.expiration,
    token_type: token.tokenType,
    scope: token.scope
  };
  await next();
};
const parameters = exports.parameters = new Set(['scope']);