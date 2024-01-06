"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = checkIdTokenHint;
var _errors = require("../../helpers/errors.js");
/*
 * Validates the incoming id_token_hint
 *
 * @throws: invalid_request
 */
async function checkIdTokenHint(ctx, next) {
  const {
    oidc
  } = ctx;
  if (oidc.params.id_token_hint !== undefined) {
    let idTokenHint;
    try {
      idTokenHint = await oidc.provider.IdToken.validate(oidc.params.id_token_hint, oidc.client);
    } catch (err) {
      if (err instanceof _errors.OIDCProviderError) {
        throw err;
      }
      throw new _errors.InvalidRequest('could not validate id_token_hint', undefined, err.message);
    }
    ctx.oidc.entity('IdTokenHint', idTokenHint);
  }
  return next();
}