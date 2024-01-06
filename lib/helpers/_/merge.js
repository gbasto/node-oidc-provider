"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _is_plain_object = _interopRequireDefault(require("./is_plain_object.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable no-param-reassign, no-continue */

function merge(target, ...sources) {
  for (const source of sources) {
    if (!(0, _is_plain_object.default)(source)) {
      continue;
    }
    for (const [key, value] of Object.entries(source)) {
      if (key === '__proto__' || key === 'constructor') {
        continue;
      }
      if ((0, _is_plain_object.default)(target[key]) && (0, _is_plain_object.default)(value)) {
        target[key] = merge(target[key], value);
      } else if (typeof value !== 'undefined') {
        target[key] = value;
      }
    }
  }
  return target;
}
var _default = exports.default = merge;