"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = checkRedirectUri;
var _errors = require("../../helpers/errors.js");
/*
 * Checks that provided redirect_uri is allowed in the client configuration
 *
 * @throws: invalid_redirect_uri
 */
function checkRedirectUri(ctx, next) {
  if (!ctx.oidc.client.redirectUriAllowed(ctx.oidc.params.redirect_uri)) {
    throw new _errors.InvalidRedirectUri();
  } else {
    ctx.oidc.redirectUriCheckPerformed = true;
  }
  return next();
}