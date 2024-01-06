"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = backchannelRequestResponse;
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
async function backchannelRequestResponse(ctx, next) {
  const {
    BackchannelAuthenticationRequest
  } = ctx.oidc.provider;
  const {
    features: {
      ciba
    }
  } = (0, _weak_cache.default)(ctx.oidc.provider).configuration();
  const request = new BackchannelAuthenticationRequest({
    accountId: ctx.oidc.account.accountId,
    claims: ctx.oidc.claims,
    client: ctx.oidc.client,
    nonce: ctx.oidc.params.nonce,
    params: ctx.oidc.params.toPlainObject(),
    resource: Object.keys(ctx.oidc.resourceServers),
    scope: [...ctx.oidc.requestParamScopes].join(' ')
  });

  // eslint-disable-next-line default-case
  switch (request.resource.length) {
    case 0:
      delete request.resource;
      break;
    case 1:
      [request.resource] = request.resource;
      break;
  }
  ctx.oidc.entity('BackchannelAuthenticationRequest', request);
  const id = await request.save();
  ctx.body = {
    expires_in: request.expiration,
    auth_req_id: id
  };
  await ciba.triggerAuthenticationDevice(ctx, request, ctx.oidc.account, ctx.oidc.client);
  return next();
}