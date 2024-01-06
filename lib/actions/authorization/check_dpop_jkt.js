"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = checkDpopJkt;
var _errors = require("../../helpers/errors.js");
var _validate_dpop = _interopRequireDefault(require("../../helpers/validate_dpop.js"));
var _epoch_time = _interopRequireDefault(require("../../helpers/epoch_time.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/*
 * Validates dpop_jkt equals the used DPoP proof thumbprint
 * when provided, otherwise defaults dpop_jkt to it.
 *
 * @throws: invalid_request
 */
async function checkDpopJkt(ctx, next) {
  const {
    params
  } = ctx.oidc;
  const dPoP = await (0, _validate_dpop.default)(ctx);
  if (dPoP) {
    const {
      ReplayDetection
    } = ctx.oidc.provider;
    const unique = await ReplayDetection.unique(ctx.oidc.client.clientId, dPoP.jti, (0, _epoch_time.default)() + 300);
    ctx.assert(unique, new _errors.InvalidRequest('DPoP proof JWT Replay detected'));
    if (params.dpop_jkt && params.dpop_jkt !== dPoP.thumbprint) {
      throw new _errors.InvalidRequest('DPoP proof key thumbprint does not match dpop_jkt');
    } else if (!params.dpop_jkt) {
      params.dpop_jkt = dPoP.thumbprint;
    }
  }
  return next();
}