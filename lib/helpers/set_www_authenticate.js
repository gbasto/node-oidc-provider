"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = setWWWAuthenticate;
var _omit_by = _interopRequireDefault(require("./_/omit_by.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function setWWWAuthenticate(ctx, scheme, fields) {
  const wwwAuth = Object.entries((0, _omit_by.default)(fields, v => v === undefined)).map(([key, val]) => `${key}="${val.replace(/"/g, '\\"')}"`).join(', ');
  ctx.set('WWW-Authenticate', `${scheme} ${wwwAuth}`);
}