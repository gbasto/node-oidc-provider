"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = oidcRequired;
var _validate_presence = _interopRequireDefault(require("../../helpers/validate_presence.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function oidcRequired(ctx, next) {
  const required = new Set(['scope']);
  if (ctx.oidc.client.backchannelTokenDeliveryMode !== 'poll') {
    required.add('client_notification_token');
  }
  (0, _validate_presence.default)(ctx, ...required);
  return next();
}