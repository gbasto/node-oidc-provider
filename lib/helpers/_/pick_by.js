"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = (object, predicate) => {
  const result = {};
  Object.entries(object).forEach(([key, value]) => {
    if (predicate(value, key)) {
      result[key] = value;
    }
  });
  return result;
};
exports.default = _default;