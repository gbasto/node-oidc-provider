"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _is_plain_object = _interopRequireDefault(require("./is_plain_object.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = (object, path, value) => {
  const properties = path.split('.');
  if (properties.includes('__proto__') || properties.includes('constructor')) {
    throw new TypeError('__proto__ and constructor cannot be set');
  }
  let current = object;
  properties.forEach((property, i) => {
    if (i + 1 === properties.length) {
      current[property] = value;
    } else if (!(property in current) || !(0, _is_plain_object.default)(current[property])) {
      current[property] = {};
    }
    current = current[property];
  });
};
exports.default = _default;