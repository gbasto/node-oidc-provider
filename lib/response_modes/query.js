"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _redirect_uri = _interopRequireDefault(require("../helpers/redirect_uri.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = (ctx, redirectUri, payload) => {
  const uri = (0, _redirect_uri.default)(redirectUri, payload, 'query');
  ctx.status = 303;
  ctx.redirect(uri);
};
exports.default = _default;