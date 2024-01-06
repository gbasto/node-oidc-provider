"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = stripOutsideJarParams;
/*
 * Makes sure that
 * - unauthenticated clients send the JAR Request Object
 * - either JAR or plain request is provided
 * - request_uri is not used
 *
 * @throws: invalid_request
 */
function stripOutsideJarParams(ctx, next) {
  const JAR = !!ctx.oidc.params.request;
  for (const [param, value] of Object.entries(ctx.oidc.params)) {
    if (value !== undefined) {
      if (JAR && param !== 'client_id' && param !== 'request') {
        ctx.oidc.params[param] = undefined;
      }
    }
  }
  return next();
}