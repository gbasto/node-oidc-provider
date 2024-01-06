"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = deviceAuthorizationResponse;
function deviceAuthorizationResponse(ctx, next) {
  if (!ctx.oidc.body.client_id) {
    ctx.oidc.body.client_id = ctx.oidc.client.clientId;
  }
  return next();
}