"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = checkPrompt;
var _errors = require("../../helpers/errors.js");
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/*
 * Checks that all requested prompts are supported and validates prompt none is not combined with
 * other prompts
 *
 * @throws: invalid_request
 */
function checkPrompt(ctx, next) {
  if (ctx.oidc.params.prompt !== undefined) {
    const {
      prompts
    } = ctx.oidc;
    const supported = (0, _weak_cache.default)(ctx.oidc.provider).configuration('prompts');
    for (const prompt of prompts) {
      if (!supported.has(prompt)) {
        throw new _errors.InvalidRequest('unsupported prompt value requested');
      }
    }
    if (prompts.has('none') && prompts.size !== 1) {
      throw new _errors.InvalidRequest('prompt none must only be used alone');
    }
  }
  return next();
}