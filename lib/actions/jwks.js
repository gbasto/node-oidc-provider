"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = renderJWKS;
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function renderJWKS(ctx, next) {
  ctx.body = (0, _weak_cache.default)(ctx.oidc.provider).jwksResponse;
  ctx.type = 'application/jwk-set+json; charset=utf-8';
  return next();
}