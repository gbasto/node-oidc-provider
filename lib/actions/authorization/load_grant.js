"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = loadGrant;
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/*
 * Load or establish a new Grant object when the user is known.
 */
async function loadGrant(ctx, next) {
  const loadExistingGrant = (0, _weak_cache.default)(ctx.oidc.provider).configuration('loadExistingGrant');
  if (ctx.oidc.account) {
    let grant = await loadExistingGrant(ctx);
    if (grant) {
      if (grant.accountId !== ctx.oidc.account.accountId) {
        throw new Error('accountId mismatch');
      }
      if (grant.clientId !== ctx.oidc.client.clientId) {
        throw new Error('clientId mismatch');
      }
      ctx.oidc.session.ensureClientContainer(ctx.oidc.params.client_id);
      ctx.oidc.session.grantIdFor(ctx.oidc.params.client_id, grant.jti);
    } else {
      grant = new ctx.oidc.provider.Grant({
        accountId: ctx.oidc.account.accountId,
        clientId: ctx.oidc.client.clientId
      });
    }
    ctx.oidc.entity('Grant', grant);
  }
  return next();
}