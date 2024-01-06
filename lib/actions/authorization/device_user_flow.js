"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = deviceUserFlow;
var _params = _interopRequireDefault(require("../../helpers/params.js"));
var _re_render_errors = require("../../helpers/re_render_errors.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
async function deviceUserFlow(allowList, ctx, next) {
  if (ctx.oidc.route === 'device_resume') {
    const code = await ctx.oidc.provider.DeviceCode.find(ctx.oidc.entities.Interaction.deviceCode, {
      ignoreExpiration: true,
      ignoreSessionBinding: true
    });
    if (!code) {
      throw new _re_render_errors.NotFoundError();
    }
    if (code.isExpired) {
      throw new _re_render_errors.ExpiredError();
    }
    if (code.error || code.accountId) {
      throw new _re_render_errors.AlreadyUsedError();
    }
    ctx.oidc.entity('DeviceCode', code);
  } else {
    ctx.oidc.params = new ((0, _params.default)(allowList))(ctx.oidc.deviceCode.params);
  }
  await next();
}