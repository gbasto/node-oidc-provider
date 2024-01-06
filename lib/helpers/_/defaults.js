"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.deep = void 0;
var _is_plain_object = _interopRequireDefault(require("./is_plain_object.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable no-continue, no-param-reassign */

function defaults(deep, target, ...sources) {
  for (const source of sources) {
    if (!(0, _is_plain_object.default)(source)) {
      continue;
    }
    for (const [key, value] of Object.entries(source)) {
      if (key === '__proto__' || key === 'constructor') {
        continue;
      }
      if (typeof target[key] === 'undefined' && typeof value !== 'undefined') {
        target[key] = value;
      }
      if (deep && (0, _is_plain_object.default)(target[key]) && (0, _is_plain_object.default)(value)) {
        defaults(true, target[key], value);
      }
    }
  }
  return target;
}
var _default = exports.default = defaults.bind(undefined, false);
const deep = exports.deep = defaults.bind(undefined, true);