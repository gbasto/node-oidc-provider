"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getContextEnsureOidc;
function getContextEnsureOidc({
  OIDCContext
}) {
  return async function contextEnsureOidc(ctx, next) {
    Object.defineProperty(ctx, 'oidc', {
      value: new OIDCContext(ctx)
    });
    await next();
  };
}