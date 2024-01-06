"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = checkCibaContext;
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
async function checkCibaContext(ctx, next) {
  const {
    features: {
      ciba
    }
  } = (0, _weak_cache.default)(ctx.oidc.provider).configuration();
  await Promise.all([ciba.validateRequestContext(ctx, ctx.oidc.params.request_context), ciba.validateBindingMessage(ctx, ctx.oidc.params.binding_message)]);
  return next();
}