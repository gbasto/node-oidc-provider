"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = deviceUserFlowErrors;
var _errors = require("../../helpers/errors.js");
var _err_out = _interopRequireDefault(require("../../helpers/err_out.js"));
var _re_render_errors = require("../../helpers/re_render_errors.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
async function deviceUserFlowErrors(ctx, next) {
  try {
    await next();
  } catch (err) {
    if (!(err instanceof _re_render_errors.ReRenderError)) {
      const out = (0, _err_out.default)(err);
      let code = ctx.oidc.deviceCode;
      if (!code && ctx.oidc.entities.Interaction?.deviceCode) {
        code = await ctx.oidc.provider.DeviceCode.find(ctx.oidc.entities.Interaction.deviceCode, {
          ignoreExpiration: true,
          ignoreSessionBinding: true
        });
      }
      if (code) {
        Object.assign(code, {
          error: out.error,
          errorDescription: out.error_description
        });
        await code.save();
        if (err instanceof _errors.AccessDenied) {
          throw new _re_render_errors.AbortedError();
        }
      }
    }
    throw err;
  }
}