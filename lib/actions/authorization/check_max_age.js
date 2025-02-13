"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = checkMaxAge;
var _errors = require("../../helpers/errors.js");
/*
 * Validates the max_age parameter and handles max_age=0 to prompt=login translation
 *
 * @throws: invalid_request
 */
function checkMaxAge(ctx, next) {
  if (ctx.oidc.params.max_age !== undefined) {
    const maxAge = +ctx.oidc.params.max_age;
    if (!Number.isSafeInteger(maxAge) || Math.sign(maxAge) === -1) {
      throw new _errors.InvalidRequest('invalid max_age parameter value');
    }
    if (maxAge === 0) {
      const {
        prompts
      } = ctx.oidc;
      ctx.oidc.params.max_age = undefined;
      if (!prompts.has('login')) {
        prompts.add('login');
        ctx.oidc.params.prompt = [...prompts].join(' ');
      }
    }
  }
  return next();
}