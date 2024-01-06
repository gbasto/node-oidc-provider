"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parseBodyIfPost;
var _selective_body = _interopRequireDefault(require("./selective_body.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
async function parseBodyIfPost(cty, ctx, next) {
  if (ctx.method === 'POST') {
    await (0, _selective_body.default)(cty, ctx, next);
  } else {
    await next();
  }
}