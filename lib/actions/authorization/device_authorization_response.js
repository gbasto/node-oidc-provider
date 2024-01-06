"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = deviceAuthorizationResponse;
var _user_codes = require("../../helpers/user_codes.js");
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
async function deviceAuthorizationResponse(ctx, next) {
  const {
    charset,
    mask,
    deviceInfo
  } = (0, _weak_cache.default)(ctx.oidc.provider).configuration('features.deviceFlow');
  const userCode = (0, _user_codes.generate)(charset, mask);
  const dc = new ctx.oidc.provider.DeviceCode({
    client: ctx.oidc.client,
    deviceInfo: deviceInfo(ctx),
    params: ctx.oidc.params.toPlainObject(),
    userCode: (0, _user_codes.normalize)(userCode)
  });
  ctx.oidc.entity('DeviceCode', dc);
  ctx.body = {
    device_code: await dc.save(),
    user_code: userCode,
    verification_uri: ctx.oidc.urlFor('code_verification'),
    verification_uri_complete: ctx.oidc.urlFor('code_verification', {
      query: {
        user_code: userCode
      }
    }),
    expires_in: dc.expiration
  };
  await next();
  ctx.oidc.provider.emit('device_authorization.success', ctx, ctx.body);
}