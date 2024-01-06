"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = requestObjectRemapErrors;
var _errors = require("../../helpers/errors.js");
/*
 * Remaps the Backchannel Authentication Endpoint errors thrown in downstream middlewares.
 *
 * @throws: invalid_request
 */
async function requestObjectRemapErrors(ctx, next) {
  return next().catch(err => {
    if (err instanceof _errors.InvalidRequestObject) {
      Object.assign(err, {
        message: 'invalid_request',
        error: 'invalid_request'
      });
    }
    throw err;
  });
}