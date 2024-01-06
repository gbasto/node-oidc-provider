"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = rejectRegistration;
var _errors = require("../../helpers/errors.js");
/*
 * Rejects registration parameter as not supported.
 *
 * @throws: registration_not_supported
 */
function rejectRegistration(ctx, next) {
  if (ctx.oidc.params.registration !== undefined) {
    throw new _errors.RegistrationNotSupported();
  }
  return next();
}