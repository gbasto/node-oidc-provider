"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = deviceVerificationResponse;
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
var _combined_scope = _interopRequireDefault(require("../../helpers/combined_scope.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
async function deviceVerificationResponse(ctx, next) {
  const {
    expiresWithSession,
    features: {
      deviceFlow: {
        successSource
      }
    }
  } = (0, _weak_cache.default)(ctx.oidc.provider).configuration();
  const code = ctx.oidc.deviceCode;
  const scopeSet = (0, _combined_scope.default)(ctx.oidc.grant, ctx.oidc.requestParamScopes, ctx.oidc.resourceServers);
  Object.assign(code, {
    accountId: ctx.oidc.session.accountId,
    acr: ctx.oidc.acr,
    amr: ctx.oidc.amr,
    authTime: ctx.oidc.session.authTime(),
    claims: ctx.oidc.claims,
    grantId: ctx.oidc.session.grantIdFor(ctx.oidc.client.clientId),
    scope: [...scopeSet].join(' '),
    sessionUid: ctx.oidc.session.uid,
    resource: Object.keys(ctx.oidc.resourceServers)
  });
  if (Object.keys(code.claims).length === 0) {
    delete code.claims;
  }

  // eslint-disable-next-line default-case
  switch (code.resource.length) {
    case 0:
      delete code.resource;
      break;
    case 1:
      [code.resource] = code.resource;
      break;
  }
  if (await expiresWithSession(ctx, code)) {
    code.expiresWithSession = true;
  } else {
    ctx.oidc.session.authorizationFor(ctx.oidc.client.clientId).persistsLogout = true;
  }
  if (ctx.oidc.client.includeSid() || ctx.oidc.claims.id_token && 'sid' in ctx.oidc.claims.id_token) {
    code.sid = ctx.oidc.session.sidFor(ctx.oidc.client.clientId);
  }
  await code.save();
  await successSource(ctx);
  ctx.oidc.provider.emit('authorization.success', ctx);
  return next();
}