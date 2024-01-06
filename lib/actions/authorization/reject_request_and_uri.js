"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = rejectRequestAndUri;
var _errors = require("../../helpers/errors.js");
/*
 * Rejects when request and request_uri are used together.
 *
 * @throws: invalid_request
 */
function rejectRequestAndUri(ctx, next) {
  if (ctx.oidc.params.request !== undefined && ctx.oidc.params.request_uri !== undefined) {
    throw new _errors.InvalidRequest('request and request_uri parameters MUST NOT be used together');
  }
  return next();
}