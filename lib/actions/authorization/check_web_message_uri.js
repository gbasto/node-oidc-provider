"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = checkWebMessageUri;
var _errors = require("../../helpers/errors.js");
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/*
 * Checks that provided web_message_uri is allowed in the client configuration
 *
 * @throws: web_message_uri_mismatch
 */
function checkWebMessageUri(ctx, next) {
  const {
    oidc
  } = ctx;
  const {
    client,
    params
  } = oidc;
  if ((0, _weak_cache.default)(ctx.oidc.provider).configuration('features.webMessageResponseMode.enabled')) {
    if (params.web_message_uri && !client.webMessageUriAllowed(params.web_message_uri)) {
      throw new _errors.WebMessageUriMismatch();
    } else {
      oidc.webMessageUriCheckPerformed = true;
    }
  }
  return next();
}