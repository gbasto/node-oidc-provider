"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = assembleParams;
var _params = _interopRequireDefault(require("../helpers/params.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function assembleParams(allowList, ctx, next) {
  const params = ctx.method === 'POST' ? ctx.oidc.body : ctx.query;
  ctx.oidc.params = new ((0, _params.default)(allowList))(params);
  return next();
}